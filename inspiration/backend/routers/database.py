from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from models import User, Book, Category, BookCopy, Borrow, Donation
from enums import CopyStatus, BorrowStatus, DonationStatus, UserRole
from seed_data import SEED_USERS, SEED_CATEGORIES, SEED_BOOKS, SEED_BOOKS_2, get_random_cover
from database import get_session
from auth import get_password_hash
import random

router = APIRouter(prefix="/database", tags=["Database"])

@router.post("/seed")
def seed_database(session: Session = Depends(get_session)):
    """Seed database with Bangla sample data"""
    try:
        # Seed Users
        for user_data in SEED_USERS:
            # Check if user already exists
            existing_user = session.exec(select(User).where(User.email == user_data["email"])).first()
            if not existing_user:
                # Hash the password and create user with proper structure
                hashed_password = get_password_hash(user_data["password"])
                user = User(
                    name=user_data["name"],
                    email=user_data["email"],
                    hashed_password=hashed_password,
                    role=user_data["role"]
                )
                session.add(user)
        
        session.commit()
        
        # Seed Categories
        for category_data in SEED_CATEGORIES:
            # Check if category already exists
            existing_category = session.exec(select(Category).where(Category.name == category_data["name"])).first()
            if not existing_category:
                category = Category(**category_data)
                session.add(category)
        
        session.commit()
        
        # Get all categories for random assignment
        categories = session.exec(select(Category)).all()
        
        # Seed Books with random category assignment
        all_books = SEED_BOOKS + SEED_BOOKS_2
        for book_data in all_books:
            # Check if book already exists
            existing_book = session.exec(select(Book).where(Book.title == book_data["title"])).first()
            if not existing_book:
                # Assign random category
                book_data_copy = book_data.copy()
                book_data_copy["category_id"] = random.choice(categories).id if categories else None
                
                book = Book(**book_data_copy)
                session.add(book)
                session.commit()
                session.refresh(book)
                
                # Create 2-3 copies of each book (admin-added, no donors for now)
                num_copies = random.randint(2, 3)
                for i in range(num_copies):
                    book_copy = BookCopy(
                        book_id=book.id,
                        status=CopyStatus.available
                    )
                    session.add(book_copy)
        
        session.commit()
        
        # Create some sample borrows and donations
        users = session.exec(select(User)).all()
        book_copies = session.exec(select(BookCopy)).all()
        
        if users and book_copies:
            # Create 3-5 sample borrows
            num_borrows = min(random.randint(3, 5), len(book_copies))
            selected_copies = random.sample(book_copies, num_borrows)
            
            for book_copy in selected_copies:
                if book_copy.status == CopyStatus.available:
                    borrow = Borrow(
                        user_id=random.choice(users).id,
                        book_copy_id=book_copy.id,
                        status=random.choice([BorrowStatus.pending, BorrowStatus.approved, BorrowStatus.active])
                    )
                    session.add(borrow)
                    
                    # Update book copy status based on borrow status
                    if borrow.status == BorrowStatus.approved:
                        book_copy.status = CopyStatus.reserved
                    elif borrow.status == BorrowStatus.active:
                        book_copy.status = CopyStatus.borrowed
                    
                    session.add(book_copy)
        
        session.commit()
        
        # Create borrows and donations for each user to ensure everyone has activity
        users = session.exec(select(User)).all()
        books = session.exec(select(Book)).all()
        book_copies = session.exec(select(BookCopy)).all()
        
        if users and book_copies and books:
            # Ensure each user has at least 1-3 borrows and 1-2 donations
            for user in users:
                # Skip admin and librarian for donations (they manage, don't donate)
                should_donate = user.role == UserRole.member
                
                # Create 1-3 borrows for each user
                num_borrows = random.randint(1, 3)
                available_copies = [copy for copy in book_copies if copy.status == CopyStatus.available]
                
                if available_copies:
                    user_borrow_copies = random.sample(available_copies, min(num_borrows, len(available_copies)))
                    
                    for book_copy in user_borrow_copies:
                        borrow_status = random.choice([
                            BorrowStatus.pending, 
                            BorrowStatus.approved, 
                            BorrowStatus.active,
                            BorrowStatus.returned
                        ])
                        
                        borrow = Borrow(
                            user_id=user.id,
                            book_copy_id=book_copy.id,
                            status=borrow_status
                        )
                        session.add(borrow)
                        
                        # Update book copy status based on borrow status
                        if borrow_status == BorrowStatus.approved:
                            book_copy.status = CopyStatus.reserved
                        elif borrow_status == BorrowStatus.active:
                            book_copy.status = CopyStatus.borrowed
                        # If returned, keep as available
                        
                        session.add(book_copy)
                        
                        # Remove from available list to avoid double assignment
                        if book_copy in available_copies:
                            available_copies.remove(book_copy)
                
                # Create 1-2 donations for member users
                if should_donate:
                    num_donations = random.randint(1, 2)
                    
                    for i in range(num_donations):
                        # Create a donation record
                        donation_status = random.choice([
                            DonationStatus.pending,
                            DonationStatus.approved, 
                            DonationStatus.completed
                        ])
                        
                        donation = Donation(
                            user_id=user.id,
                            status=donation_status
                        )
                        session.add(donation)
                        session.commit()
                        session.refresh(donation)
                        
                        # Create a book copy for this donation
                        random_book = random.choice(books)
                        
                        donated_copy = BookCopy(
                            book_id=random_book.id,
                            donor_id=user.id,  # Set the donor
                            status=CopyStatus.available
                        )
                        session.add(donated_copy)
                        session.commit()
                        session.refresh(donated_copy)
                        
                        # Link the donation to the book copy
                        donation.book_copy_id = donated_copy.id
                        session.add(donation)
        
        session.commit()
        
        # Count final records
        user_count = len(session.exec(select(User)).all())
        category_count = len(session.exec(select(Category)).all())
        book_count = len(session.exec(select(Book)).all())
        book_copy_count = len(session.exec(select(BookCopy)).all())
        borrow_count = len(session.exec(select(Borrow)).all())
        donation_count = len(session.exec(select(Donation)).all())
        
        return {
            "message": "ডাটাবেস সফলভাবে সিড করা হয়েছে",
            "data": {
                "users": user_count,
                "categories": category_count,
                "books": book_count,
                "book_copies": book_copy_count,
                "borrows": borrow_count,
                "donations": donation_count
            }
        }
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"সিড করতে ত্রুটি: {str(e)}")

@router.delete("/reset")
def reset_database(session: Session = Depends(get_session)):
    """Reset (clear) entire database"""
    try:
        # Drop all tables with CASCADE to handle dependencies
        from database import create_tables
        from sqlalchemy import text
        
        # Drop tables in reverse order of dependencies
        session.exec(text("DROP TABLE IF EXISTS donation CASCADE"))
        session.exec(text("DROP TABLE IF EXISTS borrow CASCADE"))
        session.exec(text("DROP TABLE IF EXISTS bookcopy CASCADE"))
        session.exec(text("DROP TABLE IF EXISTS book CASCADE"))
        session.exec(text("DROP TABLE IF EXISTS category CASCADE"))
        session.exec(text("DROP TABLE IF EXISTS \"user\" CASCADE"))
        session.exec(text("DROP TABLE IF EXISTS adminconfig CASCADE"))
        
        # Drop enums
        session.exec(text("DROP TYPE IF EXISTS userrole CASCADE"))
        session.exec(text("DROP TYPE IF EXISTS copystatus CASCADE"))
        session.exec(text("DROP TYPE IF EXISTS borrowstatus CASCADE"))
        session.exec(text("DROP TYPE IF EXISTS donationstatus CASCADE"))
        
        session.commit()
        
        # Recreate all tables
        create_tables()
        
        return {
            "message": "ডাটাবেস সফলভাবে রিসেট করা হয়েছে",
            "status": "সমস্ত টেবিল এবং ইনাম ড্রপ এবং রিক্রিয়েট করা হয়েছে"
        }
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"রিসেট করতে ত্রুটি: {str(e)}")

@router.get("/stats")
def get_database_stats(session: Session = Depends(get_session)):
    """Get current database statistics"""
    try:
        user_count = len(session.exec(select(User)).all())
        category_count = len(session.exec(select(Category)).all())
        book_count = len(session.exec(select(Book)).all())
        book_copy_count = len(session.exec(select(BookCopy)).all())
        borrow_count = len(session.exec(select(Borrow)).all())
        donation_count = len(session.exec(select(Donation)).all())
        
        # Count by status
        available_copies = len(session.exec(select(BookCopy).where(BookCopy.status == CopyStatus.available)).all())
        borrowed_copies = len(session.exec(select(BookCopy).where(BookCopy.status == CopyStatus.borrowed)).all())
        reserved_copies = len(session.exec(select(BookCopy).where(BookCopy.status == CopyStatus.reserved)).all())
        
        pending_borrows = len(session.exec(select(Borrow).where(Borrow.status == BorrowStatus.pending)).all())
        active_borrows = len(session.exec(select(Borrow).where(Borrow.status == BorrowStatus.active)).all())
        
        pending_donations = len(session.exec(select(Donation).where(Donation.status == DonationStatus.pending)).all())
        completed_donations = len(session.exec(select(Donation).where(Donation.status == DonationStatus.completed)).all())
        
        return {
            "total_records": {
                "users": user_count,
                "categories": category_count, 
                "books": book_count,
                "book_copies": book_copy_count,
                "borrows": borrow_count,
                "donations": donation_count
            },
            "book_copy_status": {
                "available": available_copies,
                "borrowed": borrowed_copies,
                "reserved": reserved_copies
            },
            "borrow_status": {
                "pending": pending_borrows,
                "active": active_borrows
            },
            "donation_status": {
                "pending": pending_donations,
                "completed": completed_donations
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"স্ট্যাটস পেতে ত্রুটি: {str(e)}")
