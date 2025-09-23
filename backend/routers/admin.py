from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timedelta
from models import Borrow, Donation, BookCopy, Book, User, Category
from schemas import BorrowOut, DonationOut, UserOut, UserCreate, BorrowCreate
from enums import BorrowStatus, DonationStatus, CopyStatus, UserRole
from database import get_session
from auth import require_admin, get_password_hash, get_current_user
from timezone_utils import bangladesh_now

router = APIRouter(prefix="/admin", tags=["Admin"])

# ===== BORROW MANAGEMENT =====

@router.get("/borrows", response_model=list[BorrowOut])
def get_all_borrows(session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get all borrows (admin view)"""
    statement = select(Borrow)
    borrows = session.exec(statement).all()
    
    # Load nested relationships
    for borrow in borrows:
        if borrow.user_id:
            user = session.get(User, borrow.user_id)
            borrow.user = user
        if borrow.book_copy_id:
            book_copy = session.get(BookCopy, borrow.book_copy_id)
            if book_copy and book_copy.book_id:
                book = session.get(Book, book_copy.book_id)
                if book:
                    book_copy.book = book
            borrow.book_copy = book_copy
    
    return borrows

@router.get("/borrows/{borrow_id}", response_model=BorrowOut)
def get_borrow_admin(borrow_id: int, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get specific borrow (admin can view any)"""
    borrow = session.get(Borrow, borrow_id)
    if not borrow:
        raise HTTPException(404, "Borrow not found")
    return borrow

@router.get("/borrows/status/{status}", response_model=list[BorrowOut])
def get_borrows_by_status_admin(status: BorrowStatus, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get all borrows by status (admin view)"""
    statement = select(Borrow).where(Borrow.status == status)
    borrows = session.exec(statement).all()
    return borrows

@router.get("/borrows/user/{user_id}", response_model=list[BorrowOut])
def get_user_borrows_admin(user_id: int, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get all borrows by specific user (admin view)"""
    statement = select(Borrow).where(Borrow.user_id == user_id)
    borrows = session.exec(statement).all()
    return borrows

@router.post("/borrows/{borrow_id}/approve")
def approve_borrow_first_step(borrow_id: int, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """First approval: Change status to 'approved' - User gets notification"""
    borrow = session.get(Borrow, borrow_id)
    if not borrow:
        raise HTTPException(404, "Borrow request not found")
    
    if borrow.status != BorrowStatus.pending:
        raise HTTPException(400, f"Can only approve pending requests. Current status: {borrow.status}")
    
    # Update borrow status to approved and set approved_at
    borrow.status = BorrowStatus.approved
    borrow.approved_at = bangladesh_now()  # Set the approval timestamp
    
    # Update book copy status to reserved
    book_copy = session.get(BookCopy, borrow.book_copy_id)
    if book_copy:
        book_copy.status = CopyStatus.reserved
        session.add(book_copy)
    
    session.add(borrow)
    session.commit()
    session.refresh(borrow)
    
    return {
        "message": "Borrow request approved (Step 1/2)",
        "borrow_id": borrow_id,
        "status": borrow.status,
        "approved_at": borrow.approved_at,
        "note": "User has been notified. Book is reserved for pickup.",
        "approved_by": admin_user.name
    }

@router.post("/borrows/{borrow_id}/handover")
def handover_book_second_step(borrow_id: int, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Second approval: Physical handover - Change status to 'active'"""
    borrow = session.get(Borrow, borrow_id)
    if not borrow:
        raise HTTPException(404, "Borrow request not found")
    
    if borrow.status != BorrowStatus.approved:
        raise HTTPException(400, f"Can only handover approved requests. Current status: {borrow.status}")
    
    # Update borrow status to active and set handed_over_at
    borrow.status = BorrowStatus.active
    borrow.handed_over_at = bangladesh_now()  # Set the handover timestamp
    
    # Update book copy status to borrowed
    book_copy = session.get(BookCopy, borrow.book_copy_id)
    if book_copy:
        book_copy.status = CopyStatus.borrowed
        session.add(book_copy)
    
    session.add(borrow)
    session.commit()
    session.refresh(borrow)
    
    return {
        "message": "Book handed over successfully (Step 2/2)",
        "borrow_id": borrow_id,
        "status": borrow.status,
        "handed_over_at": borrow.handed_over_at,
        "note": "Book is now actively borrowed by user.",
        "handed_over_by": admin_user.name
    }

@router.post("/borrows/{borrow_id}/reject")
def reject_borrow(borrow_id: int, reason: str = "No reason provided", session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Reject a borrow request"""
    borrow = session.get(Borrow, borrow_id)
    if not borrow:
        raise HTTPException(404, "Borrow request not found")
    
    if borrow.status not in [BorrowStatus.pending, BorrowStatus.approved]:
        raise HTTPException(400, f"Can only reject pending or approved requests. Current status: {borrow.status}")
    
    # Update borrow status to rejected
    borrow.status = BorrowStatus.rejected
    
    # If book copy was reserved, make it available again
    book_copy = session.get(BookCopy, borrow.book_copy_id)
    if book_copy and book_copy.status == CopyStatus.reserved:
        book_copy.status = CopyStatus.available
        session.add(book_copy)
    
    session.add(borrow)
    session.commit()
    session.refresh(borrow)
    
    return {
        "message": "Borrow request rejected",
        "borrow_id": borrow_id,
        "status": borrow.status,
        "reason": reason,
        "rejected_by": admin_user.name
    }

@router.post("/borrows/{borrow_id}/return")
def mark_book_returned(borrow_id: int, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Mark a book as returned"""
    borrow = session.get(Borrow, borrow_id)
    if not borrow:
        raise HTTPException(404, "Borrow request not found")
    
    if borrow.status != BorrowStatus.active:
        raise HTTPException(400, f"Can only return active borrows. Current status: {borrow.status}")
    
    # Update borrow status to returned and set returned_at
    borrow.status = BorrowStatus.returned
    borrow.returned_at = bangladesh_now()  # Set the return timestamp
    
    # Update book copy status to available
    book_copy = session.get(BookCopy, borrow.book_copy_id)
    if book_copy:
        book_copy.status = CopyStatus.available
        session.add(book_copy)
    
    session.add(borrow)
    session.commit()
    session.refresh(borrow)
    
    return {
        "message": "Book returned successfully",
        "borrow_id": borrow_id,
        "status": borrow.status,
        "returned_at": borrow.returned_at,
        "note": "Book is now available for other users.",
        "processed_by": admin_user.name
    }

@router.post("/issue", response_model=BorrowOut)
def issue_book(borrow: BorrowCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Issue a book directly to a user (librarian only)"""
    from enums import UserRole
    
    # Only librarians can issue books
    if current_user.role not in [UserRole.librarian, UserRole.admin]:
        raise HTTPException(
            status_code=403, 
            detail="Only librarians can issue books directly"
        )
    
    # Verify target user exists
    target_user = session.get(User, borrow.user_id)
    if not target_user:
        raise HTTPException(404, "Target user not found")
    
    # Verify target user is active
    if not target_user.is_active:
        raise HTTPException(400, "Cannot issue book to inactive user")
    
    # Verify book copy exists and is available
    book_copy = session.get(BookCopy, borrow.book_copy_id)
    if not book_copy:
        raise HTTPException(404, "Book copy not found")
    
    if book_copy.status not in [CopyStatus.available, CopyStatus.reserved]:
        raise HTTPException(400, f"Book copy is not available for issuing (current status: {book_copy.status})")
    
    # Check if user already has an active borrow for this book copy
    existing_borrow = session.exec(
        select(Borrow).where(
            Borrow.user_id == borrow.user_id,
            Borrow.book_copy_id == borrow.book_copy_id,
            Borrow.status.in_([BorrowStatus.pending, BorrowStatus.approved, BorrowStatus.active])
        )
    ).first()
    
    if existing_borrow:
        raise HTTPException(400, "User already has an active borrow for this book copy")
    
    # Create borrow record with active status (direct issue)
    db_borrow = Borrow(
        user_id=borrow.user_id,
        book_copy_id=borrow.book_copy_id,
        status=BorrowStatus.active,  # Direct issue - skip pending/approved states
        issued_date=bangladesh_now(),
        due_date=bangladesh_now() + timedelta(days=14)  # 2 weeks default
    )
    session.add(db_borrow)
    
    # Update book copy status to borrowed
    book_copy.status = CopyStatus.borrowed
    session.add(book_copy)
    
    session.commit()
    session.refresh(db_borrow)
    
    # Load nested relationships for response
    if db_borrow.book_copy_id:
        book_copy = session.get(BookCopy, db_borrow.book_copy_id)
        if book_copy and book_copy.book_id:
            book = session.get(Book, book_copy.book_id)
            if book:
                book_copy.book = book
        db_borrow.book_copy = book_copy
    
    return db_borrow


# ===== DONATION MANAGEMENT =====

@router.get("/donations", response_model=list[DonationOut])
def get_all_donations(session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get all donations (admin view)"""
    statement = select(Donation)
    donations = session.exec(statement).all()
    
    # Load nested relationships
    for donation in donations:
        if donation.user_id:
            user = session.get(User, donation.user_id)
            donation.user = user
        if donation.book_copy_id:
            book_copy = session.get(BookCopy, donation.book_copy_id)
            if book_copy and book_copy.book_id:
                book = session.get(Book, book_copy.book_id)
                if book:
                    book_copy.book = book
            donation.book_copy = book_copy
    
    return donations

@router.get("/donations/{donation_id}", response_model=DonationOut)
def get_donation_admin(donation_id: int, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get specific donation (admin can view any)"""
    donation = session.get(Donation, donation_id)
    if not donation:
        raise HTTPException(404, "Donation not found")
    return donation

@router.get("/donations/status/{status}", response_model=list[DonationOut])
def get_donations_by_status_admin(status: DonationStatus, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get all donations by status (admin view)"""
    statement = select(Donation).where(Donation.status == status)
    donations = session.exec(statement).all()
    return donations

@router.get("/donations/user/{user_id}", response_model=list[DonationOut])
def get_user_donations_admin(user_id: int, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get all donations by specific user (admin view)"""
    statement = select(Donation).where(Donation.user_id == user_id)
    donations = session.exec(statement).all()
    return donations

@router.post("/donations/{donation_id}/approve")
def approve_donation_first_step(donation_id: int, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """First approval: Change status to 'approved' - User gets notification"""
    donation = session.get(Donation, donation_id)
    if not donation:
        raise HTTPException(404, "Donation request not found")
    
    if donation.status != DonationStatus.pending:
        raise HTTPException(400, f"Can only approve pending requests. Current status: {donation.status}")
    
    # Update donation status to approved and set approved_at
    donation.status = DonationStatus.approved
    donation.approved_at = bangladesh_now()  # Set the approval timestamp
    
    session.add(donation)
    session.commit()
    session.refresh(donation)
    
    return {
        "message": "Donation request approved (Step 1/2)",
        "donation_id": donation_id,
        "status": donation.status,
        "approved_at": donation.approved_at,
        "note": "User has been notified. Waiting for physical book delivery.",
        "approved_by": admin_user.name
    }

@router.post("/donations/{donation_id}/complete")
def complete_donation_second_step(donation_id: int, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Second approval: Physical book received - Change status to 'completed'"""
    donation = session.get(Donation, donation_id)
    if not donation:
        raise HTTPException(404, "Donation request not found")
    
    if donation.status != DonationStatus.approved:
        raise HTTPException(400, f"Can only complete approved donations. Current status: {donation.status}")
    
    # Update donation status to completed and set completed_at
    donation.status = DonationStatus.completed
    donation.completed_at = bangladesh_now()  # Set the completion timestamp
    
    # If there's a book copy associated, ensure it's available
    if donation.book_copy_id:
        book_copy = session.get(BookCopy, donation.book_copy_id)
        if book_copy:
            book_copy.status = CopyStatus.available
            session.add(book_copy)
    
    session.add(donation)
    session.commit()
    session.refresh(donation)
    
    return {
        "message": "Donation completed successfully (Step 2/2)",
        "donation_id": donation_id,
        "status": donation.status,
        "completed_at": donation.completed_at,
        "note": "Book has been received and is now available in the library.",
        "completed_by": admin_user.name
    }

@router.post("/donations/{donation_id}/reject")
def reject_donation(donation_id: int, reason: str = "No reason provided", session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Reject a donation request"""
    donation = session.get(Donation, donation_id)
    if not donation:
        raise HTTPException(404, "Donation request not found")
    
    if donation.status not in [DonationStatus.pending, DonationStatus.approved]:
        raise HTTPException(400, f"Can only reject pending or approved requests. Current status: {donation.status}")
    
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
        "message": "Donation request rejected",
        "donation_id": donation_id,
        "status": donation.status,
        "reason": reason,
        "rejected_by": admin_user.name
    }

# ===== USER MANAGEMENT =====

@router.post("/users", response_model=UserOut)
def create_user(user: UserCreate, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Create a new user (admin only)"""
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == user.email)).first()
    if existing_user:
        raise HTTPException(400, "Email already registered")
    
    # Hash password and create user
    hashed_password = get_password_hash(user.password)
    newUser = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role
    )

    session.add(newUser)
    session.commit()
    session.refresh(newUser)

    return newUser

@router.get("/users", response_model=list[UserOut])
def get_all_users(session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get all users (admin only)"""
    statement = select(User)
    users = session.exec(statement).all()
    return users

@router.get("/users/{user_id}", response_model=UserOut)
def get_user_by_id(user_id: int, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get user by ID (admin only)"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, new_role: UserRole, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Update user role (admin only)"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    
    old_role = user.role
    user.role = new_role
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {
        "message": "User role updated successfully",
        "user_id": user_id,
        "old_role": old_role,
        "new_role": new_role,
        "updated_by": admin_user.name
    }

@router.put("/users/{user_id}/status")
def update_user_status(user_id: int, is_active: bool, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Activate/deactivate user (admin only)"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    
    old_status = user.is_active
    user.is_active = is_active
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {
        "message": f"User {'activated' if is_active else 'deactivated'} successfully",
        "user_id": user_id,
        "old_status": old_status,
        "new_status": is_active,
        "updated_by": admin_user.name
    }

@router.get("/users/{user_id}/stats")
def get_user_activity_stats(user_id: int, session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get specific user activity statistics (admin only)"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    
    # Get user's borrow statistics
    user_borrows = session.exec(select(Borrow).where(Borrow.user_id == user_id)).all()
    borrow_stats = {
        "total": len(user_borrows),
        "pending": len([b for b in user_borrows if b.status == BorrowStatus.pending]),
        "approved": len([b for b in user_borrows if b.status == BorrowStatus.approved]),
        "active": len([b for b in user_borrows if b.status == BorrowStatus.active]),
        "returned": len([b for b in user_borrows if b.status == BorrowStatus.returned]),
        "rejected": len([b for b in user_borrows if b.status == BorrowStatus.rejected])
    }
    
    # Get user's donation statistics
    user_donations = session.exec(select(Donation).where(Donation.user_id == user_id)).all()
    donation_stats = {
        "total": len(user_donations),
        "pending": len([d for d in user_donations if d.status == DonationStatus.pending]),
        "approved": len([d for d in user_donations if d.status == DonationStatus.approved]),
        "completed": len([d for d in user_donations if d.status == DonationStatus.completed]),
        "rejected": len([d for d in user_donations if d.status == DonationStatus.rejected])
    }
    
    return {
        "user_id": user_id,
        "user_name": user.name,
        "user_email": user.email,
        "user_role": user.role,
        "user_status": "Active" if user.is_active else "Inactive",
        "borrow_activity": borrow_stats,
        "donation_activity": donation_stats,
        "summary": {
            "total_books_borrowed": borrow_stats["returned"] + borrow_stats["active"],
            "total_books_donated": donation_stats["completed"],
            "current_active_borrows": borrow_stats["active"],
            "pending_requests": borrow_stats["pending"] + donation_stats["pending"]
        }
    }

# ===== ADMIN DASHBOARD =====

@router.get("/stats/overview")
def get_system_overview_stats(session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get comprehensive system statistics overview"""
    
    # User Statistics
    total_users = len(session.exec(select(User)).all())
    active_users = len(session.exec(select(User).where(User.is_active == True)).all())
    admin_users = len(session.exec(select(User).where(User.role == UserRole.admin)).all())
    librarian_users = len(session.exec(select(User).where(User.role == UserRole.librarian)).all())
    member_users = len(session.exec(select(User).where(User.role == UserRole.member)).all())
    
    # Book Statistics
    total_books = len(session.exec(select(Book)).all())
    total_book_copies = len(session.exec(select(BookCopy)).all())
    available_copies = len(session.exec(select(BookCopy).where(BookCopy.status == CopyStatus.available)).all())
    borrowed_copies = len(session.exec(select(BookCopy).where(BookCopy.status == CopyStatus.borrowed)).all())
    reserved_copies = len(session.exec(select(BookCopy).where(BookCopy.status == CopyStatus.reserved)).all())
    damaged_copies = len(session.exec(select(BookCopy).where(BookCopy.status == CopyStatus.damaged)).all())
    
    # Borrow Statistics
    total_borrows = len(session.exec(select(Borrow)).all())
    pending_borrows = len(session.exec(select(Borrow).where(Borrow.status == BorrowStatus.pending)).all())
    approved_borrows = len(session.exec(select(Borrow).where(Borrow.status == BorrowStatus.approved)).all())
    active_borrows = len(session.exec(select(Borrow).where(Borrow.status == BorrowStatus.active)).all())
    returned_borrows = len(session.exec(select(Borrow).where(Borrow.status == BorrowStatus.returned)).all())
    rejected_borrows = len(session.exec(select(Borrow).where(Borrow.status == BorrowStatus.rejected)).all())
    
    # Donation Statistics
    total_donations = len(session.exec(select(Donation)).all())
    pending_donations = len(session.exec(select(Donation).where(Donation.status == DonationStatus.pending)).all())
    approved_donations = len(session.exec(select(Donation).where(Donation.status == DonationStatus.approved)).all())
    completed_donations = len(session.exec(select(Donation).where(Donation.status == DonationStatus.completed)).all())
    rejected_donations = len(session.exec(select(Donation).where(Donation.status == DonationStatus.rejected)).all())
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "inactive": total_users - active_users,
            "by_role": {
                "admin": admin_users,
                "librarian": librarian_users,
                "member": member_users
            }
        },
        "books": {
            "total_titles": total_books,
            "total_copies": total_book_copies,
            "by_status": {
                "available": available_copies,
                "borrowed": borrowed_copies,
                "reserved": reserved_copies,
                "damaged": damaged_copies
            }
        },
        "borrows": {
            "total": total_borrows,
            "pending_approval": pending_borrows,
            "approved_awaiting_handover": approved_borrows,
            "active": active_borrows,
            "returned": returned_borrows,
            "rejected": rejected_borrows
        },
        "donations": {
            "total": total_donations,
            "pending_approval": pending_donations,
            "approved_awaiting_completion": approved_donations,
            "completed": completed_donations,
            "rejected": rejected_donations
        }
    }

@router.get("/stats/users")
def get_user_statistics(session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get detailed user statistics"""
    users = session.exec(select(User)).all()
    
    stats = {
        "total_users": len(users),
        "active_users": len([u for u in users if u.is_active]),
        "inactive_users": len([u for u in users if not u.is_active]),
        "by_role": {
            "admin": len([u for u in users if u.role == UserRole.admin]),
            "librarian": len([u for u in users if u.role == UserRole.librarian]),
            "member": len([u for u in users if u.role == UserRole.member])
        },
        "activity_breakdown": {
            "active_admins": len([u for u in users if u.role == UserRole.admin and u.is_active]),
            "active_librarians": len([u for u in users if u.role == UserRole.librarian and u.is_active]),
            "active_members": len([u for u in users if u.role == UserRole.member and u.is_active])
        }
    }
    
    return stats

@router.get("/stats/books")
def get_book_statistics(session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get detailed book and book copy statistics"""
    books = session.exec(select(Book)).all()
    book_copies = session.exec(select(BookCopy)).all()
    categories = session.exec(select(Category)).all()
    
    # Get category-wise book distribution
    category_distribution = []
    total_books_categorized = 0
    
    for category in categories:
        category_books = [b for b in books if b.category_id == category.id]
        book_count = len(category_books)
        total_books_categorized += book_count
        
        if book_count > 0:
            category_distribution.append({
                "name": category.name,
                "value": book_count,
                "percentage": 0  # Will be calculated after loop
            })
    
    # Add uncategorized books
    uncategorized_books = [b for b in books if not b.category_id]
    if uncategorized_books:
        category_distribution.append({
            "name": "অবিন্যস্ত",
            "value": len(uncategorized_books),
            "percentage": 0
        })
        total_books_categorized += len(uncategorized_books)
    
    # Calculate percentages
    for category in category_distribution:
        category["percentage"] = (category["value"] / total_books_categorized * 100) if total_books_categorized > 0 else 0
    
    stats = {
        "books": {
            "total_titles": len(books),
            "average_copies_per_book": len(book_copies) / len(books) if books else 0,
            "category_distribution": category_distribution
        },
        "copies": {
            "total_copies": len(book_copies),
            "by_status": {
                "available": len([c for c in book_copies if c.status == CopyStatus.available]),
                "borrowed": len([c for c in book_copies if c.status == CopyStatus.borrowed]),
                "reserved": len([c for c in book_copies if c.status == CopyStatus.reserved]),
                "damaged": len([c for c in book_copies if c.status == CopyStatus.damaged])
            }
        },
        "availability": {
            "available_percentage": (len([c for c in book_copies if c.status == CopyStatus.available]) / len(book_copies) * 100) if book_copies else 0,
            "borrowed_percentage": (len([c for c in book_copies if c.status == CopyStatus.borrowed]) / len(book_copies) * 100) if book_copies else 0
        }
    }
    
    return stats

@router.get("/stats/trends")
def get_trends_data(session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get monthly trends data for charts"""
    from datetime import datetime, timedelta
    
    # Get data for the last 6 months
    months_data = []
    current_date = bangladesh_now()
    
    for i in range(5, -1, -1):  # Last 6 months
        target_date = current_date.replace(day=1) - timedelta(days=30*i)
        month_start = target_date.replace(day=1)
        next_month = month_start.replace(month=month_start.month % 12 + 1) if month_start.month < 12 else month_start.replace(year=month_start.year + 1, month=1)
        
        # Count borrows in this month
        monthly_borrows = session.exec(
            select(Borrow).where(
                Borrow.created_at >= month_start,
                Borrow.created_at < next_month
            )
        ).all()
        
        # Count donations in this month
        monthly_donations = session.exec(
            select(Donation).where(
                Donation.created_at >= month_start,
                Donation.created_at < next_month
            )
        ).all()
        
        # Count returns (borrows that were returned in this month)
        monthly_returns = len([b for b in monthly_borrows if b.status == BorrowStatus.returned])
        
        month_name_mapping = {
            1: "জানুয়ারি", 2: "ফেব্রুয়ারি", 3: "মার্চ", 4: "এপ্রিল",
            5: "মে", 6: "জুন", 7: "জুলাই", 8: "আগস্ট",
            9: "সেপ্টেম্বর", 10: "অক্টোবর", 11: "নভেম্বর", 12: "ডিসেম্বর"
        }
        
        months_data.append({
            "month": month_name_mapping[month_start.month],
            "borrows": len(monthly_borrows),
            "donations": len(monthly_donations),
            "returns": monthly_returns
        })
    
    return {
        "monthly_trends": months_data
    }

@router.get("/stats/user-activity")
def get_user_activity_data(session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get weekly user activity data"""
    from datetime import datetime, timedelta
    
    # Get data for the last 7 days
    weekly_activity = []
    current_date = bangladesh_now()
    
    day_name_mapping = {
        0: "সোম", 1: "মঙ্গল", 2: "বুধ", 3: "বৃহস্পতি",
        4: "শুক্র", 5: "শনি", 6: "রবি"
    }
    
    for i in range(7):
        target_date = current_date - timedelta(days=6-i)
        day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        # Count unique users who made borrows or donations on this day
        daily_borrows = session.exec(
            select(Borrow).where(
                Borrow.created_at >= day_start,
                Borrow.created_at < day_end
            )
        ).all()
        
        daily_donations = session.exec(
            select(Donation).where(
                Donation.created_at >= day_start,
                Donation.created_at < day_end
            )
        ).all()
        
        # Get unique user IDs
        unique_users = set()
        for borrow in daily_borrows:
            if borrow.user_id:
                unique_users.add(borrow.user_id)
        for donation in daily_donations:
            if donation.user_id:
                unique_users.add(donation.user_id)
        
        weekly_activity.append({
            "day": day_name_mapping[target_date.weekday()],
            "users": len(unique_users)
        })
    
    return {
        "user_activity": weekly_activity
    }

@router.get("/stats/borrows")
def get_borrow_statistics(session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get detailed borrow statistics"""
    borrows = session.exec(select(Borrow)).all()
    
    stats = {
        "total_borrows": len(borrows),
        "by_status": {
            "pending": len([b for b in borrows if b.status == BorrowStatus.pending]),
            "approved": len([b for b in borrows if b.status == BorrowStatus.approved]),
            "active": len([b for b in borrows if b.status == BorrowStatus.active]),
            "returned": len([b for b in borrows if b.status == BorrowStatus.returned]),
            "rejected": len([b for b in borrows if b.status == BorrowStatus.rejected])
        },
        "workflow_metrics": {
            "completion_rate": (len([b for b in borrows if b.status == BorrowStatus.returned]) / len(borrows) * 100) if borrows else 0,
            "rejection_rate": (len([b for b in borrows if b.status == BorrowStatus.rejected]) / len(borrows) * 100) if borrows else 0,
            "pending_action_count": len([b for b in borrows if b.status in [BorrowStatus.pending, BorrowStatus.approved]])
        }
    }
    
    return stats

@router.get("/stats/donations")
def get_donation_statistics(session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get detailed donation statistics"""
    donations = session.exec(select(Donation)).all()
    
    stats = {
        "total_donations": len(donations),
        "by_status": {
            "pending": len([d for d in donations if d.status == DonationStatus.pending]),
            "approved": len([d for d in donations if d.status == DonationStatus.approved]),
            "completed": len([d for d in donations if d.status == DonationStatus.completed]),
            "rejected": len([d for d in donations if d.status == DonationStatus.rejected])
        },
        "workflow_metrics": {
            "completion_rate": (len([d for d in donations if d.status == DonationStatus.completed]) / len(donations) * 100) if donations else 0,
            "rejection_rate": (len([d for d in donations if d.status == DonationStatus.rejected]) / len(donations) * 100) if donations else 0,
            "pending_action_count": len([d for d in donations if d.status in [DonationStatus.pending, DonationStatus.approved]])
        }
    }
    
    return stats

@router.get("/dashboard")
def admin_dashboard(session: Session = Depends(get_session), admin_user: User = Depends(require_admin)):
    """Get admin dashboard with all pending actions"""
    
    # Count pending requests
    pending_borrows = len(session.exec(select(Borrow).where(Borrow.status == BorrowStatus.pending)).all())
    approved_borrows = len(session.exec(select(Borrow).where(Borrow.status == BorrowStatus.approved)).all())
    active_borrows = len(session.exec(select(Borrow).where(Borrow.status == BorrowStatus.active)).all())
    
    pending_donations = len(session.exec(select(Donation).where(Donation.status == DonationStatus.pending)).all())
    approved_donations = len(session.exec(select(Donation).where(Donation.status == DonationStatus.approved)).all())
    
    # Get actual pending items for quick action
    pending_borrow_list = session.exec(select(Borrow).where(Borrow.status == BorrowStatus.pending)).all()
    approved_borrow_list = session.exec(select(Borrow).where(Borrow.status == BorrowStatus.approved)).all()
    pending_donation_list = session.exec(select(Donation).where(Donation.status == DonationStatus.pending)).all()
    approved_donation_list = session.exec(select(Donation).where(Donation.status == DonationStatus.approved)).all()
    
    return {
        "admin_info": {
            "name": admin_user.name,
            "email": admin_user.email
        },
        "summary": {
            "pending_borrows": pending_borrows,
            "approved_borrows_awaiting_handover": approved_borrows,
            "active_borrows": active_borrows,
            "pending_donations": pending_donations,
            "approved_donations_awaiting_completion": approved_donations
        },
        "actions_required": {
            "borrow_approvals_needed": [{"id": b.id, "user_id": b.user_id, "book_copy_id": b.book_copy_id} for b in pending_borrow_list],
            "borrow_handovers_needed": [{"id": b.id, "user_id": b.user_id, "book_copy_id": b.book_copy_id} for b in approved_borrow_list],
            "donation_approvals_needed": [{"id": d.id, "user_id": d.user_id, "book_copy_id": d.book_copy_id} for d in pending_donation_list],
            "donation_completions_needed": [{"id": d.id, "user_id": d.user_id, "book_copy_id": d.book_copy_id} for d in approved_donation_list]
        }
    }
