# Library Management System

## Overview
This system supports two main workflows:
1. **Borrow Requests**: Members request to borrow books
2. **Donation Requests**: Members offer to donate books to the library

**✨ New Feature**: Supabase Authentication for secure user management!

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:
```env
SUPABASE_URL=https://tdtnxwyhttbchhxpsiqe.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
DATABASE_URL=sqlite:///./test.db
```

### 3. Set Up Database
```bash
# Create/update database tables
python -c "from db import create_db_and_tables; create_db_and_tables()"

# If you encounter column errors after model changes, run migrations
python migrate.py
```

### 4. Run the Application
```bash
uvicorn main:app --reload
```

### 4. Access the API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔐 Authentication

This application uses **Supabase** for authentication. See [AUTH_SETUP.md](./AUTH_SETUP.md) for detailed documentation.

### Quick Authentication Guide

#### Sign Up
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "role": "member"
  }'
```

#### Sign In
```bash
curl -X POST http://localhost:8000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### Use Protected Endpoints
```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### User Roles
- **GUEST**: Default role, limited access
- **MEMBER**: Can borrow books, donate books, view their requests
- **ADMIN**: Can approve/reject requests, issue books, manage library

## Models

### Request Types
- `BORROW`: Member wants to borrow a book
- `DONATION`: Member wants to donate a book

### Request Statuses
- `PENDING`: Waiting for admin review
- `APPROVED`: Admin approved (for borrow: book is reserved)
- `REJECTED`: Admin rejected the request
- `COLLECTED`: Member collected the book physically (borrow only)
- `COMPLETED`: Request fulfilled (donation added to library)

### Book Copy Statuses
- `AVAILABLE`: Can be borrowed
- `RESERVED`: Approved for borrow, waiting for member to collect
- `ISSUED`: Currently borrowed by a member
- `DAMAGED`: Book is damaged
- `LOST`: Book is lost

## Borrow Workflow

### Step 1: Member Creates Request
```python
request = create_borrow_request(session, member_id, book_id)
```
- Status: `PENDING`
- Member selects which book they want to borrow

### Step 2: Admin Reviews and Approves
```python
# To approve
approved = approve_borrow_request(session, request_id, admin_id)

# To reject
rejected = reject_request(session, request_id, admin_id)
```
- Admin views pending requests
- If approved:
  - Status: `APPROVED`
  - System finds an available copy and reserves it
  - Copy status: `AVAILABLE` → `RESERVED`
- If rejected:
  - Status: `REJECTED`
  - No further action needed

### Step 3: Member Collects Book Physically
```python
issue_record = mark_collected_and_issue_book(session, request_id, admin_id)
```
- Admin confirms physical collection
- Creates `IssueBook` record
- Automatically sets due date to **14 days** from issue date
- Request status: `APPROVED` → `COLLECTED`
- Copy status: `RESERVED` → `ISSUED`

### Step 4: Member Returns Book
```python
returned = return_book(session, issue_book_id)
```
- Sets return date
- Copy status: `ISSUED` → `AVAILABLE`
- Can check if book was overdue: `issue_record.is_overdue`

## Donation Workflow

### Step 1: Member Creates Donation Request
```python
request = create_donation_request(
    session,
    member_id=member_id,
    title="Book Title",
    author="Author Name",
    year=2024,
    pages=300
)
```
- Status: `PENDING`
- Member provides book details they want to donate

### Step 2: Admin Approves and Adds to Library
```python
# To approve
book = approve_donation_request(session, request_id, admin_id, num_copies=3)

# To reject
rejected = reject_request(session, request_id, admin_id)
```
- If approved:
  - Creates new `Book` record
  - Creates specified number of `BookCopy` records
  - Request status: `PENDING` → `COMPLETED`
  - All copies status: `AVAILABLE`
- If rejected:
  - Status: `REJECTED`

## Key Features

### Automatic Due Date Calculation
- Books are automatically issued for **14 days**
- Due date = Issue date + 14 days
- No need to manually calculate

### Overdue Detection
```python
if issue_record.is_overdue:
    print("Book is overdue!")
```
- Automatically checks if current date > due date
- Only for books not yet returned

### Available Copies Count
```python
# Get available copies for a book
available = session.exec(
    select(BookCopy).where(
        BookCopy.book_id == book_id,
        BookCopy.status == bookStatus.AVAILABLE
    )
).all()
count = len(available)
```

### Pending Requests for Admin
```python
pending_requests = get_pending_requests(session)
for req in pending_requests:
    print(f"Request #{req.id}: {req.request_type}")
```

### Member Request History
```python
member_requests = get_member_requests(session, member_id)
for req in member_requests:
    print(f"{req.request_type}: {req.status}")
```

## Data Integrity

### Relationships Tracked
- Each `IssueBook` links back to its `BookRequest`
- Each `BookRequest` (borrow) links to reserved `BookCopy`
- Each request tracks which `Admin` reviewed it
- Full audit trail of all actions

### Validation
- Can't approve request without available copies
- Can't issue book that wasn't approved first
- Can't return book that wasn't issued
- Can't modify requests that aren't pending

## Example Usage

See `example_usage.py` for a complete working example of:
- Creating borrow requests
- Admin approval and reservation
- Book collection and issuance
- Book return
- Donation workflow
- Request rejection

## Running the Example

```bash
python example_usage.py
```

This will demonstrate the complete workflow with sample data.
