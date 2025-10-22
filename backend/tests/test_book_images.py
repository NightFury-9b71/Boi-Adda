"""
Comprehensive tests for book images endpoints
Tests: /images/* routes (upload/delete book covers)
"""
import pytest
from unittest.mock import patch, AsyncMock
from io import BytesIO


class TestUploadBookCover:
    """Test POST /images/books/{book_id}/cover - Upload book cover"""
    
    @patch('router.book_images.require_admin')
    @patch('router.book_images.upload_book_cover')
    def test_upload_cover_success(self, mock_upload, mock_auth, client, admin_user, sample_book):
        """Test successfully uploading book cover"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        mock_upload.return_value = "https://storage.url/cover.jpg"
        
        response = client.post(
            f"/images/books/{sample_book.id}/cover",
            headers={"Authorization": "Bearer admin_token"},
            files={"file": ("cover.jpg", b"fake image data", "image/jpeg")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "uploaded successfully" in data["message"].lower()
        assert "cover_url" in data
    
    @patch('router.book_images.require_admin')
    def test_upload_cover_nonexistent_book(self, mock_auth, client, admin_user):
        """Test uploading cover for non-existent book"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/images/books/99999/cover",
            headers={"Authorization": "Bearer admin_token"},
            files={"file": ("cover.jpg", b"fake image data", "image/jpeg")}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_upload_cover_no_auth(self, client, sample_book):
        """Test uploading cover without authentication"""
        response = client.post(
            f"/images/books/{sample_book.id}/cover",
            files={"file": ("cover.jpg", b"fake image data", "image/jpeg")}
        )
        
        assert response.status_code == 403
    
    @patch('router.book_images.require_admin')
    def test_upload_cover_no_file(self, mock_auth, client, admin_user, sample_book):
        """Test uploading cover without file"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            f"/images/books/{sample_book.id}/cover",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 422
    
    @patch('router.book_images.require_admin')
    @patch('router.book_images.upload_book_cover')
    def test_upload_cover_replace_existing(self, mock_upload, mock_auth, client, admin_user, sample_book, session):
        """Test uploading cover to replace existing one"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        mock_upload.return_value = "https://storage.url/new_cover.jpg"
        
        # Set existing cover
        sample_book.cover_image_url = "https://storage.url/old_cover.jpg"
        session.add(sample_book)
        session.commit()
        
        response = client.post(
            f"/images/books/{sample_book.id}/cover",
            headers={"Authorization": "Bearer admin_token"},
            files={"file": ("new_cover.jpg", b"fake image data", "image/jpeg")}
        )
        
        assert response.status_code == 200


class TestDeleteBookCover:
    """Test DELETE /images/books/{book_id}/cover - Delete book cover"""
    
    @patch('router.book_images.require_admin')
    @patch('router.book_images.delete_book_cover')
    def test_delete_cover_success(self, mock_delete, mock_auth, client, admin_user, sample_book, session):
        """Test successfully deleting book cover"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Set existing cover
        sample_book.cover_image_url = "https://storage.url/cover.jpg"
        session.add(sample_book)
        session.commit()
        
        response = client.delete(
            f"/images/books/{sample_book.id}/cover",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"].lower()
    
    @patch('router.book_images.require_admin')
    def test_delete_cover_nonexistent_book(self, mock_auth, client, admin_user):
        """Test deleting cover for non-existent book"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.delete(
            "/images/books/99999/cover",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 404
    
    def test_delete_cover_no_auth(self, client, sample_book):
        """Test deleting cover without authentication"""
        response = client.delete(
            f"/images/books/{sample_book.id}/cover"
        )
        
        assert response.status_code == 403
    
    @patch('router.book_images.require_admin')
    @patch('router.book_images.delete_book_cover')
    def test_delete_cover_no_existing_cover(self, mock_delete, mock_auth, client, admin_user, sample_book):
        """Test deleting cover when book has no cover"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.delete(
            f"/images/books/{sample_book.id}/cover",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200


class TestGetBookWithCover:
    """Test GET /images/books/{book_id} - Get book details with cover"""
    
    def test_get_book_success(self, client, sample_book):
        """Test getting book details (public endpoint)"""
        response = client.get(f"/images/books/{sample_book.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_book.id
        assert "title" in data
        assert "author" in data
        assert "cover_image_url" in data
    
    def test_get_book_nonexistent(self, client):
        """Test getting non-existent book"""
        response = client.get("/images/books/99999")
        
        assert response.status_code == 404
    
    def test_get_book_with_cover(self, client, sample_book, session):
        """Test getting book with cover URL"""
        sample_book.cover_image_url = "https://storage.url/cover.jpg"
        session.add(sample_book)
        session.commit()
        
        response = client.get(f"/images/books/{sample_book.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["cover_image_url"] == "https://storage.url/cover.jpg"
    
    def test_get_book_no_cover(self, client, sample_book):
        """Test getting book without cover"""
        response = client.get(f"/images/books/{sample_book.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["cover_image_url"] is None
