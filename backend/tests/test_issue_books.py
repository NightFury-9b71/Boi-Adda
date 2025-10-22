"""
Comprehensive tests for issue books endpoints  
Tests: /issue/* routes (approve, reject, return, view issued books)
"""
import pytest
from unittest.mock import patch
from models import BookRequest, IssueBook, BookCopy, requestType, requestStatus, bookStatus
from datetime import datetime, timedelta


class TestApproveRequest:
    """Test POST /issue/approve-request/{request_id} - Admin approves borrow request"""
    
    @patch('router.issue_books.require_admin')
    def test_approve_request_success(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test successfully approving borrow request"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create pending borrow request
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
            f"/issue/approve-request/{request.id}",
            json={},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "approved successfully" in data["message"].lower()
        assert "reserved_copy_id" in data
    
    @patch('router.issue_books.require_admin')
    def test_approve_request_no_copies(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test approving request when no copies available"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Mark all copies as issued
        for copy in sample_book.copies:
            copy.status = bookStatus.ISSUED
            session.add(copy)
        session.commit()
        
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
            f"/issue/approve-request/{request.id}",
            json={},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "no available copies" in response.json()["detail"].lower()
    
    @patch('router.issue_books.require_admin')
    def test_approve_request_already_approved(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test approving already approved request"""
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
            f"/issue/approve-request/{request.id}",
            json={},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "cannot approve" in response.json()["detail"].lower()
    
    @patch('router.issue_books.require_admin')
    def test_approve_donation_request(self, mock_auth, client, admin_user, member_user, session):
        """Test approving donation request (should fail)"""
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
            f"/issue/approve-request/{request.id}",
            json={},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "not a borrow request" in response.json()["detail"].lower()


class TestRejectRequest:
    """Test POST /issue/reject-request/{request_id} - Admin rejects borrow request"""
    
    @patch('router.issue_books.require_admin')
    def test_reject_request_success(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test successfully rejecting borrow request"""
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
            f"/issue/reject-request/{request.id}",
            json={},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        assert "rejected successfully" in response.json()["message"].lower()
    
    @patch('router.issue_books.require_admin')
    def test_reject_request_already_approved(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test rejecting already approved request"""
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
            f"/issue/reject-request/{request.id}",
            json={},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400


class TestReturnBook:
    """Test PUT /issue/return/{issue_id} - Admin marks book as returned"""
    
    @patch('router.issue_books.require_admin')
    def test_return_book_success(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test successfully returning a book"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create issued book
        copy = sample_book.copies[0]
        copy.status = bookStatus.ISSUED
        session.add(copy)
        
        issue = IssueBook(
            member_id=member_user.id,
            book_copy_id=copy.id,
            admin_id=admin_user.id,
            issue_date=datetime.now(),
            due_date=datetime.now() + timedelta(days=14)
        )
        session.add(issue)
        session.commit()
        session.refresh(issue)
        
        response = client.put(
            f"/issue/return/{issue.id}",
            json={"book_condition": "available"},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["return_date"] is not None
        assert "returned successfully" in data["message"].lower()
    
    @patch('router.issue_books.require_admin')
    def test_return_book_damaged(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test returning book marked as damaged"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        copy = sample_book.copies[0]
        copy.status = bookStatus.ISSUED
        session.add(copy)
        
        issue = IssueBook(
            member_id=member_user.id,
            book_copy_id=copy.id,
            admin_id=admin_user.id,
            issue_date=datetime.now(),
            due_date=datetime.now() + timedelta(days=14)
        )
        session.add(issue)
        session.commit()
        session.refresh(issue)
        
        response = client.put(
            f"/issue/return/{issue.id}",
            json={"book_condition": "damaged"},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        assert "damaged" in response.json()["message"].lower()
    
    @patch('router.issue_books.require_admin')
    def test_return_book_lost(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test returning book marked as lost"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        copy = sample_book.copies[0]
        copy.status = bookStatus.ISSUED
        session.add(copy)
        
        issue = IssueBook(
            member_id=member_user.id,
            book_copy_id=copy.id,
            admin_id=admin_user.id,
            issue_date=datetime.now(),
            due_date=datetime.now() + timedelta(days=14)
        )
        session.add(issue)
        session.commit()
        session.refresh(issue)
        
        response = client.put(
            f"/issue/return/{issue.id}",
            json={"book_condition": "lost"},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
    
    @patch('router.issue_books.require_admin')
    def test_return_book_already_returned(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test returning already returned book"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        copy = sample_book.copies[0]
        
        issue = IssueBook(
            member_id=member_user.id,
            book_copy_id=copy.id,
            admin_id=admin_user.id,
            issue_date=datetime.now(),
            due_date=datetime.now() + timedelta(days=14),
            return_date=datetime.now()
        )
        session.add(issue)
        session.commit()
        session.refresh(issue)
        
        response = client.put(
            f"/issue/return/{issue.id}",
            json={"book_condition": "available"},
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400
        assert "already been returned" in response.json()["detail"].lower()
    
    @patch('router.issue_books.require_admin')
    def test_return_book_invalid_condition(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test returning book with invalid condition"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        copy = sample_book.copies[0]
        copy.status = bookStatus.ISSUED
        session.add(copy)
        
        issue = IssueBook(
            member_id=member_user.id,
            book_copy_id=copy.id,
            admin_id=admin_user.id,
            issue_date=datetime.now(),
            due_date=datetime.now() + timedelta(days=14)
        )
        session.add(issue)
        session.commit()
        session.refresh(issue)
        
        response = client.put(
            f"/issue/return/{issue.id}",
            json={"book_condition": "issued"},  # Invalid for return
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 400


class TestGetAllIssuedBooks:
    """Test GET /issue/issued - Admin gets all issued books"""
    
    @patch('router.issue_books.require_admin')
    def test_get_issued_books_success(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test getting all currently issued books"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create issued books
        for i, copy in enumerate(sample_book.copies[:2]):
            copy.status = bookStatus.ISSUED
            session.add(copy)
            
            issue = IssueBook(
                member_id=member_user.id,
                book_copy_id=copy.id,
                admin_id=admin_user.id,
                issue_date=datetime.now(),
                due_date=datetime.now() + timedelta(days=14)
            )
            session.add(issue)
        session.commit()
        
        response = client.get(
            "/issue/issued",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(book["return_date"] is None for book in data)
    
    @patch('router.issue_books.require_admin')
    def test_get_issued_books_include_returned(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test getting all issued books including returned ones"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create issued and returned books
        for i, copy in enumerate(sample_book.copies[:2]):
            issue = IssueBook(
                member_id=member_user.id,
                book_copy_id=copy.id,
                admin_id=admin_user.id,
                issue_date=datetime.now(),
                due_date=datetime.now() + timedelta(days=14),
                return_date=datetime.now() if i == 0 else None
            )
            session.add(issue)
        session.commit()
        
        response = client.get(
            "/issue/issued?include_returned=true",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
    
    @patch('router.issue_books.require_admin')
    def test_get_issued_books_empty(self, mock_auth, client, admin_user):
        """Test getting issued books when none exist"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        response = client.get(
            "/issue/issued",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        assert response.json() == []


class TestGetOverdueBooks:
    """Test GET /issue/overdue - Admin gets overdue books"""
    
    @patch('router.issue_books.require_admin')
    def test_get_overdue_books_success(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test getting overdue books"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create overdue book
        copy = sample_book.copies[0]
        copy.status = bookStatus.ISSUED
        session.add(copy)
        
        issue = IssueBook(
            member_id=member_user.id,
            book_copy_id=copy.id,
            admin_id=admin_user.id,
            issue_date=datetime.now() - timedelta(days=20),
            due_date=datetime.now() - timedelta(days=6)  # Overdue by 6 days
        )
        session.add(issue)
        session.commit()
        
        response = client.get(
            "/issue/overdue",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["is_overdue"] is True
    
    @patch('router.issue_books.require_admin')
    def test_get_overdue_books_none(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test getting overdue books when none are overdue"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create non-overdue book
        copy = sample_book.copies[0]
        copy.status = bookStatus.ISSUED
        session.add(copy)
        
        issue = IssueBook(
            member_id=member_user.id,
            book_copy_id=copy.id,
            admin_id=admin_user.id,
            issue_date=datetime.now(),
            due_date=datetime.now() + timedelta(days=14)
        )
        session.add(issue)
        session.commit()
        
        response = client.get(
            "/issue/overdue",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        assert response.json() == []


class TestGetPendingRequests:
    """Test GET /issue/pending-requests - Admin gets pending borrow requests"""
    
    @patch('router.issue_books.require_admin')
    def test_get_pending_requests_success(self, mock_auth, client, admin_user, member_user, sample_book, session):
        """Test getting pending borrow requests"""
        mock_auth.return_value = type('User', (), {'email': admin_user.email})()
        
        # Create pending requests
        for _ in range(3):
            request = BookRequest(
                request_type=requestType.BORROW,
                member_id=member_user.id,
                book_id=sample_book.id,
                status=requestStatus.PENDING
            )
            session.add(request)
        session.commit()
        
        response = client.get(
            "/issue/pending-requests",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all(r["status"] == "pending" for r in data)


class TestMemberGetIssuedBooks:
    """Test GET /issue/my-issued-books - Member gets their issued books"""
    
    @patch('router.issue_books.require_member_or_admin')
    def test_member_get_issued_books_success(self, mock_auth, client, member_user, sample_book, admin_user, session):
        """Test member getting their issued books"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        # Create issued books
        for copy in sample_book.copies[:2]:
            copy.status = bookStatus.ISSUED
            session.add(copy)
            
            issue = IssueBook(
                member_id=member_user.id,
                book_copy_id=copy.id,
                admin_id=admin_user.id,
                issue_date=datetime.now(),
                due_date=datetime.now() + timedelta(days=14)
            )
            session.add(issue)
        session.commit()
        
        response = client.get(
            "/issue/my-issued-books",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
    
    @patch('router.issue_books.require_member_or_admin')
    def test_member_get_issued_books_empty(self, mock_auth, client, member_user):
        """Test member getting issued books when none exist"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.get(
            "/issue/my-issued-books",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        assert response.json() == []
    
    @patch('router.issue_books.require_member_or_admin')
    def test_member_get_issued_books_with_history(self, mock_auth, client, member_user, sample_book, admin_user, session):
        """Test member getting issued books including history"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        # Create issued and returned books
        for i, copy in enumerate(sample_book.copies[:2]):
            issue = IssueBook(
                member_id=member_user.id,
                book_copy_id=copy.id,
                admin_id=admin_user.id,
                issue_date=datetime.now(),
                due_date=datetime.now() + timedelta(days=14),
                return_date=datetime.now() if i == 0 else None
            )
            session.add(issue)
        session.commit()
        
        response = client.get(
            "/issue/my-issued-books?include_returned=true",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2


class TestMemberGetIssueDetails:
    """Test GET /issue/my-issued-books/{issue_id} - Member gets specific issue details"""
    
    @patch('router.issue_books.require_member_or_admin')
    def test_member_get_issue_details_success(self, mock_auth, client, member_user, sample_book, admin_user, session):
        """Test member getting their issue details"""
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        copy = sample_book.copies[0]
        copy.status = bookStatus.ISSUED
        session.add(copy)
        
        issue = IssueBook(
            member_id=member_user.id,
            book_copy_id=copy.id,
            admin_id=admin_user.id,
            issue_date=datetime.now(),
            due_date=datetime.now() + timedelta(days=14)
        )
        session.add(issue)
        session.commit()
        session.refresh(issue)
        
        response = client.get(
            f"/issue/my-issued-books/{issue.id}",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == issue.id
    
    @patch('router.issue_books.require_member_or_admin')
    def test_member_get_issue_details_wrong_member(self, mock_auth, client, member_user, sample_book, admin_user, session):
        """Test member trying to get another member's issue"""
        from models import Member, userRole
        
        # Create another member
        other_member = Member(
            name="Other Member",
            email="other@test.com",
            role=userRole.MEMBER
        )
        session.add(other_member)
        session.commit()
        
        # Create issue for other member
        copy = sample_book.copies[0]
        issue = IssueBook(
            member_id=other_member.id,
            book_copy_id=copy.id,
            admin_id=admin_user.id,
            issue_date=datetime.now(),
            due_date=datetime.now() + timedelta(days=14)
        )
        session.add(issue)
        session.commit()
        session.refresh(issue)
        
        # Try to access as original member
        mock_auth.return_value = type('User', (), {'email': member_user.email})()
        
        response = client.get(
            f"/issue/my-issued-books/{issue.id}",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 403
