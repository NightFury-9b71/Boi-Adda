from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from models import Book
from db import get_session
from auth import require_admin
from storage import upload_book_cover, delete_book_cover

router = APIRouter()


@router.post("/books/{book_id}/cover")
async def upload_book_cover_image(
    book_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Upload or update cover image for a book.
    Only admins can upload book covers.
    """
    try:
        # Check if book exists
        book = session.get(Book, book_id)
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Upload cover to Supabase Storage
        cover_url = await upload_book_cover(file, book_id)
        
        # Update database with cover URL
        book.cover_image_url = cover_url
        session.add(book)
        session.commit()
        session.refresh(book)
        
        return {
            "message": "Book cover uploaded successfully",
            "public_id": cover_url,  # For compatibility with frontend
            "url": cover_url,
            "secure_url": cover_url,
            "cover_url": cover_url,
            "book": {
                "id": book.id,
                "title": book.title,
                "author": book.author,
                "cover_image_url": book.cover_image_url
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload book cover: {str(e)}")


@router.delete("/books/{book_id}/cover")
async def delete_book_cover_image(
    book_id: int,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Delete cover image for a book.
    Only admins can delete book covers.
    """
    try:
        # Check if book exists
        book = session.get(Book, book_id)
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Delete from Supabase Storage
        delete_book_cover(book_id)
        
        # Update database
        book.cover_image_url = None
        session.add(book)
        session.commit()
        
        return {"message": "Book cover deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete book cover: {str(e)}")


@router.get("/books/{book_id}")
async def get_book_with_cover(
    book_id: int,
    session: Session = Depends(get_session)
):
    """
    Get book details including cover image URL.
    Public endpoint - no authentication required.
    """
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "published_year": book.published_year,
        "pages": book.pages,
        "cover_image_url": book.cover_image_url
    }
