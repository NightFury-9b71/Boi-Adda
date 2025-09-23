from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from models import User, Borrow, Donation
from schemas import UserOut, UserUpdate, ImageUploadResponse
from enums import BorrowStatus, DonationStatus
from database import get_session
from auth import get_current_user
from cloudinary_service import upload_user_profile, upload_user_cover, delete_image
import os
from timezone_utils import bangladesh_now

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
async def update_my_profile(user_update: UserUpdate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Update current user's profile"""
    
    # Store old public IDs for cleanup if needed
    old_profile_public_id = current_user.profile_public_id
    old_cover_public_id = current_user.cover_public_id
    
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
    if user_update.profile_public_id is not None:
        current_user.profile_public_id = user_update.profile_public_id
    if user_update.cover_image is not None:
        current_user.cover_image = user_update.cover_image
    if user_update.cover_public_id is not None:
        current_user.cover_public_id = user_update.cover_public_id
    
    # Clean up old Cloudinary images if public IDs were removed
    if old_profile_public_id and not current_user.profile_public_id:
        await delete_image(old_profile_public_id)
    if old_cover_public_id and not current_user.cover_public_id:
        await delete_image(old_cover_public_id)
    
    current_user.updated_at = bangladesh_now()
    
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return current_user

@router.post("/me/upload-profile-image", response_model=ImageUploadResponse)
async def upload_profile_image(file: UploadFile = File(...), session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Upload profile image for current user to Cloudinary"""
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    try:
        # Delete old Cloudinary image if exists
        if current_user.profile_public_id:
            await delete_image(current_user.profile_public_id)
        
        # Upload to Cloudinary
        upload_result = await upload_user_profile(
            contents, 
            current_user.id, 
            current_user.name,
            replace_existing=True
        )
        
        # Update user's profile image
        current_user.profile_public_id = upload_result["public_id"]
        current_user.profile_image = upload_result["url"]
        current_user.updated_at = bangladesh_now()
        session.add(current_user)
        session.commit()
        session.refresh(current_user)
        
        return ImageUploadResponse(**upload_result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload profile image: {str(e)}")

@router.post("/me/upload-cover-image", response_model=ImageUploadResponse)
async def upload_cover_image(file: UploadFile = File(...), session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Upload cover image for current user to Cloudinary"""
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    try:
        # Delete old Cloudinary image if exists
        if current_user.cover_public_id:
            await delete_image(current_user.cover_public_id)
        
        # Upload to Cloudinary
        upload_result = await upload_user_cover(
            contents, 
            current_user.id, 
            current_user.name,
            replace_existing=True
        )
        
        # Update user's cover image
        current_user.cover_public_id = upload_result["public_id"]
        current_user.cover_image = upload_result["url"]
        current_user.updated_at = bangladesh_now()
        session.add(current_user)
        session.commit()
        session.refresh(current_user)
        
        return ImageUploadResponse(**upload_result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload cover image: {str(e)}")

@router.delete("/me/profile-image")
async def delete_profile_image(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Delete current user's profile image from Cloudinary"""
    
    if not current_user.profile_public_id:
        raise HTTPException(status_code=400, detail="No profile image to delete")
    
    try:
        # Delete from Cloudinary
        success = await delete_image(current_user.profile_public_id)
        
        if success:
            # Reset profile image
            current_user.profile_public_id = None
            current_user.profile_image = None
            current_user.updated_at = bangladesh_now()
            session.add(current_user)
            session.commit()
            
            return {"message": "Profile image deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete image from Cloudinary")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete profile image: {str(e)}")

@router.delete("/me/cover-image")
async def delete_cover_image(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Delete current user's cover image from Cloudinary"""
    
    if not current_user.cover_public_id:
        raise HTTPException(status_code=400, detail="No cover image to delete")
    
    try:
        # Delete from Cloudinary
        success = await delete_image(current_user.cover_public_id)
        
        if success:
            # Reset cover image
            current_user.cover_public_id = None
            current_user.cover_image = None
            current_user.updated_at = bangladesh_now()
            session.add(current_user)
            session.commit()
            
            return {"message": "Cover image deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete image from Cloudinary")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete cover image: {str(e)}")

@router.get("/{user_id}", response_model=UserOut)
def get_user_profile(user_id: int, session: Session = Depends(get_session)):
    """Get user profile by ID (public)"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
