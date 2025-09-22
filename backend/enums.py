from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    librarian = "librarian"
    member = "member"

# --- Basic Enums ---
class CopyStatus(str, Enum):
    available = "available"
    reserved = "reserved"         # Reserved for approved borrow request
    borrowed = "borrowed"         # Actually borrowed (physically handed over)
    damaged = "damaged"
    pending_donation = "pending_donation"  # Donated but awaiting admin approval

class BorrowStatus(str, Enum):
    pending = "pending"           # User requested, waiting for admin approval
    approved = "approved"         # Admin approved, copy status becomes 'reserved'
    active = "active"             # Book physically handed over, actively borrowed
    returned = "returned"         # Book returned
    rejected = "rejected"         # Admin rejected the borrow request

class DonationStatus(str, Enum):
    pending = "pending"           # User submitted, waiting for admin approval
    approved = "approved"         # Admin approved, in temporary inventory
    completed = "completed"       # Physical book received, added to library
    rejected = "rejected"         # Admin rejected the donation
