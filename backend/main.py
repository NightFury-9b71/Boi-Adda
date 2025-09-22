from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from database import create_tables
from routers import users, categories, books, book_copies, borrows, donations, database, admin, auth

app = FastAPI(
    title="বই আড্ডা API",
    description="API for Book Adda - A library management system for promoting knowledge sharing",
    version="1.0.0",
)

# Get environment variables directly from Render
frontend_url = os.getenv('FRONTEND_URL')

origins = [
    frontend_url,
    'http://localhost:5173',
    'http://localhost:3000',
]

# Filter out None values in case FRONTEND_URL isn't set
origins = [url for url in origins if url is not None]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)



# Create database tables
try:
    create_tables()
    print("✓ Database tables created successfully")
except Exception as e:
    print(f"⚠ Warning: Database table creation failed: {e}")
    print("This might be normal if tables already exist.")

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "বই আড্ডা API is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "বই আড্ডা API"}


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
