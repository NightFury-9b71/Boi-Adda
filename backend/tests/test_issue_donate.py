"""
Comprehensive tests for issue from donation endpoint
Tests: /issue-donate/* routes
"""
import pytest
from unittest.mock import patch
from models import BookRequest, Book, BookCopy, requestType, requestStatus, bookStatus
from datetime import datetime


class TestIssueDonation:
    """Test POST /issue-donate/ - Admin issues book to donor after accepting donation"""
    
    @patch('router.issue_donate.require_admin')
    def test_issue_donation_success(self, mock_auth, client, admin_user, member_user, session):
        """Test successfully issuing book to donor"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create book from donation
        book = Book(
            title="Donated Book",
            author="Donor Author",
            published_year=2020,
            pages=200
        )
        session.add(book)
        session.flush()
        
        # Add copy
        copy = BookCopy(
            book_id=book.id,
            status=bookStatus.AVAILABLE
        )
        session.add(copy)
        
        # Create completed donation request
        request = BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="Donated Book",
            donation_author="Donor Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.COMPLETED,
            book_id=book.id
        )
        session.add(request)
        session.commit()
        session.refresh(request)
        
        response = client.post(
            "/issue-donate/",
            json={"donation_request_id": request.id},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["member_id"] == member_user.id
        assert "issued to donor" in data["message"].lower()
    
    @patch('router.issue_donate.require_admin')
    def test_issue_donation_not_completed(self, mock_auth, client, admin_user, member_user, session):
        """Test issuing from pending donation (should fail)"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        request = BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="Book",
            donation_author="Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.PENDING
        )
        session.add(request)
        session.commit()
        session.refresh(request)
        
        response = client.post(
            "/issue-donate/",
            json={"donation_request_id": request.id},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "must be accepted first" in response.json()["detail"].lower()
    
    @patch('router.issue_donate.require_admin')
    def test_issue_donation_already_issued(self, mock_auth, client, admin_user, member_user, session):
        """Test issuing already issued donation"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        from models import IssueBook
        from datetime import timedelta
        
        # Create book and copy
        book = Book(title="Book", author="Author", published_year=2020, pages=200)
        session.add(book)
        session.flush()
        
        copy = BookCopy(book_id=book.id, status=bookStatus.AVAILABLE)
        session.add(copy)
        
        # Create donation request
        request = BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="Book",
            donation_author="Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.COMPLETED,
            book_id=book.id
        )
        session.add(request)
        session.flush()
        
        # Create issue
        issue = IssueBook(
            member_id=member_user.id,
            book_copy_id=copy.id,
            admin_id=admin_user.id,
            request_id=request.id,
            issue_date=datetime.now(),
            due_date=datetime.now() + timedelta(days=14)
        )
        session.add(issue)
        session.commit()
        session.refresh(request)
        
        response = client.post(
            "/issue-donate/",
            json={"donation_request_id": request.id},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "already resulted in an issued book" in response.json()["detail"].lower()
    
    @patch('router.issue_donate.require_admin')
    def test_issue_donation_no_book_linked(self, mock_auth, client, admin_user, member_user, session):
        """Test issuing when no book linked to donation"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        request = BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="Book",
            donation_author="Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.COMPLETED,
            book_id=None
        )
        session.add(request)
        session.commit()
        session.refresh(request)
        
        response = client.post(
            "/issue-donate/",
            json={"donation_request_id": request.id},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "no book was linked" in response.json()["detail"].lower()
    
    @patch('router.issue_donate.require_admin')
    def test_issue_donation_no_available_copies(self, mock_auth, client, admin_user, member_user, session):
        """Test issuing when no copies available"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create book with issued copy
        book = Book(title="Book", author="Author", published_year=2020, pages=200)
        session.add(book)
        session.flush()
        
        copy = BookCopy(book_id=book.id, status=bookStatus.ISSUED)
        session.add(copy)
        
        request = BookRequest(
            request_type=requestType.DONATION,
            member_id=member_user.id,
            donation_title="Book",
            donation_author="Author",
            donation_year=2020,
            donation_pages=200,
            status=requestStatus.COMPLETED,
            book_id=book.id
        )
        session.add(request)
        session.commit()
        session.refresh(request)
        
        response = client.post(
            "/issue-donate/",
            json={"donation_request_id": request.id},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "no available copies" in response.json()["detail"].lower()
    
    @patch('router.issue_donate.require_admin')
    def test_issue_donation_not_found(self, mock_auth, client, admin_user):
        """Test issuing non-existent donation"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/issue-donate/",
            json={"donation_request_id": 99999},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 404
    
    @patch('router.issue_donate.require_admin')
    def test_issue_borrow_as_donation(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test issuing borrow request as donation (should fail)"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        request = BookRequest(
            request_type=requestType.BORROW,
            member_id=member_user.id,
            book_id=sample_book.id,
            status=requestStatus.APPROVED
        )
        session.add(request)
        session.commit()
        session.refresh(request)
        
        response = client.post(
            "/issue-donate/",
            json={"donation_request_id": request.id},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "not a donation request" in response.json()["detail"].lower()
    
    def test_issue_donation_no_auth(self, client):
        """Test issuing without authentication"""
        response = client.post(
            "/issue-donate/",
            json={"donation_request_id": 1}
        )
        
        assert response.status_code == 403
    
    @patch('router.issue_donate.require_admin')
    def test_issue_donation_missing_id(self, mock_auth, client, admin_user):
        """Test issuing without donation_request_id"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/issue-donate/",
            json={},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 422
