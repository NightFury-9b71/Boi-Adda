import os
from typing import BinaryIO, Optional
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try to initialize Supabase client if credentials are available
supabase = None
SUPABASE_ENABLED = False

try:
    from supabase import create_client, Client
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    
    if SUPABASE_URL and SUPABASE_KEY:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        SUPABASE_ENABLED = True
        print("✅ Supabase Storage initialized successfully")
    else:
        print("⚠️  Supabase credentials not found. Storage features will be disabled.")
except ImportError:
    print("⚠️  Supabase package not installed. Storage features will be disabled.")
except Exception as e:
    print(f"⚠️  Failed to initialize Supabase: {e}. Storage features will be disabled.")

# Storage buckets
BOOK_COVERS_BUCKET = "book-covers"
USER_PROFILES_BUCKET = "profile-pictures"
DONATION_COVERS_BUCKET = "donation-covers"

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

def validate_image_file(filename: str) -> bool:
    """Validate that the uploaded file is an image"""
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_IMAGE_EXTENSIONS

async def upload_book_cover(file: UploadFile, book_id: int) -> str:
    """
    Upload a book cover image to Supabase Storage
    Returns the public URL of the uploaded image
    """
    if not SUPABASE_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="স্টোরেজ সেবা উপলব্ধ নেই। দয়া করে পরে চেষ্টা করুন।"
        )
    
    if not validate_image_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail="ভুল ফাইল টাইপ। শুধুমাত্র ছবি আপলোড করুন (JPG, PNG, GIF)।"
        )
    
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    file_path = f"book_{book_id}{ext}"
    
    try:
        # Read file content
        content = await file.read()
        
        # Upload to Supabase Storage
        response = supabase.storage.from_(BOOK_COVERS_BUCKET).upload(
            path=file_path,
            file=content,
            file_options={"content-type": file.content_type, "upsert": "true"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(BOOK_COVERS_BUCKET).get_public_url(file_path)
        
        return public_url
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="বইয়ের কভার আপলোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।")
    finally:
        # Reset file pointer
        await file.seek(0)

async def upload_donation_cover(file: UploadFile, donation_id: int) -> str:
    """
    Upload a donation cover image to Supabase Storage
    Returns the public URL of the uploaded image
    """
    if not SUPABASE_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="স্টোরেজ সেবা উপলব্ধ নেই। দয়া করে পরে চেষ্টা করুন।"
        )
    
    if not validate_image_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail="ভুল ফাইল টাইপ। শুধুমাত্র ছবি আপলোড করুন (JPG, PNG, GIF)।"
        )
    
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    file_path = f"donation_{donation_id}{ext}"
    
    try:
        # Read file content
        content = await file.read()
        
        # Upload to Supabase Storage
        response = supabase.storage.from_(DONATION_COVERS_BUCKET).upload(
            path=file_path,
            file=content,
            file_options={"content-type": file.content_type, "upsert": "true"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(DONATION_COVERS_BUCKET).get_public_url(file_path)
        
        return public_url
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="দানের কভার আপলোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।")
    finally:
        # Reset file pointer
        await file.seek(0)


async def upload_profile_photo(file: UploadFile, user_id: int, user_type: str) -> str:
    """
    Upload a user profile photo to Supabase Storage
    user_type should be either 'admin' or 'member'
    Returns the public URL of the uploaded image
    """
    if not SUPABASE_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="স্টোরেজ সেবা উপলব্ধ নেই। দয়া করে পরে চেষ্টা করুন।"
        )
    
    if not validate_image_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail="ভুল ফাইল টাইপ। শুধুমাত্র ছবি আপলোড করুন (JPG, PNG, GIF)।"
        )
    
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    file_path = f"{user_type}_{user_id}{ext}"
    
    try:
        # Read file content
        content = await file.read()
        
        # Upload to Supabase Storage
        response = supabase.storage.from_(USER_PROFILES_BUCKET).upload(
            path=file_path,
            file=content,
            file_options={"content-type": file.content_type, "upsert": "true"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(USER_PROFILES_BUCKET).get_public_url(file_path)
        
        return public_url
    
    except Exception as e:
        raise HTTPException(status_code=500, detail="প্রোফাইল ছবি আপলোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।")
    finally:
        # Reset file pointer
        await file.seek(0)


def delete_book_cover(book_id: int):
    """Delete a book cover from Supabase Storage"""
    if not SUPABASE_ENABLED:
        return True  # Silently succeed if storage is not enabled
    
    try:
        # Try to delete all possible extensions
        for ext in ALLOWED_IMAGE_EXTENSIONS:
            file_path = f"book_{book_id}{ext}"
            try:
                supabase.storage.from_(BOOK_COVERS_BUCKET).remove([file_path])
            except:
                pass  # File might not exist with this extension
        return True
    except Exception as e:
        raise HTTPException(status_code=500, detail="বইয়ের কভার মুছতে সমস্যা হয়েছে।")

def delete_profile_photo(user_id: int, user_type: str):
    """Delete a user profile photo from Supabase Storage"""
    if not SUPABASE_ENABLED:
        return True  # Silently succeed if storage is not enabled
    
    try:
        # Try to delete all possible extensions
        for ext in ALLOWED_IMAGE_EXTENSIONS:
            file_path = f"{user_type}_{user_id}{ext}"
            try:
                supabase.storage.from_(USER_PROFILES_BUCKET).remove([file_path])
            except:
                pass  # File might not exist with this extension
        return True
    except Exception as e:
        raise HTTPException(status_code=500, detail="প্রোফাইল ছবি মুছতে সমস্যা হয়েছে।")

def get_public_url(bucket: str, file_path: str) -> str:
    """Get the public URL of a file in Supabase Storage"""
    if not SUPABASE_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="স্টোরেজ সেবা উপলব্ধ নেই। দয়া করে পরে চেষ্টা করুন।"
        )
    
    try:
        return supabase.storage.from_(bucket).get_public_url(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail="ফাইল লিঙ্ক পেতে সমস্যা হয়েছে।")
