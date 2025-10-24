from db import get_session
from models import Book, BookCopy, User, bookStatus
from sqlmodel import select, Session, SQLModel
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from auth import require_admin

router = APIRouter()


# Request/Response Models
class UploadBookData(SQLModel):
    title: str
    author: str
    published_year: int
    pages: int
    copies_to_add: int = 1


@router.post("/", status_code=status.HTTP_201_CREATED)
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
    admin = session.exec(select(User).where(User.email == user_email)).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="অ্যাডমিন প্রোফাইল খুঁজে পাওয়া যায়নি। সিস্টেম অ্যাডমিনিস্ট্রেটরের সাথে যোগাযোগ করুন।"
        )
    
    # Validate book data
    if data.published_year < 1000 or data.published_year > datetime.now().year:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="প্রকাশের বছর সঠিক নয়।"
        )
    
    if data.pages <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="পৃষ্ঠা সংখ্যা ০ এর চেয়ে বেশি হতে হবে।"
        )
    
    if data.copies_to_add <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="কপির সংখ্যা ০ এর চেয়ে বেশি হতে হবে।"
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
