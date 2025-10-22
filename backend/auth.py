from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from sqlmodel import Session, select
from models import userRole, Admin, Member
from db import get_session
from storage import upload_profile_photo, delete_profile_photo

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://tdtnxwyhttbchhxpsiqe.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

if not SUPABASE_KEY:
    raise ValueError(
        "SUPABASE_KEY environment variable is required!\n"
        "Please create a .env file with:\n"
        "SUPABASE_URL=https://tdtnxwyhttbchhxpsiqe.supabase.co\n"
        "SUPABASE_KEY=your_supabase_anon_key_here\n\n"
        "Get your key from: https://supabase.com/dashboard → Your Project → Settings → API"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()
security = HTTPBearer()


# Pydantic models for requests/responses
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: userRole = userRole.MEMBER


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict
    message: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    role: str
    profile_photo_url: Optional[str] = None


class MessageResponse(BaseModel):
    message: str


# Dependency to get current user from token
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Validates the JWT token and returns the user data.
    Usage: current_user = Depends(get_current_user)
    """
    try:
        token = credentials.credentials
        # Verify the token with Supabase
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials: {str(e)}")


# Dependency to require admin role
async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Checks if the current user has admin role.
    Usage: admin_user = Depends(require_admin)
    """
    user_metadata = current_user.user_metadata or {}
    role = user_metadata.get("role", "guest")
    
    if role != userRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user


# Dependency to require member or admin role
async def require_member_or_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Checks if the current user has member or admin role.
    Usage: user = Depends(require_member_or_admin)
    """
    user_metadata = current_user.user_metadata or {}
    role = user_metadata.get("role", "guest")
    
    if role not in [userRole.MEMBER, userRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Member or Admin privileges required")
    return current_user


@router.post("/signup", response_model=MessageResponse)
async def sign_up(request: SignUpRequest):
    """
    Register a new user with email and password.
    By default, users are created with MEMBER role unless specified.
    Supabase will send a verification OTP code via the "Confirm signup" email template.
    """
    try:
        # Sign up the user - this triggers the "Confirm signup" email template
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "name": request.name,
                    "role": request.role
                }
            }
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Failed to create user")
        
        return MessageResponse(
            message="Registration successful! Please check your email for a 6-digit verification code."
        )
    except Exception as e:
        error_message = str(e)
        
        # Handle the case where user exists but is unverified
        if "already registered" in error_message.lower() or "already been registered" in error_message.lower():
            # Try to resend verification
            try:
                supabase.auth.resend({
                    "type": "signup",
                    "email": request.email
                })
                return MessageResponse(
                    message="This email is already registered but not verified. We've sent you a new verification code!"
                )
            except:
                raise HTTPException(
                    status_code=400, 
                    detail="This email is already registered. If you haven't verified it yet, please check your email or try password reset."
                )
        
        raise HTTPException(status_code=400, detail=error_message)


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(request: VerifyEmailRequest):
    """
    Verify user email with the 6-digit OTP code sent via email.
    """
    try:
        # Verify OTP for email signup
        response = supabase.auth.verify_otp({
            "email": request.email,
            "token": request.token,
            "type": "email"  # Changed from "signup" to "email" for OTP verification
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Invalid verification code")
        
        return MessageResponse(
            message="Email verified successfully! You can now sign in."
        )
    except Exception as e:
        error_message = str(e)
        if "expired" in error_message.lower():
            raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")
        elif "invalid" in error_message.lower():
            raise HTTPException(status_code=400, detail="Invalid verification code. Please check and try again.")
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(request: ResendVerificationRequest):
    """
    Resend verification OTP code to the user's email.
    """
    try:
        # Use sign_in_with_otp to send OTP code
        supabase.auth.sign_in_with_otp({
            "email": request.email,
            "options": {
                "should_create_user": False  # Don't create new user, just send OTP
            }
        })
        
        return MessageResponse(
            message="Verification code sent! Please check your email for a 6-digit code."
        )
    except Exception as e:
        error_message = str(e)
        if "not found" in error_message.lower():
            raise HTTPException(status_code=404, detail="Email not found. Please register first.")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/signin", response_model=AuthResponse)
async def sign_in(request: SignInRequest):
    """
    Sign in with email and password.
    Returns access token and refresh token.
    """
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_metadata = response.user.user_metadata or {}
        
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            user={
                "id": response.user.id,
                "email": response.user.email,
                "name": user_metadata.get("name", ""),
                "role": user_metadata.get("role", "guest")
            },
            message="Signed in successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


@router.post("/signout", response_model=MessageResponse)
async def sign_out(current_user: dict = Depends(get_current_user)):
    """
    Sign out the current user.
    Requires valid authentication token.
    """
    try:
        supabase.auth.sign_out()
        return MessageResponse(message="Signed out successfully")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(refresh_token: str):
    """
    Refresh the access token using a refresh token.
    """
    try:
        response = supabase.auth.refresh_session(refresh_token)
        
        if not response.session:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        user_metadata = response.user.user_metadata or {}
        
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            user={
                "id": response.user.id,
                "email": response.user.email,
                "name": user_metadata.get("name", ""),
                "role": user_metadata.get("role", "guest")
            },
            message="Token refreshed successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token refresh failed: {str(e)}")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Get current user information including profile photo from database.
    Requires valid authentication token.
    """
    user_metadata = current_user.user_metadata or {}
    role = user_metadata.get("role", "guest")
    email = current_user.email
    
    # Get profile photo from database
    profile_photo_url = None
    if role == userRole.ADMIN:
        user = session.exec(select(Admin).where(Admin.email == email)).first()
        if user:
            profile_photo_url = user.profile_photo_url
    elif role == userRole.MEMBER:
        user = session.exec(select(Member).where(Member.email == email)).first()
        if user:
            profile_photo_url = user.profile_photo_url
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=user_metadata.get("name", ""),
        role=role,
        profile_photo_url=profile_photo_url
    )


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(email: EmailStr):
    """
    Send password reset email.
    """
    try:
        supabase.auth.reset_password_email(email)
        return MessageResponse(message="Password reset email sent. Please check your inbox.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(token: str, new_password: str):
    """
    Reset password using the token from email.
    """
    try:
        supabase.auth.update_user({
            "password": new_password
        })
        return MessageResponse(message="Password reset successfully")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/update-profile", response_model=UserResponse)
async def update_profile(name: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """
    Update user profile information.
    Requires valid authentication token.
    """
    try:
        update_data = {}
        if name:
            user_metadata = current_user.user_metadata or {}
            user_metadata["name"] = name
            update_data["data"] = user_metadata
        
        response = supabase.auth.update_user(update_data)
        user_metadata = response.user.user_metadata or {}
        
        return UserResponse(
            id=response.user.id,
            email=response.user.email,
            name=user_metadata.get("name", ""),
            role=user_metadata.get("role", "guest")
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/profile-photo", response_model=MessageResponse)
async def upload_user_profile_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Upload or update profile photo for the current user.
    Requires valid authentication token.
    """
    try:
        # Get user metadata
        user_metadata = current_user.user_metadata or {}
        role = user_metadata.get("role", "guest")
        email = current_user.email
        
        # Find the user in database by email
        if role == userRole.ADMIN:
            user = session.exec(select(Admin).where(Admin.email == email)).first()
            user_type = "admin"
        elif role == userRole.MEMBER:
            user = session.exec(select(Member).where(Member.email == email)).first()
            user_type = "member"
        else:
            raise HTTPException(status_code=403, detail="Guest users cannot upload profile photos")
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found in database")
        
        # Upload photo to Supabase Storage
        photo_url = await upload_profile_photo(file, user.id, user_type)
        
        # Update database with photo URL
        user.profile_photo_url = photo_url
        session.add(user)
        session.commit()
        
        return MessageResponse(message=f"Profile photo uploaded successfully: {photo_url}")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload profile photo: {str(e)}")


@router.delete("/profile-photo", response_model=MessageResponse)
async def delete_user_profile_photo(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete profile photo for the current user.
    Requires valid authentication token.
    """
    try:
        # Get user metadata
        user_metadata = current_user.user_metadata or {}
        role = user_metadata.get("role", "guest")
        email = current_user.email
        
        # Find the user in database by email
        if role == userRole.ADMIN:
            user = session.exec(select(Admin).where(Admin.email == email)).first()
            user_type = "admin"
        elif role == userRole.MEMBER:
            user = session.exec(select(Member).where(Member.email == email)).first()
            user_type = "member"
        else:
            raise HTTPException(status_code=403, detail="Guest users don't have profile photos")
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found in database")
        
        # Delete from Supabase Storage
        delete_profile_photo(user.id, user_type)
        
        # Update database
        user.profile_photo_url = None
        session.add(user)
        session.commit()
        
        return MessageResponse(message="Profile photo deleted successfully")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete profile photo: {str(e)}")

