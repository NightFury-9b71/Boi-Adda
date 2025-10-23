from sqlmodel import Field, SQLModel, Relationship
from enum import Enum
from datetime import datetime


class userRole(str, Enum):
    ADMIN = "admin"
    MEMBER = "member"
    GUEST = "guest"

class bookStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"  # Approved request, waiting for collection
    ISSUED = "issued"
    DAMAGED = "damaged"
    LOST = "lost"

class requestType(str, Enum):
    BORROW = "borrow"
    DONATION = "donation"

class requestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"  # Admin approved, book reserved
    REJECTED = "rejected"
    COLLECTED = "collected"  # Member collected the book physically
    RETURN_REQUESTED = "return_requested"  # Member requested to return
    COMPLETED = "completed"  # For donations: book added to library, for borrows: book returned

class Role(SQLModel, table=True):
    """Role table to store user roles"""
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)  # "admin", "member", "guest"
    description: str | None = None
    
    users: list["User"] = Relationship(back_populates="role")

class User(SQLModel, table=True):
    """Single user table for all users"""
    id: int | None = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str  # Hashed password for authentication
    is_verified: bool = Field(default=False)  # Email verification status
    is_active: bool = Field(default=True)  # User active/inactive status
    verification_code: str | None = None  # For email verification
    verification_code_expires: datetime | None = None  # Expiry time for verification code
    profile_photo_url: str | None = None  # Storage URL for profile picture
    created_at: datetime = Field(default_factory=datetime.now)
    
    # Foreign key to Role table
    role_id: int = Field(foreign_key="role.id")
    role: "Role" = Relationship(back_populates="users")
    
    # Relationships - specify foreign_keys to avoid ambiguity
    book_requests: list["BookRequest"] = Relationship(
        back_populates="member",
        sa_relationship_kwargs={
            "foreign_keys": "[BookRequest.member_id]",
            "primaryjoin": "User.id==BookRequest.member_id"
        }
    )
    reviewed_requests: list["BookRequest"] = Relationship(
        back_populates="reviewed_by",
        sa_relationship_kwargs={
            "foreign_keys": "[BookRequest.reviewed_by_id]",
            "primaryjoin": "User.id==BookRequest.reviewed_by_id"
        }
    )
    issued_books_as_member: list["IssueBook"] = Relationship(
        back_populates="member",
        sa_relationship_kwargs={
            "foreign_keys": "[IssueBook.member_id]",
            "primaryjoin": "User.id==IssueBook.member_id"
        }
    )
    issued_books_as_admin: list["IssueBook"] = Relationship(
        back_populates="admin",
        sa_relationship_kwargs={
            "foreign_keys": "[IssueBook.admin_id]",
            "primaryjoin": "User.id==IssueBook.admin_id"
        }
    )

class Category(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: str | None = None

    books: list["Book"] = Relationship(back_populates="category")

class Book(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    author: str
    published_year: int
    pages: int
    cover_image_url: str | None = None  # Supabase Storage URL

    category_id: int | None = Field(default=None, foreign_key="category.id")
    category: "Category" = Relationship(back_populates="books")
    copies: list["BookCopy"] = Relationship(back_populates="book")
    requests: list["BookRequest"] = Relationship(back_populates="book")

class BookCopy(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    status: bookStatus = bookStatus.AVAILABLE
    # Optional: add barcode, condition, location, etc.

    book_id: int = Field(foreign_key="book.id")
    book: "Book" = Relationship(back_populates="copies")

    issue_books: list["IssueBook"] = Relationship(back_populates="book_copy")
    reservations: list["BookRequest"] = Relationship(back_populates="reserved_copy")


class BookRequest(SQLModel, table=True):
    """
    Handles both borrow and donation requests.
    Workflow for BORROW: pending → approved (reserved) → collected → issued (via IssueBook)
    Workflow for DONATION: pending → approved → completed (book added to library)
    """
    id: int | None = Field(default=None, primary_key=True)
    request_type: requestType
    status: requestStatus = requestStatus.PENDING
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now)
    reviewed_at: datetime | None = None
    collected_at: datetime | None = None
    
    # For donation requests
    donation_title: str | None = None
    donation_author: str | None = None
    donation_year: int | None = None
    donation_pages: int | None = None
    
    # Relationships
    member_id: int = Field(foreign_key="user.id")
    member: "User" = Relationship(
        back_populates="book_requests",
        sa_relationship_kwargs={
            "foreign_keys": "[BookRequest.member_id]",
            "primaryjoin": "User.id==BookRequest.member_id"
        }
    )
    
    # For borrow requests - which book they want
    book_id: int | None = Field(default=None, foreign_key="book.id")
    book: "Book" = Relationship(back_populates="requests")
    
    # Which copy was reserved (only for approved borrow requests)
    reserved_copy_id: int | None = Field(default=None, foreign_key="bookcopy.id")
    reserved_copy: "BookCopy" = Relationship(back_populates="reservations")
    
    # Admin who reviewed the request
    reviewed_by_id: int | None = Field(default=None, foreign_key="user.id")
    reviewed_by: "User" = Relationship(
        back_populates="reviewed_requests",
        sa_relationship_kwargs={
            "foreign_keys": "[BookRequest.reviewed_by_id]",
            "primaryjoin": "User.id==BookRequest.reviewed_by_id"
        }
    )
    
    # Link to IssueBook record (created when collected) - reverse relationship, no FK here
    issue_book: "IssueBook" = Relationship(back_populates="request")


class IssueBook(SQLModel, table=True):
    """
    Created when member collects the book physically.
    Automatically set due_date to 14 days from issue_date.
    """
    id: int | None = Field(default=None, primary_key=True)
    issue_date: datetime = Field(default_factory=datetime.now)
    due_date: datetime  # Auto-set to issue_date + 14 days
    return_date: datetime | None = None
    
    member_id: int = Field(foreign_key="user.id")
    member: "User" = Relationship(
        back_populates="issued_books_as_member",
        sa_relationship_kwargs={
            "foreign_keys": "[IssueBook.member_id]",
            "primaryjoin": "User.id==IssueBook.member_id"
        }
    )

    book_copy_id: int = Field(foreign_key="bookcopy.id")
    book_copy: "BookCopy" = Relationship(back_populates="issue_books")

    admin_id: int = Field(foreign_key="user.id")
    admin: "User" = Relationship(
        back_populates="issued_books_as_admin",
        sa_relationship_kwargs={
            "foreign_keys": "[IssueBook.admin_id]",
            "primaryjoin": "User.id==IssueBook.admin_id"
        }
    )
    
    # Link back to the request that initiated this - FK is here
    request_id: int | None = Field(default=None, foreign_key="bookrequest.id")
    request: "BookRequest" = Relationship(back_populates="issue_book")
    
    @property
    def is_overdue(self) -> bool:
        """Check if the book is overdue"""
        if self.return_date:
            return False  # Already returned
        return datetime.now() > self.due_date
    
    @property
    def overdue_days(self) -> int:
        """Calculate how many days overdue (0 if not overdue)"""
        if self.return_date or not self.is_overdue:
            return 0
        delta = datetime.now() - self.due_date
        return delta.days


