from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .database import create_tables
import uvicorn
import os
from fastapi.staticfiles import StaticFiles

# Import routers
from .routers import users, categories, books, book_copies, borrows, donations, database, admin, auth

app = FastAPI(
    title="বই আড্ডা API",
    description="API for Book Adda - A library management system for promoting knowledge sharing",
    version="1.0.0",
)
backend_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(backend_dir, '..', 'dist')
app.mount("/static", StaticFiles(directory=os.path.join(build_dir, 'static')), name="static")

# Configure CORS - Allow frontend URL from environment
origins = ['https://boi-adda.onrender.com',
           'http://localhost:5173',
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

# 404 handler for API routes
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={
            "message": "এন্ডপয়েন্ট পাওয়া যায়নি",
            "detail": f"The requested API endpoint '{request.url.path}' was not found.",
            "path": str(request.url.path),
            "method": request.method,
            "status_code": 404
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)