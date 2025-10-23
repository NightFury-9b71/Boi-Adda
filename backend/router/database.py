from db import get_session
from models import Book, BookCopy, User, Role, BookRequest, IssueBook, Category, requestType
from sqlmodel import select, Session, func
from fastapi import APIRouter, Depends

router = APIRouter()


@router.get("/stats")
def get_database_stats(session: Session = Depends(get_session)):
    """Get database statistics for dashboard and landing page"""
    
    # Count records in each table
    total_books = session.exec(select(func.count(Book.id))).one()
    total_copies = session.exec(select(func.count(BookCopy.id))).one()
    total_users = session.exec(select(func.count(User.id))).one()
    total_categories = session.exec(select(func.count(Category.id))).one()
    total_requests = session.exec(select(func.count(BookRequest.id))).one()
    total_issues = session.exec(select(func.count(IssueBook.id))).one()
    
    # Count borrows (borrow type requests)
    total_borrows = session.exec(
        select(func.count(BookRequest.id)).where(BookRequest.request_type == requestType.BORROW)
    ).one()
    
    # Count donations (donation type requests)
    total_donations = session.exec(
        select(func.count(BookRequest.id)).where(BookRequest.request_type == requestType.DONATION)
    ).one()
    
    # Count members by role
    member_role = session.exec(select(Role).where(Role.name == "member")).first()
    admin_role = session.exec(select(Role).where(Role.name == "admin")).first()
    
    total_members = 0
    total_admins = 0
    
    if member_role:
        total_members = session.exec(
            select(func.count(User.id)).where(User.role_id == member_role.id)
        ).one()
    
    if admin_role:
        total_admins = session.exec(
            select(func.count(User.id)).where(User.role_id == admin_role.id)
        ).one()
    
    total_all_records = (
        total_books + 
        total_copies + 
        total_users + 
        total_requests + 
        total_issues
    )
    
    return {
        "total_records": total_all_records,
        "users": total_users,
        "members": total_members,
        "admins": total_admins,
        "books": total_books,
        "book_copies": total_copies,
        "categories": total_categories,
        "requests": total_requests,
        "borrows": total_borrows,
        "donations": total_donations,
        "issues": total_issues,
        "breakdown": {
            "books": total_books,
            "book_copies": total_copies,
            "users": total_users,
            "members": total_members,
            "admins": total_admins,
            "categories": total_categories,
            "requests": total_requests,
            "borrows": total_borrows,
            "donations": total_donations,
            "issues": total_issues
        }
    }
