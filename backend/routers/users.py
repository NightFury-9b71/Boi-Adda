from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..models import User, Borrow, Donation
from ..schemas import UserOut
from ..enums import BorrowStatus, DonationStatus
from ..database import get_session
from ..auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me/stats")
def get_my_stats(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get current user's activity statistics"""
    # Get user's borrows
    user_borrows = session.exec(select(Borrow).where(Borrow.user_id == current_user.id)).all()
    borrow_stats = {
        "total": len(user_borrows),
        "pending": len([b for b in user_borrows if b.status == BorrowStatus.pending]),
        "approved": len([b for b in user_borrows if b.status == BorrowStatus.approved]),
        "active": len([b for b in user_borrows if b.status == BorrowStatus.active]),
        "returned": len([b for b in user_borrows if b.status == BorrowStatus.returned]),
        "rejected": len([b for b in user_borrows if b.status == BorrowStatus.rejected])
    }
    
    # Get user's donations
    user_donations = session.exec(select(Donation).where(Donation.user_id == current_user.id)).all()
    donation_stats = {
        "total": len(user_donations),
        "pending": len([d for d in user_donations if d.status == DonationStatus.pending]),
        "approved": len([d for d in user_donations if d.status == DonationStatus.approved]),
        "completed": len([d for d in user_donations if d.status == DonationStatus.completed]),
        "rejected": len([d for d in user_donations if d.status == DonationStatus.rejected])
    }
    
    return {
        "user_info": {
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "active": current_user.is_active
        },
        "activity_summary": {
            "borrows": borrow_stats,
            "donations": donation_stats
        }
    }
