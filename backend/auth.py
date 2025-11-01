from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
from sqlmodel import Session, select
import os
from models import User, Role
from db import get_session
from storage import upload_profile_photo, delete_profile_photo
from auth_utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_token,
    generate_verification_code,
    create_verification_token,
    verify_verification_token
)
from email_service import (
    send_verification_email_with_otp,
    send_verification_email_with_link,
    send_password_reset_email_with_otp,
    send_password_reset_email_with_link,
    send_both_verification_methods,
    send_both_password_reset_methods
)

router = APIRouter()
security = HTTPBearer()


# Pydantic models for requests/responses
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "member"  # Default to member role


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
    id: int
    email: str
    name: Optional[str]
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    bio: Optional[str] = None
    role: str
    profile_photo_url: Optional[str] = None
    created_at: Optional[str] = None
    is_verified: bool


class MessageResponse(BaseModel):
    message: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# Dependency to get current user from token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    """
    Validates the JWT token and returns the user data.
    Usage: current_user = Depends(get_current_user)
    """
    try:
        token = credentials.credentials
        # Verify the token
        payload = verify_token(token, "access")
        if not payload:
            raise HTTPException(status_code=401, detail="আপনার লগইন সেশন শেষ হয়ে গেছে। আবার লগইন করুন।")
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="লগইন তথ্য সঠিক নয়। আবার লগইন করুন।")
        
        # Get user from database
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=401, detail="ব্যবহারকারী খুঁজে পাওয়া যায়নি। আবার লগইন করুন।")
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="লগইন যাচাই করতে সমস্যা। আবার লগইন করুন।")


# Dependency to require admin role
async def require_admin(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> User:
    """
    Checks if the current user has admin role.
    Usage: admin_user = Depends(require_admin)
    """
    # Load the role relationship
    user_with_role = session.get(User, current_user.id)
    role = session.get(Role, user_with_role.role_id)
    
    if role.name != "admin":
        raise HTTPException(status_code=403, detail="অ্যাডমিন অনুমতি প্রয়োজন।")
    return current_user


# Dependency to require member or admin role
async def require_member_or_admin(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> User:
    """
    Checks if the current user has member or admin role.
    Usage: user = Depends(require_member_or_admin)
    """
    user_with_role = session.get(User, current_user.id)
    role = session.get(Role, user_with_role.role_id)
    
    if role.name not in ["member", "admin"]:
        raise HTTPException(status_code=403, detail="সদস্য বা অ্যাডমিন অনুমতি প্রয়োজন।")
    return current_user


@router.post("/signup", response_model=MessageResponse)
async def sign_up(request: SignUpRequest, session: Session = Depends(get_session), background_tasks: BackgroundTasks = BackgroundTasks()):
    """
    Register a new user with email and password.
    By default, users are created with MEMBER role unless specified.
    Sends verification email with both OTP and magic link.
    """
    try:
        # Check if user already exists
        existing_user = session.exec(select(User).where(User.email == request.email)).first()
        if existing_user:
            if existing_user.is_verified:
                raise HTTPException(status_code=400, detail="এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে। লগইন করুন।")
            else:
                # User exists but not verified, resend verification
                verification_code = generate_verification_code()
                verification_token = create_verification_token(request.email, "verify")
                
                existing_user.verification_code = verification_code
                existing_user.verification_code_expires = datetime.now() + timedelta(hours=1)
                session.add(existing_user)
                session.commit()
                
                # Send both OTP and magic link
                await send_verification_email_with_otp(request.email, verification_code, background_tasks)
                await send_verification_email_with_link(request.email, verification_token, background_tasks)
                
                return MessageResponse(
                    message="আপনার ইমেইল এখনও যাচাই হয়নি। যাচাইকরণ ইমেইল পুনরায় পাঠানো হয়েছে।"
                )
        
        # Get role from database
        role = session.exec(select(Role).where(Role.name == request.role)).first()
        if not role:
            # Create role if it doesn't exist
            role = Role(name=request.role, description=f"{request.role.capitalize()} role")
            session.add(role)
            session.commit()
            session.refresh(role)
        
        # Hash password
        password_hash = get_password_hash(request.password)
        
        # Generate verification code and token
        verification_code = generate_verification_code()
        verification_token = create_verification_token(request.email, "verify")
        
        # Create new user (NOT auto-verified)
        new_user = User(
            name=request.name,
            email=request.email,
            password_hash=password_hash,
            role_id=role.id,
            is_verified=False,  # User must verify email
            is_active=True,
            verification_code=verification_code,
            verification_code_expires=datetime.now() + timedelta(hours=1)
        )
        
        session.add(new_user)
        session.commit()
        
        # Send both OTP and magic link verification emails
        await send_verification_email_with_otp(request.email, verification_code, background_tasks)
        await send_verification_email_with_link(request.email, verification_token, background_tasks)
        
        print(f"User registered: {request.email}, OTP: {verification_code}")
        
        return MessageResponse(
            message="রেজিস্ট্রেশন সফল! আপনার ইমেইল চেক করে যাচাই করুন।"
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        print(f"Signup error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    request: VerifyEmailRequest,
    session: Session = Depends(get_session)
):
    """
    Verify user email with the 6-digit verification code (OTP).
    """
    try:
        # Find user by email
        user = session.exec(select(User).where(User.email == request.email)).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="ব্যবহারকারী খুঁজে পাওয়া যায়নি।")
        
        if user.is_verified:
            return MessageResponse(message="ইমেইল ইতিমধ্যে যাচাই করা হয়েছে। লগইন করতে পারেন।")
        
        # Check verification code
        if not user.verification_code or user.verification_code != request.token:
            raise HTTPException(status_code=400, detail="যাচাইকরণ কোড ভুল।")
        
        # Check if code expired
        if user.verification_code_expires and datetime.now() > user.verification_code_expires:
            raise HTTPException(status_code=400, detail="যাচাইকরণ কোডের মেয়াদ শেষ। নতুন কোড চান।")
        
        # Mark user as verified
        user.is_verified = True
        user.verification_code = None
        user.verification_code_expires = None
        session.add(user)
        session.commit()
        
        return MessageResponse(
            message="ইমেইল সফলভাবে যাচাই হয়েছে! এখন লগইন করতে পারেন।"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class VerifyByLinkRequest(BaseModel):
    token: str


@router.post("/verify-by-link", response_model=MessageResponse)
async def verify_email_by_link(
    request: VerifyByLinkRequest,
    session: Session = Depends(get_session)
):
    """
    Verify user email via magic link (JWT token).
    """
    try:
        # Verify the token and get email
        email = verify_verification_token(request.token, "verify")
        
        if not email:
            raise HTTPException(status_code=400, detail="লিংক সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।")
        
        # Find user by email
        user = session.exec(select(User).where(User.email == email)).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="ব্যবহারকারী খুঁজে পাওয়া যায়নি।")
        
        if user.is_verified:
            return MessageResponse(message="ইমেইল ইতিমধ্যে যাচাই করা হয়েছে। লগইন করতে পারেন।")
        
        # Mark user as verified
        user.is_verified = True
        user.verification_code = None
        user.verification_code_expires = None
        session.add(user)
        session.commit()
        
        return MessageResponse(
            message="ইমেইল সফলভাবে যাচাই হয়েছে! এখন লগইন করতে পারেন।"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="ইমেইল যাচাই করতে সমস্যা হয়েছে।")


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(request: ResendVerificationRequest, session: Session = Depends(get_session), background_tasks: BackgroundTasks = BackgroundTasks()):
    """
    Resend verification email with both OTP and magic link to the user's email.
    """
    try:
        user = session.exec(select(User).where(User.email == request.email)).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="ইমেইল খুঁজে পাওয়া যায়নি। প্রথমে রেজিস্টার করুন।")
        
        if user.is_verified:
            return MessageResponse(message="ইমেইল ইতিমধ্যে যাচাই করা হয়েছে। লগইন করতে পারেন।")
        
        # Generate new verification code and token
        verification_code = generate_verification_code()
        verification_token = create_verification_token(request.email, "verify")
        
        user.verification_code = verification_code
        user.verification_code_expires = datetime.now() + timedelta(hours=1)
        session.add(user)
        session.commit()
        
        # Send both OTP and magic link verification emails
        await send_verification_email_with_otp(request.email, verification_code, background_tasks)
        await send_verification_email_with_link(request.email, verification_token, background_tasks)
        
        print(f"New verification code for {request.email}: {verification_code}")
        
        return MessageResponse(
            message="যাচাইকরণ ইমেইল পাঠানো হয়েছে! আপনার ইমেইল চেক করুন।"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/signin", response_model=AuthResponse)
async def sign_in(
    request: SignInRequest,
    session: Session = Depends(get_session)
):
    """
    Sign in with email and password.
    Returns access token and refresh token.
    """
    try:
        # Find user by email
        user = session.exec(select(User).where(User.email == request.email)).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="ইমেইল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।")
        
        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=401, detail="ইমেইল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।")
        
        # Check if email is verified
        if not user.is_verified:
            raise HTTPException(status_code=401, detail="প্রথমে আপনার ইমেইল যাচাই করুন। ইমেইল চেক করুন।")
        
        # Get user role
        role = session.get(Role, user.role_id)
        
        # Create tokens
        token_data = {"user_id": user.id, "email": user.email, "role": role.name}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "phone": user.phone,
                "address": user.address,
                "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
                "bio": user.bio,
                "role": role.name,
                "is_verified": user.is_verified
            },
            message="Signed in successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="লগইন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।")


@router.post("/signout", response_model=MessageResponse)
async def sign_out(current_user: User = Depends(get_current_user)):
    """
    Sign out the current user.
    Requires valid authentication token.
    Note: JWT tokens are stateless, so this is mainly for client-side cleanup.
    """
    return MessageResponse(message="Signed out successfully")


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: RefreshTokenRequest, session: Session = Depends(get_session)):
    """
    Refresh the access token using a refresh token.
    """
    try:
        # Verify refresh token
        payload = verify_token(request.refresh_token, "refresh")
        if not payload:
            raise HTTPException(status_code=401, detail="রিফ্রেশ টোকেন সঠিক নয়।")
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="টোকেন সঠিক নয়।")
        
        # Get user from database
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=401, detail="ব্যবহারকারী পাওয়া যায়নি।")
        
        # Get user role
        role = session.get(Role, user.role_id)
        
        # Create new tokens
        token_data = {"user_id": user.id, "email": user.email, "role": role.name}
        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)
        
        return AuthResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "phone": user.phone,
                "address": user.address,
                "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
                "bio": user.bio,
                "role": role.name,
                "is_verified": user.is_verified
            },
            message="Token refreshed successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="টোকেন রিফ্রেশ করতে সমস্যা হয়েছে।")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Get current user information including profile photo from database.
    Requires valid authentication token.
    """
    # Get user role
    role = session.get(Role, current_user.role_id)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        phone=current_user.phone,
        address=current_user.address,
        date_of_birth=current_user.date_of_birth.isoformat() if current_user.date_of_birth else None,
        bio=current_user.bio,
        role=role.name,
        profile_photo_url=current_user.profile_photo_url,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None,
        is_verified=current_user.is_verified
    )


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest, session: Session = Depends(get_session), background_tasks: BackgroundTasks = BackgroundTasks()):
    """
    Send password reset email with both OTP and magic link.
    """
    try:
        user = session.exec(select(User).where(User.email == request.email)).first()
        
        if not user:
            # Don't reveal if email exists for security
            return MessageResponse(message="যদি ইমেইলটি আমাদের সিস্টেমে থাকে, পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে।")
        
        # Generate reset code and token
        reset_code = generate_verification_code()
        reset_token = create_verification_token(request.email, "reset")
        
        user.verification_code = reset_code
        user.verification_code_expires = datetime.now() + timedelta(hours=1)
        session.add(user)
        session.commit()
        
        # Send both OTP and magic link password reset emails
        await send_password_reset_email_with_otp(request.email, reset_code, background_tasks)
        await send_password_reset_email_with_link(request.email, reset_token, background_tasks)
        
        print(f"Password reset code for {request.email}: {reset_code}")
        
        return MessageResponse(message="পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে! আপনার ইমেইল চেক করুন।")
    except Exception as e:
        print(f"Forgot password error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest, session: Session = Depends(get_session)):
    """
    Reset password using the OTP code from email.
    """
    try:
        user = session.exec(select(User).where(User.email == request.email)).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="ব্যবহারকারী পাওয়া যায়নি।")
        
        # Check reset code
        if not user.verification_code or user.verification_code != request.code:
            raise HTTPException(status_code=400, detail="রিসেট কোড সঠিক নয়।")
        
        # Check if code expired
        if user.verification_code_expires and datetime.now() > user.verification_code_expires:
            raise HTTPException(status_code=400, detail="রিসেট কোডের মেয়াদ শেষ। দয়া করে নতুন কোড চান।")
        
        # Update password
        user.password_hash = get_password_hash(request.new_password)
        user.verification_code = None
        user.verification_code_expires = None
        session.add(user)
        session.commit()
        
        return MessageResponse(message="পাসওয়ার্ড সফলভাবে রিসেট হয়েছে!")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class ResetPasswordByLinkRequest(BaseModel):
    token: str
    new_password: str


@router.post("/reset-password-by-link", response_model=MessageResponse)
async def reset_password_by_link(request: ResetPasswordByLinkRequest, session: Session = Depends(get_session)):
    """
    Reset password using the magic link (JWT token) from email.
    """
    try:
        # Verify the token and get email
        email = verify_verification_token(request.token, "reset")
        
        if not email:
            raise HTTPException(status_code=400, detail="লিংক সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।")
        
        # Find user by email
        user = session.exec(select(User).where(User.email == email)).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="ব্যবহারকারী পাওয়া যায়নি।")
        
        # Update password
        user.password_hash = get_password_hash(request.new_password)
        user.verification_code = None
        user.verification_code_expires = None
        session.add(user)
        session.commit()
        
        return MessageResponse(message="পাসওয়ার্ড সফলভাবে রিসেট হয়েছে!")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।")


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    request: ChangePasswordRequest, 
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Change password for authenticated user.
    """
    try:
        # Use the current user directly (no need to query again)
        user = current_user
        
        # Verify current password
        if not verify_password(request.current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="বর্তমান পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।")
        
        # Update password
        user.password_hash = get_password_hash(request.new_password)
        session.add(user)
        session.commit()
        
        return MessageResponse(message="পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।")


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None


@router.put("/update-profile", response_model=UserResponse)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update user profile information.
    Requires valid authentication token.
    """
    try:
        user = session.get(User, current_user.id)
        
        if request.name:
            user.name = request.name
        
        session.add(user)
        session.commit()
        session.refresh(user)
        
        # Get user role
        role = session.get(Role, user.role_id)
        
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=role.name,
            profile_photo_url=user.profile_photo_url,
            created_at=user.created_at.isoformat() if user.created_at else None,
            is_verified=user.is_verified
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/profile-photo", response_model=MessageResponse)
async def upload_user_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Upload or update profile photo for the current user.
    Requires valid authentication token.
    """
    try:
        # Get user role
        role = session.get(Role, current_user.role_id)
        
        if role.name == "guest":
            raise HTTPException(status_code=403, detail="গেস্ট ব্যবহারকারীরা প্রোফাইল ছবি আপলোড করতে পারেন না।")
        
        # Upload photo to storage
        photo_url = await upload_profile_photo(file, current_user.id, role.name)
        
        # Update database with photo URL
        user = session.get(User, current_user.id)
        user.profile_photo_url = photo_url
        session.add(user)
        session.commit()
        
        return MessageResponse(message=f"Profile photo uploaded successfully: {photo_url}")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="প্রোফাইল ছবি আপলোড করতে সমস্যা হয়েছে।")


@router.delete("/profile-photo", response_model=MessageResponse)
async def delete_user_profile_photo(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete profile photo for the current user.
    Requires valid authentication token.
    """
    try:
        # Get user role
        role = session.get(Role, current_user.role_id)
        
        if role.name == "guest":
            raise HTTPException(status_code=403, detail="গেস্ট ব্যবহারকারীদের প্রোফাইল ছবি নেই।")
        
        # Delete from storage
        delete_profile_photo(current_user.id, role.name)
        
        # Update database
        user = session.get(User, current_user.id)
        user.profile_photo_url = None
        session.add(user)
        session.commit()
        
        return MessageResponse(message="Profile photo deleted successfully")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="প্রোফাইল ছবি মুছতে সমস্যা হয়েছে।")


# Secret endpoint to create admin
class CreateAdminRequest(BaseModel):
    secret_code: str
    name: str
    email: EmailStr
    password: str


@router.post("/create-admin", response_model=MessageResponse)
async def create_admin(
    request: CreateAdminRequest,
    session: Session = Depends(get_session)
):
    """
    Create an admin user with a secret code.
    This endpoint requires the secret code from environment variable to create an admin.
    The admin will be automatically verified.
    """
    # Verify secret code from environment
    admin_creation_code = os.getenv("ADMIN_CREATION_CODE", "boi-adda-admin")  # fallback to default
    if request.secret_code != admin_creation_code:
        raise HTTPException(status_code=403, detail="সিক্রেট কোড সঠিক নয়।")
    
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == request.email)).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।")
    
    try:
        # Get admin role from database
        admin_role = session.exec(select(Role).where(Role.name == "admin")).first()
        if not admin_role:
            # Create admin role if it doesn't exist
            admin_role = Role(name="admin", description="Administrator role")
            session.add(admin_role)
            session.commit()
            session.refresh(admin_role)
        
        # Hash password
        password_hash = get_password_hash(request.password)
        
        # Create admin in local database (auto-verified)
        new_admin = User(
            name=request.name,
            email=request.email,
            password_hash=password_hash,
            role_id=admin_role.id,
            is_verified=True,  # Auto-verify admin
            is_active=True  # Admins are active by default
        )
        
        session.add(new_admin)
        session.commit()
        session.refresh(new_admin)
        
        return MessageResponse(
            message=f"Admin created successfully! Email: {request.email}. Admin can now login with their credentials."
        )
        
    except Exception as e:
        # Rollback database changes
        session.rollback()
        raise HTTPException(status_code=400, detail="অ্যাডমিন তৈরি করতে সমস্যা হয়েছে।")
