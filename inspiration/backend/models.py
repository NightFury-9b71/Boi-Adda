from sqlmodel import Field, Relationship, SQLModel
from typing import Optional
from datetime import datetime, timezone
from enums import CopyStatus, BorrowStatus, DonationStatus, UserRole
from timezone_utils import utc_now
from pydantic import validator
from sqlalchemy import DateTime, Column
from sqlalchemy.types import TypeDecorator

class TimezoneAwareDateTime(TypeDecorator):
    """Custom DateTime type that handles timezone-aware strings from SQLite"""
    impl = DateTime
    cache_ok = True
    
    def process_result_value(self, value, dialect):
        if value is not None and isinstance(value, str):
            try:
                return parse_datetime_string(value)
            except Exception as e:
                print(f"Error parsing datetime '{value}': {e}")
                # Return as-is if parsing fails
                return value
        elif value is not None and isinstance(value, datetime) and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

def get_utc_now():
    """Get current UTC time for database default"""
    from timezone_utils import utc_now
    return utc_now()

def parse_datetime_string(dt_str: str) -> datetime:
    """Parse datetime string from database, handling timezone info"""
    if isinstance(dt_str, datetime):
        return dt_str if dt_str.tzinfo else dt_str.replace(tzinfo=timezone.utc)
    
    try:
        # Try parsing ISO format with timezone
        if '+' in dt_str or dt_str.endswith('Z'):
            return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        else:
            # Parse as naive and assume UTC
            dt = datetime.fromisoformat(dt_str)
            return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        # Fallback parsing
        try:
            dt = datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S.%f')
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            dt = datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S')
            return dt.replace(tzinfo=timezone.utc)

class User(SQLModel, table = True):
    id : Optional[int] = Field(default=None, primary_key=True)
    name : str
    email : str = Field(unique=True, index=True)
    phone : Optional[str] = None
    address : Optional[str] = None
    bio : Optional[str] = None
    date_of_birth : Optional[str] = None
    profile_image : Optional[str] = None
    profile_public_id : Optional[str] = None  # Cloudinary public ID for profile image
    cover_image : Optional[str] = None
    cover_public_id : Optional[str] = None    # Cloudinary public ID for cover image
    hashed_password : str
    role : UserRole = Field(default=UserRole.member)
    is_active : bool = Field(default=True)
    created_at : datetime = Field(default_factory=get_utc_now)
    updated_at : datetime = Field(default_factory=get_utc_now)
    
    @validator('created_at', 'updated_at', pre=True)
    def parse_datetime(cls, v):
        if isinstance(v, str):
            return parse_datetime_string(v)
        elif isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    # points : int = Field(default=0)
    # inkpots : list["Inkpot"] = Relationship(back_populates="user")
    # badges : list["Badge"] = Relationship(back_populates="user")
    # rewards : list["Badge"] = Relationship(back_populates="user")
    # articales : list["Article"] = Relationship(back_populates="user")
    # comments : list["Comment"] = Relationship(back_populates="user")
    # notifications : list["Borrow"] = Relationship(back_populates="user")

    borrows : list["Borrow"] = Relationship(back_populates="user")
    donates : list["Donation"] = Relationship(back_populates="user")
    donated_copies : list["BookCopy"] = Relationship(back_populates="donor")

class Category(SQLModel, table = True):
    id : Optional[int] = Field(default=None, primary_key=True)
    name : str
    description : str
    created_at : datetime = Field(default_factory=get_utc_now)
    updated_at : datetime = Field(default_factory=get_utc_now)

    books : list["Book"] = Relationship(back_populates="category")
    
    @validator('created_at', 'updated_at', pre=True)
    def parse_datetime(cls, v):
        if isinstance(v, str):
            return parse_datetime_string(v)
        elif isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class Book(SQLModel, table = True):
    id : Optional[int] = Field(default=None, primary_key=True)
    title : str
    author : str 
    isbn : Optional[str] = None  # ISBN field for book identification
    cover : str
    cover_public_id : Optional[str] = None  # Cloudinary public ID for book cover
    category_id : Optional[int] = Field(default=None, foreign_key="category.id")
    published_year : int
    pages : int
    total_copies : int = Field(default=0)  # Total number of copies
    times_borrowed : int = Field(default=0)  # Total times borrowed across all copies
    created_at : datetime = Field(default_factory=get_utc_now)
    updated_at : datetime = Field(default_factory=get_utc_now)
    
    category : Optional["Category"] = Relationship(back_populates="books")
    book_copies : list["BookCopy"] = Relationship(back_populates="book")
    
    @validator('created_at', 'updated_at', pre=True)
    def parse_datetime(cls, v):
        if isinstance(v, str):
            return parse_datetime_string(v)
        elif isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class BookCopy(SQLModel, table = True):
    id : Optional[int] = Field(default=None, primary_key=True)
    book_id : Optional[int] = Field(default=None, foreign_key="book.id")
    donor_id : Optional[int] = Field(default=None, foreign_key="user.id")  # Direct reference to donor
    status : CopyStatus = CopyStatus.available
    due_date : Optional[datetime] = None
    return_date : Optional[datetime] = None
    times_borrowed : int = Field(default=0)  # Times this specific copy was borrowed
    created_at : datetime = Field(default_factory=get_utc_now)
    updated_at : datetime = Field(default_factory=get_utc_now)
    
    book : Optional["Book"] = Relationship(back_populates="book_copies")
    donor : Optional["User"] = Relationship(back_populates="donated_copies")
    borrows : list["Borrow"] = Relationship(back_populates="book_copy")
    donations : list["Donation"] = Relationship(back_populates="book_copy")
    
    @validator('created_at', 'updated_at', 'due_date', 'return_date', pre=True)
    def parse_datetime(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            return parse_datetime_string(v)
        elif isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v



class Borrow(SQLModel, table = True):
    id : Optional[int] = Field(default=None, primary_key=True)
    status : BorrowStatus
    created_at : datetime = Field(default_factory=get_utc_now)
    updated_at : datetime = Field(default_factory=get_utc_now)
    approved_at : Optional[datetime] = None  # When admin approved the request
    handed_over_at : Optional[datetime] = None  # When book was physically handed over
    returned_at : Optional[datetime] = None  # When book was returned by user
    
    user_id : Optional[int] = Field(default=None, foreign_key="user.id")
    book_copy_id: Optional[int] = Field(default=None, foreign_key="bookcopy.id")

    user : Optional["User"] = Relationship(back_populates="borrows")
    book_copy : Optional["BookCopy"] = Relationship(back_populates="borrows")
    
    @validator('created_at', 'updated_at', 'approved_at', 'handed_over_at', 'returned_at', pre=True)
    def parse_datetime(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            return parse_datetime_string(v)
        elif isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class Donation(SQLModel, table = True):
    id : Optional[int] = Field(default=None, primary_key=True)
    status : DonationStatus
    created_at : datetime = Field(default_factory=get_utc_now)
    updated_at : datetime = Field(default_factory=get_utc_now)
    approved_at : Optional[datetime] = None  # When admin approved the donation
    completed_at : Optional[datetime] = None  # When donation was completed

    user_id : Optional[int] = Field(default=None, foreign_key="user.id")
    book_copy_id: Optional[int] = Field(default=None, foreign_key="bookcopy.id")
    
    user : Optional["User"] = Relationship(back_populates="donates")
    book_copy : Optional["BookCopy"] = Relationship(back_populates="donations")
    
    @validator('created_at', 'updated_at', 'approved_at', 'completed_at', pre=True)
    def parse_datetime(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            return parse_datetime_string(v)
        elif isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v


# class Depot(SQLModel, table = True):
#     id : Optional[int] = Field(default=None, primary_key=True)

#     book_copy : list["BookCopy"] = Relationship(back_populates="depot")
#     borrows : list["Borrow"] = Relationship(back_populates="depot")
#     donations : list["Donation"] = Relationship(back_populates="depot")

# class Inkpot(SQLModel):
#     id : Optional[int] = Field(default=None, primary_key=True)

#     user_id : Optional[int] = Field(default=None, foreign_key="user.id")
#     user : Optional["User"] = Relationship(back_populates="inkpots")

#     reason : str

# class RewardRule(SQLModel):
#     id : Optional[int] = Field(default=None, primary_key=True)
#     action : str
#     points : int
#     description : str    

# class RewardItem(SQLModel):
#     id : Optional[int] = Field(default=None, primary_key=True)
#     name : str
#     description : str
#     available : int

#     user_id : Optional[int] = Field(default=None, foreign_key="user.id")
#     user : Optional["User"] = Relationship(back_populates="rewards")

# class Badge(SQLModel):
#     id : Optional[int] = Field(default=None, primary_key=True)
#     name : str
#     description : str

#     user_id : Optional[int] = Field(default=None, foreign_key="user.id")
#     user : Optional["User"] = Relationship(back_populates="badges")

# class Article(SQLModel):
#     id : Optional[int] = Field(default=None, primary_key=True)
#     comments : list["Comment"] = Relationship(back_populates="article")

#     user_id : Optional[int] = Field(default=None, foreign_key="user.id")
#     user : Optional["User"] = Relationship(back_populates="articles")

# class Comment(SQLModel):
#     id : Optional[int] = Field(default=None, primary_key=True)
#     artice_id : Optional[int] = Field(default=None, foreign_key="Article.id")
#     article : Optional["Article"] = Relationship(back_populates="comments")

#     user_id : Optional[int] = Field(default=None, foreign_key="user.id")
#     user : Optional["User"] = Relationship(back_populates="comments")

# class Notification(SQLModel):
#     id : Optional[int] = Field(default=None, primary_key=True)
#     description : str

#     user_id : Optional[int] = Field(default=None, foreign_key="user.id")
#     user : Optional["User"] = Relationship(back_populates="notifications")

class AdminConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    admin_creation_code: str = Field(default="illusion")
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)
