"""
Migration script to upload existing images from public folder to Cloudinary
with proper naming conventions (ID + name).

This script:
1. Reads all books and users from the database
2. Uploads their existing images to Cloudinary with proper naming
3. Updates the database with Cloudinary public IDs
4. Maintains backward compatibility with existing image paths

Usage:
    conda activate boiAdda
    python migrate_images_to_cloudinary.py
"""

import os
import asyncio
import logging
from pathlib import Path
from sqlmodel import Session, select
from database import engine
from models import Book, User
from cloudinary_service import upload_book_cover, upload_user_profile, upload_user_cover
import cloudinary
from timezone_utils import utc_now

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('cloudinary_migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CloudinaryMigration:
    def __init__(self, frontend_public_path="../frontend/public"):
        self.frontend_public_path = Path(frontend_public_path)
        self.book_covers_path = self.frontend_public_path / "book-covers"
        self.user_covers_path = self.frontend_public_path / "user-covers"
        
        # Stats
        self.stats = {
            "books_processed": 0,
            "books_uploaded": 0,
            "books_failed": 0,
            "users_processed": 0,
            "users_profile_uploaded": 0,
            "users_cover_uploaded": 0,
            "users_failed": 0,
            "total_uploads": 0,
            "total_failures": 0
        }
    
    def validate_cloudinary_config(self):
        """Validate that Cloudinary is properly configured"""
        try:
            # Test Cloudinary connection
            info = cloudinary.api.ping()
            logger.info("✅ Cloudinary connection successful")
            return True
        except Exception as e:
            logger.error(f"❌ Cloudinary configuration error: {e}")
            logger.error("Please check your CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET")
            return False
    
    def image_exists(self, image_path):
        """Check if an image file exists"""
        return image_path and Path(image_path).exists()
    
    async def migrate_book_covers(self):
        """Migrate book cover images to Cloudinary"""
        logger.info("🔄 Starting book cover migration...")
        
        with Session(engine) as session:
            # Get all books
            statement = select(Book)
            books = session.exec(statement).all()
            
            logger.info(f"Found {len(books)} books to process")
            
            for book in books:
                self.stats["books_processed"] += 1
                
                try:
                    # Skip if already has Cloudinary public ID
                    if book.cover_public_id:
                        logger.info(f"Book {book.id} already has Cloudinary image, skipping")
                        continue
                    
                    # Check if book has a cover image
                    if not book.cover:
                        logger.info(f"Book {book.id} has no cover image, skipping")
                        continue
                    
                    # Construct image path
                    image_path = self.book_covers_path / book.cover
                    
                    if not self.image_exists(image_path):
                        logger.warning(f"Book {book.id}: Image not found at {image_path}")
                        continue
                    
                    logger.info(f"Uploading cover for book {book.id}: {book.title}")
                    
                    # Upload to Cloudinary
                    with open(image_path, 'rb') as image_file:
                        upload_result = await upload_book_cover(
                            image_file.read(),
                            book.id,
                            book.title,
                            book.author,
                            replace_existing=True
                        )
                    
                    # Update book with Cloudinary public ID
                    book.cover_public_id = upload_result["public_id"]
                    book.cover = upload_result["url"]  # Update URL to Cloudinary URL
                    
                    session.add(book)
                    session.commit()
                    
                    self.stats["books_uploaded"] += 1
                    self.stats["total_uploads"] += 1
                    
                    logger.info(f"✅ Book {book.id} cover uploaded successfully: {upload_result['public_id']}")
                    
                except Exception as e:
                    self.stats["books_failed"] += 1
                    self.stats["total_failures"] += 1
                    logger.error(f"❌ Failed to upload cover for book {book.id}: {e}")
                    session.rollback()
    
    async def migrate_user_images(self):
        """Migrate user profile and cover images to Cloudinary"""
        logger.info("🔄 Starting user images migration...")
        
        with Session(engine) as session:
            # Get all users
            statement = select(User)
            users = session.exec(statement).all()
            
            logger.info(f"Found {len(users)} users to process")
            
            for user in users:
                self.stats["users_processed"] += 1
                
                try:
                    user_updated = False
                    
                    # Migrate profile image
                    if user.profile_image and not user.profile_public_id:
                        profile_path = self.user_covers_path / user.profile_image.lstrip('/')
                        
                        if self.image_exists(profile_path):
                            logger.info(f"Uploading profile image for user {user.id}: {user.name}")
                            
                            with open(profile_path, 'rb') as image_file:
                                upload_result = await upload_user_profile(
                                    image_file.read(),
                                    user.id,
                                    user.name,
                                    replace_existing=True
                                )
                            
                            user.profile_public_id = upload_result["public_id"]
                            user.profile_image = upload_result["url"]
                            user_updated = True
                            self.stats["users_profile_uploaded"] += 1
                            self.stats["total_uploads"] += 1
                            
                            logger.info(f"✅ User {user.id} profile image uploaded: {upload_result['public_id']}")
                        else:
                            logger.warning(f"User {user.id}: Profile image not found at {profile_path}")
                    
                    # Migrate cover image
                    if user.cover_image and not user.cover_public_id:
                        cover_path = self.user_covers_path / user.cover_image.lstrip('/')
                        
                        if self.image_exists(cover_path):
                            logger.info(f"Uploading cover image for user {user.id}: {user.name}")
                            
                            with open(cover_path, 'rb') as image_file:
                                upload_result = await upload_user_cover(
                                    image_file.read(),
                                    user.id,
                                    user.name,
                                    replace_existing=True
                                )
                            
                            user.cover_public_id = upload_result["public_id"]
                            user.cover_image = upload_result["url"]
                            user_updated = True
                            self.stats["users_cover_uploaded"] += 1
                            self.stats["total_uploads"] += 1
                            
                            logger.info(f"✅ User {user.id} cover image uploaded: {upload_result['public_id']}")
                        else:
                            logger.warning(f"User {user.id}: Cover image not found at {cover_path}")
                    
                    # Update user if any images were uploaded
                    if user_updated:
                        session.add(user)
                        session.commit()
                
                except Exception as e:
                    self.stats["users_failed"] += 1
                    self.stats["total_failures"] += 1
                    logger.error(f"❌ Failed to upload images for user {user.id}: {e}")
                    session.rollback()
    
    def print_summary(self):
        """Print migration summary"""
        logger.info("="*60)
        logger.info("📊 CLOUDINARY MIGRATION SUMMARY")
        logger.info("="*60)
        logger.info(f"Books processed: {self.stats['books_processed']}")
        logger.info(f"Book covers uploaded: {self.stats['books_uploaded']}")
        logger.info(f"Book upload failures: {self.stats['books_failed']}")
        logger.info("-"*40)
        logger.info(f"Users processed: {self.stats['users_processed']}")
        logger.info(f"User profile images uploaded: {self.stats['users_profile_uploaded']}")
        logger.info(f"User cover images uploaded: {self.stats['users_cover_uploaded']}")
        logger.info(f"User upload failures: {self.stats['users_failed']}")
        logger.info("-"*40)
        logger.info(f"Total uploads: {self.stats['total_uploads']}")
        logger.info(f"Total failures: {self.stats['total_failures']}")
        logger.info("="*60)
        
        if self.stats['total_failures'] == 0:
            logger.info("🎉 Migration completed successfully!")
        else:
            logger.warning(f"⚠️ Migration completed with {self.stats['total_failures']} failures. Check logs for details.")
    
    async def run_migration(self):
        """Run the complete migration process"""
        start_time = utc_now()
        logger.info("🚀 Starting Cloudinary migration...")
        
        # Validate Cloudinary configuration
        if not self.validate_cloudinary_config():
            return False
        
        # Check if paths exist
        if not self.frontend_public_path.exists():
            logger.error(f"Frontend public path not found: {self.frontend_public_path}")
            return False
        
        try:
            # Migrate book covers
            await self.migrate_book_covers()
            
            # Migrate user images
            await self.migrate_user_images()
            
            # Print summary
            end_time = utc_now()
            duration = end_time - start_time
            logger.info(f"⏱️ Migration completed in {duration}")
            
            self.print_summary()
            return True
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            return False

async def main():
    """Main function"""
    # Check if we're in the right directory
    if not Path("models.py").exists():
        logger.error("Please run this script from the backend directory")
        return
    
    # Create migration instance
    migration = CloudinaryMigration()
    
    # Ask for confirmation
    print("🔄 This script will migrate all existing images to Cloudinary.")
    print("⚠️ Make sure you have:")
    print("   1. Configured Cloudinary credentials in your environment")
    print("   2. Backed up your database")
    print("   3. Tested Cloudinary connection")
    
    confirm = input("\\nDo you want to continue? (yes/no): ").lower().strip()
    
    if confirm not in ['yes', 'y']:
        print("Migration cancelled.")
        return
    
    # Run migration
    success = await migration.run_migration()
    
    if success:
        print("\\n✅ Migration completed successfully!")
        print("📝 Check 'cloudinary_migration.log' for detailed logs.")
    else:
        print("\\n❌ Migration failed!")
        print("📝 Check 'cloudinary_migration.log' for error details.")

if __name__ == "__main__":
    asyncio.run(main())