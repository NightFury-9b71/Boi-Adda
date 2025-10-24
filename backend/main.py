import os
from dotenv import load_dotenv
from db import get_session, create_db_and_tables, drop_db_and_tables, SQLModel
from fastapi import FastAPI, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()
from router import (
    borrow_books, 
    donate_books, 
    issue_borrow, 
    issue_donate, 
    issue_direct,
    upload_books,
    issue_books,
    mock_data,
    book_images,
    books,
    book_copies,
    categories,
    admin,
    users,
    borrows,
    donations,
    database
)
from auth import router as auth_router


app = FastAPI()

origins = os.getenv("FRONTEND_URL", "http://localhost:5173,https://boi-adda.onrender.com").split(",")

# CORS configuration - Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Authentication routes
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# Database stats
app.include_router(database.router, prefix="/database", tags=["Database"])

# Books management
app.include_router(books.router, prefix="/books", tags=["Books"])
app.include_router(book_copies.router, prefix="/book-copies", tags=["Book Copies"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])

# User management
app.include_router(users.router, prefix="/users", tags=["Users"])

# Member workflows - Borrow and Donate
app.include_router(borrows.router, prefix="/borrows", tags=["Borrows"])
app.include_router(donations.router, prefix="/donations", tags=["Donations"])

# Admin routes
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

# Book images (covers)
app.include_router(book_images.router, prefix="/images", tags=["Book Images"])

# Legacy routes (for backward compatibility)
# Borrow workflow
app.include_router(borrow_books.router, prefix="/borrow", tags=["Legacy - Borrow Books"])

# Donation workflow
app.include_router(donate_books.router, prefix="/donate", tags=["Legacy - Donate Books"])

# Issue books - separated by workflow
app.include_router(issue_borrow.router, prefix="/issue-borrow", tags=["Issue from Borrow Request"])
app.include_router(issue_donate.router, prefix="/issue-donate", tags=["Issue from Donation"])
app.include_router(issue_direct.router, prefix="/issue-direct", tags=["Issue Direct"])

# Upload books directly
app.include_router(upload_books.router, prefix="/upload-books", tags=["Upload Books"])

# Legacy issue books route (for return, view issued books, etc.)
app.include_router(issue_books.router, prefix="/issue", tags=["Issue Books Management"])

# Mock data
app.include_router(mock_data.router, prefix="/mock", tags=["Mock Data"])


