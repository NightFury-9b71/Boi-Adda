from db import get_session
from models import Member, Admin, BookRequest, IssueBook, requestType, requestStatus
from sqlmodel import select, Session, SQLModel
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from auth import get_current_user
from typing import Optional
from storage import upload_profile_photo

router = APIRouter()


# Response Models
class UserProfileResponse(SQLModel):
    id: int
    name: str
    email: str
    role: str
    profile_photo_url: Optional[str] = None


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
    
    # Try to find in members first
    member = session.exec(select(Member).where(Member.email == user_email)).first()
    if member:
        return UserProfileResponse(
            id=member.id,
            name=member.name,
            email=member.email,
            role=member.role.value,
            profile_photo_url=member.profile_photo_url
        )
    
    # Try to find in admins
    admin = session.exec(select(Admin).where(Admin.email == user_email)).first()
    if admin:
        return UserProfileResponse(
            id=admin.id,
            name=admin.name,
            email=admin.email,
            role=admin.role.value,
            profile_photo_url=admin.profile_photo_url
        )
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User profile not found"
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
    
    # Try to find in members first
    member = session.exec(select(Member).where(Member.email == user_email)).first()
    if member:
        if name:
            member.name = name
        session.add(member)
        session.commit()
        session.refresh(member)
        return UserProfileResponse(
            id=member.id,
            name=member.name,
            email=member.email,
            role=member.role.value,
            profile_photo_url=member.profile_photo_url
        )
    
    # Try to find in admins
    admin = session.exec(select(Admin).where(Admin.email == user_email)).first()
    if admin:
        if name:
            admin.name = name
        session.add(admin)
        session.commit()
        session.refresh(admin)
        return UserProfileResponse(
            id=admin.id,
            name=admin.name,
            email=admin.email,
            role=admin.role.value,
            profile_photo_url=admin.profile_photo_url
        )
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User profile not found"
    )


# GET /users/me/stats - Get current user's statistics
@router.get("/me/stats", response_model=UserStatsResponse)
def get_current_user_stats(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current authenticated user's activity statistics"""
    user_email = current_user.email
    
    # Find member
    member = session.exec(select(Member).where(Member.email == user_email)).first()
    if not member:
        # If user is admin, return zeros
        admin = session.exec(select(Admin).where(Admin.email == user_email)).first()
        if admin:
            return UserStatsResponse(
                total_borrows=0,
                active_borrows=0,
                total_donations=0,
                pending_requests=0
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # Get borrow statistics
    total_borrows = len(session.exec(
        select(BookRequest).where(
            BookRequest.member_id == member.id,
            BookRequest.request_type == requestType.BORROW
        )
    ).all())
    
    # Get active borrows (issued and not returned)
    active_borrows = len(session.exec(
        select(IssueBook).where(
            IssueBook.member_id == member.id,
            IssueBook.return_date.is_(None)
        )
    ).all())
    
    # Get donation statistics
    total_donations = len(session.exec(
        select(BookRequest).where(
            BookRequest.member_id == member.id,
            BookRequest.request_type == requestType.DONATION
        )
    ).all())
    
    # Get pending requests (both borrow and donation)
    pending_requests = len(session.exec(
        select(BookRequest).where(
            BookRequest.member_id == member.id,
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
    # Try to find in members first
    member = session.get(Member, user_id)
    if member:
        return UserProfileResponse(
            id=member.id,
            name=member.name,
            email=member.email,
            role=member.role.value,
            profile_photo_url=member.profile_photo_url
        )
    
    # Try to find in admins
    admin = session.get(Admin, user_id)
    if admin:
        return UserProfileResponse(
            id=admin.id,
            name=admin.name,
            email=admin.email,
            role=admin.role.value,
            profile_photo_url=admin.profile_photo_url
        )
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found"
    )


# POST /users/me/upload-profile-image - Upload profile image
@router.post("/me/upload-profile-image")
async def upload_user_profile_image(
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
            detail="File must be an image"
        )
    
    try:
        # Find user and determine type
        member = session.exec(select(Member).where(Member.email == user_email)).first()
        if member:
            file_url = await upload_profile_photo(file, member.id, "member")
            member.profile_photo_url = file_url
            session.add(member)
            session.commit()
            return {
                "message": "Profile image uploaded successfully",
                "url": file_url
            }
        
        admin = session.exec(select(Admin).where(Admin.email == user_email)).first()
        if admin:
            file_url = await upload_profile_photo(file, admin.id, "admin")
            admin.profile_photo_url = file_url
            session.add(admin)
            session.commit()
            return {
                "message": "Profile image uploaded successfully",
                "url": file_url
            }
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
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
            detail="File must be an image"
        )
    
    # Note: User model doesn't have cover_image_url field yet
    # For now, we'll upload it but won't store the URL in the database
    try:
        # Find user and determine type
        member = session.exec(select(Member).where(Member.email == user_email)).first()
        if member:
            # Upload as profile photo for now (since cover_image_url field doesn't exist)
            file_url = await upload_profile_photo(file, member.id, "member_cover")
            return {
                "message": "Cover image uploaded successfully",
                "url": file_url,
                "note": "Cover image field not yet implemented in user model"
            }
        
        admin = session.exec(select(Admin).where(Admin.email == user_email)).first()
        if admin:
            file_url = await upload_profile_photo(file, admin.id, "admin_cover")
            return {
                "message": "Cover image uploaded successfully",
                "url": file_url,
                "note": "Cover image field not yet implemented in user model"
            }
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )
