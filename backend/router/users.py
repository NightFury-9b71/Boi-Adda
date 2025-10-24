from db import get_session
from models import User, Role, BookRequest, IssueBook, requestType, requestStatus
from sqlmodel import select, Session, SQLModel
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from auth import get_current_user
from typing import Optional
from datetime import datetime
from storage import upload_profile_photo

router = APIRouter()


# Response Models
class UserProfileResponse(SQLModel):
    id: int
    name: str
    email: str
    role: str
    profile_photo_url: Optional[str] = None
    created_at: Optional[datetime] = None


class UserStatsResponse(SQLModel):
    total_borrows: int
    active_borrows: int
    total_donations: int
    pending_requests: int


# GET /users/me - Get current user profile
@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current authenticated user's profile"""
    user_email = current_user.email
    
    # Find user in database
    user = session.exec(select(User).where(User.email == user_email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ব্যবহারকারীর প্রোফাইল খুঁজে পাওয়া যায়নি।"
        )
    
    return UserProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.name,
        profile_photo_url=user.profile_photo_url,
        created_at=user.created_at
    )


# PUT /users/me - Update current user profile
@router.put("/me", response_model=UserProfileResponse)
def update_current_user_profile(
    name: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update current authenticated user's profile"""
    user_email = current_user.email
    
    # Find user in database
    user = session.exec(select(User).where(User.email == user_email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ব্যবহারকারীর প্রোফাইল খুঁজে পাওয়া যায়নি।"
        )
    
    # Update fields
    if name:
        user.name = name
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return UserProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.name,
        profile_photo_url=user.profile_photo_url,
        created_at=user.created_at
    )


# GET /users/me/stats - Get current user's statistics
@router.get("/me/stats", response_model=UserStatsResponse)
def get_current_user_stats(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current authenticated user's activity statistics"""
    user_email = current_user.email
    
    # Find user
    user = session.exec(select(User).where(User.email == user_email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ব্যবহারকারীর প্রোফাইল খুঁজে পাওয়া যায়নি।"
        )
    
    # If user is admin, return zeros (admins don't borrow/donate)
    if user.role.name == "admin":
        return UserStatsResponse(
            total_borrows=0,
            active_borrows=0,
            total_donations=0,
            pending_requests=0
        )
    
    # Get borrow statistics
    total_borrows = len(session.exec(
        select(BookRequest).where(
            BookRequest.member_id == user.id,
            BookRequest.request_type == requestType.BORROW
        )
    ).all())
    
    # Get active borrows (issued and not returned)
    active_borrows = len(session.exec(
        select(IssueBook).where(
            IssueBook.member_id == user.id,
            IssueBook.return_date == None
        )
    ).all())
    
    # Get donation statistics
    total_donations = len(session.exec(
        select(BookRequest).where(
            BookRequest.member_id == user.id,
            BookRequest.request_type == requestType.DONATION
        )
    ).all())
    
    # Get pending requests (both borrow and donation)
    pending_requests = len(session.exec(
        select(BookRequest).where(
            BookRequest.member_id == user.id,
            BookRequest.status.in_([requestStatus.PENDING, requestStatus.APPROVED])
        )
    ).all())
    
    return UserStatsResponse(
        total_borrows=total_borrows,
        active_borrows=active_borrows,
        total_donations=total_donations,
        pending_requests=pending_requests
    )


# GET /users/{user_id} - Get user profile by ID
@router.get("/{user_id}", response_model=UserProfileResponse)
def get_user_profile_by_id(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get user profile by ID (accessible to authenticated users)"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ব্যবহারকারী খুঁজে পাওয়া যায়নি।"
        )
    
    return UserProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.name,
        profile_photo_url=user.profile_photo_url,
        created_at=user.created_at
    )


# POST /users/me/upload-profile-image - Upload profile image
@router.post("/me/upload-profile-image")
async def upload_user_profile_photo_url(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Upload profile image for current user"""
    user_email = current_user.email
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="শুধুমাত্র ছবি আপলোড করুন।"
        )
    
    try:
        # Find user
        user = session.exec(select(User).where(User.email == user_email)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ব্যবহারকারীর প্রোফাইল খুঁজে পাওয়া যায়নি।"
            )
        
        file_url = await upload_profile_photo(file, user.id, user.role.name)
        user.profile_photo_url = file_url
        session.add(user)
        session.commit()
        
        return {
            "message": "প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে!",
            "url": file_url
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="প্রোফাইল ছবি আপলোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।"
        )


# POST /users/me/upload-cover-image - Upload cover image
@router.post("/me/upload-cover-image")
async def upload_user_cover_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Upload cover image for current user's profile"""
    user_email = current_user.email
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="শুধুমাত্র ছবি আপলোড করুন।"
        )
    
    # Note: User model doesn't have cover_image_url field yet
    # For now, we'll upload it but won't store the URL in the database
    try:
        # Find user
        user = session.exec(select(User).where(User.email == user_email)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ব্যবহারকারীর প্রোফাইল খুঁজে পাওয়া যায়নি।"
            )
        
        # Upload as profile photo for now (since cover_image_url field doesn't exist)
        file_url = await upload_profile_photo(file, user.id, f"{user.role.name}_cover")
        return {
            "message": "কভার ছবি সফলভাবে আপলোড হয়েছে!",
            "url": file_url,
            "note": "Cover image field not yet implemented in user model"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="কভার ছবি আপলোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।"
        )
