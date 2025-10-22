"""
Comprehensive tests for issue direct endpoint
Tests: /issue-direct/* routes (direct book issuing without request)
"""
import pytest
from unittest.mock import patch
from models import BookCopy, IssueBook, bookStatus
from datetime import datetime


class TestIssueDirectly:
    """Test POST /issue-direct/ - Admin issues book directly to member"""
    
    @patch('router.issue_direct.require_admin')
    def test_issue_direct_success(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test successfully issuing book directly"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        copy = sample_book.copies[0]
        
        response = client.post(
            "/issue-direct/",
            json={
                "member_id": member_user.id,
                "book_copy_id": copy.id
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["member_id"] == member_user.id
        assert data["book_copy_id"] == copy.id
        assert "issued directly" in data["message"].lower()
        assert data["due_date"] is not None
    
    @patch('router.issue_direct.require_admin')
    def test_issue_direct_reserved_copy(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test issuing reserved copy directly"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        copy = sample_book.copies[0]
        copy.status = bookStatus.RESERVED
        session.add(copy)
        session.commit()
        
        response = client.post(
            "/issue-direct/",
            json={
                "member_id": member_user.id,
                "book_copy_id": copy.id
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 201
    
    @patch('router.issue_direct.require_admin')
    def test_issue_direct_issued_copy(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test issuing already issued copy (should fail)"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        copy = sample_book.copies[0]
        copy.status = bookStatus.ISSUED
        session.add(copy)
        session.commit()
        
        response = client.post(
            "/issue-direct/",
            json={
                "member_id": member_user.id,
                "book_copy_id": copy.id
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "cannot issue book" in response.json()["detail"].lower()
    
    @patch('router.issue_direct.require_admin')
    def test_issue_direct_damaged_copy(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test issuing damaged copy (should fail)"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        copy = sample_book.copies[0]
        copy.status = bookStatus.DAMAGED
        session.add(copy)
        session.commit()
        
        response = client.post(
            "/issue-direct/",
            json={
                "member_id": member_user.id,
                "book_copy_id": copy.id
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
    
    @patch('router.issue_direct.require_admin')
    def test_issue_direct_lost_copy(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test issuing lost copy (should fail)"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        copy = sample_book.copies[0]
        copy.status = bookStatus.LOST
        session.add(copy)
        session.commit()
        
        response = client.post(
            "/issue-direct/",
            json={
                "member_id": member_user.id,
                "book_copy_id": copy.id
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
    
    @patch('router.issue_direct.require_admin')
    def test_issue_direct_nonexistent_member(self, mock_auth, client, admin_user, sample_book):
        """Test issuing to non-existent member"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        copy = sample_book.copies[0]
        
        response = client.post(
            "/issue-direct/",
            json={
                "member_id": 99999,
                "book_copy_id": copy.id
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 404
        assert "member not found" in response.json()["detail"].lower()
    
    @patch('router.issue_direct.require_admin')
    def test_issue_direct_nonexistent_copy(self, mock_auth, client, admin_user, member_user):
        """Test issuing non-existent copy"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/issue-direct/",
            json={
                "member_id": member_user.id,
                "book_copy_id": 99999
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 404
        assert "copy not found" in response.json()["detail"].lower()
    
    @patch('router.issue_direct.require_admin')
    def test_issue_direct_duplicate(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test issuing same copy to same member twice"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        from datetime import timedelta
        
        copy = sample_book.copies[0]
        copy.status = bookStatus.ISSUED
        session.add(copy)
        
        # Create existing issue
        issue = IssueBook(
            member_id=member_user.id,
            book_copy_id=copy.id,
            admin_id=admin_user.id,
            issue_date=datetime.now(),
            due_date=datetime.now() + timedelta(days=14)
        )
        session.add(issue)
        session.commit()
        
        response = client.post(
            "/issue-direct/",
            json={
                "member_id": member_user.id,
                "book_copy_id": copy.id
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "already has this book" in response.json()["detail"].lower()
    
    def test_issue_direct_no_auth(self, client, member_user, sample_book):
        """Test issuing without authentication"""
        copy = sample_book.copies[0]
        
        response = client.post(
            "/issue-direct/",
            json={
                "member_id": member_user.id,
                "book_copy_id": copy.id
            }
        )
        
        assert response.status_code == 403
    
    @patch('router.issue_direct.require_admin')
    def test_issue_direct_missing_member_id(self, mock_auth, client, admin_user, sample_book):
        """Test issuing without member_id"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        copy = sample_book.copies[0]
        
        response = client.post(
            "/issue-direct/",
            json={
                "book_copy_id": copy.id
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 422
    
    @patch('router.issue_direct.require_admin')
    def test_issue_direct_missing_copy_id(self, mock_auth, client, admin_user, member_user):
        """Test issuing without book_copy_id"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/issue-direct/",
            json={
                "member_id": member_user.id
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 422
    
    @patch('router.issue_direct.require_admin')
    def test_issue_direct_invalid_ids(self, mock_auth, client, admin_user):
        """Test issuing with invalid ID types"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/issue-direct/",
            json={
                "member_id": "invalid",
                "book_copy_id": "invalid"
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 422
    
    @patch('router.issue_direct.require_admin')
    def test_issue_direct_negative_ids(self, mock_auth, client, admin_user):
        """Test issuing with negative IDs"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.post(
            "/issue-direct/",
            json={
                "member_id": -1,
                "book_copy_id": -1
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 404
    
    @patch('router.issue_direct.require_admin')
    def test_issue_direct_multiple_copies_same_member(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test issuing multiple different copies to same member"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Issue first copy
        copy1 = sample_book.copies[0]
        response1 = client.post(
            "/issue-direct/",
            json={
                "member_id": member_user.id,
                "book_copy_id": copy1.id
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        assert response1.status_code == 201
        
        # Issue second copy
        copy2 = sample_book.copies[1]
        response2 = client.post(
            "/issue-direct/",
            json={
                "member_id": member_user.id,
                "book_copy_id": copy2.id
            },
            headers={"Authorization": "Bearer admin_token"}
        )
        assert response2.status_code == 201
