"""
Comprehensive tests for donate books endpoints
Tests: /donate/* routes
"""
import pytest
from unittest.mock import patch
from models import BookRequest, requestType, requestStatus, Book
from datetime import datetime


class TestCreateDonationRequest:
    """Test POST /donate/request - Create donation request"""
    
    @patch('router.donate_books.require_member_or_admin')
    def test_create_donation_success(self, mock_auth, client, member_user):
        """Test successful donation request creation"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.post(
            "/donate/request",
            json={
                "donation_title": "The Great Gatsby",
                "donation_author": "F. Scott Fitzgerald",
                "donation_year": 1925,
                "donation_pages": 180
            },
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["donation_title"] == "The Great Gatsby"
        assert data["status"] == "pending"
        assert "waiting for admin approval" in data["message"].lower()
    
    @patch('router.donate_books.require_member_or_admin')
    def test_create_donation_invalid_year(self, mock_auth, client, member_user):
        """Test donation with invalid year"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.post(
            "/donate/request",
            json={
                "donation_title": "Test Book",
                "donation_author": "Test Author",
                "donation_year": 999,  # Invalid
                "donation_pages": 100
            },
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()
    
    @patch('router.donate_books.require_member_or_admin')
    def test_create_donation_future_year(self, mock_auth, client, member_user):
        """Test donation with future year"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.post(
            "/donate/request",
            json={
                "donation_title": "Test Book",
                "donation_author": "Test Author",
                "donation_year": datetime.now().year + 1,
                "donation_pages": 100
            },
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()
    
    @patch('router.donate_books.require_member_or_admin')
    def test_create_donation_zero_pages(self, mock_auth, client, member_user):
        """Test donation with zero pages"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.post(
            "/donate/request",
            json={
                "donation_title": "Test Book",
                "donation_author": "Test Author",
                "donation_year": 2020,
                "donation_pages": 0
            },
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 400
        assert "greater than 0" in response.json()["detail"].lower()
    
    @patch('router.donate_books.require_member_or_admin')
    def test_create_donation_negative_pages(self, mock_auth, client, member_user):
        """Test donation with negative pages"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.post(
            "/donate/request",
            json={
                "donation_title": "Test Book",
                "donation_author": "Test Author",
                "donation_year": 2020,
                "donation_pages": -100
            },
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 400
    
    @patch('router.donate_books.require_member_or_admin')
    def test_create_donation_missing_fields(self, mock_auth, client, member_user):
        """Test donation with missing required fields"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.post(
            "/donate/request",
            json={
                "donation_title": "Test Book"
                # Missing author, year, pages
            },
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 422
    
    def test_create_donation_no_auth(self, client):
        """Test creating donation without authentication"""
        response = client.post(
            "/donate/request",
            json={
                "donation_title": "Test Book",
                "donation_author": "Test Author",
                "donation_year": 2020,
                "donation_pages": 100
            }
        )
        
        assert response.status_code == 403


class TestGetMemberDonationRequests:
    """Test GET /donate/my-requests - Get member's donation requests"""
    
    @patch('router.donate_books.require_member_or_admin')
    def test_get_my_donations_success(self, mock_auth, client, member_user, session):
        """Test getting member's donation requests"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        # Create donations
        for i in range(3):
            donation = BookRequest(
                request_type=requestType.DONATION,
                member_id=member_user.id,
                donation_title=f"Book {i}",
                donation_author="Author",
                donation_year=2020,
                donation_pages=200,
                status=requestStatus.PENDING
            )
            session.add(donation)
        session.commit()
        
        response = client.get(
            "/donate/my-requests",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
    
    @patch('router.donate_books.require_member_or_admin')
    def test_get_my_donations_empty(self, mock_auth, client, member_user):
        """Test getting donations when none exist"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.get(
            "/donate/my-requests",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        assert response.json() == []


class TestCancelDonationRequest:
    """Test DELETE /donate/my-requests/{request_id} - Cancel donation"""
    
    @patch('router.donate_books.require_member_or_admin')
    def test_cancel_donation_success(self, mock_auth, client, member_user, session):
        """Test successfully canceling pending donation"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        donation = BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="Book",
            donation_author="Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.PENDING
        )
        session.add(donation)
        session.commit()
        session.refresh(donation)
        
        response = client.delete(
            f"/donate/my-requests/{donation.id}",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        assert "cancelled successfully" in response.json()["message"].lower()
    
    @patch('router.donate_books.require_member_or_admin')
    def test_cancel_donation_completed(self, mock_auth, client, member_user, session):
        """Test canceling completed donation (should fail)"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        donation = BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="Book",
            donation_author="Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.COMPLETED
        )
        session.add(donation)
        session.commit()
        session.refresh(donation)
        
        response = client.delete(
            f"/donate/my-requests/{donation.id}",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 400
        assert "cannot cancel" in response.json()["detail"].lower()


class TestAdminGetPendingDonations:
    """Test GET /donate/pending-requests - Admin gets pending donations"""
    
    @patch('router.donate_books.require_admin')
    def test_get_pending_donations_success(self, mock_auth, client, admin_user, member_user, session):
        """Test admin getting pending donations"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create pending donations
        for i in range(3):
            donation = BookRequest(
                request_type=requestType.DONATION,
                member_id=member_user.id,
                donation_title=f"Book {i}",
                donation_author="Author",
                donation_year=2020,
                donation_pages=200,
                status=requestStatus.PENDING
            )
            session.add(donation)
        session.commit()
        
        response = client.get(
            "/donate/pending-requests",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all(d["status"] == "pending" for d in data)
    
    @patch('router.donate_books.require_admin')
    def test_get_pending_donations_empty(self, mock_auth, client, admin_user):
        """Test getting pending donations when none exist"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.get(
            "/donate/pending-requests",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        assert response.json() == []


class TestAdminAcceptDonation:
    """Test POST /donate/accept-donation/{request_id} - Admin accepts donation"""
    
    @patch('router.donate_books.require_admin')
    def test_accept_donation_new_book(self, mock_auth, client, admin_user, member_user, session):
        """Test accepting donation for new book"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        donation = BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="New Book",
            donation_author="New Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.PENDING
        )
        session.add(donation)
        session.commit()
        session.refresh(donation)
        
        response = client.post(
            f"/donate/accept-donation/{donation.id}",
            json={"copies_to_add": 1},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "book_id" in data
        assert data["copies_added"] == 1
        assert "new book added" in data["message"].lower()
    
    @patch('router.donate_books.require_admin')
    def test_accept_donation_existing_book(self, mock_auth, client, admin_user, member_user, session):
        """Test accepting donation for existing book"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create existing book
        book = Book(
            title="Existing Book",
            author="Existing Author",
            published_year=2020,
            pages=200
        )
        session.add(book)
        session.commit()
        
        donation = BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="Existing Book",
            donation_author="Existing Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.PENDING
        )
        session.add(donation)
        session.commit()
        session.refresh(donation)
        
        response = client.post(
            f"/donate/accept-donation/{donation.id}",
            json={"copies_to_add": 2},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["copies_added"] == 2
        assert "already exists" in data["message"].lower()
    
    @patch('router.donate_books.require_admin')
    def test_accept_donation_not_pending(self, mock_auth, client, admin_user, member_user, session):
        """Test accepting non-pending donation"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        donation = BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="Book",
            donation_author="Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.COMPLETED
        )
        session.add(donation)
        session.commit()
        session.refresh(donation)
        
        response = client.post(
            f"/donate/accept-donation/{donation.id}",
            json={"copies_to_add": 1},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "cannot accept" in response.json()["detail"].lower()
    
    @patch('router.donate_books.require_admin')
    def test_accept_donation_zero_copies(self, mock_auth, client, admin_user, member_user, session):
        """Test accepting donation with zero copies"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        donation = BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="Book",
            donation_author="Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.PENDING
        )
        session.add(donation)
        session.commit()
        session.refresh(donation)
        
        response = client.post(
            f"/donate/accept-donation/{donation.id}",
            json={"copies_to_add": 0},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "greater than 0" in response.json()["detail"].lower()
    
    @patch('router.donate_books.require_admin')
    def test_accept_donation_not_found(self, mock_auth, client, admin_user):
        """Test accepting non-existent donation"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/donate/accept-donation/99999",
            json={"copies_to_add": 1},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 404


class TestAdminRejectDonation:
    """Test POST /donate/reject-donation/{request_id} - Admin rejects donation"""
    
    @patch('router.donate_books.require_admin')
    def test_reject_donation_success(self, mock_auth, client, admin_user, member_user, session):
        """Test successfully rejecting donation"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        donation = BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="Book",
            donation_author="Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.PENDING
        )
        session.add(donation)
        session.commit()
        session.refresh(donation)
        
        response = client.post(
            f"/donate/reject-donation/{donation.id}",
            json={},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        assert "rejected successfully" in response.json()["message"].lower()
    
    @patch('router.donate_books.require_admin')
    def test_reject_donation_not_pending(self, mock_auth, client, admin_user, member_user, session):
        """Test rejecting non-pending donation"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        donation = BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="Book",
            donation_author="Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.REJECTED
        )
        session.add(donation)
        session.commit()
        session.refresh(donation)
        
        response = client.post(
            f"/donate/reject-donation/{donation.id}",
            json={},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400


class TestAdminGetAllDonations:
    """Test GET /donate/all-requests - Admin gets all donations"""
    
    @patch('router.donate_books.require_admin')
    def test_get_all_donations(self, mock_auth, client, admin_user, member_user, session):
        """Test getting all donation requests"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create donations with different statuses
        statuses = [requestStatus.PENDING, requestStatus.COMPLETED, requestStatus.REJECTED]
        for status in statuses:
            donation = BookRequest(
                request_type=requestType.DONATION,
                member_id=member_user.id,
                donation_title=f"Book {status}",
                donation_author="Author",
                donation_year=2020,
                donation_pages=200,
                status=status
            )
            session.add(donation)
        session.commit()
        
        response = client.get(
            "/donate/all-requests",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
    
    @patch('router.donate_books.require_admin')
    def test_get_all_donations_filtered(self, mock_auth, client, admin_user, member_user, session):
        """Test getting donations filtered by status"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create donations with different statuses
        for i in range(2):
            session.add(BookRequest(
                request_type=requestType.DONATION,
                member_id=member_user.id,
                donation_title=f"Pending {i}",
                donation_author="Author",
                donation_year=2020,
                donation_pages=200,
                status=requestStatus.PENDING
            ))
        session.add(BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="Completed",
            donation_author="Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.COMPLETED
        ))
        session.commit()
        
        response = client.get(
            "/donate/all-requests?status_filter=pending",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(d["status"] == "pending" for d in data)
