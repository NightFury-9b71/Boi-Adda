from db import get_session
from models import Book, Member, BookRequest, requestType, requestStatus
from sqlmodel import select, Session, SQLModel
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from auth import get_current_user
from typing import Optional

router = APIRouter()


# Request/Response Models
class DonationCreate(SQLModel):
    title: str
    author: str
    published_year: int
    pages: int


class DonationResponse(SQLModel):
    id: int
    donation_title: str
    donation_author: str
    donation_year: int
    donation_pages: int
    status: requestStatus
    created_at: datetime
    reviewed_at: Optional[datetime] = None


class DonationWithBookCreate(SQLModel):
    book_id: int


# POST /donations - Create a new donation request
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_donation_request(
    request_data: DonationCreate,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a donation request"""
    user_email = current_user.email
    
    # Find member
    member = session.exec(select(Member).where(Member.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found. Please contact admin."
        )
    
    # Validate donation data
    if request_data.published_year < 1000 or request_data.published_year > datetime.now().year:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid publication year"
        )
    
    if request_data.pages <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pages must be greater than 0"
        )
    
    # Create the donation request
    donation_request = BookRequest(
        request_type=requestType.DONATION,
        member_id=member.id,
        donation_title=request_data.title,
        donation_author=request_data.author,
        donation_year=request_data.published_year,
        donation_pages=request_data.pages,
        status=requestStatus.PENDING
    )
    
    session.add(donation_request)
    session.commit()
    session.refresh(donation_request)
    
    return DonationResponse(
        id=donation_request.id,
        donation_title=donation_request.donation_title,
        donation_author=donation_request.donation_author,
        donation_year=donation_request.donation_year,
        donation_pages=donation_request.donation_pages,
        status=donation_request.status,
        created_at=donation_request.created_at,
        reviewed_at=donation_request.reviewed_at
    )


# POST /donations/with-new-book - Create donation with existing book
@router.post("/with-new-book", status_code=status.HTTP_201_CREATED)
def create_donation_with_book(
    request_data: DonationWithBookCreate,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a donation request for an existing book in the library"""
    user_email = current_user.email
    
    # Find member
    member = session.exec(select(Member).where(Member.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found. Please contact admin."
        )
    
    # Verify book exists
    book = session.get(Book, request_data.book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    # Create the donation request with book details
    donation_request = BookRequest(
        request_type=requestType.DONATION,
        member_id=member.id,
        book_id=request_data.book_id,
        donation_title=book.title,
        donation_author=book.author,
        donation_year=book.published_year,
        donation_pages=book.pages,
        status=requestStatus.PENDING
    )
    
    session.add(donation_request)
    session.commit()
    session.refresh(donation_request)
    
    return DonationResponse(
        id=donation_request.id,
        donation_title=donation_request.donation_title,
        donation_author=donation_request.donation_author,
        donation_year=donation_request.donation_year,
        donation_pages=donation_request.donation_pages,
        status=donation_request.status,
        created_at=donation_request.created_at,
        reviewed_at=donation_request.reviewed_at
    )


# GET /donations - Get all donation requests for current user
@router.get("/", response_model=list[DonationResponse])
def get_my_donation_requests(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all donation requests for the authenticated member"""
    user_email = current_user.email
    
    # Find member
    member = session.exec(select(Member).where(Member.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found."
        )
    
    # Get all donation requests for this member
    requests = session.exec(
        select(BookRequest).where(
            BookRequest.member_id == member.id,
            BookRequest.request_type == requestType.DONATION
        ).order_by(BookRequest.created_at.desc())
    ).all()
    
    return [
        DonationResponse(
            id=req.id,
            donation_title=req.donation_title,
            donation_author=req.donation_author,
            donation_year=req.donation_year,
            donation_pages=req.donation_pages,
            status=req.status,
            created_at=req.created_at,
            reviewed_at=req.reviewed_at
        )
        for req in requests
    ]


# GET /donations/history - Same as GET /donations (for consistency with frontend)
@router.get("/history", response_model=list[DonationResponse])
def get_donation_history(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get donation history for the authenticated member"""
    return get_my_donation_requests(current_user, session)


# PUT /donations/{donation_id}/cancel - Cancel a donation request
@router.put("/{donation_id}/cancel", status_code=status.HTTP_200_OK)
def cancel_donation_request(
    donation_id: int,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Cancel a pending donation request"""
    user_email = current_user.email
    
    # Find member
    member = session.exec(select(Member).where(Member.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found."
        )
    
    donation_request = session.get(BookRequest, donation_id)
    
    if not donation_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation request not found"
        )
    
    # Verify the request belongs to the member
    if donation_request.member_id != member.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to cancel this request"
        )
    
    # Verify it's a donation request
    if donation_request.request_type != requestType.DONATION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a donation request"
        )
    
    # Can only cancel pending requests
    if donation_request.status != requestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel request with status: {donation_request.status.value}. Only pending requests can be cancelled."
        )
    
    # Delete the request
    session.delete(donation_request)
    session.commit()
    
    return {
        "message": "Donation request cancelled successfully",
        "request_id": donation_id
    }
