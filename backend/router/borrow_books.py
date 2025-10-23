from db import get_session
from models import Book, BookCopy, User, BookRequest, requestType, requestStatus, bookStatus
from sqlmodel import select, Session, SQLModel
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from auth import require_member_or_admin, get_current_user

router = APIRouter()


# Request/Response Models
class BorrowRequestCreate(SQLModel):
    book_id: int


class BorrowRequestResponse(SQLModel):
    id: int
    book_id: int
    book_title: str
    book_author: str
    book_cover_url: str | None = None
    status: requestStatus
    created_at: datetime
    reviewed_at: datetime | None = None
    message: str


class BorrowRequestListResponse(SQLModel):
    id: int
    book_id: int
    book_title: str
    book_author: str
    book_cover_url: str | None = None
    status: requestStatus
    created_at: datetime


@router.post("/request", response_model=BorrowRequestResponse, status_code=status.HTTP_201_CREATED)
def create_borrow_request(
    request_data: BorrowRequestCreate,
    current_user: dict = Depends(require_member_or_admin),
    session: Session = Depends(get_session)
):
    """
    Create a borrow request for a book.
    Member can request to borrow a book if copies are available.
    """
    # Get member_id from authenticated user
    user_email = current_user.email
    
    # Find member by email
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
    statement = select(BookCopy).where(
        BookCopy.book_id == request_data.book_id,
        BookCopy.status == bookStatus.AVAILABLE
    )
    available_copies = session.exec(statement).all()
    
    if not available_copies:
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

    reserve_book = available_copies[0]
    reserve_book.status = bookStatus.RESERVED
    
    session.add(reserve_book)
    session.add(borrow_request)
    session.commit()
    session.refresh(borrow_request)
    session.refresh(reserve_book)
    
    return BorrowRequestResponse(
        id=borrow_request.id,
        book_id=book.id,
        book_title=book.title,
        book_author=book.author,
        book_cover_url=book.cover_image_url,
        status=borrow_request.status,
        created_at=borrow_request.created_at,
        reviewed_at=borrow_request.reviewed_at,
        message=f"Borrow request created successfully. Your request is pending admin approval."
    )


@router.get("/requests", response_model=list[BorrowRequestListResponse])
def get_member_borrow_requests(
    current_user: dict = Depends(require_member_or_admin),
    session: Session = Depends(get_session)
):
    """
    Get all borrow requests for the authenticated member.
    """
    user_email = current_user.email
    
    # Find member by email
    member = session.exec(select(User).where(User.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found. Please contact admin."
        )
    
    # Get all borrow requests for this member
    statement = select(BookRequest).where(
        BookRequest.member_id == member.id,
        BookRequest.request_type == requestType.BORROW
    ).order_by(BookRequest.created_at.desc())
    
    requests = session.exec(statement).all()
    
    return [
        BorrowRequestListResponse(
            id=req.id,
            book_id=req.book_id,
            book_title=req.book.title,
            book_author=req.book.author,
            book_cover_url=req.book.cover_image_url,
            status=req.status,
            created_at=req.created_at
        )
        for req in requests
    ]


@router.get("/requests/{request_id}", response_model=BorrowRequestResponse)
def get_borrow_request_details(
    request_id: int,
    current_user: dict = Depends(require_member_or_admin),
    session: Session = Depends(get_session)
):
    """
    Get details of a specific borrow request.
    """
    user_email = current_user.email
    
    # Find member by email
    member = session.exec(select(User).where(User.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found. Please contact admin."
        )
    
    borrow_request = session.get(BookRequest, request_id)
    
    if not borrow_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrow request not found"
        )
    
    # Verify the request belongs to the member
    if borrow_request.member_id != member.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this request"
        )
    
    # Verify it's a borrow request
    if borrow_request.request_type != requestType.BORROW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a borrow request"
        )
    
    return BorrowRequestResponse(
        id=borrow_request.id,
        book_id=borrow_request.book_id,
        book_title=borrow_request.book.title,
        book_author=borrow_request.book.author,
        book_cover_url=borrow_request.book.cover_image_url,
        status=borrow_request.status,
        created_at=borrow_request.created_at,
        reviewed_at=borrow_request.reviewed_at,
        message=f"Request status: {borrow_request.status.value}"
    )


@router.delete("/requests/{request_id}", status_code=status.HTTP_200_OK)
def cancel_borrow_request(
    request_id: int,
    current_user: dict = Depends(require_member_or_admin),
    session: Session = Depends(get_session)
):
    """
    Cancel a pending borrow request.
    Can only cancel requests that are in PENDING status.
    """
    user_email = current_user.email
    
    # Find member by email
    member = session.exec(select(User).where(User.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found. Please contact admin."
        )
    
    borrow_request = session.get(BookRequest, request_id)
    
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
        "request_id": request_id
    }


@router.get("/available-books", response_model=list[dict])
def get_available_books(session: Session = Depends(get_session)):
    """
    Get all books that have at least one available copy.
    Public endpoint - no authentication required.
    """
    # Get all books with their available copies count
    statement = select(Book)
    books = session.exec(statement).all()
    
    available_books = []
    for book in books:
        # Count available copies
        available_count = len([
            copy for copy in book.copies 
            if copy.status == bookStatus.AVAILABLE
        ])
        
        if available_count > 0:
            available_books.append({
                "id": book.id,
                "title": book.title,
                "author": book.author,
                "published_year": book.published_year,
                "pages": book.pages,
                "cover_image_url": book.cover_image_url,
                "available_copies": available_count,
                "total_copies": len(book.copies)
            })
    
    return available_books
