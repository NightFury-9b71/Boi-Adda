from db import get_session
from models import (
    BookCopy, Member, Admin, BookRequest, IssueBook,
    requestType, requestStatus, bookStatus
)
from sqlmodel import select, Session, SQLModel
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from auth import require_admin

router = APIRouter()


# Request/Response Models
class IssueDonationCreate(SQLModel):
    donation_request_id: int


class IssueBookResponse(SQLModel):
    id: int
    member_id: int
    member_name: str
    member_profile_photo: str | None = None
    book_title: str
    book_author: str
    book_cover_url: str | None = None
    book_copy_id: int
    issue_date: datetime
    due_date: datetime
    return_date: datetime | None = None
    is_overdue: bool
    message: str


@router.post("/", response_model=IssueBookResponse, status_code=status.HTTP_201_CREATED)
def issue_book_from_donation(
    data: IssueDonationCreate,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin issues a book to the donor after accepting their donation.
    The book copy is from the donated book that was just added to library.
    """
    user_email = current_user.email
    
    # Find admin by email
    admin = session.exec(select(Admin).where(Admin.email == user_email)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found. Please contact system administrator."
        )
    
    # Get the donation request
    donation_request = session.get(BookRequest, data.donation_request_id)
    if not donation_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation request not found"
        )
    
    # Verify it's a donation request
    if donation_request.request_type != requestType.DONATION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a donation request"
        )
    
    # Check status - must be completed (donation accepted)
    if donation_request.status != requestStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot issue book for donation with status: {donation_request.status.value}. Donation must be accepted first."
        )
    
    # Check if already issued to donor
    if donation_request.issue_book:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This donation has already resulted in an issued book"
        )
    
    # Get the book that was added from donation
    if not donation_request.book_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No book was linked to this donation"
        )
    
    # Find an available copy of the donated book
    statement = select(BookCopy).where(
        BookCopy.book_id == donation_request.book_id,
        BookCopy.status == bookStatus.AVAILABLE
    )
    available_copy = session.exec(statement).first()
    
    if not available_copy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No available copies of the donated book"
        )
    
    # Create IssueBook record
    issue_date = datetime.now()
    due_date = issue_date + timedelta(days=14)  # 14 days borrowing period
    
    issue_book = IssueBook(
        member_id=donation_request.member_id,  # Issue to the donor
        book_copy_id=available_copy.id,
        admin_id=admin.id,
        request_id=donation_request.id,
        issue_date=issue_date,
        due_date=due_date
    )
    
    # Update book copy status
    available_copy.status = bookStatus.ISSUED
    
    session.add(issue_book)
    session.add(available_copy)
    session.commit()
    session.refresh(issue_book)
    
    return IssueBookResponse(
        id=issue_book.id,
        member_id=issue_book.member_id,
        member_name=issue_book.member.name,
        member_profile_photo=issue_book.member.profile_photo_url,
        book_title=available_copy.book.title,
        book_author=available_copy.book.author,
        book_cover_url=available_copy.book.cover_image_url,
        book_copy_id=available_copy.id,
        issue_date=issue_book.issue_date,
        due_date=issue_book.due_date,
        return_date=issue_book.return_date,
        is_overdue=issue_book.is_overdue,
        message=f"Book issued to donor. Due date: {issue_book.due_date.strftime('%Y-%m-%d')}"
    )
