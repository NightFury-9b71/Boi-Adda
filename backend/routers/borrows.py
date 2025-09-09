from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from models import User, BookCopy, Borrow, Book
from schemas import BorrowCreate, BorrowOut
from enums import CopyStatus, BorrowStatus
from database import get_session
from auth import get_current_user

router = APIRouter(prefix="/borrows", tags=["Borrows"])

@router.get("/", response_model=list[BorrowOut])
def getBorrows(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get current user's borrows with nested book information"""
    statement = select(Borrow).where(Borrow.user_id == current_user.id)
    borrows = session.exec(statement).all()
    
    # Load nested relationships
    for borrow in borrows:
        if borrow.book_copy_id:
            book_copy = session.get(BookCopy, borrow.book_copy_id)
            if book_copy and book_copy.book_id:
                book = session.get(Book, book_copy.book_id)
                if book:
                    book_copy.book = book
            borrow.book_copy = book_copy
    
    return borrows

@router.get("/stats")
def getBorrowStats(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get current user's borrow statistics"""
    user_borrows = session.exec(select(Borrow).where(Borrow.user_id == current_user.id)).all()
    total_borrows = len(user_borrows)
    pending_borrows = len([b for b in user_borrows if b.status == BorrowStatus.pending])
    approved_borrows = len([b for b in user_borrows if b.status == BorrowStatus.approved])
    active_borrows = len([b for b in user_borrows if b.status == BorrowStatus.active])
    returned_borrows = len([b for b in user_borrows if b.status == BorrowStatus.returned])
    rejected_borrows = len([b for b in user_borrows if b.status == BorrowStatus.rejected])
    
    return {
        "scope": "my_borrows",
        "total_borrows": total_borrows,
        "pending": pending_borrows,
        "approved": approved_borrows,
        "active": active_borrows,
        "returned": returned_borrows,
        "rejected": rejected_borrows
    }

@router.get("/status/{status}", response_model=list[BorrowOut])
def getBorrowsByStatus(status: BorrowStatus, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get current user's borrows by status"""
    statement = select(Borrow).where(
        Borrow.user_id == current_user.id,
        Borrow.status == status
    )
    borrows = session.exec(statement).all()
    return borrows

@router.get("/{id}", response_model=BorrowOut)
def getBorrow(id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get specific borrow record (user's own only)"""
    borrow = session.get(Borrow, id)
    if not borrow:
        raise HTTPException(404, "Borrow record not found")
    
    # Users can only see their own borrows
    if borrow.user_id != current_user.id:
        raise HTTPException(403, "You can only view your own borrow records")
    
    return borrow

@router.post("/", response_model=BorrowOut)
def createBorrow(borrow: BorrowCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Create a borrow request (for current user only)"""
    # Users can only borrow for themselves
    if current_user.id != borrow.user_id:
        raise HTTPException(403, "You can only borrow books for yourself")
    # Verify user exists
    user = session.get(User, borrow.user_id)
    if not user:
        raise HTTPException(404, "User not found")
    
    # Verify book copy exists and is available
    book_copy = session.get(BookCopy, borrow.book_copy_id)
    if not book_copy:
        raise HTTPException(404, "Book copy not found")
    
    if book_copy.status != CopyStatus.available:
        raise HTTPException(400, "Book copy is not available")
    
    # Create borrow record
    db_borrow = Borrow(
        user_id=borrow.user_id,
        book_copy_id=borrow.book_copy_id,
        status=BorrowStatus.pending
    )
    session.add(db_borrow)
    
    # Update book copy status
    book_copy.status = CopyStatus.reserved
    session.add(book_copy)
    
    session.commit()
    session.refresh(db_borrow)
    return db_borrow

@router.put("/{id}/cancel")
def cancelBorrow(id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Cancel a borrow request (user's own only)"""
    borrow = session.get(Borrow, id)
    if not borrow:
        raise HTTPException(404, "Borrow record not found")
    
    # Users can only cancel their own borrows
    if borrow.user_id != current_user.id:
        raise HTTPException(403, "You can only cancel your own borrow requests")
    
    # Can only cancel pending or approved borrows
    if borrow.status not in [BorrowStatus.pending, BorrowStatus.approved]:
        raise HTTPException(400, f"Cannot cancel borrow with status: {borrow.status}")
    
    # Update borrow status to rejected
    borrow.status = BorrowStatus.rejected
    
    # If book copy was reserved, make it available again
    if borrow.book_copy_id:
        book_copy = session.get(BookCopy, borrow.book_copy_id)
        if book_copy and book_copy.status == CopyStatus.reserved:
            book_copy.status = CopyStatus.available
            session.add(book_copy)
    
    session.add(borrow)
    session.commit()
    session.refresh(borrow)
    
    return {
        "message": "Borrow request cancelled successfully",
        "borrow_id": id,
        "status": borrow.status,
        "cancelled_by": current_user.name
    }
