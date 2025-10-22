from db import get_session
from models import (
    Book, BookCopy, Member, Admin, BookRequest,
    requestType, requestStatus, bookStatus
)
from sqlmodel import select, Session, SQLModel
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from auth import require_member_or_admin, require_admin

router = APIRouter()


# Request/Response Models
class DonationRequestCreate(SQLModel):
    donation_title: str
    donation_author: str
    donation_year: int
    donation_pages: int


class DonationRequestResponse(SQLModel):
    id: int
    donation_title: str
    donation_author: str
    donation_year: int
    donation_pages: int
    status: requestStatus
    created_at: datetime
    reviewed_at: datetime | None = None
    message: str


class DonationRequestListResponse(SQLModel):
    id: int
    donation_title: str
    donation_author: str
    donation_year: int
    donation_pages: int
    status: requestStatus
    created_at: datetime
    member_id: int
    member_name: str
    member_email: str


class AcceptDonationData(SQLModel):
    copies_to_add: int = 1  # Number of copies to add to library


class RejectDonationData(SQLModel):
    pass  # No additional data needed


class UploadBookData(SQLModel):
    title: str
    author: str
    published_year: int
    pages: int
    copies_to_add: int = 1


# Member Routes
@router.post("/request", response_model=DonationRequestResponse, status_code=status.HTTP_201_CREATED)
def create_donation_request(
    request_data: DonationRequestCreate,
    current_user: dict = Depends(require_member_or_admin),
    session: Session = Depends(get_session)
):
    """
    Member creates a donation request.
    Member offers to donate a book to the library.
    """
    user_email = current_user.email
    
    # Find member by email
    member = session.exec(select(Member).where(Member.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found. Please contact admin."
        )
    
    # Validate donation data
    if request_data.donation_year < 1000 or request_data.donation_year > datetime.now().year:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid publication year"
        )
    
    if request_data.donation_pages <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pages must be greater than 0"
        )
    
    # Create the donation request
    donation_request = BookRequest(
        request_type=requestType.DONATION,
        member_id=member.id,
        donation_title=request_data.donation_title,
        donation_author=request_data.donation_author,
        donation_year=request_data.donation_year,
        donation_pages=request_data.donation_pages,
        status=requestStatus.PENDING
    )
    
    session.add(donation_request)
    session.commit()
    session.refresh(donation_request)
    
    return DonationRequestResponse(
        id=donation_request.id,
        donation_title=donation_request.donation_title,
        donation_author=donation_request.donation_author,
        donation_year=donation_request.donation_year,
        donation_pages=donation_request.donation_pages,
        status=donation_request.status,
        created_at=donation_request.created_at,
        reviewed_at=donation_request.reviewed_at,
        message="Donation request created successfully. Waiting for admin approval."
    )


@router.get("/my-requests", response_model=list[DonationRequestListResponse])
def get_member_donation_requests(
    current_user: dict = Depends(require_member_or_admin),
    session: Session = Depends(get_session)
):
    """
    Get all donation requests for the authenticated member.
    """
    user_email = current_user.email
    
    # Find member by email
    member = session.exec(select(Member).where(Member.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found. Please contact admin."
        )
    
    # Get all donation requests for this member
    statement = select(BookRequest).where(
        BookRequest.member_id == member.id,
        BookRequest.request_type == requestType.DONATION
    ).order_by(BookRequest.created_at.desc())
    
    requests = session.exec(statement).all()
    
    return [
        DonationRequestListResponse(
            id=req.id,
            donation_title=req.donation_title,
            donation_author=req.donation_author,
            donation_year=req.donation_year,
            donation_pages=req.donation_pages,
            status=req.status,
            created_at=req.created_at,
            member_id=req.member_id,
            member_name=req.member.name,
            member_email=req.member.email
        )
        for req in requests
    ]


@router.get("/my-requests/{request_id}", response_model=DonationRequestResponse)
def get_donation_request_details(
    request_id: int,
    current_user: dict = Depends(require_member_or_admin),
    session: Session = Depends(get_session)
):
    """
    Get details of a specific donation request.
    """
    user_email = current_user.email
    
    # Find member by email
    member = session.exec(select(Member).where(Member.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found. Please contact admin."
        )
    
    donation_request = session.get(BookRequest, request_id)
    
    if not donation_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation request not found"
        )
    
    # Verify the request belongs to the member
    if donation_request.member_id != member.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this request"
        )
    
    # Verify it's a donation request
    if donation_request.request_type != requestType.DONATION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a donation request"
        )
    
    return DonationRequestResponse(
        id=donation_request.id,
        donation_title=donation_request.donation_title,
        donation_author=donation_request.donation_author,
        donation_year=donation_request.donation_year,
        donation_pages=donation_request.donation_pages,
        status=donation_request.status,
        created_at=donation_request.created_at,
        reviewed_at=donation_request.reviewed_at,
        message=f"Request status: {donation_request.status.value}"
    )


@router.delete("/my-requests/{request_id}", status_code=status.HTTP_200_OK)
def cancel_donation_request(
    request_id: int,
    current_user: dict = Depends(require_member_or_admin),
    session: Session = Depends(get_session)
):
    """
    Cancel a pending donation request.
    Can only cancel requests that are in PENDING status.
    """
    user_email = current_user.email
    
    # Find member by email
    member = session.exec(select(Member).where(Member.email == user_email)).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found. Please contact admin."
        )
    
    donation_request = session.get(BookRequest, request_id)
    
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
        "request_id": request_id
    }


# Admin Routes
@router.get("/pending-requests", response_model=list[DonationRequestListResponse])
def get_pending_donation_requests(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin gets all pending donation requests that need review.
    """
    user_email = current_user.email
    
    # Find admin by email
    admin = session.exec(select(Admin).where(Admin.email == user_email)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found. Please contact system administrator."
        )
    
    # Get pending donation requests
    statement = select(BookRequest).where(
        BookRequest.request_type == requestType.DONATION,
        BookRequest.status == requestStatus.PENDING
    ).order_by(BookRequest.created_at)
    
    pending_requests = session.exec(statement).all()
    
    return [
        DonationRequestListResponse(
            id=req.id,
            donation_title=req.donation_title,
            donation_author=req.donation_author,
            donation_year=req.donation_year,
            donation_pages=req.donation_pages,
            status=req.status,
            created_at=req.created_at,
            member_id=req.member_id,
            member_name=req.member.name,
            member_email=req.member.email
        )
        for req in pending_requests
    ]


@router.get("/all-requests", response_model=list[DonationRequestListResponse])
def get_all_donation_requests(
    current_user: dict = Depends(require_admin),
    status_filter: requestStatus | None = None,
    session: Session = Depends(get_session)
):
    """
    Admin gets all donation requests.
    Optionally filter by status.
    """
    user_email = current_user.email
    
    # Find admin by email
    admin = session.exec(select(Admin).where(Admin.email == user_email)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found. Please contact system administrator."
        )
    
    # Build query
    statement = select(BookRequest).where(
        BookRequest.request_type == requestType.DONATION
    )
    
    if status_filter:
        statement = statement.where(BookRequest.status == status_filter)
    
    statement = statement.order_by(BookRequest.created_at.desc())
    
    requests = session.exec(statement).all()
    
    return [
        DonationRequestListResponse(
            id=req.id,
            donation_title=req.donation_title,
            donation_author=req.donation_author,
            donation_year=req.donation_year,
            donation_pages=req.donation_pages,
            status=req.status,
            created_at=req.created_at,
            member_id=req.member_id,
            member_name=req.member.name,
            member_email=req.member.email
        )
        for req in requests
    ]


@router.post("/accept-donation/{request_id}", status_code=status.HTTP_200_OK)
def accept_donation(
    request_id: int,
    data: AcceptDonationData,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin accepts a donation request and adds the book to the library.
    This creates a new Book entry (or uses existing) and adds BookCopy records.
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
    donation_request = session.get(BookRequest, request_id)
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
    
    # Check status
    if donation_request.status != requestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept request with status: {donation_request.status.value}"
        )
    
    # Validate copies_to_add
    if data.copies_to_add <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of copies must be greater than 0"
        )
    
    # Check if book already exists in library
    statement = select(Book).where(
        Book.title == donation_request.donation_title,
        Book.author == donation_request.donation_author
    )
    existing_book = session.exec(statement).first()
    
    if existing_book:
        # Book already exists, just add copies
        book = existing_book
        message = f"Book already exists in library. Added {data.copies_to_add} new copy/copies."
    else:
        # Create new book entry
        book = Book(
            title=donation_request.donation_title,
            author=donation_request.donation_author,
            published_year=donation_request.donation_year,
            pages=donation_request.donation_pages
        )
        session.add(book)
        session.flush()  # Get the book ID
        message = f"New book added to library with {data.copies_to_add} copy/copies."
    
    # Add book copies
    for _ in range(data.copies_to_add):
        book_copy = BookCopy(
            book_id=book.id,
            status=bookStatus.AVAILABLE
        )
        session.add(book_copy)
    
    # Update donation request
    donation_request.status = requestStatus.COMPLETED
    donation_request.reviewed_at = datetime.now()
    donation_request.reviewed_by_id = admin.id
    donation_request.book_id = book.id  # Link to the book
    
    session.add(donation_request)
    session.commit()
    
    return {
        "message": message,
        "request_id": request_id,
        "book_id": book.id,
        "book_title": book.title,
        "book_author": book.author,
        "book_cover_url": book.cover_image_url,
        "copies_added": data.copies_to_add,
        "total_copies_in_library": len(book.copies)
    }


@router.post("/reject-donation/{request_id}", status_code=status.HTTP_200_OK)
def reject_donation(
    request_id: int,
    data: RejectDonationData,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin rejects a donation request.
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
    donation_request = session.get(BookRequest, request_id)
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
    
    # Check status
    if donation_request.status != requestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject request with status: {donation_request.status.value}"
        )
    
    # Update donation request
    donation_request.status = requestStatus.REJECTED
    donation_request.reviewed_at = datetime.now()
    donation_request.reviewed_by_id = admin.id
    
    session.add(donation_request)
    session.commit()
    
    return {
        "message": "Donation request rejected successfully.",
        "request_id": request_id
    }


@router.get("/completed-donations", response_model=list[DonationRequestListResponse])
def get_completed_donations(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin gets all completed donation requests (books that were added to library).
    """
    user_email = current_user.email
    
    # Find admin by email
    admin = session.exec(select(Admin).where(Admin.email == user_email)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found. Please contact system administrator."
        )
    
    # Get completed donation requests
    statement = select(BookRequest).where(
        BookRequest.request_type == requestType.DONATION,
        BookRequest.status == requestStatus.COMPLETED
    ).order_by(BookRequest.reviewed_at.desc())
    
    completed_requests = session.exec(statement).all()
    
    return [
        DonationRequestListResponse(
            id=req.id,
            donation_title=req.donation_title,
            donation_author=req.donation_author,
            donation_year=req.donation_year,
            donation_pages=req.donation_pages,
            status=req.status,
            created_at=req.created_at,
            member_id=req.member_id,
            member_name=req.member.name,
            member_email=req.member.email
        )
        for req in completed_requests
    ]


@router.post("/upload-books", status_code=status.HTTP_201_CREATED)
def upload_books_directly(
    data: UploadBookData,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Admin directly uploads/adds books to the library without a donation request.
    This is for books acquired through purchase, donation in-person, or other means.
    """
    user_email = current_user.email
    
    # Find admin by email
    admin = session.exec(select(Admin).where(Admin.email == user_email)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found. Please contact system administrator."
        )
    
    # Validate book data
    if data.published_year < 1000 or data.published_year > datetime.now().year:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid publication year"
        )
    
    if data.pages <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pages must be greater than 0"
        )
    
    if data.copies_to_add <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of copies must be greater than 0"
        )
    
    # Check if book already exists in library
    statement = select(Book).where(
        Book.title == data.title,
        Book.author == data.author
    )
    existing_book = session.exec(statement).first()
    
    if existing_book:
        # Book already exists, just add copies
        book = existing_book
        action = "updated"
        message = f"Book already exists in library. Added {data.copies_to_add} new copy/copies."
    else:
        # Create new book entry
        book = Book(
            title=data.title,
            author=data.author,
            published_year=data.published_year,
            pages=data.pages
        )
        session.add(book)
        session.flush()  # Get the book ID
        action = "created"
        message = f"New book added to library with {data.copies_to_add} copy/copies."
    
    # Add book copies
    new_copies = []
    for _ in range(data.copies_to_add):
        book_copy = BookCopy(
            book_id=book.id,
            status=bookStatus.AVAILABLE
        )
        session.add(book_copy)
        new_copies.append(book_copy)
    
    session.commit()
    session.refresh(book)
    
    return {
        "message": message,
        "action": action,
        "book_id": book.id,
        "book_title": book.title,
        "book_author": book.author,
        "book_cover_url": book.cover_image_url,
        "published_year": book.published_year,
        "pages": book.pages,
        "copies_added": data.copies_to_add,
        "total_copies_in_library": len(book.copies),
        "available_copies": len([c for c in book.copies if c.status == bookStatus.AVAILABLE])
    }

