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

# Conditionally mount static files if the directory exists
backend_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(backend_dir, '..', 'dist')
static_dir = os.path.join(build_dir, 'static')

if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    print(f"✓ Static files mounted from: {static_dir}")
else:
    print(f"⚠ Static files directory not found: {static_dir}")
    print("This is normal during API-only deployment or development.")

# Configure CORS - Allow frontend URL from environment
origins = [
    'https://boi-adda.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
]

# Add any additional origins from environment
additional_origins = os.environ.get("ADDITIONAL_ORIGINS", "").split(",")
for origin in additional_origins:
    if origin.strip():
        origins.append(origin.strip())

print(f"🌐 CORS origins: {origins}")

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

# Static files info endpoint
@app.get("/static-info")
async def static_info():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(backend_dir, '..', 'dist')
    static_dir = os.path.join(build_dir, 'static')
    
    return {
        "static_dir": static_dir,
        "exists": os.path.exists(static_dir),
        "backend_dir": backend_dir,
        "build_dir": build_dir,
        "files": os.listdir(static_dir) if os.path.exists(static_dir) else []
    }

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

# Startup event
@app.on_event("startup")
async def startup_event():
    print("🎉 বই আড্ডা API started successfully!")
    print(f"📚 Available at: http://0.0.0.0:{os.environ.get('PORT', 8000)}")
    print("📋 Available routes:")
    print("  - GET  /          (Root)")
    print("  - GET  /health    (Health check)")
    print("  - GET  /docs      (API documentation)")
    print("  - POST /auth/...  (Authentication)")
    print("  - GET  /admin/... (Admin routes)")
    
@app.on_event("shutdown")
async def shutdown_event():
    print("👋 বই আড্ডা API shutting down...")

# 404 handler for API routes
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    # Check if this is an API request
    if request.url.path.startswith('/api') or request.url.path.startswith('/admin') or request.url.path.startswith('/auth'):
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
    else:
        # For non-API routes, return a simple 404
        return JSONResponse(
            status_code=404,
            content={"message": "Page not found", "status_code": 404}
        )

# Add a catch-all route for debugging
@app.get("/debug/routes")
async def debug_routes():
    """Debug endpoint to see all available routes"""
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            routes.append({
                "path": route.path,
                "methods": list(route.methods) if hasattr(route, 'methods') else ['GET']
            })
    return {"total_routes": len(routes), "routes": routes}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    environment = os.environ.get("ENVIRONMENT", "development")
    
    print(f"🚀 Starting server on {host}:{port}")
    print(f"📍 Environment: {environment}")
    print(f"🔧 Reload: {environment == 'development'}")
    
    uvicorn.run(
        "backend.main:app" if environment == "production" else "main:app",
        host=host,
        port=port,
        reload=environment == "development",
        log_level="info"
    )