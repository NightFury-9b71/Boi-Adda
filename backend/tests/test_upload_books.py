"""
Comprehensive tests for upload books endpoint
Tests: /upload-books/* routes
"""
import pytest
from unittest.mock import patch
from datetime import datetime


class TestUploadBooksDirectly:
    """Test POST /upload-books/ - Admin uploads books directly"""
    
    @patch('router.upload_books.require_admin')
    def test_upload_new_book_success(self, mock_auth, client, admin_user):
        """Test successfully uploading a new book"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "New Book",
                "author": "New Author",
                "published_year": 2020,
                "pages": 300,
                "copies_to_add": 2
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["action"] == "created"
        assert data["book_title"] == "New Book"
        assert data["copies_added"] == 2
        assert "new book added" in data["message"].lower()
    
    @patch('router.upload_books.require_admin')
    def test_upload_existing_book(self, mock_auth, client, admin_user, sample_book, session):
        """Test uploading copies of existing book"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": sample_book.title,
                "author": sample_book.author,
                "published_year": sample_book.published_year,
                "pages": sample_book.pages,
                "copies_to_add": 3
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["action"] == "updated"
        assert "already exists" in data["message"].lower()
        assert data["copies_added"] == 3
    
    @patch('router.upload_books.require_admin')
    def test_upload_book_invalid_year(self, mock_auth, client, admin_user):
        """Test uploading book with invalid year"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "Test Book",
                "author": "Test Author",
                "published_year": 999,
                "pages": 200,
                "copies_to_add": 1
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()
    
    @patch('router.upload_books.require_admin')
    def test_upload_book_future_year(self, mock_auth, client, admin_user):
        """Test uploading book with future year"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "Test Book",
                "author": "Test Author",
                "published_year": datetime.now().year + 1,
                "pages": 200,
                "copies_to_add": 1
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
    
    @patch('router.upload_books.require_admin')
    def test_upload_book_zero_pages(self, mock_auth, client, admin_user):
        """Test uploading book with zero pages"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "Test Book",
                "author": "Test Author",
                "published_year": 2020,
                "pages": 0,
                "copies_to_add": 1
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "greater than 0" in response.json()["detail"].lower()
    
    @patch('router.upload_books.require_admin')
    def test_upload_book_negative_pages(self, mock_auth, client, admin_user):
        """Test uploading book with negative pages"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "Test Book",
                "author": "Test Author",
                "published_year": 2020,
                "pages": -100,
                "copies_to_add": 1
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
    
    @patch('router.upload_books.require_admin')
    def test_upload_book_zero_copies(self, mock_auth, client, admin_user):
        """Test uploading book with zero copies"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "Test Book",
                "author": "Test Author",
                "published_year": 2020,
                "pages": 200,
                "copies_to_add": 0
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "greater than 0" in response.json()["detail"].lower()
    
    @patch('router.upload_books.require_admin')
    def test_upload_book_negative_copies(self, mock_auth, client, admin_user):
        """Test uploading book with negative copies"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "Test Book",
                "author": "Test Author",
                "published_year": 2020,
                "pages": 200,
                "copies_to_add": -1
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
    
    @patch('router.upload_books.require_admin')
    def test_upload_book_missing_fields(self, mock_auth, client, admin_user):
        """Test uploading book with missing required fields"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "Test Book"
                # Missing author, year, pages
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 422
    
    def test_upload_book_no_auth(self, client):
        """Test uploading book without authentication"""
        response = client.post(
            "/upload-books/",
            json={
                "title": "Test Book",
                "author": "Test Author",
                "published_year": 2020,
                "pages": 200,
                "copies_to_add": 1
            }
        )
        
        assert response.status_code == 403
    
    @patch('router.upload_books.require_admin')
    def test_upload_book_default_copies(self, mock_auth, client, admin_user):
        """Test uploading book with default copies (1)"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "Test Book",
                "author": "Test Author",
                "published_year": 2020,
                "pages": 200
                # copies_to_add defaults to 1
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["copies_added"] == 1
    
    @patch('router.upload_books.require_admin')
    def test_upload_book_large_copies(self, mock_auth, client, admin_user):
        """Test uploading book with large number of copies"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "Test Book",
                "author": "Test Author",
                "published_year": 2020,
                "pages": 200,
                "copies_to_add": 100
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["copies_added"] == 100
    
    @patch('router.upload_books.require_admin')
    def test_upload_book_empty_title(self, mock_auth, client, admin_user):
        """Test uploading book with empty title"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "",
                "author": "Test Author",
                "published_year": 2020,
                "pages": 200,
                "copies_to_add": 1
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 422
    
    @patch('router.upload_books.require_admin')
    def test_upload_book_empty_author(self, mock_auth, client, admin_user):
        """Test uploading book with empty author"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "Test Book",
                "author": "",
                "published_year": 2020,
                "pages": 200,
                "copies_to_add": 1
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 422
    
    @patch('router.upload_books.require_admin')
    def test_upload_book_very_old(self, mock_auth, client, admin_user):
        """Test uploading very old book (edge case for year)"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "Ancient Book",
                "author": "Old Author",
                "published_year": 1000,
                "pages": 200,
                "copies_to_add": 1
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 201
    
    @patch('router.upload_books.require_admin')
    def test_upload_book_current_year(self, mock_auth, client, admin_user):
        """Test uploading book with current year"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/upload-books/",
            json={
                "title": "New Release",
                "author": "Modern Author",
                "published_year": datetime.now().year,
                "pages": 200,
                "copies_to_add": 1
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 201
