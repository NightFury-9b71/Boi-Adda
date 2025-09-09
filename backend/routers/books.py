from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from models import Book, BookCopy, User, Donation, Borrow
from schemas import BookCreate, BookOut
from enums import CopyStatus, BorrowStatus
from database import get_session
from auth import get_current_user, require_admin, require_librarian_or_admin
import logging

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/books", tags=["Books"])

@router.get("/", response_model=list[BookOut])
def getBooks(session: Session = Depends(get_session)):
    """Get all books with available copies (public access)"""
    try:
        # Get all books with their copy information
        statement = select(Book)
        all_books = session.exec(statement).all()
        
        available_books = []
        
        for book in all_books:
            try:
                # Count available copies (excluding reserved and borrowed)
                available_copies_count = session.exec(
                    select(func.count(BookCopy.id)).where(
                        BookCopy.book_id == book.id,
                        BookCopy.status == CopyStatus.available
                    )
                ).one()
                
                # Count approved/active borrows (actual borrowed amount)
                times_borrowed = session.exec(
                    select(func.count(Borrow.id)).where(
                        Borrow.book_copy_id.in_(
                            select(BookCopy.id).where(BookCopy.book_id == book.id)
                        ),
                        Borrow.status.in_([BorrowStatus.approved, BorrowStatus.active])
                    )
                ).one()
                
                # Only include books with available copies
                if available_copies_count > 0:
                    # Create a dictionary with book data plus computed fields
                    book_data = book.model_dump()
                    book_data['total_copies'] = int(available_copies_count)
                    book_data['times_borrowed'] = int(times_borrowed)
                    
                    available_books.append(book_data)
                    
            except Exception as e:
                logger.error(f"Error processing book {book.id}: {str(e)}")
                continue
        
        return available_books
        
    except Exception as e:
        logger.error(f"Error in getBooks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{id}", response_model=BookOut)
def getBook(id: int, session: Session = Depends(get_session)):
    """Get book by ID with available copies count (public access)"""
    try:
        book = session.get(Book, id)
        if not book:
            raise HTTPException(404, "Book not found")
        
        # Count available copies (excluding reserved and borrowed)
        available_copies_count = session.exec(
            select(func.count(BookCopy.id)).where(
                BookCopy.book_id == book.id,
                BookCopy.status == CopyStatus.available
            )
        ).one()
        
        # Count approved/active borrows (actual borrowed amount)
        times_borrowed = session.exec(
            select(func.count(Borrow.id)).where(
                Borrow.book_copy_id.in_(
                    select(BookCopy.id).where(BookCopy.book_id == book.id)
                ),
                Borrow.status.in_([BorrowStatus.approved, BorrowStatus.active])
            )
        ).one()
        
        # Create response with updated counts
        book_data = book.model_dump()
        book_data['total_copies'] = int(available_copies_count)
        book_data['times_borrowed'] = int(times_borrowed)
        
        return book_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in getBook for id {id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/", response_model=BookOut)
def addBook(book: BookCreate, session: Session = Depends(get_session), current_user: User = Depends(require_librarian_or_admin)):
    """Add a new book (librarian or admin only)"""
    try:
        if not book:
            raise HTTPException(400, "Book data is required")
        
        # Check if book already exists (by title and author)
        existing_book = session.exec(
            select(Book).where(
                Book.title == book.title,
                Book.author == book.author
            )
        ).first()
        
        if existing_book:
            # Book exists, create a new copy
            new_copy = BookCopy(book_id=existing_book.id, status=CopyStatus.available)
            session.add(new_copy)
            session.commit()
            session.refresh(new_copy)
            
            # Count current available copies for response
            available_copies_count = session.exec(
                select(func.count(BookCopy.id)).where(
                    BookCopy.book_id == existing_book.id,
                    BookCopy.status == CopyStatus.available
                )
            ).one()
            
            times_borrowed = session.exec(
                select(func.count(Borrow.id)).where(
                    Borrow.book_copy_id.in_(
                        select(BookCopy.id).where(BookCopy.book_id == existing_book.id)
                    ),
                    Borrow.status.in_([BorrowStatus.approved, BorrowStatus.active])
                )
            ).one()
            
            # Return book data with counts
            book_data = existing_book.model_dump()
            book_data['total_copies'] = int(available_copies_count)
            book_data['times_borrowed'] = int(times_borrowed)
            return book_data
            
        else:
            # Create new book
            db_book = Book(**book.model_dump())
            session.add(db_book)
            session.commit()
            session.refresh(db_book)

            # Create first copy of the new book
            new_copy = BookCopy(book_id=db_book.id, status=CopyStatus.available)
            session.add(new_copy)
            session.commit()
            session.refresh(new_copy)

            # Return new book with initial counts
            book_data = db_book.model_dump()
            book_data['total_copies'] = 1  # Just created one copy
            book_data['times_borrowed'] = 0  # Brand new book
            return book_data
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in addBook: {str(e)}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.put("/{id}", response_model=BookOut)
def updateBook(id: int, book_update: BookCreate, session: Session = Depends(get_session), current_user: User = Depends(require_librarian_or_admin)):
    """Update book information (librarian or admin only)"""
    try:
        # Get the existing book
        existing_book = session.get(Book, id)
        if not existing_book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Update book fields
        book_data = book_update.model_dump(exclude_unset=True)
        for field, value in book_data.items():
            setattr(existing_book, field, value)
        
        session.add(existing_book)
        session.commit()
        session.refresh(existing_book)
        
        # Count current available copies for response
        available_copies_count = session.exec(
            select(func.count(BookCopy.id)).where(
                BookCopy.book_id == existing_book.id,
                BookCopy.status == CopyStatus.available
            )
        ).one()
        
        times_borrowed = session.exec(
            select(func.count(Borrow.id)).where(
                Borrow.book_copy_id.in_(
                    select(BookCopy.id).where(BookCopy.book_id == existing_book.id)
                ),
                Borrow.status.in_([BorrowStatus.approved, BorrowStatus.active])
            )
        ).one()
        
        # Return updated book data with counts
        response_data = existing_book.model_dump()
        response_data['total_copies'] = int(available_copies_count)
        response_data['times_borrowed'] = int(times_borrowed)
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in updateBook for id {id}: {str(e)}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/{id}")
def deleteBook(id: int, session: Session = Depends(get_session), current_user: User = Depends(require_admin)):
    """Delete a book and all its copies (admin only)"""
    try:
        book = session.get(Book, id)
        if not book:
            raise HTTPException(404, "Book not found")
        
        # Check if any copies are currently borrowed or reserved
        book_copies = session.exec(select(BookCopy).where(BookCopy.book_id == id)).all()
        active_copies = [copy for copy in book_copies if copy.status != CopyStatus.available]
        
        if active_copies:
            raise HTTPException(400, f"Cannot delete book with {len(active_copies)} active copies (borrowed/reserved)")
        
        # Delete all book copies first
        for copy in book_copies:
            session.delete(copy)
        
        # Delete the book
        session.delete(book)
        session.commit()
        
        return {
            "message": "Book deleted successfully",
            "deleted_book_id": id,
            "deleted_copies": len(book_copies),
            "deleted_by": current_user.name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in deleteBook for id {id}: {str(e)}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Debug endpoint to test database connection
@router.get("/debug/test")
def test_books_endpoint(session: Session = Depends(get_session)):
    """Debug endpoint to test basic functionality"""
    try:
        # Test basic book query
        books_count = session.exec(select(func.count(Book.id))).one()
        copies_count = session.exec(select(func.count(BookCopy.id))).one()
        borrows_count = session.exec(select(func.count(Borrow.id))).one()
        
        return {
            "status": "OK",
            "books_count": int(books_count),
            "copies_count": int(copies_count),
            "borrows_count": int(borrows_count),
            "available_enums": {
                "copy_statuses": [status.value for status in CopyStatus],
                "borrow_statuses": [status.value for status in BorrowStatus]
            }
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e),
            "error_type": type(e).__name__
        }