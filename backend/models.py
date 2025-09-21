from sqlmodel import Field, Relationship, SQLModel
from typing import Optional
from datetime import datetime
from enums import CopyStatus, BorrowStatus, DonationStatus, UserRole

def get_current_time():
    return datetime.now()

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
    created_at : datetime = Field(default_factory=get_current_time)
    updated_at : datetime = Field(default_factory=get_current_time)

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
    created_at : datetime = Field(default_factory=get_current_time)
    updated_at : datetime = Field(default_factory=get_current_time)

    books : list["Book"] = Relationship(back_populates="category")

class Book(SQLModel, table = True):
    id : Optional[int] = Field(default=None, primary_key=True)
    title : str
    author : str 
    cover : str
    cover_public_id : Optional[str] = None  # Cloudinary public ID for book cover
    category_id : Optional[int] = Field(default=None, foreign_key="category.id")
    published_year : int
    pages : int
    total_copies : int = Field(default=0)  # Total number of copies
    times_borrowed : int = Field(default=0)  # Total times borrowed across all copies
    created_at : datetime = Field(default_factory=get_current_time)
    updated_at : datetime = Field(default_factory=get_current_time)
    
    category : Optional["Category"] = Relationship(back_populates="books")
    book_copies : list["BookCopy"] = Relationship(back_populates="book")

class BookCopy(SQLModel, table = True):
    id : Optional[int] = Field(default=None, primary_key=True)
    book_id : Optional[int] = Field(default=None, foreign_key="book.id")
    donor_id : Optional[int] = Field(default=None, foreign_key="user.id")  # Direct reference to donor
    status : CopyStatus = CopyStatus.available
    due_date : Optional[datetime] = None
    return_date : Optional[datetime] = None
    times_borrowed : int = Field(default=0)  # Times this specific copy was borrowed
    created_at : datetime = Field(default_factory=get_current_time)
    updated_at : datetime = Field(default_factory=get_current_time)
    
    book : Optional["Book"] = Relationship(back_populates="book_copies")
    donor : Optional["User"] = Relationship(back_populates="donated_copies")
    borrows : list["Borrow"] = Relationship(back_populates="book_copy")
    donations : list["Donation"] = Relationship(back_populates="book_copy")



class Borrow(SQLModel, table = True):
    id : Optional[int] = Field(default=None, primary_key=True)
    status : BorrowStatus
    created_at : datetime = Field(default_factory=get_current_time)
    updated_at : datetime = Field(default_factory=get_current_time)
    approved_at : Optional[datetime] = None  # When admin approved the request
    handed_over_at : Optional[datetime] = None  # When book was physically handed over
    returned_at : Optional[datetime] = None  # When book was returned by user
    
    user_id : Optional[int] = Field(default=None, foreign_key="user.id")
    book_copy_id: Optional[int] = Field(default=None, foreign_key="bookcopy.id")

    user : Optional["User"] = Relationship(back_populates="borrows")
    book_copy : Optional["BookCopy"] = Relationship(back_populates="borrows")

class Donation(SQLModel, table = True):
    id : Optional[int] = Field(default=None, primary_key=True)
    status : DonationStatus
    created_at : datetime = Field(default_factory=get_current_time)
    updated_at : datetime = Field(default_factory=get_current_time)
    approved_at : Optional[datetime] = None  # When admin approved the donation
    completed_at : Optional[datetime] = None  # When donation was completed

    user_id : Optional[int] = Field(default=None, foreign_key="user.id")
    book_copy_id: Optional[int] = Field(default=None, foreign_key="bookcopy.id")
    
    user : Optional["User"] = Relationship(back_populates="donates")
    book_copy : Optional["BookCopy"] = Relationship(back_populates="donations")


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
