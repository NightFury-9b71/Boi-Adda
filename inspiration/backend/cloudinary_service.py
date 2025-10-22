"""
Cloudinary service for handling image uploads, downloads, and management.
Provides proper file naming with ID and name conventions.
"""

import os
import re
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from cloudinary.exceptions import Error as CloudinaryError
from typing import Optional, Dict, Any, Union
from urllib.parse import unquote
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CloudinaryService:
    """Service class for Cloudinary operations with proper naming conventions."""
    
    def __init__(self):
        """Initialize Cloudinary configuration from environment variables."""
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True
        )
        
        # Verify configuration
        if not all([
            os.getenv("CLOUDINARY_CLOUD_NAME"),
            os.getenv("CLOUDINARY_API_KEY"),
            os.getenv("CLOUDINARY_API_SECRET")
        ]):
            raise ValueError("Missing Cloudinary configuration. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.")
    
    def _sanitize_filename(self, text: str) -> str:
        """Sanitize text for use in filenames."""
        # Remove special characters and replace spaces with underscores
        sanitized = re.sub(r'[^\w\s-]', '', text)
        sanitized = re.sub(r'[-\s]+', '_', sanitized)
        return sanitized.lower().strip('_')
    
    def _generate_book_public_id(self, book_id: int, title: str, author: str) -> str:
        """Generate a public ID for book covers with proper naming convention."""
        sanitized_title = self._sanitize_filename(title)[:30]  # Limit length
        sanitized_author = self._sanitize_filename(author)[:20]  # Limit length
        return f"book_covers/book_{book_id}_{sanitized_title}_{sanitized_author}"
    
    def _generate_user_public_id(self, user_id: int, name: str, image_type: str = "profile") -> str:
        """Generate a public ID for user images with proper naming convention."""
        sanitized_name = self._sanitize_filename(name)[:25]  # Limit length
        return f"user_images/{image_type}_{user_id}_{sanitized_name}"
    
    async def upload_book_cover(
        self, 
        file: Union[str, bytes], 
        book_id: int, 
        title: str, 
        author: str,
        replace_existing: bool = True
    ) -> Dict[str, Any]:
        """
        Upload a book cover image to Cloudinary.
        
        Args:
            file: File path, file object, or bytes
            book_id: ID of the book
            title: Title of the book
            author: Author of the book
            replace_existing: Whether to replace existing image
            
        Returns:
            Dict containing upload result with public_id, url, etc.
        """
        try:
            public_id = self._generate_book_public_id(book_id, title, author)
            
            upload_options = {
                "public_id": public_id,
                "folder": "book_covers",
                "transformation": [
                    {"width": 800, "height": 1200, "crop": "limit"},
                    {"quality": "auto"},
                    {"format": "auto"}
                ],
                "overwrite": replace_existing,
                "resource_type": "image"
            }
            
            result = cloudinary.uploader.upload(file, **upload_options)
            
            logger.info(f"Successfully uploaded book cover for book ID {book_id}: {result['public_id']}")
            return {
                "public_id": result["public_id"],
                "url": result["secure_url"],
                "width": result.get("width"),
                "height": result.get("height"),
                "format": result.get("format"),
                "bytes": result.get("bytes")
            }
            
        except CloudinaryError as e:
            logger.error(f"Cloudinary error uploading book cover for book ID {book_id}: {str(e)}")
            raise Exception(f"Failed to upload book cover: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error uploading book cover for book ID {book_id}: {str(e)}")
            raise Exception(f"Failed to upload book cover: {str(e)}")
    
    async def upload_user_image(
        self, 
        file: Union[str, bytes], 
        user_id: int, 
        name: str,
        image_type: str = "profile",
        replace_existing: bool = True
    ) -> Dict[str, Any]:
        """
        Upload a user image (profile or cover) to Cloudinary.
        
        Args:
            file: File path, file object, or bytes
            user_id: ID of the user
            name: Name of the user
            image_type: Type of image ("profile" or "cover")
            replace_existing: Whether to replace existing image
            
        Returns:
            Dict containing upload result with public_id, url, etc.
        """
        try:
            if image_type not in ["profile", "cover"]:
                raise ValueError("image_type must be 'profile' or 'cover'")
            
            public_id = self._generate_user_public_id(user_id, name, image_type)
            
            # Different transformations for profile vs cover images
            if image_type == "profile":
                transformation = [
                    {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
                    {"quality": "auto"},
                    {"format": "auto"}
                ]
            else:  # cover image
                transformation = [
                    {"width": 1200, "height": 600, "crop": "fill"},
                    {"quality": "auto"},
                    {"format": "auto"}
                ]
            
            upload_options = {
                "public_id": public_id,
                "folder": "user_images",
                "transformation": transformation,
                "overwrite": replace_existing,
                "resource_type": "image"
            }
            
            result = cloudinary.uploader.upload(file, **upload_options)
            
            logger.info(f"Successfully uploaded {image_type} image for user ID {user_id}: {result['public_id']}")
            return {
                "public_id": result["public_id"],
                "url": result["secure_url"],
                "width": result.get("width"),
                "height": result.get("height"),
                "format": result.get("format"),
                "bytes": result.get("bytes")
            }
            
        except CloudinaryError as e:
            logger.error(f"Cloudinary error uploading {image_type} image for user ID {user_id}: {str(e)}")
            raise Exception(f"Failed to upload {image_type} image: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error uploading {image_type} image for user ID {user_id}: {str(e)}")
            raise Exception(f"Failed to upload {image_type} image: {str(e)}")
    
    def get_optimized_url(
        self, 
        public_id: str, 
        width: Optional[int] = None, 
        height: Optional[int] = None,
        crop: str = "fill",
        quality: str = "auto",
        format: str = "auto"
    ) -> str:
        """
        Get an optimized URL for an image stored in Cloudinary.
        
        Args:
            public_id: The Cloudinary public ID
            width: Desired width
            height: Desired height
            crop: Crop mode
            quality: Quality setting
            format: Image format
            
        Returns:
            Optimized image URL
        """
        try:
            transformation = {"quality": quality, "format": format}
            
            if width and height:
                transformation.update({"width": width, "height": height, "crop": crop})
            elif width:
                transformation.update({"width": width})
            elif height:
                transformation.update({"height": height})
            
            url = cloudinary.utils.cloudinary_url(public_id, **transformation)[0]
            return url
            
        except Exception as e:
            logger.error(f"Error generating optimized URL for {public_id}: {str(e)}")
            return ""
    
    async def delete_image(self, public_id: str) -> bool:
        """
        Delete an image from Cloudinary.
        
        Args:
            public_id: The Cloudinary public ID
            
        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            result = cloudinary.uploader.destroy(public_id)
            success = result.get("result") == "ok"
            
            if success:
                logger.info(f"Successfully deleted image: {public_id}")
            else:
                logger.warning(f"Failed to delete image: {public_id}, result: {result}")
            
            return success
            
        except CloudinaryError as e:
            logger.error(f"Cloudinary error deleting image {public_id}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting image {public_id}: {str(e)}")
            return False
    
    def get_image_info(self, public_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about an image stored in Cloudinary.
        
        Args:
            public_id: The Cloudinary public ID
            
        Returns:
            Dict containing image information or None if not found
        """
        try:
            result = cloudinary.api.resource(public_id)
            return {
                "public_id": result["public_id"],
                "url": result["secure_url"],
                "width": result.get("width"),
                "height": result.get("height"),
                "format": result.get("format"),
                "bytes": result.get("bytes"),
                "created_at": result.get("created_at")
            }
            
        except CloudinaryError as e:
            logger.error(f"Cloudinary error getting image info for {public_id}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting image info for {public_id}: {str(e)}")
            return None

# Create a singleton instance
cloudinary_service = CloudinaryService()

# Convenience functions for easy import
async def upload_book_cover(file, book_id: int, title: str, author: str, replace_existing: bool = True):
    """Upload a book cover image."""
    return await cloudinary_service.upload_book_cover(file, book_id, title, author, replace_existing)

async def upload_user_profile(file, user_id: int, name: str, replace_existing: bool = True):
    """Upload a user profile image."""
    return await cloudinary_service.upload_user_image(file, user_id, name, "profile", replace_existing)

async def upload_user_cover(file, user_id: int, name: str, replace_existing: bool = True):
    """Upload a user cover image."""
    return await cloudinary_service.upload_user_image(file, user_id, name, "cover", replace_existing)

def get_optimized_url(public_id: str, width: Optional[int] = None, height: Optional[int] = None, **kwargs):
    """Get an optimized URL for an image."""
    return cloudinary_service.get_optimized_url(public_id, width, height, **kwargs)

async def delete_image(public_id: str):
    """Delete an image from Cloudinary."""
    return await cloudinary_service.delete_image(public_id)