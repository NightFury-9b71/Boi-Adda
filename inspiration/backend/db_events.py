from sqlalchemy import event
from sqlmodel import Session, select
from models import Book, BookCopy, Borrow

def update_book_counters(session: Session, book_id: int):
    """Update total_copies and times_borrowed for a book"""
    # Count total copies
    total_copies = len(session.exec(select(BookCopy).where(BookCopy.book_id == book_id)).all())
    
    # Count total times borrowed (sum of all copy borrows)
    book_copies = session.exec(select(BookCopy).where(BookCopy.book_id == book_id)).all()
    total_times_borrowed = sum(copy.times_borrowed for copy in book_copies)
    
    # Update book
    book = session.get(Book, book_id)
    if book:
        book.total_copies = total_copies
        book.times_borrowed = total_times_borrowed
        session.add(book)

@event.listens_for(BookCopy, 'after_insert')
def receive_after_insert_book_copy(mapper, connection, target):
    """Automatically update book.total_copies when a new BookCopy is created"""
    session = Session(connection)
    if target.book_id:
        update_book_counters(session, target.book_id)
        session.commit()

@event.listens_for(BookCopy, 'after_delete')
def receive_after_delete_book_copy(mapper, connection, target):
    """Automatically update book.total_copies when a BookCopy is deleted"""
    session = Session(connection)
    if target.book_id:
        update_book_counters(session, target.book_id)
        session.commit()

@event.listens_for(Borrow, 'after_insert')
def receive_after_insert_borrow(mapper, connection, target):
    """Automatically increment times_borrowed when a new Borrow is created"""
    session = Session(connection)
    if target.book_copy_id:
        # Increment BookCopy times_borrowed
        book_copy = session.get(BookCopy, target.book_copy_id)
        if book_copy:
            book_copy.times_borrowed += 1
            session.add(book_copy)
            
            # Update Book counters
            if book_copy.book_id:
                update_book_counters(session, book_copy.book_id)
            
            session.commit()

@event.listens_for(Borrow, 'after_delete')
def receive_after_delete_borrow(mapper, connection, target):
    """Automatically decrement times_borrowed when a Borrow is deleted"""
    session = Session(connection)
    if target.book_copy_id:
        # Decrement BookCopy times_borrowed
        book_copy = session.get(BookCopy, target.book_copy_id)
        if book_copy and book_copy.times_borrowed > 0:
            book_copy.times_borrowed -= 1
            session.add(book_copy)
            
            # Update Book counters
            if book_copy.book_id:
                update_book_counters(session, book_copy.book_id)
            
            session.commit()

# Helper function to manually recalculate all counters (for data consistency)
def recalculate_all_counters(session: Session):
    """Recalculate all book counters - useful for data migration or fixing inconsistencies"""
    books = session.exec(select(Book)).all()
    for book in books:
        update_book_counters(session, book.id)
    session.commit()
