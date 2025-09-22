from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from models import User, Book, BookCopy, Donation
from schemas import DonationCreate, DonationWithNewBookCreate, DonationOut
from enums import CopyStatus, DonationStatus
from database import get_session
from auth import get_current_user

router = APIRouter(prefix="/donations", tags=["Donations"])

@router.get("/", response_model=list[DonationOut])
def getDonations(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get current user's donations with nested book information"""
    statement = select(Donation).where(Donation.user_id == current_user.id)
    donations = session.exec(statement).all()
    
    # Load nested relationships
    for donation in donations:
        if donation.book_copy_id:
            book_copy = session.get(BookCopy, donation.book_copy_id)
            if book_copy and book_copy.book_id:
                book = session.get(Book, book_copy.book_id)
                if book:
                    book_copy.book = book
            donation.book_copy = book_copy
    
    return donations

@router.get("/stats")
def getDonationStats(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get current user's donation statistics"""
    # Users see only their own donations
    user_donations = session.exec(select(Donation).where(Donation.user_id == current_user.id)).all()
    total_donations = len(user_donations)
    pending_donations = len([d for d in user_donations if d.status == DonationStatus.pending])
    approved_donations = len([d for d in user_donations if d.status == DonationStatus.approved])
    completed_donations = len([d for d in user_donations if d.status == DonationStatus.completed])
    rejected_donations = len([d for d in user_donations if d.status == DonationStatus.rejected])
    
    return {
        "scope": "my_donations",
        "total_donations": total_donations,
        "pending": pending_donations,
        "approved": approved_donations,
        "completed": completed_donations,
        "rejected": rejected_donations
    }

@router.get("/status/{status}", response_model=list[DonationOut])
def getDonationsByStatus(status: DonationStatus, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get current user's donations by status"""
    statement = select(Donation).where(
        Donation.user_id == current_user.id,
        Donation.status == status
    )
    
    donations = session.exec(statement).all()
    return donations

@router.get("/{id}", response_model=DonationOut)
def getDonation(id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get specific donation record (user's own only)"""
    donation = session.get(Donation, id)
    if not donation:
        raise HTTPException(404, "Donation not found")
    
    # Users can only see their own donations
    if donation.user_id != current_user.id:
        raise HTTPException(403, "Access denied - you can only view your own donations")
    
    return donation

@router.post("/", response_model=DonationOut)
def createDonation(donation: DonationCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Create a donation request (for current user only)"""
    # Users can only create donations for themselves
    if current_user.id != donation.user_id:
        raise HTTPException(403, "You can only create donations for yourself")
    # Verify user exists
    user = session.get(User, donation.user_id)
    if not user:
        raise HTTPException(404, "User not found")
    
    # Verify book exists
    book = session.get(Book, donation.book_id)
    if not book:
        raise HTTPException(404, "Book not found")
    
    # Create donation record
    db_donation = Donation(
        status=DonationStatus.pending,
        user_id=donation.user_id
    )
    session.add(db_donation)
    session.commit()
    session.refresh(db_donation)
    
    # Create book copy for the donation with donor information (pending admin approval)
    book_copy = BookCopy(
        book_id=donation.book_id,
        donor_id=donation.user_id,  # Set the donor
        status=CopyStatus.pending_donation  # Not available until admin completes donation
    )
    session.add(book_copy)
    session.commit()
    session.refresh(book_copy)
    
    # Link the book copy to the donation
    db_donation.book_copy_id = book_copy.id
    session.add(db_donation)
    session.commit()
    session.refresh(db_donation)
    
    return db_donation

@router.post("/with-new-book", response_model=DonationOut)
def createDonationWithNewBook(donation: DonationWithNewBookCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Create a donation request with new book information (for current user only)"""
    # Users can only create donations for themselves
    if current_user.id != donation.user_id:
        raise HTTPException(403, "You can only create donations for yourself")
    
    # Verify user exists
    user = session.get(User, donation.user_id)
    if not user:
        raise HTTPException(404, "User not found")
    
    # Check if book already exists (by title and author)
    existing_book = session.exec(
        select(Book).where(
            Book.title == donation.title,
            Book.author == donation.author
        )
    ).first()
    
    if existing_book:
        # Book exists, use existing book for donation
        book_id = existing_book.id
    else:
        # Create new book
        new_book = Book(
            title=donation.title,
            author=donation.author,
            cover=donation.cover,
            category_id=donation.category_id,
            published_year=donation.published_year,
            pages=donation.pages,
            total_copies=0,  # Will be incremented when donation is approved
            times_borrowed=0
        )
        session.add(new_book)
        session.commit()
        session.refresh(new_book)
        book_id = new_book.id
    
    # Create donation record
    db_donation = Donation(
        status=DonationStatus.pending,
        user_id=donation.user_id
    )
    session.add(db_donation)
    session.commit()
    session.refresh(db_donation)
    
    # Create book copy for the donation with donor information (pending admin approval)
    book_copy = BookCopy(
        book_id=book_id,
        donor_id=donation.user_id,  # Set the donor
        status=CopyStatus.pending_donation  # Not available until admin completes donation
    )
    session.add(book_copy)
    session.commit()
    session.refresh(book_copy)
    
    # Link the book copy to the donation
    db_donation.book_copy_id = book_copy.id
    session.add(db_donation)
    session.commit()
    session.refresh(db_donation)
    
    return db_donation

@router.put("/{id}/cancel")
def cancelDonation(id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Cancel a donation request (user's own only)"""
    donation = session.get(Donation, id)
    if not donation:
        raise HTTPException(404, "Donation not found")
    
    # Users can only cancel their own donations
    if donation.user_id != current_user.id:
        raise HTTPException(403, "You can only cancel your own donations")
    
    # Can only cancel pending or approved donations
    if donation.status not in [DonationStatus.pending, DonationStatus.approved]:
        raise HTTPException(400, f"Cannot cancel donation with status: {donation.status}")
    
    # Update donation status to rejected
    donation.status = DonationStatus.rejected
    
    # If there's a book copy created for this donation, remove it
    if donation.book_copy_id:
        book_copy = session.get(BookCopy, donation.book_copy_id)
        if book_copy:
            session.delete(book_copy)
            donation.book_copy_id = None
    
    session.add(donation)
    session.commit()
    session.refresh(donation)
    
    return {
        "message": "Donation cancelled successfully",
        "donation_id": id,
        "status": donation.status,
        "cancelled_by": current_user.name
    }

@router.post("/bulk-create")
def createBulkDonations(donations_data: list[DonationCreate], session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Create multiple donation requests at once (for current user only)"""
    if not donations_data:
        raise HTTPException(400, "At least one donation is required")
    
    created_donations = []
    
    for donation_data in donations_data:
        # Users can only create donations for themselves
        if current_user.id != donation_data.user_id:
            raise HTTPException(403, "You can only create donations for yourself")
        
        # Verify user exists
        user = session.get(User, donation_data.user_id)
        if not user:
            raise HTTPException(404, f"User with ID {donation_data.user_id} not found")
        
        # Verify book exists
        book = session.get(Book, donation_data.book_id)
        if not book:
            raise HTTPException(404, f"Book with ID {donation_data.book_id} not found")
        
        # Create donation record
        db_donation = Donation(
            status=DonationStatus.pending,
            user_id=donation_data.user_id
        )
        session.add(db_donation)
        session.commit()
        session.refresh(db_donation)
        
        # Create book copy for the donation with donor information
        book_copy = BookCopy(
            book_id=donation_data.book_id,
            donor_id=donation_data.user_id,  # Set the donor
            status=CopyStatus.available
        )
        session.add(book_copy)
        session.commit()
        session.refresh(book_copy)
        
        # Link the book copy to the donation
        db_donation.book_copy_id = book_copy.id
        session.add(db_donation)
        session.commit()
        session.refresh(db_donation)
        
        created_donations.append(db_donation)
    
    return {
        "message": f"Successfully created {len(created_donations)} donation requests",
        "donations": created_donations,
        "created_by": current_user.name
    }
