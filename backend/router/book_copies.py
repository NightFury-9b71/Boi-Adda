from db import get_session
from models import BookCopy, Book, bookStatus
from sqlmodel import select, Session, SQLModel
from fastapi import APIRouter, Depends, HTTPException, status, Query
from auth import require_admin, get_current_user
from typing import Optional

router = APIRouter()


# Request/Response Models
class BookCopyResponse(SQLModel):
    id: int
    book_id: int
    status: bookStatus
    book_title: str
    book_author: str
    book_cover_url: Optional[str] = None


class BookCopyCreate(SQLModel):
    book_id: int
    status: bookStatus = bookStatus.AVAILABLE


class BookCopyUpdate(SQLModel):
    status: bookStatus


# GET /book-copies - List all book copies
@router.get("/", response_model=list[BookCopyResponse])
def list_book_copies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    book_id: Optional[int] = None,
    status_filter: Optional[bookStatus] = None,
    session: Session = Depends(get_session)
):
    """
    Get all book copies with optional filters.
    Public endpoint - no authentication required.
    """
    statement = select(BookCopy)
    
    # Add filters if provided
    if book_id is not None:
        statement = statement.where(BookCopy.book_id == book_id)
    
    if status_filter is not None:
        statement = statement.where(BookCopy.status == status_filter)
    
    # Add pagination
    statement = statement.offset(skip).limit(limit)
    
    copies = session.exec(statement).all()
    
    return [
        BookCopyResponse(
            id=copy.id,
            book_id=copy.book_id,
            status=copy.status,
            book_title=copy.book.title,
            book_author=copy.book.author,
            book_cover_url=copy.book.cover_image_url
        )
        for copy in copies
    ]


# GET /book-copies/{id} - Get book copy details
@router.get("/{copy_id}", response_model=BookCopyResponse)
def get_book_copy_details(
    copy_id: int,
    session: Session = Depends(get_session)
):
    """
    Get detailed information about a specific book copy.
    Public endpoint - no authentication required.
    """
    copy = session.get(BookCopy, copy_id)
    
    if not copy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book copy not found"
        )
    
    return BookCopyResponse(
        id=copy.id,
        book_id=copy.book_id,
        status=copy.status,
        book_title=copy.book.title,
        book_author=copy.book.author,
        book_cover_url=copy.book.cover_image_url
    )


# GET /book-copies/book/{book_id}/available - Get available copies for a book
@router.get("/book/{book_id}/available", response_model=list[BookCopyResponse])
def get_available_copies_for_book(
    book_id: int,
    session: Session = Depends(get_session)
):
    """
    Get all available copies for a specific book.
    Public endpoint - no authentication required.
    """
    # Verify book exists
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    # Get available copies
    statement = select(BookCopy).where(
        BookCopy.book_id == book_id,
        BookCopy.status == bookStatus.AVAILABLE
    )
    
    copies = session.exec(statement).all()
    
    return [
        BookCopyResponse(
            id=copy.id,
            book_id=copy.book_id,
            status=copy.status,
            book_title=copy.book.title,
            book_author=copy.book.author,
            book_cover_url=copy.book.cover_image_url
        )
        for copy in copies
    ]


# POST /book-copies - Create a new book copy (Admin only)
@router.post("/", response_model=BookCopyResponse, status_code=status.HTTP_201_CREATED)
def create_book_copy(
    copy_data: BookCopyCreate,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Create a new book copy.
    Admin only endpoint.
    """
    # Verify book exists
    book = session.get(Book, copy_data.book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    # Create new book copy
    copy = BookCopy(
        book_id=copy_data.book_id,
        status=copy_data.status
    )
    
    session.add(copy)
    session.commit()
    session.refresh(copy)
    
    return BookCopyResponse(
        id=copy.id,
        book_id=copy.book_id,
        status=copy.status,
        book_title=copy.book.title,
        book_author=copy.book.author,
        book_cover_url=copy.book.cover_image_url
    )


# PUT /book-copies/{id} - Update book copy status (Admin only)
@router.put("/{copy_id}", response_model=BookCopyResponse)
def update_book_copy(
    copy_id: int,
    copy_data: BookCopyUpdate,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Update book copy status.
    Admin only endpoint.
    """
    copy = session.get(BookCopy, copy_id)
    
    if not copy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book copy not found"
        )
    
    # Update status
    copy.status = copy_data.status
    
    session.add(copy)
    session.commit()
    session.refresh(copy)
    
    return BookCopyResponse(
        id=copy.id,
        book_id=copy.book_id,
        status=copy.status,
        book_title=copy.book.title,
        book_author=copy.book.author,
        book_cover_url=copy.book.cover_image_url
    )


# DELETE /book-copies/{id} - Delete a book copy (Admin only)
@router.delete("/{copy_id}", status_code=status.HTTP_200_OK)
def delete_book_copy(
    copy_id: int,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Delete a book copy.
    Admin only - can only delete if copy is not currently issued or reserved.
    """
    copy = session.get(BookCopy, copy_id)
    
    if not copy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book copy not found"
        )
    
    # Check if copy is issued or reserved
    if copy.status in [bookStatus.ISSUED, bookStatus.RESERVED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete book copy. Status is currently {copy.status.value}."
        )
    
    # Delete the copy
    session.delete(copy)
    session.commit()
    
    return {
        "message": "Book copy deleted successfully",
        "copy_id": copy_id
    }
