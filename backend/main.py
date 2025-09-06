from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import create_tables
from . import db_events  # Import to register the event handlers

# Import routers
from .routers import users, categories, books, book_copies, borrows, donations, database, admin, auth

app = FastAPI(
    title="বই আড্ডা API",
    description="API for Book Adda - A library management system for promoting knowledge sharing",
    version="1.0.0",
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "*",
    # Add your production domain here when deploying
    # "https://yourdomain.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)



# Create database tables
create_tables()

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(books.router)
app.include_router(book_copies.router)
app.include_router(borrows.router)
app.include_router(donations.router)
app.include_router(database.router)
app.include_router(admin.router)
