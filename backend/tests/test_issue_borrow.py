"""
Comprehensive tests for issue from borrow request endpoint
Tests: /issue-borrow/* routes
"""
import pytest
from unittest.mock import patch
from models import BookRequest, BookCopy, requestType, requestStatus, bookStatus
from datetime import datetime


class TestIssueBorrowRequest:
    """Test POST /issue-borrow/ - Admin issues book from approved borrow request"""
    
    @patch('router.issue_borrow.require_admin')
    def test_issue_from_borrow_success(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test successfully issuing book from approved request"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create approved request with reserved copy
        copy = sample_book.copies[0]
        copy.status = bookStatus.RESERVED
        session.add(copy)
        
        request = BookRequest(
            request_type=requestType.BORROW,
            member_id=member_user.id,
            book_id=sample_book.id,
            status=requestStatus.APPROVED,
            reserved_copy_id=copy.id
        )
        session.add(request)
        session.commit()
        session.refresh(request)
        
        response = client.post(
            "/issue-borrow/",
            json={"request_id": request.id},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["member_id"] == member_user.id
        assert data["book_copy_id"] == copy.id
        assert "issued from borrow request" in data["message"].lower()
        assert data["due_date"] is not None
    
    @patch('router.issue_borrow.require_admin')
    def test_issue_from_borrow_not_approved(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test issuing from pending request (should fail)"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        request = BookRequest(
            request_type=requestType.BORROW,
            member_id=member_user.id,
            book_id=sample_book.id,
            status=requestStatus.PENDING
        )
        session.add(request)
        session.commit()
        session.refresh(request)
        
        response = client.post(
            "/issue-borrow/",
            json={"request_id": request.id},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "must be approved" in response.json()["detail"].lower()
    
    @patch('router.issue_borrow.require_admin')
    def test_issue_from_borrow_already_collected(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test issuing already collected request"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        from models import IssueBook
        from datetime import timedelta
        
        # Create approved request with issue book
        copy = sample_book.copies[0]
        request = BookRequest(
            request_type=requestType.BORROW,
            member_id=member_user.id,
            book_id=sample_book.id,
            status=requestStatus.APPROVED,
            reserved_copy_id=copy.id
        )
        session.add(request)
        session.flush()
        
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
            "/issue-borrow/",
            json={"request_id": request.id},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "already been collected" in response.json()["detail"].lower()
    
    @patch('router.issue_borrow.require_admin')
    def test_issue_from_borrow_no_reserved_copy(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test issuing when no copy is reserved"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        request = BookRequest(
            request_type=requestType.BORROW,
            member_id=member_user.id,
            book_id=sample_book.id,
            status=requestStatus.APPROVED,
            reserved_copy_id=None
        )
        session.add(request)
        session.commit()
        session.refresh(request)
        
        response = client.post(
            "/issue-borrow/",
            json={"request_id": request.id},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "no copy was reserved" in response.json()["detail"].lower()
    
    @patch('router.issue_borrow.require_admin')
    def test_issue_from_borrow_not_found(self, mock_auth, client, admin_user):
        """Test issuing non-existent request"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/issue-borrow/",
            json={"request_id": 99999},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 404
    
    @patch('router.issue_borrow.require_admin')
    def test_issue_from_donation_request(self, mock_auth, client, admin_user, member_user, session):
        """Test issuing from donation request (should fail)"""
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
            "/issue-borrow/",
            json={"request_id": request.id},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "not a borrow request" in response.json()["detail"].lower()
    
    def test_issue_from_borrow_no_auth(self, client):
        """Test issuing without authentication"""
        response = client.post(
            "/issue-borrow/",
            json={"request_id": 1}
        )
        
        assert response.status_code == 403
    
    @patch('router.issue_borrow.require_admin')
    def test_issue_from_borrow_missing_request_id(self, mock_auth, client, admin_user):
        """Test issuing without request_id"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/issue-borrow/",
            json={},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 422
    
    @patch('router.issue_borrow.require_admin')
    def test_issue_from_borrow_rejected_request(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test issuing from rejected request"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        request = BookRequest(
            request_type=requestType.BORROW,
            member_id=member_user.id,
            book_id=sample_book.id,
            status=requestStatus.REJECTED
        )
        session.add(request)
        session.commit()
        session.refresh(request)
        
        response = client.post(
            "/issue-borrow/",
            json={"request_id": request.id},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
