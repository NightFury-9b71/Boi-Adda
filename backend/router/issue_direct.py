from db import get_session
from models import (
    BookCopy, User, IssueBook,
    bookStatus
)
from sqlmodel import select, Session, SQLModel
from sqlalchemy.orm import joinedload
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from auth import require_admin

router = APIRouter()


# Request/Response Models
class DirectIssueBookCreate(SQLModel):
    member_id: int
    book_copy_id: int


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
def issue_book_directly(
    data: DirectIssueBookCreate,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin issues a book directly to a member without a borrow request.
    Useful for walk-in members or special cases.
    The book copy must be AVAILABLE or RESERVED.
    """
    user_email = current_user.email
    
    # Find admin by email
    admin = session.exec(select(User).where(User.email == user_email)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found. Please contact system administrator."
        )
    
    # Verify member exists
    member = session.get(User, data.member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Get the book copy
    book_copy = session.get(BookCopy, data.book_copy_id)
    if not book_copy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book copy not found"
        )
    
    # Check if copy is available or reserved
    if book_copy.status not in [bookStatus.AVAILABLE, bookStatus.RESERVED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot issue book with status: {book_copy.status.value}. Book must be available or reserved."
        )
    
    # Check if member already has this book issued
    existing_issue = session.exec(
        select(IssueBook).where(
            IssueBook.member_id == data.member_id,
            IssueBook.book_copy_id == data.book_copy_id,
            IssueBook.return_date == None
        )
    ).first()
    
    if existing_issue:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This member already has this book copy issued"
        )
    
    # Create IssueBook record
    issue_date = datetime.now()
    due_date = issue_date + timedelta(days=14)  # 14 days borrowing period
    
    issue_book = IssueBook(
        member_id=data.member_id,
        book_copy_id=data.book_copy_id,
        admin_id=admin.id,
        request_id=None,  # No request for direct issue
        issue_date=issue_date,
        due_date=due_date
    )
    
    # Update book copy status
    book_copy.status = bookStatus.ISSUED
    
    session.add(issue_book)
    session.add(book_copy)
    session.commit()
    
    # Load the issue_book with relationships for the response
    issue_book = session.exec(
        select(IssueBook).where(IssueBook.id == issue_book.id).options(
            joinedload(IssueBook.member),
            joinedload(IssueBook.book_copy).joinedload(BookCopy.book)
        )
    ).first()
    
    return IssueBookResponse(
        id=issue_book.id,
        member_id=issue_book.member_id,
        member_name=issue_book.member.name,
        member_profile_photo=issue_book.member.profile_photo_url,
        book_title=issue_book.book_copy.book.title,
        book_author=issue_book.book_copy.book.author,
        book_cover_url=issue_book.book_copy.book.cover_image_url,
        book_copy_id=issue_book.book_copy.id,
        issue_date=issue_book.issue_date,
        due_date=issue_book.due_date,
        return_date=issue_book.return_date,
        is_overdue=issue_book.is_overdue,
        message=f"Book issued directly. Due date: {issue_book.due_date.strftime('%Y-%m-%d')}"
    )
