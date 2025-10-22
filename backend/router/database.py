from db import get_session
from models import Book, BookCopy, Member, Admin, BookRequest, IssueBook
from sqlmodel import select, Session, func
from fastapi import APIRouter, Depends

router = APIRouter()


@router.get("/stats")
def get_database_stats(session: Session = Depends(get_session)):
    """Get total record count from all tables"""
    
    # Count records in each table
    total_books = session.exec(select(func.count(Book.id))).one()
    total_copies = session.exec(select(func.count(BookCopy.id))).one()
    total_members = session.exec(select(func.count(Member.id))).one()
    total_admins = session.exec(select(func.count(Admin.id))).one()
    total_requests = session.exec(select(func.count(BookRequest.id))).one()
    total_issues = session.exec(select(func.count(IssueBook.id))).one()
    
    total_records = (
        total_books + 
        total_copies + 
        total_members + 
        total_admins + 
        total_requests + 
        total_issues
    )
    
    return {
        "total_records": total_records,
        "breakdown": {
            "books": total_books,
            "book_copies": total_copies,
            "members": total_members,
            "admins": total_admins,
            "requests": total_requests,
            "issues": total_issues
        }
    }
