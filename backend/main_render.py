from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import create_tables
import uvicorn
import os
from fastapi.staticfiles import StaticFiles

# Import routers
from routers import users, categories, books, book_copies, borrows, donations, database, admin, auth

app = FastAPI(
    title="বই আড্ডা API",
    description="API for Book Adda - A library management system for promoting knowledge sharing",
    version="1.0.0",
)

# Conditionally mount static files if the directory exists
backend_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(backend_dir, '..', 'dist')
static_dir = os.path.join(build_dir, 'static')

if os.path.exists(build_dir):
    print(f"Mounting static files from: {build_dir}")
    app.mount("/static", StaticFiles(directory=build_dir), name="static")
else:
    print(f"Build directory not found: {build_dir}")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev server
        "https://boi-adda.netlify.app",  # Production frontend
        "https://boi-adda-frontend.onrender.com",  # Alternative production URL
        "https://boi-adda.onrender.com",  # Main production frontend
        "https://boi-adda-57qj.onrender.com",  # Possible Render auto-generated URL
        "https://boi-adda-0r8m.onrender.com",  # Another possible Render URL pattern
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(categories.router, prefix="/categories", tags=["categories"])
app.include_router(books.router, prefix="/books", tags=["books"])
app.include_router(book_copies.router, prefix="/book-copies", tags=["book-copies"])
app.include_router(borrows.router, prefix="/borrows", tags=["borrows"])
app.include_router(donations.router, prefix="/donations", tags=["donations"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(database.router, prefix="/database", tags=["database"])

@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    create_tables()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "বই আড্ডা API is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "message": "বই আড্ডা API is operational",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
