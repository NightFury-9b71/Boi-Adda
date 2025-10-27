from db import get_session
from models import Book, BookCopy, User, BookRequest, requestType, requestStatus, bookStatus, IssueBook
from sqlmodel import select, Session, SQLModel
from sqlalchemy.orm import selectinload
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from auth import get_current_user
from typing import Optional

router = APIRouter()


# Request/Response Models
class BorrowCreate(SQLModel):
    book_id: int


class BorrowResponse(SQLModel):
    id: int
    book_id: int
    book_title: str
    book_author: str
    book_cover_url: Optional[str] = None
    status: requestStatus
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    collected_at: Optional[datetime] = None
    return_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    is_overdue: bool = False
    overdue_days: int = 0


class IssuedBookResponse(SQLModel):
    id: int
    book_id: int
    book_title: str
    book_author: str
    book_cover_url: Optional[str] = None
    issue_date: datetime
    due_date: datetime
    return_date: Optional[datetime] = None
    is_overdue: bool


# POST /borrows - Create a new borrow request
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_borrow_request(
    request_data: BorrowCreate,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a borrow request for a book"""
    user_email = current_user.email
    
    # Find member
    member = session.exec(select(User).where(User.email == user_email)).first()
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
    
    # Check if there are available copies
    available_copy = session.exec(
        select(BookCopy).where(
            BookCopy.book_id == request_data.book_id,
            BookCopy.status == bookStatus.AVAILABLE
        )
    ).first()
    
    if not available_copy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No available copies of this book"
        )
    
    # Check if member already has a pending or approved request for this book
    existing_request = session.exec(
        select(BookRequest).where(
            BookRequest.member_id == member.id,
            BookRequest.book_id == request_data.book_id,
            BookRequest.request_type == requestType.BORROW,
            BookRequest.status.in_([requestStatus.PENDING, requestStatus.APPROVED])
        )
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have a {existing_request.status.value} request for this book"
        )
    
    # Create the borrow request
    borrow_request = BookRequest(
        request_type=requestType.BORROW,
        member_id=member.id,
        book_id=request_data.book_id,
        status=requestStatus.PENDING
    )
    
    session.add(borrow_request)
    session.commit()
    session.refresh(borrow_request)
    
    return BorrowResponse(
        id=borrow_request.id,
        book_id=book.id,
        book_title=book.title,
        book_author=book.author,
        book_cover_url=book.cover_image_url,
        status=borrow_request.status,
        created_at=borrow_request.created_at,
        reviewed_at=borrow_request.reviewed_at,
        collected_at=borrow_request.collected_at
    )


# GET /borrows - Get all borrow requests for current user
@router.get("/", response_model=list[BorrowResponse])
def get_my_borrow_requests(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all borrow requests for the authenticated member"""
    user_email = current_user.email
    
    # Find member
    member = session.exec(select(User).where(User.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found."
        )
    
    # Get all borrow requests for this member with book relationship loaded
    requests = session.exec(
        select(BookRequest).options(selectinload(BookRequest.book)).where(
            BookRequest.member_id == member.id,
            BookRequest.request_type == requestType.BORROW
        ).order_by(BookRequest.created_at.desc())
    ).all()
    
    result = []
    for req in requests:
        # Get issue book record if collected, return_requested, or completed (returned)
        issue_book = None
        if req.status in [requestStatus.COLLECTED, requestStatus.RETURN_REQUESTED, requestStatus.COMPLETED]:
            issue_book = session.exec(
                select(IssueBook).where(IssueBook.request_id == req.id)
            ).first()
        
        result.append(BorrowResponse(
            id=req.id,
            book_id=req.book_id,
            book_title=req.book.title,
            book_author=req.book.author,
            book_cover_url=req.book.cover_image_url,
            status=req.status,
            created_at=req.created_at,
            reviewed_at=req.reviewed_at,
            collected_at=req.collected_at,
            return_date=issue_book.return_date if issue_book else None,
            due_date=issue_book.due_date if issue_book else None,
            is_overdue=issue_book.is_overdue if issue_book else False,
            overdue_days=issue_book.overdue_days if issue_book else 0
        ))
    
    return result


# GET /borrows/history - Get borrow history (issued books)
@router.get("/history", response_model=list[IssuedBookResponse])
def get_borrow_history(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all issued books for the authenticated member"""
    user_email = current_user.email
    
    # Find member
    member = session.exec(select(User).where(User.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found."
        )
    
    # Get all issued books for this member
    issued_books = session.exec(
        select(IssueBook).where(
            IssueBook.member_id == member.id
        ).order_by(IssueBook.issue_date.desc())
    ).all()
    
    return [
        IssuedBookResponse(
            id=issue.id,
            book_id=issue.book_copy.book.id,
            book_title=issue.book_copy.book.title,
            book_author=issue.book_copy.book.author,
            book_cover_url=issue.book_copy.book.cover_image_url,
            issue_date=issue.issue_date,
            due_date=issue.due_date,
            return_date=issue.return_date,
            is_overdue=issue.is_overdue
        )
        for issue in issued_books
    ]


# PUT /borrows/{borrow_id}/cancel - Cancel a borrow request
@router.put("/{borrow_id}/cancel", status_code=status.HTTP_200_OK)
def cancel_borrow_request(
    borrow_id: int,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Cancel a pending borrow request"""
    user_email = current_user.email
    
    # Find member
    member = session.exec(select(User).where(User.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found."
        )
    
    borrow_request = session.get(BookRequest, borrow_id)
    
    if not borrow_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrow request not found"
        )
    
    # Verify the request belongs to the member
    if borrow_request.member_id != member.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to cancel this request"
        )
    
    # Verify it's a borrow request
    if borrow_request.request_type != requestType.BORROW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a borrow request"
        )
    
    # Can only cancel pending requests
    if borrow_request.status != requestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel request with status: {borrow_request.status.value}. Only pending requests can be cancelled."
        )
    
    # Delete the request
    session.delete(borrow_request)
    session.commit()
    
    return {
        "message": "Borrow request cancelled successfully",
        "request_id": borrow_id
    }


# PUT /borrows/{borrow_id}/return - Request to return a book
@router.put("/{borrow_id}/return", status_code=status.HTTP_200_OK)
def request_return_book(
    borrow_id: int,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Request to return a borrowed book (member initiates, admin processes)"""
    user_email = current_user.email
    
    # Find member
    member = session.exec(select(User).where(User.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found."
        )
    
    # Find the borrow request
    borrow_request = session.get(BookRequest, borrow_id)
    
    if not borrow_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrow request not found"
        )
    
    # Verify the request belongs to the member
    if borrow_request.member_id != member.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to return this book"
        )
    
    # Verify it's a borrow request
    if borrow_request.request_type != requestType.BORROW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a borrow request"
        )
    
    # Can only request return for collected books
    if borrow_request.status != requestStatus.COLLECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot return book with status: {borrow_request.status.value}. Only collected books can be returned."
        )
    
    # Find the issue record
    issue_book = session.exec(
        select(IssueBook).where(IssueBook.request_id == borrow_id)
    ).first()
    
    if not issue_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue record not found for this borrow request"
        )
    
    if issue_book.return_date is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book already returned"
        )
    
    # Update borrow request status to return_requested (waiting for admin approval)
    borrow_request.status = requestStatus.RETURN_REQUESTED
    session.add(borrow_request)
    
    session.commit()
    
    return {
        "message": "Return request submitted successfully. Waiting for admin approval.",
        "request_id": borrow_request.id,
        "status": borrow_request.status.value
    }
