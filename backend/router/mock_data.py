from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from db import get_session, engine
from models import (
    SQLModel, User, Role, Book, BookCopy, BookRequest, IssueBook, Category,
    bookStatus, requestType, requestStatus
)
from datetime import datetime, timedelta
from mock_data_samples import (
    ADMINS_DATA, MEMBERS_DATA, BOOKS_DATA, 
    BOOK_COPY_COUNTS, DONATION_DATA, CATEGORIES_DATA
)
from auth_utils import get_password_hash
import os
from dotenv import load_dotenv

load_dotenv()
DEFAULT_MOCK_PASSWORD = os.getenv("MOCK_USERS_PASSWORD", "Test123!")

router = APIRouter()


@router.post("/seed", status_code=status.HTTP_201_CREATED)
def seed_database(session: Session = Depends(get_session)):
    """
    Seed the database with mock data for testing.
    Creates roles if needed, then creates admins, members, books, book copies, and some sample requests.
    Appends data to existing database.
    """
    try:
        # Create or get roles
        admin_role = session.exec(select(Role).where(Role.name == "admin")).first()
        member_role = session.exec(select(Role).where(Role.name == "member")).first()
        guest_role = session.exec(select(Role).where(Role.name == "guest")).first()
        
        # Create roles if they don't exist
        if not admin_role:
            admin_role = Role(
                name="admin",
                description="Administrator with full access"
            )
            session.add(admin_role)
        
        if not member_role:
            member_role = Role(
                name="member",
                description="Regular library member"
            )
            session.add(member_role)
        
        if not guest_role:
            guest_role = Role(
                name="guest",
                description="Guest user with limited access"
            )
            session.add(guest_role)
        
        session.commit()
        session.refresh(admin_role)
        session.refresh(member_role)
        
        # Create Admins (with hashed passwords and auto-verified)
        admins = []
        password_hash = get_password_hash(DEFAULT_MOCK_PASSWORD)
        for admin_data in ADMINS_DATA:
            admin = User(
                name=admin_data["name"],
                email=admin_data["email"],
                password_hash=password_hash,
                is_verified=True,  # Auto-verify mock admins
                is_active=True,  # All mock users are active
                role_id=admin_role.id,
                profile_photo_url=admin_data.get("profile_photo_url")
            )
            session.add(admin)
            admins.append(admin)
        session.commit()
        for admin in admins:
            session.refresh(admin)
        
        # Create Members (with hashed passwords and auto-verified)
        members = []
        for member_data in MEMBERS_DATA:
            member = User(
                name=member_data["name"],
                email=member_data["email"],
                password_hash=password_hash,
                is_verified=True,  # Auto-verify mock members
                is_active=True,  # All mock users are active
                role_id=member_role.id,
                profile_photo_url=member_data.get("profile_photo_url")
            )
            session.add(member)
            members.append(member)
        session.commit()
        for member in members:
            session.refresh(member)
        
        # Create Categories
        categories = []
        for category_data in CATEGORIES_DATA:
            # Check if category already exists
            existing_category = session.exec(
                select(Category).where(Category.name == category_data["name"])
            ).first()
            
            if not existing_category:
                category = Category(**category_data)
                session.add(category)
                categories.append(category)
            else:
                categories.append(existing_category)
        
        session.commit()
        for category in categories:
            if category.id is None:  # Only refresh newly created categories
                session.refresh(category)
        
        # Create Books with categories
        books = []
        for book_data in BOOKS_DATA:
            # Extract category_index and remove it from book_data
            category_index = book_data.pop("category_index", 0)
            
            # Assign category_id
            book_data["category_id"] = categories[category_index].id
            
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
                "categories": len(categories),
                "books": len(books),
                "book_copies": len(copies),
                "borrow_requests": 5,
                "donation_requests": 1,
                "issued_books": 2,
                "overdue_books": 1
            },
            "note": f"All users created with default password: {DEFAULT_MOCK_PASSWORD}. Users are auto-verified and can log in immediately."
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
        # Get all users and count by role
        all_users = session.exec(select(User)).all()
        admin_role = session.exec(select(Role).where(Role.name == "admin")).first()
        member_role = session.exec(select(Role).where(Role.name == "member")).first()
        
        admin_count = len([u for u in all_users if u.role_id == admin_role.id]) if admin_role else 0
        member_count = len([u for u in all_users if u.role_id == member_role.id]) if member_role else 0
        
        stats = {
            "admins": admin_count,
            "members": member_count,
            "total_users": len(all_users),
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


@router.post("/verify-all-users", status_code=status.HTTP_200_OK)
def verify_all_mock_users(session: Session = Depends(get_session)):
    """
    Verify all users in the database (useful for testing).
    Sets is_verified=True for all users.
    """
    try:
        all_users = session.exec(select(User)).all()
        verified_count = 0
        
        for user in all_users:
            if not user.is_verified:
                user.is_verified = True
                user.verification_code = None
                user.verification_code_expires = None
                session.add(user)
                verified_count += 1
        
        session.commit()
        
        return {
            "message": "All users verified successfully",
            "verified_count": verified_count,
            "total_users": len(all_users)
        }
    
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying users: {str(e)}"
        )
