import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from starlette.responses import JSONResponse
from database import create_tables
from routers import users, categories, books, book_copies, borrows, donations, database, admin, auth
from timezone_utils import add_timezone_to_naive_datetime, utc_now

# Custom JSON encoder that converts datetime objects to Bangladesh time
class BangladeshTimeJSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        def convert_datetimes(obj):
            if isinstance(obj, dict):
                return {k: convert_datetimes(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_datetimes(item) for item in obj]
            elif isinstance(obj, str):
                # Check if it's a datetime string
                if 'T' in obj and ('+' in obj or obj.endswith('Z')):
                    try:
                        # Parse as datetime
                        dt = datetime.fromisoformat(obj.replace('Z', '+00:00'))
                        # Convert to Bangladesh time
                        from timezone_utils import utc_to_bangladesh
                        bangladesh_time = utc_to_bangladesh(dt)
                        return bangladesh_time.isoformat()
                    except:
                        pass
            elif isinstance(obj, datetime):
                if obj.tzinfo is None:
                    obj = obj.replace(tzinfo=timezone.utc)
                from timezone_utils import utc_to_bangladesh
                bangladesh_time = utc_to_bangladesh(obj)
                return bangladesh_time.isoformat()
            return obj
        
        converted_content = convert_datetimes(content)
        return json.dumps(
            converted_content,
            ensure_ascii=False,
            separators=(",", ":"),
            default=str
        ).encode("utf-8")

app = FastAPI(
    title="বই আড্ডা API", 
    description="API for Book Adda - A library management system for promoting knowledge sharing",
    version="1.0.0",
    default_response_class=BangladeshTimeJSONResponse
)

# Get environment variables directly from Render
frontend_url = os.getenv('FRONTEND_URL')

origins = [
    frontend_url,
    'http://localhost:5173',
    'http://localhost:5174',
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
