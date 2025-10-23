from db import get_session
from models import (
    Book, BookCopy, User, User, BookRequest, IssueBook,
    requestType, requestStatus, bookStatus
)
from sqlmodel import select, Session, SQLModel
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from auth import require_member_or_admin, require_admin

router = APIRouter()


# Request/Response Models
class ApproveRequestData(SQLModel):
    pass  # No additional data needed


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


class IssuedBookListResponse(SQLModel):
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


class ReturnBookData(SQLModel):
    book_condition: bookStatus = bookStatus.AVAILABLE  # Can mark as damaged/lost


# Admin Routes - Approve/Reject Borrow Requests
@router.post("/approve-request/{request_id}", status_code=status.HTTP_200_OK)
def approve_borrow_request(
    request_id: int,
    data: ApproveRequestData,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin approves a pending borrow request.
    This reserves a copy for the member to collect.
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
    borrow_request = session.get(BookRequest, request_id)
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
    
    # Check status
    if borrow_request.status != requestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve request with status: {borrow_request.status.value}"
        )
    
    # Find an available copy
    statement = select(BookCopy).where(
        BookCopy.book_id == borrow_request.book_id,
        BookCopy.status == bookStatus.AVAILABLE
    )
    available_copy = session.exec(statement).first()
    
    if not available_copy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No available copies of this book"
        )
    
    # Reserve the copy
    available_copy.status = bookStatus.RESERVED
    
    # Update the request
    borrow_request.status = requestStatus.APPROVED
    borrow_request.reviewed_at = datetime.now()
    borrow_request.reviewed_by_id = admin.id
    borrow_request.reserved_copy_id = available_copy.id
    
    session.add(available_copy)
    session.add(borrow_request)
    session.commit()
    
    return {
        "message": "Request approved successfully. Book reserved for member to collect.",
        "request_id": request_id,
        "reserved_copy_id": available_copy.id,
        "book_title": borrow_request.book.title
    }


@router.post("/reject-request/{request_id}", status_code=status.HTTP_200_OK)
def reject_borrow_request(
    request_id: int,
    data: ApproveRequestData,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin rejects a pending borrow request.
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
    borrow_request = session.get(BookRequest, request_id)
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
    
    # Check status
    if borrow_request.status != requestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject request with status: {borrow_request.status.value}"
        )
    
    # Update the request
    borrow_request.status = requestStatus.REJECTED
    borrow_request.reviewed_at = datetime.now()
    borrow_request.reviewed_by_id = admin.id
    
    session.add(borrow_request)
    session.commit()
    
    return {
        "message": "Request rejected successfully.",
        "request_id": request_id
    }


# Admin Routes - Return Books
@router.put("/return/{issue_id}", response_model=IssueBookResponse)
def return_book(
    issue_id: int,
    data: ReturnBookData,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin marks a book as returned by member.
    Can also mark the book condition (available, damaged, lost).
    """
    user_email = current_user.email
    
    # Find admin by email
    admin = session.exec(select(User).where(User.email == user_email)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found. Please contact system administrator."
        )
    
    # Get the issue record
    issue_book = session.get(IssueBook, issue_id)
    if not issue_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue record not found"
        )
    
    # Check if already returned
    if issue_book.return_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This book has already been returned"
        )
    
    # Validate book condition
    valid_conditions = [bookStatus.AVAILABLE, bookStatus.DAMAGED, bookStatus.LOST]
    if data.book_condition not in valid_conditions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid book condition. Must be one of: {', '.join([c.value for c in valid_conditions])}"
        )
    
    # Update issue record
    issue_book.return_date = datetime.now()
    
    # Update book copy status
    book_copy = session.get(BookCopy, issue_book.book_copy_id)
    book_copy.status = data.book_condition
    
    session.add(issue_book)
    session.add(book_copy)
    session.commit()
    session.refresh(issue_book)
    
    return IssueBookResponse(
        id=issue_book.id,
        member_id=issue_book.member_id,
        member_name=issue_book.member.name,
        member_profile_photo=issue_book.member.profile_photo_url,
        book_title=book_copy.book.title,
        book_author=book_copy.book.author,
        book_cover_url=book_copy.book.cover_image_url,
        book_copy_id=book_copy.id,
        issue_date=issue_book.issue_date,
        due_date=issue_book.due_date,
        return_date=issue_book.return_date,
        is_overdue=issue_book.is_overdue,
        message=f"Book returned successfully. Status: {data.book_condition.value}"
    )


# Admin Routes - View Issued Books
@router.get("/issued", response_model=list[IssuedBookListResponse])
def get_all_issued_books(
    current_user: dict = Depends(require_admin),
    include_returned: bool = False,
    session: Session = Depends(get_session)
):
    """
    Admin gets all issued books.
    By default, only shows currently issued (not returned) books.
    Set include_returned=true to see all records.
    """
    user_email = current_user.email
    
    # Find admin by email
    admin = session.exec(select(User).where(User.email == user_email)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found. Please contact system administrator."
        )
    
    # Build query
    statement = select(IssueBook)
    
    if not include_returned:
        statement = statement.where(IssueBook.return_date == None)
    
    statement = statement.order_by(IssueBook.issue_date.desc())
    
    issued_books = session.exec(statement).all()
    
    return [
        IssuedBookListResponse(
            id=issue.id,
            member_id=issue.member_id,
            member_name=issue.member.name,
            member_profile_photo=issue.member.profile_photo_url,
            book_title=issue.book_copy.book.title,
            book_author=issue.book_copy.book.author,
            book_cover_url=issue.book_copy.book.cover_image_url,
            book_copy_id=issue.book_copy_id,
            issue_date=issue.issue_date,
            due_date=issue.due_date,
            return_date=issue.return_date,
            is_overdue=issue.is_overdue
        )
        for issue in issued_books
    ]


@router.get("/overdue", response_model=list[IssuedBookListResponse])
def get_overdue_books(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin gets all overdue books (not returned and past due date).
    """
    user_email = current_user.email
    
    # Find admin by email
    admin = session.exec(select(User).where(User.email == user_email)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found. Please contact system administrator."
        )
    
    # Get all unreturned books
    statement = select(IssueBook).where(
        IssueBook.return_date == None
    ).order_by(IssueBook.due_date)
    
    issued_books = session.exec(statement).all()
    
    # Filter for overdue
    overdue_books = [issue for issue in issued_books if issue.is_overdue]
    
    return [
        IssuedBookListResponse(
            id=issue.id,
            member_id=issue.member_id,
            member_name=issue.member.name,
            member_profile_photo=issue.member.profile_photo_url,
            book_title=issue.book_copy.book.title,
            book_author=issue.book_copy.book.author,
            book_cover_url=issue.book_copy.book.cover_image_url,
            book_copy_id=issue.book_copy_id,
            issue_date=issue.issue_date,
            due_date=issue.due_date,
            return_date=issue.return_date,
            is_overdue=issue.is_overdue
        )
        for issue in overdue_books
    ]


@router.get("/pending-requests", response_model=list[dict])
def get_pending_requests(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin gets all pending borrow requests that need review.
    """
    user_email = current_user.email
    
    # Find admin by email
    admin = session.exec(select(User).where(User.email == user_email)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found. Please contact system administrator."
        )
    
    # Get pending borrow requests
    statement = select(BookRequest).where(
        BookRequest.request_type == requestType.BORROW,
        BookRequest.status == requestStatus.PENDING
    ).order_by(BookRequest.created_at)
    
    pending_requests = session.exec(statement).all()
    
    return [
        {
            "request_id": req.id,
            "member_id": req.member_id,
            "member_name": req.member.name,
            "member_email": req.member.email,
            "member_profile_photo": req.member.profile_photo_url,
            "book_id": req.book_id,
            "book_title": req.book.title,
            "book_author": req.book.author,
            "book_cover_url": req.book.cover_image_url,
            "created_at": req.created_at,
            "status": req.status.value
        }
        for req in pending_requests
    ]


@router.get("/approved-requests", response_model=list[dict])
def get_approved_requests(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin gets all approved borrow requests waiting for collection.
    """
    user_email = current_user.email
    
    # Find admin by email
    admin = session.exec(select(User).where(User.email == user_email)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found. Please contact system administrator."
        )
    
    # Get approved borrow requests
    statement = select(BookRequest).where(
        BookRequest.request_type == requestType.BORROW,
        BookRequest.status == requestStatus.APPROVED
    ).order_by(BookRequest.reviewed_at)
    
    approved_requests = session.exec(statement).all()
    
    return [
        {
            "request_id": req.id,
            "member_id": req.member_id,
            "member_name": req.member.name,
            "member_email": req.member.email,
            "member_profile_photo": req.member.profile_photo_url,
            "book_id": req.book_id,
            "book_title": req.book.title,
            "book_author": req.book.author,
            "book_cover_url": req.book.cover_image_url,
            "reserved_copy_id": req.reserved_copy_id,
            "created_at": req.created_at,
            "reviewed_at": req.reviewed_at,
            "status": req.status.value
        }
        for req in approved_requests
    ]


# Member Routes
@router.get("/my-issued-books", response_model=list[IssuedBookListResponse])
def get_member_issued_books(
    current_user: dict = Depends(require_member_or_admin),
    include_returned: bool = False,
    session: Session = Depends(get_session)
):
    """
    Member gets their issued books.
    By default, only shows currently issued (not returned) books.
    Set include_returned=true to see borrowing history.
    """
    user_email = current_user.email
    
    # Find member by email
    member = session.exec(select(User).where(User.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found. Please contact admin."
        )
    
    # Build query
    statement = select(IssueBook).where(IssueBook.member_id == member.id)
    
    if not include_returned:
        statement = statement.where(IssueBook.return_date == None)
    
    statement = statement.order_by(IssueBook.issue_date.desc())
    
    issued_books = session.exec(statement).all()
    
    return [
        IssuedBookListResponse(
            id=issue.id,
            member_id=issue.member_id,
            member_name=issue.member.name,
            member_profile_photo=issue.member.profile_photo_url,
            book_title=issue.book_copy.book.title,
            book_author=issue.book_copy.book.author,
            book_cover_url=issue.book_copy.book.cover_image_url,
            book_copy_id=issue.book_copy_id,
            issue_date=issue.issue_date,
            due_date=issue.due_date,
            return_date=issue.return_date,
            is_overdue=issue.is_overdue
        )
        for issue in issued_books
    ]


@router.get("/my-issued-books/{issue_id}", response_model=IssueBookResponse)
def get_member_issue_details(
    issue_id: int,
    current_user: dict = Depends(require_member_or_admin),
    session: Session = Depends(get_session)
):
    """
    Member gets details of a specific issued book.
    """
    user_email = current_user.email
    
    # Find member by email
    member = session.exec(select(User).where(User.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found. Please contact admin."
        )
    
    issue_book = session.get(IssueBook, issue_id)
    
    if not issue_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue record not found"
        )
    
    # Verify the issue belongs to the member
    if issue_book.member_id != member.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this record"
        )
    
    book_copy = issue_book.book_copy
    
    return IssueBookResponse(
        id=issue_book.id,
        member_id=issue_book.member_id,
        member_name=issue_book.member.name,
        member_profile_photo=issue_book.member.profile_photo_url,
        book_title=book_copy.book.title,
        book_author=book_copy.book.author,
        book_cover_url=book_copy.book.cover_image_url,
        book_copy_id=book_copy.id,
        issue_date=issue_book.issue_date,
        due_date=issue_book.due_date,
        return_date=issue_book.return_date,
        is_overdue=issue_book.is_overdue,
        message=f"Book is {'returned' if issue_book.return_date else ('overdue' if issue_book.is_overdue else 'on loan')}"
    )
