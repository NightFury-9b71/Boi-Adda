from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from starlette.responses import JSONResponse
import os
import json
from datetime import datetime, timezone
from database import create_tables
from routers import users, categories, books, book_copies, borrows, donations, database, admin, auth
from timezone_utils import add_timezone_to_naive_datetime, utc_now

class TimezoneAwareJSONResponse(JSONResponse):
    """Custom JSON response that ensures datetime objects have timezone info"""
    
    def render(self, content) -> bytes:
        # Convert any datetime objects to timezone-aware ISO strings
        def convert_datetime(obj):
            if isinstance(obj, dict):
                return {k: convert_datetime(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_datetime(item) for item in obj]
            elif isinstance(obj, datetime):
                if obj.tzinfo is None:
                    # Assume naive datetime from database is Bangladesh time (+6)
                    from timezone_utils import BANGLADESH_TZ
                    obj = obj.replace(tzinfo=BANGLADESH_TZ)
                return obj.isoformat()
            return obj
        
        converted_content = convert_datetime(content)
        return super().render(converted_content)

app = FastAPI(
    title="বই আড্ডা API", 
    description="API for Book Adda - A library management system for promoting knowledge sharing",
    version="1.0.0",
    default_response_class=TimezoneAwareJSONResponse
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

@app.get("/timezone")
async def get_timezone_info():
    """Get timezone information for Bangladesh and UTC"""
    from timezone_utils import get_timezone_info
    return get_timezone_info()


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
