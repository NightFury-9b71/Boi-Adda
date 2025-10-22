from pydantic import BaseModel, EmailStr, Field, field_serializer
from typing import Optional
from datetime import datetime, timezone
from enums import CopyStatus, BorrowStatus, DonationStatus, UserRole

# Custom datetime field that displays in Bangladesh time
class BangladeshDateTime(datetime):
    """Custom datetime that displays in Bangladesh timezone"""
    
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.no_info_plain_validator_function(cls.validate_datetime)
    
    @classmethod
    def validate_datetime(cls, v):
        if isinstance(v, datetime):
            return v
        elif isinstance(v, str):
            # Parse the string as UTC datetime
            dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        return v
    
    @field_serializer
    def serialize_datetime(self) -> str:
        # Convert to Bangladesh time for display
        from timezone_utils import utc_to_bangladesh
        bangladesh_time = utc_to_bangladesh(self)
        return bangladesh_time.isoformat()

# Image Upload Schemas
class ImageUploadResponse(BaseModel):
    public_id: str
    url: str
    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None
    bytes: Optional[int] = None

class BookImageUploadRequest(BaseModel):
    book_id: int
    title: str
    author: str
    isbn: Optional[str] = None

class UserImageUploadRequest(BaseModel):
    user_id: int
    name: str
    image_type: str  # "profile" or "cover"

# Authentication Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    password: str
    role: Optional[UserRole] = UserRole.member

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# User Schemas
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    password: str
    role: Optional[UserRole] = UserRole.member

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    bio: Optional[str]
    date_of_birth: Optional[str]
    profile_image: Optional[str]
    profile_public_id: Optional[str]  # Cloudinary public ID for profile image
    cover_image: Optional[str]
    cover_public_id: Optional[str]    # Cloudinary public ID for cover image
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    date_of_birth: Optional[str] = None
    profile_image: Optional[str] = None
    profile_public_id: Optional[str] = None  # Cloudinary public ID for profile image
    cover_image: Optional[str] = None
    cover_public_id: Optional[str] = None    # Cloudinary public ID for cover image
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

# Donor Info (used in book schemas)
class DonorInfo(BaseModel):
    id: int
    name: str

# Category Schemas
class CategoryCreate(BaseModel):
    name: str
    description: str

class CategoryOut(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime
    updated_at: datetime

# Book Schemas
class BookCreate(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    cover: str
    cover_public_id: Optional[str] = None  # Cloudinary public ID for book cover
    category_id: Optional[int] = None
    published_year: int
    pages: int

class BookOut(BaseModel):
    id: int
    title: str
    author: str
    isbn: Optional[str]
    cover: str
    cover_public_id: Optional[str]  # Cloudinary public ID for book cover
    category_id: Optional[int]
    published_year: int
    pages: int
    total_copies: int
    times_borrowed: int
    created_at: datetime
    updated_at: datetime

class BookWithDonorOut(BaseModel):
    id: int
    title: str
    author: str
    isbn: Optional[str]
    cover: str
    cover_public_id: Optional[str]  # Cloudinary public ID for book cover
    category_id: Optional[int]
    published_year: int
    pages: int
    total_copies: int
    times_borrowed: int
    created_at: datetime
    updated_at: datetime
    donors: list[DonorInfo] = []

# BookCopy Schemas
class BookCopyCreate(BaseModel):
    book_id: int
    donor_id: Optional[int] = None  # Optional for admin-added books

class BookCopyOut(BaseModel):
    id: int
    book_id: Optional[int]
    donor_id: Optional[int]
    status: CopyStatus
    due_date: Optional[datetime] = None
    return_date: Optional[datetime] = None
    times_borrowed: int
    created_at: datetime
    updated_at: datetime
    book: Optional[BookOut] = None  # Include book information
    donor: Optional[DonorInfo] = None  # Include donor information

# Borrow Schemas
class BorrowCreate(BaseModel):
    user_id: int
    book_copy_id: int

class BorrowOut(BaseModel):
    id: int
    status: BorrowStatus
    user_id: Optional[int]
    book_copy_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime] = None
    handed_over_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None
    book_copy: Optional[BookCopyOut] = None
    user: Optional[UserOut] = None

# Donation Schemas
class DonationCreate(BaseModel):
    user_id: int
    book_id: int  # For creating new book copy with donor

class DonationWithNewBookCreate(BaseModel):
    user_id: int
    # Book information for new book
    title: str
    author: str
    isbn: Optional[str] = None
    cover: str
    cover_public_id: Optional[str] = None  # Cloudinary public ID for book cover
    category_id: Optional[int] = None
    published_year: int
    pages: int

class DonationOut(BaseModel):
    id: int
    status: DonationStatus
    user_id: Optional[int]
    book_copy_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    book_copy: Optional[BookCopyOut] = None
    user: Optional[UserOut] = None

# Admin Creation Schemas
class AdminCreateRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    password: str
    admin_code: str

class AdminCodeChangeRequest(BaseModel):
    new_code: str

class AdminCodeResponse(BaseModel):
    message: str

