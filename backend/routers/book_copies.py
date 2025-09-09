from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from models import Book, BookCopy, Borrow, User
from schemas import BookCopyCreate, BookCopyOut
from enums import CopyStatus, BorrowStatus
from database import get_session
from auth import get_current_user, require_admin, require_librarian_or_admin

router = APIRouter(prefix="/book-copies", tags=["Book Copies"])

@router.get("/book/{book_id}/available", response_model=list[BookCopyOut])
def getAvailableBookCopies(book_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get available book copies for a specific book (authenticated users only)"""
    # Verify book exists
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(404, "Book not found")
    
    # Get available book copies for this book
    statement = select(BookCopy).where(
        BookCopy.book_id == book_id,
        BookCopy.status == CopyStatus.available
    )
    available_copies = session.exec(statement).all()
    return available_copies

@router.get("/", response_model=list[BookCopyOut])
def getBookCopies(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get all book copies (authenticated users only)"""
    statement = select(BookCopy)
    book_copies = session.exec(statement).all()
    return book_copies

@router.get("/{id}", response_model=BookCopyOut)
def getBookCopy(id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get book copy by ID with book information (authenticated users only)"""
    # Get book copy with book information using join
    statement = select(BookCopy, Book).join(Book).where(BookCopy.id == id)
    result = session.exec(statement).first()
    
    if not result:
        raise HTTPException(404, "Book copy not found")
    
    book_copy, book = result
    
    # Create response with book information
    response_data = book_copy.model_dump()
    response_data["book"] = book.model_dump()
    
    return response_data

@router.post("/", response_model=BookCopyOut)
def addBookCopy(book_copy: BookCopyCreate, session: Session = Depends(get_session), current_user: User = Depends(require_librarian_or_admin)):
    """Add a new book copy (librarian or admin only)"""
    # Verify book exists
    book = session.get(Book, book_copy.book_id)
    if not book:
        raise HTTPException(404, "Book not found")
    
    db_book_copy = BookCopy(**book_copy.model_dump())
    session.add(db_book_copy)
    session.commit()
    session.refresh(db_book_copy)
    return db_book_copy

@router.delete("/{id}")
def deleteBookCopy(id: int, session: Session = Depends(get_session), current_user: User = Depends(require_librarian_or_admin)):
    """Delete a book copy (librarian or admin only)"""
    # Get the book copy
    book_copy = session.get(BookCopy, id)
    if not book_copy:
        raise HTTPException(404, "Book copy not found")
    
    # Check if book copy is currently borrowed or reserved
    if book_copy.status in [CopyStatus.borrowed, CopyStatus.reserved]:
        raise HTTPException(400, f"Cannot delete book copy that is {book_copy.status.value}")
    
    # Check if there are any active borrows for this copy
    active_borrows = session.exec(
        select(Borrow).where(
            Borrow.book_copy_id == id,
            Borrow.status.in_([BorrowStatus.pending, BorrowStatus.approved, BorrowStatus.active])
        )
    ).all()
    
    if active_borrows:
        raise HTTPException(400, "Cannot delete book copy with active borrow records")
    
    # Store book_id for counter update (will be handled automatically by db_events)
    book_id = book_copy.book_id
    
    # Delete the book copy
    session.delete(book_copy)
    session.commit()
    
    return {
        "message": "Book copy deleted successfully",
        "deleted_copy_id": id,
        "book_id": book_id,
        "deleted_by": current_user.name
    }

@router.put("/{id}/status")
def updateBookCopyStatus(id: int, new_status: CopyStatus, session: Session = Depends(get_session), current_user: User = Depends(require_librarian_or_admin)):
    """Update book copy status (librarian or admin only)"""
    book_copy = session.get(BookCopy, id)
    if not book_copy:
        raise HTTPException(404, "Book copy not found")
    
    old_status = book_copy.status
    book_copy.status = new_status
    session.add(book_copy)
    session.commit()
    session.refresh(book_copy)
    
    return {
        "message": "Book copy status updated successfully",
        "copy_id": id,
        "old_status": old_status,
        "new_status": new_status,
        "updated_by": current_user.name
    }
