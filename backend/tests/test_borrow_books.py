"""
Comprehensive tests for borrow books endpoints
Tests: /borrow/* routes
"""
import pytest
from unittest.mock import patch
from models import BookRequest, BookCopy, requestStatus, requestType, bookStatus


class TestCreateBorrowRequest:
    """Test POST /borrow/request - Create borrow request"""
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_create_borrow_request_success(self, mock_auth, client, member_user, sample_book):
        """Test successful borrow request creation"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.post(
            "/borrow/request",
            json={"book_id": sample_book.id},
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["book_id"] == sample_book.id
        assert data["status"] == "pending"
        assert "pending admin approval" in data["message"].lower()
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_create_borrow_request_nonexistent_book(self, mock_auth, client, member_user):
        """Test borrow request for non-existent book"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.post(
            "/borrow/request",
            json={"book_id": 99999},
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_create_borrow_request_no_available_copies(self, mock_auth, client, member_user, sample_book, session):
        """Test borrow request when no copies available"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        # Mark all copies as issued
        for copy in sample_book.copies:
            copy.status = bookStatus.ISSUED
            session.add(copy)
        session.commit()
        
        response = client.post(
            "/borrow/request",
            json={"book_id": sample_book.id},
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 400
        assert "no available copies" in response.json()["detail"].lower()
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_create_borrow_request_duplicate_pending(self, mock_auth, client, member_user, sample_book, session):
        """Test creating duplicate borrow request (already pending)"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        # Create first request
        first_request = BookRequest(
            request_type=requestType.BORROW,
            member_id=member_user.id,
            book_id=sample_book.id,
            status=requestStatus.PENDING
        )
        session.add(first_request)
        session.commit()
        
        # Try to create another
        response = client.post(
            "/borrow/request",
            json={"book_id": sample_book.id},
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 400
        assert "already have" in response.json()["detail"].lower()
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_create_borrow_request_duplicate_approved(self, mock_auth, client, member_user, sample_book, session):
        """Test creating borrow request when already approved"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        # Create approved request
        request = BookRequest(
            request_type=requestType.BORROW,
            member_id=member_user.id,
            book_id=sample_book.id,
            status=requestStatus.APPROVED
        )
        session.add(request)
        session.commit()
        
        response = client.post(
            "/borrow/request",
            json={"book_id": sample_book.id},
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 400
        assert "already have" in response.json()["detail"].lower()
    
    def test_create_borrow_request_no_auth(self, client, sample_book):
        """Test creating borrow request without authentication"""
        response = client.post(
            "/borrow/request",
            json={"book_id": sample_book.id}
        )
        
        assert response.status_code == 403
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_create_borrow_request_missing_book_id(self, mock_auth, client, member_user):
        """Test creating borrow request without book_id"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.post(
            "/borrow/request",
            json={},
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 422
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_create_borrow_request_invalid_book_id_type(self, mock_auth, client, member_user):
        """Test creating borrow request with invalid book_id type"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.post(
            "/borrow/request",
            json={"book_id": "invalid"},
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 422


class TestGetMemberBorrowRequests:
    """Test GET /borrow/requests - Get member's borrow requests"""
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_get_borrow_requests_success(self, mock_auth, client, member_user, sample_book, session):
        """Test getting member's borrow requests"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        # Create some requests
        for i in range(3):
            request = BookRequest(
                request_type=requestType.BORROW,
                member_id=member_user.id,
                book_id=sample_book.id,
                status=requestStatus.PENDING
            )
            session.add(request)
        session.commit()
        
        response = client.get(
            "/borrow/requests",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all(req["book_id"] == sample_book.id for req in data)
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_get_borrow_requests_empty(self, mock_auth, client, member_user):
        """Test getting borrow requests when none exist"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.get(
            "/borrow/requests",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_borrow_requests_no_auth(self, client):
        """Test getting borrow requests without authentication"""
        response = client.get("/borrow/requests")
        
        assert response.status_code == 403


class TestGetBorrowRequestDetails:
    """Test GET /borrow/requests/{request_id} - Get specific request details"""
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_get_request_details_success(self, mock_auth, client, member_user, sample_book, session):
        """Test getting specific borrow request details"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        request = BookRequest(
            request_type=requestType.BORROW,
            member_id=member_user.id,
            book_id=sample_book.id,
            status=requestStatus.PENDING
        )
        session.add(request)
        session.commit()
        session.refresh(request)
        
        response = client.get(
            f"/borrow/requests/{request.id}",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == request.id
        assert data["book_id"] == sample_book.id
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_get_request_details_not_found(self, mock_auth, client, member_user):
        """Test getting non-existent request"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.get(
            "/borrow/requests/99999",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 404
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_get_request_details_wrong_member(self, mock_auth, client, member_user, session, sample_book):
        """Test getting another member's request"""
        # Create another member
        from models import Member, userRole
        other_member = Member(
            name="Other Member",
            email="other@test.com",
            role=userRole.MEMBER
        )
        session.add(other_member)
        session.commit()
        
        # Create request for other member
        request = BookRequest(
            request_type=requestType.BORROW,
            member_id=other_member.id,
            book_id=sample_book.id,
            status=requestStatus.PENDING
        )
        session.add(request)
        session.commit()
        session.refresh(request)
        
        # Try to access as original member
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.get(
            f"/borrow/requests/{request.id}",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 403


class TestCancelBorrowRequest:
    """Test DELETE /borrow/requests/{request_id} - Cancel borrow request"""
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_cancel_request_success(self, mock_auth, client, member_user, sample_book, session):
        """Test successfully canceling pending request"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        request = BookRequest(
            request_type=requestType.BORROW,
            member_id=member_user.id,
            book_id=sample_book.id,
            status=requestStatus.PENDING
        )
        session.add(request)
        session.commit()
        session.refresh(request)
        
        response = client.delete(
            f"/borrow/requests/{request.id}",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        assert "cancelled successfully" in response.json()["message"].lower()
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_cancel_request_approved(self, mock_auth, client, member_user, sample_book, session):
        """Test canceling approved request (should fail)"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        request = BookRequest(
            request_type=requestType.BORROW,
            member_id=member_user.id,
            book_id=sample_book.id,
            status=requestStatus.APPROVED
        )
        session.add(request)
        session.commit()
        session.refresh(request)
        
        response = client.delete(
            f"/borrow/requests/{request.id}",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 400
        assert "cannot cancel" in response.json()["detail"].lower()
    
    @patch('router.borrow_books.require_member_or_admin')
    def test_cancel_request_not_found(self, mock_auth, client, member_user):
        """Test canceling non-existent request"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.delete(
            "/borrow/requests/99999",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 404


class TestGetAvailableBooks:
    """Test GET /borrow/available-books - Get books with available copies"""
    
    def test_get_available_books_success(self, client, sample_book):
        """Test getting available books (public endpoint)"""
        response = client.get("/borrow/available-books")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert any(book["id"] == sample_book.id for book in data)
        assert all("available_copies" in book for book in data)
    
    def test_get_available_books_no_available(self, client, sample_book, session):
        """Test getting available books when all are issued"""
        # Mark all copies as issued
        for copy in sample_book.copies:
            copy.status = bookStatus.ISSUED
            session.add(copy)
        session.commit()
        
        response = client.get("/borrow/available-books")
        
        assert response.status_code == 200
        data = response.json()
        # Sample book should not be in the list
        assert not any(book["id"] == sample_book.id for book in data)
    
    def test_get_available_books_empty_library(self, client, session):
        """Test getting available books when library is empty"""
        # Clear all books
        from models import Book
        from sqlmodel import select, delete
        session.exec(delete(BookCopy))
        session.exec(delete(Book))
        session.commit()
        
        response = client.get("/borrow/available-books")
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_available_books_mixed_status(self, client, sample_book, session):
        """Test getting available books with mixed copy statuses"""
        # Set different statuses
        copies = list(sample_book.copies)
        if len(copies) >= 3:
            copies[0].status = bookStatus.AVAILABLE
            copies[1].status = bookStatus.ISSUED
            copies[2].status = bookStatus.DAMAGED
            for copy in copies:
                session.add(copy)
            session.commit()
        
        response = client.get("/borrow/available-books")
        
        assert response.status_code == 200
        data = response.json()
        book_data = next((b for b in data if b["id"] == sample_book.id), None)
        if book_data:
            assert book_data["available_copies"] == 1
