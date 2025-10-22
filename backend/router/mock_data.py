from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from db import get_session, engine
from models import (
    SQLModel, Admin, Member, Book, BookCopy, BookRequest, IssueBook,
    userRole, bookStatus, requestType, requestStatus
)
from datetime import datetime, timedelta
from mock_data_samples import (
    ADMINS_DATA, MEMBERS_DATA, BOOKS_DATA, 
    BOOK_COPY_COUNTS, DONATION_DATA
)

router = APIRouter()


@router.post("/seed", status_code=status.HTTP_201_CREATED)
def seed_database(session: Session = Depends(get_session)):
    """
    Seed the database with mock data for testing.
    Creates admins, members, books, book copies, and some sample requests.
    """
    try:
        # Check if data already exists
        existing_admins = session.exec(select(Admin)).first()
        if existing_admins:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Database already contains data. Use /mock/reset to clear first."
            )
        
        # Create Admins
        admins = []
        for admin_data in ADMINS_DATA:
            admin = Admin(**admin_data)
            session.add(admin)
            admins.append(admin)
        session.commit()
        for admin in admins:
            session.refresh(admin)
        
        # Create Members
        members = []
        for member_data in MEMBERS_DATA:
            member = Member(**member_data)
            session.add(member)
            members.append(member)
        session.commit()
        for member in members:
            session.refresh(member)
        
        # Create Books
        books = []
        for book_data in BOOKS_DATA:
            book = Book(**book_data)
            session.add(book)
            books.append(book)
        session.commit()
        for book in books:
            session.refresh(book)
        
        # Create Book Copies (3 copies for first 4 books, 2 copies for next 2, 1 copy for last 2)
        copies = []
        
        for book, count in zip(books, BOOK_COPY_COUNTS):
            for _ in range(count):
                copy = BookCopy(book_id=book.id, status=bookStatus.AVAILABLE)
                session.add(copy)
                copies.append(copy)
        session.commit()
        for copy in copies:
            session.refresh(copy)
        
        # Create some sample borrow requests
        # Request 1: Pending request
        request1 = BookRequest(
            request_type=requestType.BORROW,
            member_id=members[0].id,
            book_id=books[0].id,
            status=requestStatus.PENDING
        )
        session.add(request1)
        
        # Request 2: Approved request (with reserved copy)
        request2 = BookRequest(
            request_type=requestType.BORROW,
            member_id=members[1].id,
            book_id=books[1].id,
            status=requestStatus.APPROVED,
            reviewed_at=datetime.now() - timedelta(hours=2),
            reviewed_by_id=admins[0].id,
            reserved_copy_id=copies[3].id  # Second book, first copy
        )
        copies[3].status = bookStatus.RESERVED
        session.add(request2)
        session.add(copies[3])
        
        # Request 3: Collected and issued
        request3 = BookRequest(
            request_type=requestType.BORROW,
            member_id=members[2].id,
            book_id=books[2].id,
            status=requestStatus.COLLECTED,
            reviewed_at=datetime.now() - timedelta(days=3),
            collected_at=datetime.now() - timedelta(days=2),
            reviewed_by_id=admins[0].id,
            reserved_copy_id=copies[6].id  # Third book, first copy
        )
        
        issue_date = datetime.now() - timedelta(days=2)
        issue1 = IssueBook(
            member_id=members[2].id,
            book_copy_id=copies[6].id,
            admin_id=admins[0].id,
            issue_date=issue_date,
            due_date=issue_date + timedelta(days=14),
            request_id=request3.id
        )
        copies[6].status = bookStatus.ISSUED
        session.add(request3)
        session.add(issue1)
        session.add(copies[6])
        
        # Request 4: Rejected request
        request4 = BookRequest(
            request_type=requestType.BORROW,
            member_id=members[3].id,
            book_id=books[3].id,
            status=requestStatus.REJECTED,
            reviewed_at=datetime.now() - timedelta(days=1),
            reviewed_by_id=admins[1].id
        )
        session.add(request4)
        
        # Request 5: Another issued book (overdue)
        request5 = BookRequest(
            request_type=requestType.BORROW,
            member_id=members[4].id,
            book_id=books[4].id,
            status=requestStatus.COLLECTED,
            reviewed_at=datetime.now() - timedelta(days=20),
            collected_at=datetime.now() - timedelta(days=19),
            reviewed_by_id=admins[1].id,
            reserved_copy_id=copies[12].id  # Fifth book, first copy
        )
        
        issue_date2 = datetime.now() - timedelta(days=19)
        issue2 = IssueBook(
            member_id=members[4].id,
            book_copy_id=copies[12].id,
            admin_id=admins[1].id,
            issue_date=issue_date2,
            due_date=issue_date2 + timedelta(days=14),  # This will be overdue
            request_id=request5.id
        )
        copies[12].status = bookStatus.ISSUED
        session.add(request5)
        session.add(issue2)
        session.add(copies[12])
        
        # Donation request (pending)
        donation1 = BookRequest(
            request_type=requestType.DONATION,
            member_id=members[0].id,
            status=requestStatus.PENDING,
            **DONATION_DATA
        )
        session.add(donation1)
        
        session.commit()
        
        return {
            "message": "Database seeded successfully",
            "summary": {
                "admins": len(admins),
                "members": len(members),
                "books": len(books),
                "book_copies": len(copies),
                "borrow_requests": 5,
                "donation_requests": 1,
                "issued_books": 2,
                "overdue_books": 1
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error seeding database: {str(e)}"
        )


@router.delete("/reset", status_code=status.HTTP_200_OK)
def reset_database(session: Session = Depends(get_session)):
    """
    Reset the database by dropping all tables and recreating them.
    WARNING: This will delete ALL data in the database!
    """
    try:
        # Drop all tables
        SQLModel.metadata.drop_all(engine)
        
        # Recreate all tables
        SQLModel.metadata.create_all(engine)
        
        return {
            "message": "Database reset successfully",
            "details": "All tables dropped and recreated. Database is now empty."
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting database: {str(e)}"
        )


@router.get("/stats")
def get_database_stats(session: Session = Depends(get_session)):
    """
    Get current database statistics.
    Shows count of all entities in the database.
    """
    try:
        stats = {
            "admins": len(session.exec(select(Admin)).all()),
            "members": len(session.exec(select(Member)).all()),
            "books": len(session.exec(select(Book)).all()),
            "book_copies": len(session.exec(select(BookCopy)).all()),
            "total_requests": len(session.exec(select(BookRequest)).all()),
            "issued_books": len(session.exec(select(IssueBook)).all()),
        }
        
        # Count by status
        available_copies = len(session.exec(
            select(BookCopy).where(BookCopy.status == bookStatus.AVAILABLE)
        ).all())
        reserved_copies = len(session.exec(
            select(BookCopy).where(BookCopy.status == bookStatus.RESERVED)
        ).all())
        issued_copies = len(session.exec(
            select(BookCopy).where(BookCopy.status == bookStatus.ISSUED)
        ).all())
        
        pending_requests = len(session.exec(
            select(BookRequest).where(BookRequest.status == requestStatus.PENDING)
        ).all())
        approved_requests = len(session.exec(
            select(BookRequest).where(BookRequest.status == requestStatus.APPROVED)
        ).all())
        
        # Count overdue books
        overdue = len([
            issue for issue in session.exec(select(IssueBook)).all()
            if issue.is_overdue
        ])
        
        stats.update({
            "book_copies_by_status": {
                "available": available_copies,
                "reserved": reserved_copies,
                "issued": issued_copies
            },
            "requests_by_status": {
                "pending": pending_requests,
                "approved": approved_requests
            },
            "overdue_books": overdue
        })
        
        return stats
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching stats: {str(e)}"
        )
