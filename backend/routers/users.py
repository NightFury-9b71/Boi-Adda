from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from ..models import User, Borrow, Donation
from ..schemas import UserOut, UserUpdate
from ..enums import BorrowStatus, DonationStatus
from ..database import get_session
from ..auth import get_current_user
import os
from datetime import datetime

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me/stats")
def get_my_stats(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get current user's activity statistics"""
    # Get user's borrows
    user_borrows = session.exec(select(Borrow).where(Borrow.user_id == current_user.id)).all()
    borrow_stats = {
        "total": len(user_borrows),
        "pending": len([b for b in user_borrows if b.status == BorrowStatus.pending]),
        "approved": len([b for b in user_borrows if b.status == BorrowStatus.approved]),
        "active": len([b for b in user_borrows if b.status == BorrowStatus.active]),
        "returned": len([b for b in user_borrows if b.status == BorrowStatus.returned]),
        "rejected": len([b for b in user_borrows if b.status == BorrowStatus.rejected])
    }
    
    # Get user's donations
    user_donations = session.exec(select(Donation).where(Donation.user_id == current_user.id)).all()
    donation_stats = {
        "total": len(user_donations),
        "pending": len([d for d in user_donations if d.status == DonationStatus.pending]),
        "approved": len([d for d in user_donations if d.status == DonationStatus.approved]),
        "completed": len([d for d in user_donations if d.status == DonationStatus.completed]),
        "rejected": len([d for d in user_donations if d.status == DonationStatus.rejected])
    }
    
    return {
        "user_info": {
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "active": current_user.is_active
        },
        "activity_summary": {
            "borrows": borrow_stats,
            "donations": donation_stats
        }
    }

@router.put("/me", response_model=UserOut)
def update_my_profile(user_update: UserUpdate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Update current user's profile"""
    
    # Update only provided fields
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.email is not None:
        # Check if email is already taken by another user
        existing_user = session.exec(select(User).where(User.email == user_update.email, User.id != current_user.id)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.address is not None:
        current_user.address = user_update.address
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    if user_update.date_of_birth is not None:
        current_user.date_of_birth = user_update.date_of_birth
    if user_update.profile_image is not None:
        current_user.profile_image = user_update.profile_image
    if user_update.cover_image is not None:
        current_user.cover_image = user_update.cover_image
    
    current_user.updated_at = datetime.now()
    
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return current_user

@router.post("/me/upload-profile-image")
def upload_profile_image(file: UploadFile = File(...), session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Upload profile image for current user"""
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Create user-covers directory if it doesn't exist
    upload_dir = "../frontend/public/user-covers"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate filename with user ID
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"user-{current_user.id}-profile.{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        buffer.write(content)
    
    # Update user's profile image path
    current_user.profile_image = f"/user-covers/{filename}"
    current_user.updated_at = datetime.now()
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return {"message": "Profile image uploaded successfully", "image_path": current_user.profile_image}

@router.post("/me/upload-cover-image")
def upload_cover_image(file: UploadFile = File(...), session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Upload cover image for current user"""
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Create user-covers directory if it doesn't exist
    upload_dir = "../frontend/public/user-covers"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate filename with user ID
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"user-{current_user.id}-cover.{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        buffer.write(content)
    
    # Update user's cover image path
    current_user.cover_image = f"/user-covers/{filename}"
    current_user.updated_at = datetime.now()
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return {"message": "Cover image uploaded successfully", "image_path": current_user.cover_image}

@router.get("/{user_id}", response_model=UserOut)
def get_user_profile(user_id: int, session: Session = Depends(get_session)):
    """Get user profile by ID (public)"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
