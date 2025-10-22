from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select, func
from models import Book, BookCopy, User, Donation, Borrow
from schemas import BookCreate, BookOut, BookWithDonorOut, ImageUploadResponse, BookImageUploadRequest, DonorInfo
from enums import CopyStatus, BorrowStatus
from database import get_session
from auth import get_current_user, require_admin, require_librarian_or_admin
from cloudinary_service import upload_book_cover, delete_image, get_optimized_url
import logging
from typing import List, Optional

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/books", tags=["Books"])

@router.get("/", response_model=List[BookWithDonorOut])
def getBooks(session: Session = Depends(get_session)):
    """Get all books with availability information and donors (public access)"""
    try:
        # Get all books with their copy information
        statement = select(Book)
        all_books = session.exec(statement).all()
        
        books_with_availability = []
        
        for book in all_books:
            try:
                # Count available copies (excluding reserved, borrowed, and pending donations)
                available_copies_result = session.exec(
                    select(func.count(BookCopy.id)).where(
                        BookCopy.book_id == book.id,
                        BookCopy.status == CopyStatus.available
                    )
                ).first()
                
                available_copies_count = available_copies_result if available_copies_result is not None else 0
                
                # Count approved/active borrows (actual borrowed amount)
                times_borrowed_result = session.exec(
                    select(func.count(Borrow.id)).where(
                        Borrow.book_copy_id.in_(
                            select(BookCopy.id).where(BookCopy.book_id == book.id)
                        ),
                        Borrow.status.in_([BorrowStatus.approved, BorrowStatus.active])
                    )
                ).first()
                
                times_borrowed = times_borrowed_result if times_borrowed_result is not None else 0
                
                # Get unique donors for this book
                donors_query = session.exec(
                    select(User.id, User.name).join(BookCopy, User.id == BookCopy.donor_id).where(
                        BookCopy.book_id == book.id,
                        BookCopy.donor_id.is_not(None)
                    ).distinct()
                ).all()
                
                donors = [DonorInfo(id=donor_id, name=donor_name) for donor_id, donor_name in donors_query]
                
                # Include all books, regardless of availability
                # Create a dictionary with book data plus computed fields
                book_data = book.model_dump() if hasattr(book, 'model_dump') else book.dict()
                book_data['total_copies'] = int(available_copies_count)
                book_data['times_borrowed'] = int(times_borrowed)
                book_data['donors'] = donors
                
                books_with_availability.append(book_data)
                    
            except Exception as e:
                logger.error(f"Error processing book {book.id}: {str(e)}")
                continue
        
        return books_with_availability
        
    except Exception as e:
        logger.error(f"Error in getBooks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve books")

@router.get("/{id}", response_model=BookWithDonorOut)
def getBook(id: int, session: Session = Depends(get_session)):
    """Get book by ID with available copies count and donors (public access)"""
    try:
        book = session.get(Book, id)
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Count available copies (excluding reserved, borrowed, and pending donations)
        available_copies_result = session.exec(
            select(func.count(BookCopy.id)).where(
                BookCopy.book_id == book.id,
                BookCopy.status == CopyStatus.available
            )
        ).first()
        
        available_copies_count = available_copies_result if available_copies_result is not None else 0
        
        # Count approved/active borrows (actual borrowed amount)
        times_borrowed_result = session.exec(
            select(func.count(Borrow.id)).where(
                Borrow.book_copy_id.in_(
                    select(BookCopy.id).where(BookCopy.book_id == book.id)
                ),
                Borrow.status.in_([BorrowStatus.approved, BorrowStatus.active])
            )
        ).first()
        
        times_borrowed = times_borrowed_result if times_borrowed_result is not None else 0
        
        # Get unique donors for this book
        donors_query = session.exec(
            select(User.id, User.name).join(BookCopy, User.id == BookCopy.donor_id).where(
                BookCopy.book_id == book.id,
                BookCopy.donor_id.is_not(None)
            ).distinct()
        ).all()
        
        donors = [DonorInfo(id=donor_id, name=donor_name) for donor_id, donor_name in donors_query]
        
        # Create response with updated counts and donors
        book_data = book.model_dump() if hasattr(book, 'model_dump') else book.dict()
        book_data['total_copies'] = int(available_copies_count)
        book_data['times_borrowed'] = int(times_borrowed)
        book_data['donors'] = donors
        
        return book_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in getBook for id {id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve book")

@router.post("/upload-cover/{book_id}", response_model=ImageUploadResponse)
async def upload_book_cover_endpoint(
    book_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_librarian_or_admin)
):
    """Upload a book cover image to Cloudinary"""
    try:
        # Get the book
        book = session.get(Book, book_id)
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (max 5MB)
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Delete old Cloudinary image if exists
        if book.cover_public_id:
            await delete_image(book.cover_public_id)
        
        # Upload to Cloudinary
        upload_result = await upload_book_cover(
            contents, 
            book_id, 
            book.title, 
            book.author,
            replace_existing=True
        )
        
        # Update book with new Cloudinary public ID
        book.cover_public_id = upload_result["public_id"]
        book.cover = upload_result["url"]  # Store the URL as well for backward compatibility
        session.add(book)
        session.commit()
        session.refresh(book)
        
        return ImageUploadResponse(**upload_result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading book cover for book {book_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload book cover")

@router.delete("/cover/{book_id}")
async def delete_book_cover(
    book_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_librarian_or_admin)
):
    """Delete a book's Cloudinary cover image"""
    try:
        book = session.get(Book, book_id)
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        if not book.cover_public_id:
            raise HTTPException(status_code=400, detail="Book has no Cloudinary cover image")
        
        # Delete from Cloudinary
        success = await delete_image(book.cover_public_id)
        
        if success:
            # Reset to default cover
            book.cover_public_id = None
            book.cover = 'cover-1.jpg'  # Default cover
            session.add(book)
            session.commit()
            
            return {"message": "Book cover deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete cover from Cloudinary")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting book cover for book {book_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete book cover")

@router.post("/", response_model=BookWithDonorOut)
def addBook(
    book: BookCreate, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(require_librarian_or_admin)
):
    """Add a new book (librarian or admin only)"""
    try:
        if not book:
            raise HTTPException(status_code=400, detail="Book data is required")
        
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
            available_copies_result = session.exec(
                select(func.count(BookCopy.id)).where(
                    BookCopy.book_id == existing_book.id,
                    BookCopy.status == CopyStatus.available
                )
            ).first()
            
            available_copies_count = available_copies_result if available_copies_result is not None else 0
            
            times_borrowed_result = session.exec(
                select(func.count(Borrow.id)).where(
                    Borrow.book_copy_id.in_(
                        select(BookCopy.id).where(BookCopy.book_id == existing_book.id)
                    ),
                    Borrow.status.in_([BorrowStatus.approved, BorrowStatus.active])
                )
            ).first()
            
            times_borrowed = times_borrowed_result if times_borrowed_result is not None else 0
            
            # Get unique donors for this book
            donors_query = session.exec(
                select(User.id, User.name).join(BookCopy, User.id == BookCopy.donor_id).where(
                    BookCopy.book_id == existing_book.id,
                    BookCopy.donor_id.is_not(None)
                ).distinct()
            ).all()
            
            donors = [DonorInfo(id=donor_id, name=donor_name) for donor_id, donor_name in donors_query]
            
            # Return book data with counts and donors
            book_data = existing_book.model_dump() if hasattr(existing_book, 'model_dump') else existing_book.dict()
            book_data['total_copies'] = int(available_copies_count)
            book_data['times_borrowed'] = int(times_borrowed)
            book_data['donors'] = donors
            return book_data
            
        else:
            # Create new book
            book_dict = book.model_dump() if hasattr(book, 'model_dump') else book.dict()
            db_book = Book(**book_dict)
            session.add(db_book)
            session.commit()
            session.refresh(db_book)

            # Create first copy of the new book
            new_copy = BookCopy(book_id=db_book.id, status=CopyStatus.available)
            session.add(new_copy)
            session.commit()
            session.refresh(new_copy)

            # Return new book with initial counts and empty donors (no donors yet)
            book_data = db_book.model_dump() if hasattr(db_book, 'model_dump') else db_book.dict()
            book_data['total_copies'] = 1  # Just created one copy
            book_data['times_borrowed'] = 0  # Brand new book
            book_data['donors'] = []  # No donors yet
            return book_data
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in addBook: {str(e)}")
        session.rollback()
        raise HTTPException(status_code=500, detail="Failed to add book")

@router.put("/{id}", response_model=BookWithDonorOut)
async def updateBook(
    id: int, 
    book_update: BookCreate, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(require_librarian_or_admin)
):
    """Update book information (librarian or admin only)"""
    try:
        # Get the existing book
        existing_book = session.get(Book, id)
        if not existing_book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Update book fields
        book_data = book_update.model_dump(exclude_unset=True) if hasattr(book_update, 'model_dump') else book_update.dict(exclude_unset=True)
        
        # Handle Cloudinary public ID update
        old_public_id = existing_book.cover_public_id
        
        for field, value in book_data.items():
            setattr(existing_book, field, value)
        
        # If cover_public_id was removed but we had one before, delete the old image
        if old_public_id and not existing_book.cover_public_id:
            await delete_image(old_public_id)
        
        session.add(existing_book)
        session.commit()
        session.refresh(existing_book)
        
        # Count current available copies for response
        available_copies_result = session.exec(
            select(func.count(BookCopy.id)).where(
                BookCopy.book_id == existing_book.id,
                BookCopy.status == CopyStatus.available
            )
        ).first()
        
        available_copies_count = available_copies_result if available_copies_result is not None else 0
        
        times_borrowed_result = session.exec(
            select(func.count(Borrow.id)).where(
                Borrow.book_copy_id.in_(
                    select(BookCopy.id).where(BookCopy.book_id == existing_book.id)
                ),
                Borrow.status.in_([BorrowStatus.approved, BorrowStatus.active])
            )
        ).first()
        
        times_borrowed = times_borrowed_result if times_borrowed_result is not None else 0
        
        # Get unique donors for this book
        donors_query = session.exec(
            select(User.id, User.name).join(BookCopy, User.id == BookCopy.donor_id).where(
                BookCopy.book_id == existing_book.id,
                BookCopy.donor_id.is_not(None)
            ).distinct()
        ).all()
        
        donors = [DonorInfo(id=donor_id, name=donor_name) for donor_id, donor_name in donors_query]
        
        # Return updated book data with counts and donors
        response_data = existing_book.model_dump() if hasattr(existing_book, 'model_dump') else existing_book.dict()
        response_data['total_copies'] = int(available_copies_count)
        response_data['times_borrowed'] = int(times_borrowed)
        response_data['donors'] = donors
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in updateBook for id {id}: {str(e)}")
        session.rollback()
        raise HTTPException(status_code=500, detail="Failed to update book")

@router.delete("/{id}")
async def deleteBook(
    id: int, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(require_admin)
):
    """Delete a book and all its copies (admin only)"""
    try:
        book = session.get(Book, id)
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Check if any copies are currently borrowed or reserved
        book_copies = session.exec(select(BookCopy).where(BookCopy.book_id == id)).all()
        active_copies = [copy for copy in book_copies if copy.status != CopyStatus.available]
        
        if active_copies:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete book with {len(active_copies)} active copies (borrowed/reserved)"
            )
        
        # Delete Cloudinary image if exists
        if book.cover_public_id:
            await delete_image(book.cover_public_id)
        
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
            "deleted_by": current_user.name,
            "cloudinary_image_deleted": book.cover_public_id is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in deleteBook for id {id}: {str(e)}")
        session.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete book")

# Debug endpoint to test database connection
@router.get("/debug/test")
def test_books_endpoint(session: Session = Depends(get_session)):
    """Debug endpoint to test basic functionality"""
    try:
        # Test basic book query
        books_count_result = session.exec(select(func.count(Book.id))).first()
        copies_count_result = session.exec(select(func.count(BookCopy.id))).first()
        borrows_count_result = session.exec(select(func.count(Borrow.id))).first()
        
        books_count = books_count_result if books_count_result is not None else 0
        copies_count = copies_count_result if copies_count_result is not None else 0
        borrows_count = borrows_count_result if borrows_count_result is not None else 0
        
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
        logger.error(f"Debug endpoint error: {str(e)}")
        return {
            "status": "ERROR",
            "error": str(e),
            "error_type": type(e).__name__
        }