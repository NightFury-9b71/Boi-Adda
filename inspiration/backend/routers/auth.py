from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import Session, select
from models import User, AdminConfig
from schemas import UserLogin, UserRegister, Token, UserOut, AdminCreateRequest, AdminCodeChangeRequest, AdminCodeResponse
from timezone_utils import bangladesh_now
from auth import (
    authenticate_user, 
    create_access_token, 
    get_password_hash, 
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user
)
from database import get_session
from enums import UserRole

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut)
def register(user_data: UserRegister, session: Session = Depends(get_session)):
    """Register a new user"""
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        address=user_data.address,
        hashed_password=hashed_password,
        role=user_data.role
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, session: Session = Depends(get_session)):
    """Login and get access token"""
    user = authenticate_user(user_credentials.email, user_credentials.password, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.post("/refresh", response_model=Token)
def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh access token"""
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.email, "role": current_user.role.value}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/create-admin", response_model=UserOut)
def create_admin(admin_data: AdminCreateRequest, session: Session = Depends(get_session)):
    """Create a new admin user with secret code"""
    # Get the admin creation code from database
    admin_config = session.exec(select(AdminConfig)).first()
    
    # If no config exists, create one with default code
    if not admin_config:
        admin_config = AdminConfig(admin_creation_code="illusion")
        session.add(admin_config)
        session.commit()
        session.refresh(admin_config)
    
    # Verify the admin code
    if admin_data.admin_code != admin_config.admin_creation_code:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin creation code"
        )
    
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == admin_data.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new admin user
    hashed_password = get_password_hash(admin_data.password)
    db_user = User(
        name=admin_data.name,
        email=admin_data.email,
        phone=admin_data.phone,
        address=admin_data.address,
        hashed_password=hashed_password,
        role=UserRole.admin
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user

@router.put("/change-admin-code", response_model=AdminCodeResponse)
def change_admin_code(
    code_data: AdminCodeChangeRequest, 
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Change the admin creation code (only admin can access)"""
    # Check if current user is admin
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can change the admin creation code"
        )
    
    # Get or create admin config
    admin_config = session.exec(select(AdminConfig)).first()
    
    if not admin_config:
        admin_config = AdminConfig(admin_creation_code=code_data.new_code)
        session.add(admin_config)
    else:
        admin_config.admin_creation_code = code_data.new_code
        admin_config.updated_at = bangladesh_now()
    
    session.commit()
    
    return {"message": "Admin creation code updated successfully"}

@router.get("/admin-code", response_model=dict)
def get_admin_code(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get the current admin creation code (only admin can access)"""
    # Check if current user is admin
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view the admin creation code"
        )
    
    # Get admin config
    admin_config = session.exec(select(AdminConfig)).first()
    
    if not admin_config:
        # Create default config if none exists
        admin_config = AdminConfig(admin_creation_code="illusion")
        session.add(admin_config)
        session.commit()
        session.refresh(admin_config)
    
    return {"admin_creation_code": admin_config.admin_creation_code}
