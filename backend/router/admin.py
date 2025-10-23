from db import get_session
from models import (
    Book, BookCopy, bookStatus, User, Role,
    BookRequest, requestType, requestStatus, IssueBook
)
from sqlmodel import select, Session, SQLModel, func
from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime, timedelta
from auth import require_admin, get_current_user
from typing import Optional

router = APIRouter()


# Request/Response Models
class IssueBookCreate(SQLModel):
    member_id: int
    book_copy_id: int


class BorrowRequestResponse(SQLModel):
    id: int
    member_id: int
    member_name: str
    member_email: str
    book_id: int
    book_title: str
    book_author: str
    book_cover_url: Optional[str] = None
    status: requestStatus
    created_at: datetime
    reviewed_at: Optional[datetime] = None


class DonationRequestResponse(SQLModel):
    id: int
    member_id: int
    member_name: str
    member_email: str
    donation_title: str
    donation_author: str
    donation_year: int
    donation_pages: int
    status: requestStatus
    created_at: datetime
    reviewed_at: Optional[datetime] = None


# ===== DASHBOARD & STATS =====

@router.get("/dashboard/stats")
def get_dashboard_stats(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get dashboard statistics for admin"""
    
    # Borrow requests counts
    pending_borrows = session.exec(
        select(func.count(BookRequest.id)).where(
            BookRequest.request_type == requestType.BORROW,
            BookRequest.status == requestStatus.PENDING
        )
    ).one()
    
    approved_borrows = session.exec(
        select(func.count(BookRequest.id)).where(
            BookRequest.request_type == requestType.BORROW,
            BookRequest.status == requestStatus.APPROVED
        )
    ).one()
    
    # Donation requests counts
    pending_donations = session.exec(
        select(func.count(BookRequest.id)).where(
            BookRequest.request_type == requestType.DONATION,
            BookRequest.status == requestStatus.PENDING
        )
    ).one()
    
    approved_donations = session.exec(
        select(func.count(BookRequest.id)).where(
            BookRequest.request_type == requestType.DONATION,
            BookRequest.status == requestStatus.APPROVED
        )
    ).one()
    
    # Active borrows
    active_borrows = session.exec(
        select(func.count(IssueBook.id)).where(
            IssueBook.return_date.is_(None)
        )
    ).one()
    
    # Total statistics
    total_books = session.exec(select(func.count(Book.id))).one()
    total_members = session.exec(select(func.count(User.id))).one()
    available_copies = session.exec(
        select(func.count(BookCopy.id)).where(BookCopy.status == bookStatus.AVAILABLE)
    ).one()
    
    return {
        "pending_borrows": pending_borrows,
        "approved_borrows": approved_borrows,
        "pending_donations": pending_donations,
        "approved_donations": approved_donations,
        "active_borrows": active_borrows,
        "total_books": total_books,
        "total_members": total_members,
        "available_copies": available_copies
    }


@router.get("/stats/overview")
def get_overview_stats(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get comprehensive system statistics overview"""
    
    # User Statistics
    total_members = session.exec(select(func.count(User.id))).one()
    total_admins = session.exec(select(func.count(User.id))).one()
    
    # Book Statistics
    total_books = session.exec(select(func.count(Book.id))).one()
    total_copies = session.exec(select(func.count(BookCopy.id))).one()
    available_copies = session.exec(
        select(func.count(BookCopy.id)).where(BookCopy.status == bookStatus.AVAILABLE)
    ).one()
    borrowed_copies = session.exec(
        select(func.count(BookCopy.id)).where(BookCopy.status == bookStatus.ISSUED)
    ).one()
    reserved_copies = session.exec(
        select(func.count(BookCopy.id)).where(BookCopy.status == bookStatus.RESERVED)
    ).one()
    
    # Borrow Statistics
    total_borrow_requests = session.exec(
        select(func.count(BookRequest.id)).where(BookRequest.request_type == requestType.BORROW)
    ).one()
    pending_borrows = session.exec(
        select(func.count(BookRequest.id)).where(
            BookRequest.request_type == requestType.BORROW,
            BookRequest.status == requestStatus.PENDING
        )
    ).one()
    approved_borrows = session.exec(
        select(func.count(BookRequest.id)).where(
            BookRequest.request_type == requestType.BORROW,
            BookRequest.status == requestStatus.APPROVED
        )
    ).one()
    rejected_borrows = session.exec(
        select(func.count(BookRequest.id)).where(
            BookRequest.request_type == requestType.BORROW,
            BookRequest.status == requestStatus.REJECTED
        )
    ).one()
    
    # Donation Statistics
    total_donations = session.exec(
        select(func.count(BookRequest.id)).where(BookRequest.request_type == requestType.DONATION)
    ).one()
    pending_donations = session.exec(
        select(func.count(BookRequest.id)).where(
            BookRequest.request_type == requestType.DONATION,
            BookRequest.status == requestStatus.PENDING
        )
    ).one()
    completed_donations = session.exec(
        select(func.count(BookRequest.id)).where(
            BookRequest.request_type == requestType.DONATION,
            BookRequest.status == requestStatus.COMPLETED
        )
    ).one()
    
    # Active issues
    active_issues = session.exec(
        select(func.count(IssueBook.id)).where(IssueBook.return_date.is_(None))
    ).one()
    
    return {
        "users": {
            "total_members": total_members,
            "total_admins": total_admins,
            "total": total_members + total_admins
        },
        "books": {
            "total_titles": total_books,
            "total_copies": total_copies,
            "available": available_copies,
            "borrowed": borrowed_copies,
            "reserved": reserved_copies
        },
        "borrows": {
            "total": total_borrow_requests,
            "pending": pending_borrows,
            "approved": approved_borrows,
            "rejected": rejected_borrows,
            "active": active_issues
        },
        "donations": {
            "total": total_donations,
            "pending": pending_donations,
            "completed": completed_donations
        }
    }


@router.get("/stats/users")
def get_user_stats(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get detailed user statistics"""
    total_members = session.exec(select(func.count(User.id))).one()
    total_admins = session.exec(select(func.count(User.id))).one()
    
    return {
        "total_users": total_members + total_admins,
        "members": total_members,
        "admins": total_admins,
        "by_role": {
            "member": total_members,
            "admin": total_admins
        }
    }


@router.get("/stats/books")
def get_book_stats(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get detailed book statistics"""
    books = session.exec(select(Book)).all()
    copies = session.exec(select(BookCopy)).all()
    
    return {
        "books": {
            "total_titles": len(books),
            "average_copies_per_book": len(copies) / len(books) if books else 0
        },
        "copies": {
            "total_copies": len(copies),
            "by_status": {
                "available": len([c for c in copies if c.status == bookStatus.AVAILABLE]),
                "issued": len([c for c in copies if c.status == bookStatus.ISSUED]),
                "reserved": len([c for c in copies if c.status == bookStatus.RESERVED]),
                "damaged": len([c for c in copies if c.status == bookStatus.DAMAGED]),
                "lost": len([c for c in copies if c.status == bookStatus.LOST])
            }
        }
    }


@router.get("/stats/borrows")
def get_borrow_stats(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get detailed borrow statistics"""
    borrows = session.exec(
        select(BookRequest).where(BookRequest.request_type == requestType.BORROW)
    ).all()
    
    return {
        "total_borrows": len(borrows),
        "by_status": {
            "pending": len([b for b in borrows if b.status == requestStatus.PENDING]),
            "approved": len([b for b in borrows if b.status == requestStatus.APPROVED]),
            "collected": len([b for b in borrows if b.status == requestStatus.COLLECTED]),
            "rejected": len([b for b in borrows if b.status == requestStatus.REJECTED])
        }
    }


@router.get("/stats/donations")
def get_donation_stats(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get detailed donation statistics"""
    donations = session.exec(
        select(BookRequest).where(BookRequest.request_type == requestType.DONATION)
    ).all()
    
    return {
        "total_donations": len(donations),
        "by_status": {
            "pending": len([d for d in donations if d.status == requestStatus.PENDING]),
            "approved": len([d for d in donations if d.status == requestStatus.APPROVED]),
            "completed": len([d for d in donations if d.status == requestStatus.COMPLETED]),
            "rejected": len([d for d in donations if d.status == requestStatus.REJECTED])
        }
    }


@router.get("/stats/trends")
def get_trends_data(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get monthly trends data for charts"""
    # Get data for the last 6 months
    months_data = []
    current_date = datetime.now()
    
    for i in range(5, -1, -1):
        # Calculate month boundaries
        target_month = current_date.month - i
        target_year = current_date.year
        
        while target_month <= 0:
            target_month += 12
            target_year -= 1
        
        month_start = datetime(target_year, target_month, 1)
        
        if target_month == 12:
            next_month = datetime(target_year + 1, 1, 1)
        else:
            next_month = datetime(target_year, target_month + 1, 1)
        
        # Count borrows and donations in this month
        monthly_borrows = session.exec(
            select(BookRequest).where(
                BookRequest.request_type == requestType.BORROW,
                BookRequest.created_at >= month_start,
                BookRequest.created_at < next_month
            )
        ).all()
        
        monthly_donations = session.exec(
            select(BookRequest).where(
                BookRequest.request_type == requestType.DONATION,
                BookRequest.created_at >= month_start,
                BookRequest.created_at < next_month
            )
        ).all()
        
        # Count returns in this month
        monthly_returns = session.exec(
            select(IssueBook).where(
                IssueBook.return_date >= month_start,
                IssueBook.return_date < next_month
            )
        ).all()
        
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        months_data.append({
            "month": month_names[target_month - 1],
            "borrows": len(monthly_borrows),
            "donations": len(monthly_donations),
            "returns": len(monthly_returns)
        })
    
    return {"monthly_trends": months_data}


@router.get("/stats/user-activity")
def get_user_activity_data(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get weekly user activity data"""
    weekly_activity = []
    current_date = datetime.now()
    
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    for i in range(7):
        target_date = current_date - timedelta(days=6-i)
        day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        # Count unique members who made requests on this day
        daily_requests = session.exec(
            select(BookRequest).where(
                BookRequest.created_at >= day_start,
                BookRequest.created_at < day_end
            )
        ).all()
        
        unique_members = set(req.member_id for req in daily_requests)
        
        weekly_activity.append({
            "day": day_names[target_date.weekday()],
            "users": len(unique_members)
        })
    
    return {"user_activity": weekly_activity}


# ===== BORROW MANAGEMENT =====

@router.get("/borrows")
def get_all_borrow_requests(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get all borrow requests with member and book details"""
    requests = session.exec(
        select(BookRequest).where(
            BookRequest.request_type == requestType.BORROW
        ).order_by(BookRequest.created_at.desc())
    ).all()
    
    result = []
    for req in requests:
        # Manually load relationships
        member = session.get(User, req.member_id)
        book = session.get(Book, req.book_id) if req.book_id else None
        
        result.append(BorrowRequestResponse(
            id=req.id,
            member_id=req.member_id,
            member_name=member.name if member else "Unknown User",
            member_email=member.email if member else "unknown@email.com",
            book_id=req.book_id if req.book_id else 0,
            book_title=book.title if book else "Unknown Book",
            book_author=book.author if book else "Unknown Author",
            book_cover_url=book.cover_image_url if book else None,
            status=req.status,
            created_at=req.created_at,
            reviewed_at=req.reviewed_at
        ))
    
    return result


@router.get("/borrows/user/{user_id}")
def get_user_borrows(
    user_id: int,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get all borrow requests for a specific user"""
    requests = session.exec(
        select(BookRequest).where(
            BookRequest.member_id == user_id,
            BookRequest.request_type == requestType.BORROW
        ).order_by(BookRequest.created_at.desc())
    ).all()
    
    result = []
    for req in requests:
        # Manually load relationships
        member = session.get(User, req.member_id)
        book = session.get(Book, req.book_id) if req.book_id else None
        
        result.append(BorrowRequestResponse(
            id=req.id,
            member_id=req.member_id,
            member_name=member.name if member else "Unknown User",
            member_email=member.email if member else "unknown@email.com",
            book_id=req.book_id if req.book_id else 0,
            book_title=book.title if book else "Unknown Book",
            book_author=book.author if book else "Unknown Author",
            book_cover_url=book.cover_image_url if book else None,
            status=req.status,
            created_at=req.created_at,
            reviewed_at=req.reviewed_at
        ))
    
    return result


@router.post("/borrows/{borrow_id}/approve")
def approve_borrow_request(
    borrow_id: int,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Approve a borrow request"""
    user_email = current_user.email
    admin = session.exec(select(User).where(User.email == user_email)).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found"
        )
    
    request_obj = session.get(BookRequest, borrow_id)
    
    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrow request not found"
        )
    
    if request_obj.status != requestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only approve pending requests. Current status: {request_obj.status}"
        )
    
    # Update request status
    request_obj.status = requestStatus.APPROVED
    request_obj.reviewed_at = datetime.now()
    request_obj.reviewed_by_id = admin.id
    
    # Reserve a book copy if not already reserved
    if not request_obj.reserved_copy_id:
        available_copy = session.exec(
            select(BookCopy).where(
                BookCopy.book_id == request_obj.book_id,
                BookCopy.status == bookStatus.AVAILABLE
            )
        ).first()
        
        if not available_copy:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No available copies for this book"
            )
        
        available_copy.status = bookStatus.RESERVED
        request_obj.reserved_copy_id = available_copy.id
        session.add(available_copy)
    
    session.add(request_obj)
    session.commit()
    session.refresh(request_obj)
    
    return {
        "message": "Borrow request approved successfully",
        "request_id": borrow_id,
        "status": request_obj.status
    }


@router.post("/borrows/{borrow_id}/handover")
def handover_book(
    borrow_id: int,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Handover book to member (physical collection)"""
    user_email = current_user.email
    admin = session.exec(select(User).where(User.email == user_email)).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found"
        )
    
    request_obj = session.get(BookRequest, borrow_id)
    
    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrow request not found"
        )
    
    if request_obj.status != requestStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only handover approved requests. Current status: {request_obj.status}"
        )
    
    # Create issue record
    issue_date = datetime.now()
    due_date = issue_date + timedelta(days=14)
    
    issue_book = IssueBook(
        member_id=request_obj.member_id,
        book_copy_id=request_obj.reserved_copy_id,
        admin_id=admin.id,
        request_id=request_obj.id,
        issue_date=issue_date,
        due_date=due_date
    )
    
    session.add(issue_book)
    
    # Update request status
    request_obj.status = requestStatus.COLLECTED
    request_obj.collected_at = datetime.now()
    
    # Update book copy status
    book_copy = session.get(BookCopy, request_obj.reserved_copy_id)
    if book_copy:
        book_copy.status = bookStatus.ISSUED
        session.add(book_copy)
    
    session.add(request_obj)
    session.commit()
    session.refresh(issue_book)
    
    return {
        "message": "Book handed over successfully",
        "request_id": borrow_id,
        "issue_id": issue_book.id,
        "due_date": due_date.isoformat()
    }


@router.post("/borrows/{borrow_id}/reject")
def reject_borrow_request(
    borrow_id: int,
    reason: Optional[str] = None,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Reject a borrow request"""
    user_email = current_user.email
    admin = session.exec(select(User).where(User.email == user_email)).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found"
        )
    
    request_obj = session.get(BookRequest, borrow_id)
    
    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrow request not found"
        )
    
    if request_obj.status not in [requestStatus.PENDING, requestStatus.APPROVED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only reject pending or approved requests. Current status: {request_obj.status}"
        )
    
    # Update request status
    request_obj.status = requestStatus.REJECTED
    request_obj.reviewed_at = datetime.now()
    request_obj.reviewed_by_id = admin.id
    
    # Free up reserved copy if exists
    if request_obj.reserved_copy_id:
        book_copy = session.get(BookCopy, request_obj.reserved_copy_id)
        if book_copy and book_copy.status == bookStatus.RESERVED:
            book_copy.status = bookStatus.AVAILABLE
            session.add(book_copy)
        request_obj.reserved_copy_id = None
    
    session.add(request_obj)
    session.commit()
    session.refresh(request_obj)
    
    return {
        "message": "Borrow request rejected",
        "request_id": borrow_id,
        "reason": reason or "No reason provided"
    }


@router.post("/borrows/{borrow_id}/return")
def return_book(
    borrow_id: int,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Mark a book as returned"""
    # Find the issue record associated with this borrow request
    issue_book = session.exec(
        select(IssueBook).where(IssueBook.request_id == borrow_id)
    ).first()
    
    if not issue_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue record not found for this borrow request"
        )
    
    if issue_book.return_date is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book already returned"
        )
    
    # Update issue record
    issue_book.return_date = datetime.now()
    session.add(issue_book)
    
    # Update book copy status
    book_copy = session.get(BookCopy, issue_book.book_copy_id)
    if book_copy:
        book_copy.status = bookStatus.AVAILABLE
        session.add(book_copy)
    
    # Update borrow request status to completed
    borrow_request = session.get(BookRequest, borrow_id)
    if borrow_request:
        borrow_request.status = requestStatus.COMPLETED
        session.add(borrow_request)
    
    session.commit()
    session.refresh(issue_book)
    
    return {
        "message": "Book returned successfully",
        "issue_id": issue_book.id,
        "return_date": issue_book.return_date.isoformat()
    }


# ===== DONATION MANAGEMENT =====

@router.get("/donations")
def get_all_donation_requests(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get all donation requests with member details"""
    requests = session.exec(
        select(BookRequest).where(
            BookRequest.request_type == requestType.DONATION
        ).order_by(BookRequest.created_at.desc())
    ).all()
    
    result = []
    for req in requests:
        # Manually load member relationship
        member = session.get(User, req.member_id)
        
        result.append(DonationRequestResponse(
            id=req.id,
            member_id=req.member_id,
            member_name=member.name if member else "Unknown User",
            member_email=member.email if member else "unknown@email.com",
            donation_title=req.donation_title or "Unknown Title",
            donation_author=req.donation_author or "Unknown Author",
            donation_year=req.donation_year or 0,
            donation_pages=req.donation_pages or 0,
            status=req.status,
            created_at=req.created_at,
            reviewed_at=req.reviewed_at
        ))
    
    return result


@router.get("/donations/user/{user_id}")
def get_user_donations(
    user_id: int,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get all donation requests for a specific user"""
    requests = session.exec(
        select(BookRequest).where(
            BookRequest.member_id == user_id,
            BookRequest.request_type == requestType.DONATION
        ).order_by(BookRequest.created_at.desc())
    ).all()
    
    result = []
    for req in requests:
        # Manually load member relationship
        member = session.get(User, req.member_id)
        
        result.append(DonationRequestResponse(
            id=req.id,
            member_id=req.member_id,
            member_name=member.name if member else "Unknown User",
            member_email=member.email if member else "unknown@email.com",
            donation_title=req.donation_title or "Unknown Title",
            donation_author=req.donation_author or "Unknown Author",
            donation_year=req.donation_year or 0,
            donation_pages=req.donation_pages or 0,
            status=req.status,
            created_at=req.created_at,
            reviewed_at=req.reviewed_at
        ))
    
    return result


@router.post("/donations/{donation_id}/approve")
def approve_donation_request(
    donation_id: int,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Approve a donation request"""
    user_email = current_user.email
    admin = session.exec(select(User).where(User.email == user_email)).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found"
        )
    
    request_obj = session.get(BookRequest, donation_id)
    
    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation request not found"
        )
    
    if request_obj.status != requestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only approve pending requests. Current status: {request_obj.status}"
        )
    
    # Update request status
    request_obj.status = requestStatus.APPROVED
    request_obj.reviewed_at = datetime.now()
    request_obj.reviewed_by_id = admin.id
    
    session.add(request_obj)
    session.commit()
    session.refresh(request_obj)
    
    return {
        "message": "Donation request approved successfully",
        "request_id": donation_id,
        "status": request_obj.status
    }


@router.post("/donations/{donation_id}/complete")
def complete_donation_request(
    donation_id: int,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Complete a donation request and add book to library"""
    request_obj = session.get(BookRequest, donation_id)
    
    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation request not found"
        )
    
    if request_obj.status != requestStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only complete approved requests. Current status: {request_obj.status}"
        )
    
    # Check if book exists or create new one
    existing_book = session.exec(
        select(Book).where(
            Book.title == request_obj.donation_title,
            Book.author == request_obj.donation_author
        )
    ).first()
    
    if existing_book:
        book = existing_book
    else:
        book = Book(
            title=request_obj.donation_title,
            author=request_obj.donation_author,
            published_year=request_obj.donation_year,
            pages=request_obj.donation_pages
        )
        session.add(book)
        session.flush()
    
    # Add book copy
    book_copy = BookCopy(
        book_id=book.id,
        status=bookStatus.AVAILABLE
    )
    session.add(book_copy)
    session.flush()
    
    # Update request status
    request_obj.status = requestStatus.COMPLETED
    request_obj.book_id = book.id
    
    session.add(request_obj)
    session.commit()
    session.refresh(request_obj)
    
    return {
        "message": "Donation completed successfully. Book added to library.",
        "request_id": donation_id,
        "book_id": book.id,
        "book_title": book.title
    }


@router.post("/donations/{donation_id}/reject")
def reject_donation_request(
    donation_id: int,
    reason: Optional[str] = None,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Reject a donation request"""
    user_email = current_user.email
    admin = session.exec(select(User).where(User.email == user_email)).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found"
        )
    
    request_obj = session.get(BookRequest, donation_id)
    
    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation request not found"
        )
    
    if request_obj.status not in [requestStatus.PENDING, requestStatus.APPROVED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only reject pending or approved requests. Current status: {request_obj.status}"
        )
    
    # Update request status
    request_obj.status = requestStatus.REJECTED
    request_obj.reviewed_at = datetime.now()
    request_obj.reviewed_by_id = admin.id
    
    session.add(request_obj)
    session.commit()
    session.refresh(request_obj)
    
    return {
        "message": "Donation request rejected",
        "request_id": donation_id,
        "reason": reason or "No reason provided"
    }


# ===== USER MANAGEMENT =====

@router.get("/users")
def get_all_users(
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get all users (members and admins) with role information"""
    all_users = session.exec(select(User)).all()
    
    users = []
    for user in all_users:
        # Manually load role relationship
        role = session.get(Role, user.role_id)
        role_name = role.name if role else "guest"
        
        users.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role_name,
            "profile_photo_url": user.profile_photo_url,
            "user_type": role_name,  # "admin" or "member"
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "is_verified": user.is_verified,
            "is_active": user.is_active
        })
    
    return users


@router.get("/users/{user_id}/stats")
def get_specific_user_stats(
    user_id: int,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Get specific user activity statistics"""
    member = session.get(User, user_id)
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user's borrow statistics
    user_borrows = session.exec(
        select(BookRequest).where(
            BookRequest.member_id == user_id,
            BookRequest.request_type == requestType.BORROW
        )
    ).all()
    
    # Get user's donation statistics
    user_donations = session.exec(
        select(BookRequest).where(
            BookRequest.member_id == user_id,
            BookRequest.request_type == requestType.DONATION
        )
    ).all()
    
    # Get active issues
    active_issues = session.exec(
        select(IssueBook).where(
            IssueBook.member_id == user_id,
            IssueBook.return_date.is_(None)
        )
    ).all()
    
    return {
        "user_id": user_id,
        "user_name": member.name,
        "user_email": member.email,
        "borrow_activity": {
            "total": len(user_borrows),
            "pending": len([b for b in user_borrows if b.status == requestStatus.PENDING]),
            "approved": len([b for b in user_borrows if b.status == requestStatus.APPROVED]),
            "collected": len([b for b in user_borrows if b.status == requestStatus.COLLECTED]),
            "rejected": len([b for b in user_borrows if b.status == requestStatus.REJECTED])
        },
        "donation_activity": {
            "total": len(user_donations),
            "pending": len([d for d in user_donations if d.status == requestStatus.PENDING]),
            "approved": len([d for d in user_donations if d.status == requestStatus.APPROVED]),
            "completed": len([d for d in user_donations if d.status == requestStatus.COMPLETED]),
            "rejected": len([d for d in user_donations if d.status == requestStatus.REJECTED])
        },
        "current_active_borrows": len(active_issues)
    }


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    new_role: str = Query(...),
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Update user role"""
    # Try to find user
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate role name
    valid_roles = ["admin", "member", "guest"]
    if new_role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Get the role from database
    role = session.exec(select(Role).where(Role.name == new_role)).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role '{new_role}' not found in database"
        )
    
    # Update user's role
    user.role_id = role.id
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {
        "message": f"User role updated to {new_role} successfully",
        "user_id": user_id,
        "new_role": new_role
    }


@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool = Query(...),
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Activate/deactivate user"""
    member = session.get(User, user_id)
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user's active status
    member.is_active = is_active
    session.add(member)
    session.commit()
    session.refresh(member)
    
    return {
        "message": f"User {'activated' if is_active else 'deactivated'} successfully",
        "user_id": user_id,
        "is_active": is_active
    }


# ===== DIRECT BOOK ISSUE =====

@router.post("/issue")
def issue_book_directly(
    data: IssueBookCreate,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """Issue a book directly to a member (bypass request workflow)"""
    user_email = current_user.email
    admin = session.exec(select(User).where(User.email == user_email)).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin profile not found"
        )
    
    # Verify member exists
    member = session.get(User, data.member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Verify book copy exists and is available
    book_copy = session.get(BookCopy, data.book_copy_id)
    if not book_copy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book copy not found"
        )
    
    if book_copy.status != bookStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Book copy is not available. Current status: {book_copy.status}"
        )
    
    # Create issue record
    issue_date = datetime.now()
    due_date = issue_date + timedelta(days=14)
    
    issue_book = IssueBook(
        member_id=data.member_id,
        book_copy_id=data.book_copy_id,
        admin_id=admin.id,
        issue_date=issue_date,
        due_date=due_date
    )
    
    session.add(issue_book)
    
    # Update book copy status
    book_copy.status = bookStatus.ISSUED
    session.add(book_copy)
    
    session.commit()
    session.refresh(issue_book)
    
    return {
        "message": "Book issued successfully",
        "issue_id": issue_book.id,
        "member_name": member.name,
        "book_title": book_copy.book.title,
        "due_date": due_date.isoformat()
    }
