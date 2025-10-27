from db import get_session
from models import Book, BookCopy, Category, bookStatus
from sqlmodel import select, Session, SQLModel, or_, func
from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime
from auth import require_admin, get_current_user
from typing import Optional

router = APIRouter()


# Request/Response Models
class BookCreate(SQLModel):
    title: str
    author: str
    published_year: int
    pages: int
    cover_image_url: Optional[str] = None
    category_id: Optional[int] = None
    total_copies: int = 1


class BookUpdate(SQLModel):
    title: Optional[str] = None
    author: Optional[str] = None
    published_year: Optional[int] = None
    pages: Optional[int] = None
    cover_image_url: Optional[str] = None
    category_id: Optional[int] = None
    total_copies: Optional[int] = None


class BookResponse(SQLModel):
    id: int
    title: str
    author: str
    published_year: int
    pages: int
    cover_image_url: Optional[str] = None
    cover: Optional[str] = None  # Alias for cover_image_url for frontend compatibility
    cover_public_id: Optional[str] = None  # For Cloudinary integration
    category_id: Optional[int] = None
    total_copies: int
    available_copies: int
    times_borrowed: int = 0
    created_at: Optional[datetime] = None


class BookDetailResponse(BookResponse):
    reserved_copies: int
    issued_copies: int
    damaged_copies: int
    lost_copies: int


# GET /books - List all books
@router.get("/", response_model=list[BookResponse])
def list_books(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """
    Get all books with optional search and pagination.
    Public endpoint - no authentication required.
    """
    statement = select(Book)
    
    # Add search filter if provided
    if search:
        search_pattern = f"%{search}%"
        statement = statement.where(
            or_(
                Book.title.ilike(search_pattern),
                Book.author.ilike(search_pattern)
            )
        )
    
    # Add pagination
    statement = statement.offset(skip).limit(limit)
    
    books = session.exec(statement).all()
    
    return [
        BookResponse(
            id=book.id,
            title=book.title,
            author=book.author,
            published_year=book.published_year,
            pages=book.pages,
            cover_image_url=book.cover_image_url,
            cover=book.cover_image_url,  # Alias for frontend
            cover_public_id=None,  # TODO: Add Cloudinary support
            category_id=book.category_id,
            total_copies=len(book.copies),
            available_copies=len([c for c in book.copies if c.status == bookStatus.AVAILABLE]),
            times_borrowed=len([ib for c in book.copies for ib in c.issue_books]),
            created_at=None  # TODO: Add created_at to Book model
        )
        for book in books
    ]


# GET /books/search - Search books
@router.get("/search", response_model=list[BookResponse])
def search_books(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    session: Session = Depends(get_session)
):
    """
    Search books by title or author.
    Public endpoint - no authentication required.
    """
    search_pattern = f"%{q}%"
    statement = select(Book).where(
        or_(
            Book.title.ilike(search_pattern),
            Book.author.ilike(search_pattern)
        )
    ).offset(skip).limit(limit)
    
    books = session.exec(statement).all()
    
    return [
        BookResponse(
            id=book.id,
            title=book.title,
            author=book.author,
            published_year=book.published_year,
            pages=book.pages,
            cover_image_url=book.cover_image_url,
            cover=book.cover_image_url,  # Alias for frontend
            cover_public_id=None,  # TODO: Add Cloudinary support
            category_id=book.category_id,
            total_copies=len(book.copies),
            available_copies=len([c for c in book.copies if c.status == bookStatus.AVAILABLE]),
            times_borrowed=len([ib for c in book.copies for ib in c.issue_books]),
            created_at=None  # TODO: Add created_at to Book model
        )
        for book in books
    ]


# GET /books/{id} - Get book details
@router.get("/{book_id}", response_model=BookDetailResponse)
def get_book_details(
    book_id: int,
    session: Session = Depends(get_session)
):
    """
    Get detailed information about a specific book.
    Public endpoint - no authentication required.
    """
    book = session.get(Book, book_id)
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    # Count copies by status
    available_copies = len([c for c in book.copies if c.status == bookStatus.AVAILABLE])
    reserved_copies = len([c for c in book.copies if c.status == bookStatus.RESERVED])
    issued_copies = len([c for c in book.copies if c.status == bookStatus.ISSUED])
    damaged_copies = len([c for c in book.copies if c.status == bookStatus.DAMAGED])
    lost_copies = len([c for c in book.copies if c.status == bookStatus.LOST])
    
    return BookDetailResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        published_year=book.published_year,
        pages=book.pages,
        cover_image_url=book.cover_image_url,
        cover=book.cover_image_url,  # Alias for frontend
        cover_public_id=None,  # TODO: Add Cloudinary support
        category_id=book.category_id,
        total_copies=len(book.copies),
        available_copies=available_copies,
        times_borrowed=len([ib for c in book.copies for ib in c.issue_books]),
        created_at=None,  # TODO: Add created_at to Book model
        reserved_copies=reserved_copies,
        issued_copies=issued_copies,
        damaged_copies=damaged_copies,
        lost_copies=lost_copies
    )


# POST /books - Create a new book (Admin only)
@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book_data: BookCreate,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Create a new book entry in the library with the specified number of copies.
    Admin only endpoint.
    """
    # Validate book data
    if book_data.published_year < 1000 or book_data.published_year > datetime.now().year:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid publication year"
        )
    
    if book_data.pages <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pages must be greater than 0"
        )
    
    # Validate category if provided
    if book_data.category_id is not None:
        category = session.get(Category, book_data.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category"
            )
    
    # Check if book already exists
    existing_book = session.exec(
        select(Book).where(
            Book.title == book_data.title,
            Book.author == book_data.author
        )
    ).first()
    
    if existing_book:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book with this title and author already exists"
        )
    
    # Validate total_copies
    if book_data.total_copies < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total copies cannot be negative"
        )
    
    # Create new book
    book = Book(
        title=book_data.title,
        author=book_data.author,
        published_year=book_data.published_year,
        pages=book_data.pages,
        cover_image_url=book_data.cover_image_url,
        category_id=book_data.category_id
    )
    
    session.add(book)
    session.flush()  # Get the book ID
    
    # Create book copies
    for _ in range(book_data.total_copies):
        book_copy = BookCopy(
            book_id=book.id,
            status=bookStatus.AVAILABLE
        )
        session.add(book_copy)
    
    session.commit()
    session.refresh(book)
    
    return BookResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        published_year=book.published_year,
        pages=book.pages,
        cover_image_url=book.cover_image_url,
        cover=book.cover_image_url,
        cover_public_id=None,
        category_id=book.category_id,
        total_copies=len(book.copies),
        available_copies=len([c for c in book.copies if c.status == bookStatus.AVAILABLE]),
        times_borrowed=0,
        created_at=None
    )


# PUT /books/{id} - Update book details (Admin only)
@router.put("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: int,
    book_data: BookUpdate,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Update book details.
    Admin only endpoint.
    """
    book = session.get(Book, book_id)
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    # Update only provided fields
    if book_data.title is not None:
        book.title = book_data.title
    
    if book_data.author is not None:
        book.author = book_data.author
    
    if book_data.published_year is not None:
        if book_data.published_year < 1000 or book_data.published_year > datetime.now().year:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid publication year"
            )
        book.published_year = book_data.published_year
    
    if book_data.pages is not None:
        if book_data.pages <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pages must be greater than 0"
            )
        book.pages = book_data.pages
    
    if book_data.cover_image_url is not None:
        book.cover_image_url = book_data.cover_image_url
    
    if book_data.category_id is not None:
        category = session.get(Category, book_data.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category"
            )
        book.category_id = book_data.category_id
    
    # Handle total_copies update
    if book_data.total_copies is not None:
        if book_data.total_copies < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Total copies cannot be negative"
            )
        
        current_copies = len(book.copies)
        desired_copies = book_data.total_copies
        
        if desired_copies > current_copies:
            # Add more copies
            copies_to_add = desired_copies - current_copies
            for _ in range(copies_to_add):
                new_copy = BookCopy(
                    book_id=book.id,
                    status=bookStatus.AVAILABLE
                )
                session.add(new_copy)
        elif desired_copies < current_copies:
            # Remove excess copies (only if they are available)
            copies_to_remove = current_copies - desired_copies
            available_copies = [c for c in book.copies if c.status == bookStatus.AVAILABLE]
            
            if len(available_copies) < copies_to_remove:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot reduce copies. Only {len(available_copies)} available copies found, but trying to remove {copies_to_remove}."
                )
            
            # Remove the first N available copies
            for copy in available_copies[:copies_to_remove]:
                session.delete(copy)
    
    session.add(book)
    session.commit()
    session.refresh(book)
    
    return BookResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        published_year=book.published_year,
        pages=book.pages,
        cover_image_url=book.cover_image_url,
        cover=book.cover_image_url,
        cover_public_id=None,
        category_id=book.category_id,
        total_copies=len(book.copies),
        available_copies=len([c for c in book.copies if c.status == bookStatus.AVAILABLE]),
        times_borrowed=len([ib for c in book.copies for ib in c.issue_books]),
        created_at=None
    )


# DELETE /books/{id} - Delete a book (Admin only)
@router.delete("/{book_id}", status_code=status.HTTP_200_OK)
def delete_book(
    book_id: int,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Delete a book and all its copies.
    Admin only - can only delete if no copies are currently issued or reserved.
    """
    book = session.get(Book, book_id)
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    # Check if any copies are issued or reserved
    active_copies = [
        c for c in book.copies 
        if c.status in [bookStatus.ISSUED, bookStatus.RESERVED]
    ]
    
    if active_copies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete book. {len(active_copies)} copy/copies are currently issued or reserved."
        )
    
    # Delete all copies first
    for copy in book.copies:
        session.delete(copy)
    
    # Delete the book
    session.delete(book)
    session.commit()
    
    return {
        "message": "Book deleted successfully",
        "book_id": book_id,
        "book_title": book.title
    }
