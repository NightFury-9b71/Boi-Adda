from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
from sqlmodel import Session, select
from models import User, Role
from db import get_session
from storage import upload_profile_photo, delete_profile_photo
from auth_utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_token,
    generate_verification_code
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
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Get user from database
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials: {str(e)}")


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
        raise HTTPException(status_code=403, detail="Admin privileges required")
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
        raise HTTPException(status_code=403, detail="Member or Admin privileges required")
    return current_user


@router.post("/signup", response_model=MessageResponse)
async def sign_up(request: SignUpRequest, session: Session = Depends(get_session)):
    """
    Register a new user with email and password.
    By default, users are created with MEMBER role unless specified.
    A verification code will be sent (in production, this would be via email).
    """
    try:
        # Check if user already exists
        existing_user = session.exec(select(User).where(User.email == request.email)).first()
        if existing_user:
            if not existing_user.is_verified:
                # Generate new verification code
                verification_code = generate_verification_code()
                existing_user.verification_code = verification_code
                existing_user.verification_code_expires = datetime.now() + timedelta(hours=24)
                session.add(existing_user)
                session.commit()
                
                # TODO: Send verification email here
                print(f"Verification code for {request.email}: {verification_code}")
                
                return MessageResponse(
                    message=f"This email is already registered but not verified. A new verification code has been generated: {verification_code}"
                )
            raise HTTPException(status_code=400, detail="Email already registered and verified")
        
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
        
        # Generate verification code
        verification_code = generate_verification_code()
        
        # Create new user
        new_user = User(
            name=request.name,
            email=request.email,
            password_hash=password_hash,
            role_id=role.id,
            is_verified=False,
            is_active=True,  # New users are active by default
            verification_code=verification_code,
            verification_code_expires=datetime.now() + timedelta(hours=24)
        )
        
        session.add(new_user)
        session.commit()
        
        # TODO: Send verification email here
        # For now, just print it (in production, send via email)
        print(f"Verification code for {request.email}: {verification_code}")
        
        return MessageResponse(
            message=f"Registration successful! Your verification code is: {verification_code}. Please verify your email."
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    request: VerifyEmailRequest,
    session: Session = Depends(get_session)
):
    """
    Verify user email with the 6-digit verification code.
    """
    try:
        # Find user by email
        user = session.exec(select(User).where(User.email == request.email)).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.is_verified:
            return MessageResponse(message="Email already verified. You can sign in.")
        
        # Check verification code
        if not user.verification_code or user.verification_code != request.token:
            raise HTTPException(status_code=400, detail="Invalid verification code")
        
        # Check if code expired
        if user.verification_code_expires and datetime.now() > user.verification_code_expires:
            raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")
        
        # Mark user as verified
        user.is_verified = True
        user.verification_code = None
        user.verification_code_expires = None
        session.add(user)
        session.commit()
        
        return MessageResponse(
            message="Email verified successfully! You can now sign in."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(request: ResendVerificationRequest, session: Session = Depends(get_session)):
    """
    Resend verification code to the user's email.
    """
    try:
        user = session.exec(select(User).where(User.email == request.email)).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="Email not found. Please register first.")
        
        if user.is_verified:
            return MessageResponse(message="Email already verified. You can sign in.")
        
        # Generate new verification code
        verification_code = generate_verification_code()
        user.verification_code = verification_code
        user.verification_code_expires = datetime.now() + timedelta(hours=24)
        session.add(user)
        session.commit()
        
        # TODO: Send verification email here
        print(f"New verification code for {request.email}: {verification_code}")
        
        return MessageResponse(
            message=f"Verification code sent! Your code is: {verification_code}"
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
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if email is verified
        if not user.is_verified:
            raise HTTPException(status_code=401, detail="Please verify your email before signing in")
        
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
                "role": role.name,
                "is_verified": user.is_verified
            },
            message="Signed in successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


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
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Get user from database
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
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
                "role": role.name,
                "is_verified": user.is_verified
            },
            message="Token refreshed successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token refresh failed: {str(e)}")


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
        role=role.name,
        profile_photo_url=current_user.profile_photo_url,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None,
        is_verified=current_user.is_verified
    )


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest, session: Session = Depends(get_session)):
    """
    Send password reset code.
    """
    try:
        user = session.exec(select(User).where(User.email == request.email)).first()
        
        if not user:
            # Don't reveal if email exists
            return MessageResponse(message="If the email exists, a password reset code has been sent.")
        
        # Generate reset code
        reset_code = generate_verification_code()
        user.verification_code = reset_code
        user.verification_code_expires = datetime.now() + timedelta(hours=1)
        session.add(user)
        session.commit()
        
        # TODO: Send reset email here
        print(f"Password reset code for {request.email}: {reset_code}")
        
        return MessageResponse(message=f"Password reset code sent! Your code is: {reset_code}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest, session: Session = Depends(get_session)):
    """
    Reset password using the code from email.
    """
    try:
        user = session.exec(select(User).where(User.email == request.email)).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check reset code
        if not user.verification_code or user.verification_code != request.code:
            raise HTTPException(status_code=400, detail="Invalid reset code")
        
        # Check if code expired
        if user.verification_code_expires and datetime.now() > user.verification_code_expires:
            raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")
        
        # Update password
        user.password_hash = get_password_hash(request.new_password)
        user.verification_code = None
        user.verification_code_expires = None
        session.add(user)
        session.commit()
        
        return MessageResponse(message="Password reset successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Update password
        user.password_hash = get_password_hash(request.new_password)
        session.add(user)
        session.commit()
        
        return MessageResponse(message="Password changed successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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
            raise HTTPException(status_code=403, detail="Guest users cannot upload profile photos")
        
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
        raise HTTPException(status_code=500, detail=f"Failed to upload profile photo: {str(e)}")


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
            raise HTTPException(status_code=403, detail="Guest users don't have profile photos")
        
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
        raise HTTPException(status_code=500, detail=f"Failed to delete profile photo: {str(e)}")


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
    This endpoint requires the secret code 'illusion' to create an admin.
    The admin will be automatically verified.
    """
    # Verify secret code
    if request.secret_code != "illusion":
        raise HTTPException(status_code=403, detail="Invalid secret code")
    
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == request.email)).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists with this email")
    
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
        raise HTTPException(status_code=400, detail=f"Failed to create admin: {str(e)}")
