from db import get_session
from models import (
    BookCopy, User, User, BookRequest, IssueBook,
    requestType, requestStatus, bookStatus
)
from sqlmodel import select, Session, SQLModel
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from auth import require_admin
from typing import Optional

router = APIRouter()


# Request/Response Models
class IssueBookCreate(SQLModel):
    request_id: int
    due_date: Optional[datetime] = None


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
def issue_book_from_borrow_request(
    data: IssueBookCreate,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin issues a book to member from an approved borrow request.
    This creates an IssueBook record and updates statuses.
    Only approved borrow requests can be collected.
    """
    user_email = current_user.email
    
    # Find admin by email
    admin = session.exec(select(User).where(User.email == user_email)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found. Please contact system administrator."
        )
    
    # Get the request
    borrow_request = session.get(BookRequest, data.request_id)
    if not borrow_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Verify it's a borrow request
    if borrow_request.request_type != requestType.BORROW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a borrow request"
        )
    
    # Check status - must be approved
    if borrow_request.status != requestStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot issue book for request with status: {borrow_request.status.value}. Request must be approved first."
        )
    
    # Check if already collected
    if borrow_request.issue_book:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This book has already been collected"
        )
    
    # Get the reserved copy
    if not borrow_request.reserved_copy_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No copy was reserved for this request"
        )
    
    reserved_copy = session.get(BookCopy, borrow_request.reserved_copy_id)
    if not reserved_copy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserved copy not found"
        )
    
    # Create IssueBook record
    issue_date = datetime.now()
    # Use provided due_date or default to 14 days
    if data.due_date is None:
        due_date = issue_date + timedelta(days=14)
    else:
        due_date = data.due_date
    
    issue_book = IssueBook(
        member_id=borrow_request.member_id,
        book_copy_id=reserved_copy.id,
        admin_id=admin.id,
        request_id=borrow_request.id,
        issue_date=issue_date,
        due_date=due_date
    )
    
    # Update book copy status
    reserved_copy.status = bookStatus.ISSUED
    
    # Update request status
    borrow_request.status = requestStatus.COLLECTED
    borrow_request.collected_at = issue_date
    
    session.add(issue_book)
    session.add(reserved_copy)
    session.add(borrow_request)
    session.commit()
    session.refresh(issue_book)
    
    return IssueBookResponse(
        id=issue_book.id,
        member_id=issue_book.member_id,
        member_name=issue_book.member.name,
        member_profile_photo=issue_book.member.profile_photo_url,
        book_title=reserved_copy.book.title,
        book_author=reserved_copy.book.author,
        book_cover_url=reserved_copy.book.cover_image_url,
        book_copy_id=reserved_copy.id,
        issue_date=issue_book.issue_date,
        due_date=issue_book.due_date,
        return_date=issue_book.return_date,
        is_overdue=issue_book.is_overdue,
        message=f"Book issued from borrow request. Due date: {issue_book.due_date.strftime('%Y-%m-%d')}"
    )
