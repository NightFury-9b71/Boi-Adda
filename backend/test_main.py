"""
Test suite for the library management system API.
Following SQLModel documentation test patterns with pytest and FastAPI TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from io import BytesIO

from main import app
from db import get_session
from models import Admin, Member, Book, BookCopy, BookRequest, IssueBook, bookStatus


# Create in-memory SQLite database for testing
@pytest.fixture(name="session")
def session_fixture():
    """Create a fresh database session for each test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create a test client with the test database session."""
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# ============================================================================
# Database Setup Fixtures
# ============================================================================

@pytest.fixture(name="test_admin")
def test_admin_fixture(session: Session):
    """Create a test admin user."""
    admin = Admin(
        name="Test Admin",
        email="admin@test.com",
        role="ADMIN"
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)
    return admin


@pytest.fixture(name="test_member")
def test_member_fixture(session: Session):
    """Create a test member user."""
    member = Member(
        name="Test Member",
        email="member@test.com",
        role="MEMBER"
    )
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@pytest.fixture(name="test_book")
def test_book_fixture(session: Session):
    """Create a test book with copies."""
    book = Book(
        title="Test Book",
        author="Test Author",
        published_year=2024,
        pages=200
    )
    session.add(book)
    session.commit()
    session.refresh(book)
    
    # Add book copies
    for _ in range(3):
        copy = BookCopy(book_id=book.id, status=bookStatus.AVAILABLE)
        session.add(copy)
    
    session.commit()
    session.refresh(book)
    return book


# ============================================================================
# Book Images Router Tests
# ============================================================================

class TestBookImages:
    """Tests for book cover image endpoints."""
    
    def test_get_book_with_no_cover(self, client: TestClient, test_book: Book):
        """Test getting book details when no cover is uploaded."""
        response = client.get(f"/images/books/{test_book.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_book.id
        assert data["title"] == "Test Book"
        assert data["cover_image_url"] is None
    
    def test_get_nonexistent_book(self, client: TestClient):
        """Test getting a book that doesn't exist."""
        response = client.get("/images/books/999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_upload_cover_requires_auth(self, client: TestClient, test_book: Book):
        """Test that uploading book cover requires authentication."""
        files = {"file": ("test.jpg", b"fake image content", "image/jpeg")}
        response = client.post(f"/images/books/{test_book.id}/cover", files=files)
        assert response.status_code == 403  # Unauthorized
    
    def test_delete_cover_requires_auth(self, client: TestClient, test_book: Book):
        """Test that deleting book cover requires authentication."""
        response = client.delete(f"/images/books/{test_book.id}/cover")
        assert response.status_code == 403  # Unauthorized


# ============================================================================
# Borrow Books Router Tests
# ============================================================================

class TestBorrowBooks:
    """Tests for borrow books endpoints."""
    
    def test_get_available_books_empty(self, client: TestClient):
        """Test getting available books when none exist."""
        response = client.get("/borrow/available-books")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_available_books(self, client: TestClient, test_book: Book):
        """Test getting available books."""
        response = client.get("/borrow/available-books")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Test Book"
        assert data[0]["available_copies"] == 3
        assert data[0]["total_copies"] == 3
        assert "cover_image_url" in data[0]
    
    def test_create_borrow_request_requires_auth(self, client: TestClient, test_book: Book):
        """Test that creating borrow request requires authentication."""
        response = client.post(
            "/borrow/request",
            json={"book_id": test_book.id}
        )
        assert response.status_code == 403
    
    def test_get_borrow_requests_requires_auth(self, client: TestClient):
        """Test that getting borrow requests requires authentication."""
        response = client.get("/borrow/requests")
        assert response.status_code == 403


# ============================================================================
# Upload Books Router Tests
# ============================================================================

class TestUploadBooks:
    """Tests for upload books endpoints."""
    
    def test_upload_book_requires_auth(self, client: TestClient):
        """Test that uploading books requires admin authentication."""
        book_data = {
            "title": "New Book",
            "author": "New Author",
            "published_year": 2024,
            "pages": 300,
            "copies_to_add": 2
        }
        response = client.post("/upload-books/", json=book_data)
        assert response.status_code == 403


# ============================================================================
# Donate Books Router Tests
# ============================================================================

class TestDonateBooks:
    """Tests for donate books endpoints."""
    
    def test_create_donation_requires_auth(self, client: TestClient):
        """Test that creating donation request requires authentication."""
        donation_data = {
            "donation_title": "Donated Book",
            "donation_author": "Donor Author",
            "donation_year": 2024,
            "donation_pages": 250
        }
        response = client.post("/donate/request", json=donation_data)
        assert response.status_code == 403
    
    def test_get_pending_donations_requires_admin(self, client: TestClient):
        """Test that getting pending donations requires admin privileges."""
        response = client.get("/donate/pending-requests")
        assert response.status_code == 403


# ============================================================================
# Issue Books Router Tests
# ============================================================================

class TestIssueBooks:
    """Tests for issue books endpoints."""
    
    def test_get_issued_books_requires_admin(self, client: TestClient):
        """Test that getting all issued books requires admin."""
        response = client.get("/issue/issued")
        assert response.status_code == 403
    
    def test_get_overdue_books_requires_admin(self, client: TestClient):
        """Test that getting overdue books requires admin."""
        response = client.get("/issue/overdue")
        assert response.status_code == 403
    
    def test_get_my_issued_books_requires_auth(self, client: TestClient):
        """Test that getting personal issued books requires authentication."""
        response = client.get("/issue/my-issued-books")
        assert response.status_code == 403
    
    def test_approve_request_requires_admin(self, client: TestClient):
        """Test that approving requests requires admin."""
        response = client.post("/issue/approve-request/1")
        assert response.status_code == 403
    
    def test_return_book_requires_admin(self, client: TestClient):
        """Test that returning books requires admin."""
        response = client.put(
            "/issue/return/1",
            json={"book_condition": "AVAILABLE"}
        )
        assert response.status_code == 403


# ============================================================================
# Database Model Tests
# ============================================================================

class TestModels:
    """Tests for database models."""
    
    def test_create_admin(self, session: Session):
        """Test creating an admin user."""
        admin = Admin(name="Admin", email="admin@example.com", role="ADMIN")
        session.add(admin)
        session.commit()
        session.refresh(admin)
        
        assert admin.id is not None
        assert admin.name == "Admin"
        assert admin.role.value == "admin"  # Enum value comparison
    
    def test_create_member(self, session: Session):
        """Test creating a member user."""
        member = Member(name="Member", email="member@example.com", role="MEMBER")
        session.add(member)
        session.commit()
        session.refresh(member)
        
        assert member.id is not None
        assert member.name == "Member"
        assert member.role.value == "member"  # Enum value comparison
        assert member.profile_photo_url is None
    
    def test_create_book(self, session: Session):
        """Test creating a book."""
        book = Book(
            title="Test Book",
            author="Test Author",
            published_year=2024,
            pages=300
        )
        session.add(book)
        session.commit()
        session.refresh(book)
        
        assert book.id is not None
        assert book.title == "Test Book"
        assert book.cover_image_url is None
    
    def test_create_book_copy(self, session: Session, test_book: Book):
        """Test creating a book copy."""
        copy = BookCopy(book_id=test_book.id, status=bookStatus.AVAILABLE)
        session.add(copy)
        session.commit()
        session.refresh(copy)
        
        assert copy.id is not None
        assert copy.book_id == test_book.id
        assert copy.status == bookStatus.AVAILABLE
    
    def test_book_with_profile_photo(self, session: Session):
        """Test that books can have cover image URLs."""
        book = Book(
            title="Book with Cover",
            author="Author",
            published_year=2024,
            pages=200,
            cover_image_url="https://example.com/cover.jpg"
        )
        session.add(book)
        session.commit()
        session.refresh(book)
        
        assert book.cover_image_url == "https://example.com/cover.jpg"
    
    def test_member_with_profile_photo(self, session: Session):
        """Test that members can have profile photos."""
        member = Member(
            name="Member",
            email="member@test.com",
            role="MEMBER",
            profile_photo_url="https://example.com/photo.jpg"
        )
        session.add(member)
        session.commit()
        session.refresh(member)
        
        assert member.profile_photo_url == "https://example.com/photo.jpg"
    
    def test_admin_with_profile_photo(self, session: Session):
        """Test that admins can have profile photos."""
        admin = Admin(
            name="Admin",
            email="admin@test.com",
            role="ADMIN",
            profile_photo_url="https://example.com/admin.jpg"
        )
        session.add(admin)
        session.commit()
        session.refresh(admin)
        
        assert admin.profile_photo_url == "https://example.com/admin.jpg"


# ============================================================================
# Integration Tests
# ============================================================================

class TestIntegration:
    """Integration tests for complete workflows."""
    
    def test_book_lifecycle(self, session: Session):
        """Test complete book lifecycle from creation to availability."""
        # Create book
        book = Book(
            title="Integration Test Book",
            author="Test Author",
            published_year=2024,
            pages=400
        )
        session.add(book)
        session.commit()
        session.refresh(book)
        
        # Add copies
        copy1 = BookCopy(book_id=book.id, status=bookStatus.AVAILABLE)
        copy2 = BookCopy(book_id=book.id, status=bookStatus.AVAILABLE)
        session.add(copy1)
        session.add(copy2)
        session.commit()
        
        # Verify book has copies
        session.refresh(book)
        assert len(book.copies) == 2
        assert all(c.status == bookStatus.AVAILABLE for c in book.copies)
    
    def test_available_books_endpoint_integration(
        self, 
        client: TestClient, 
        session: Session
    ):
        """Test the available books endpoint with multiple books."""
        # Create books with different availability
        book1 = Book(title="Book 1", author="Author 1", published_year=2024, pages=200)
        book2 = Book(title="Book 2", author="Author 2", published_year=2024, pages=300)
        book3 = Book(title="Book 3", author="Author 3", published_year=2024, pages=400)
        
        session.add_all([book1, book2, book3])
        session.commit()
        
        # Book 1: 2 available copies
        session.add_all([
            BookCopy(book_id=book1.id, status=bookStatus.AVAILABLE),
            BookCopy(book_id=book1.id, status=bookStatus.AVAILABLE),
        ])
        
        # Book 2: 1 available, 1 issued
        session.add_all([
            BookCopy(book_id=book2.id, status=bookStatus.AVAILABLE),
            BookCopy(book_id=book2.id, status=bookStatus.ISSUED),
        ])
        
        # Book 3: 0 available (all issued)
        session.add_all([
            BookCopy(book_id=book3.id, status=bookStatus.ISSUED),
        ])
        
        session.commit()
        
        # Test endpoint
        response = client.get("/borrow/available-books")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2  # Only books with available copies
        
        titles = {book["title"] for book in data}
        assert "Book 1" in titles
        assert "Book 2" in titles
        assert "Book 3" not in titles
        
        # Check available counts
        for book in data:
            if book["title"] == "Book 1":
                assert book["available_copies"] == 2
                assert book["total_copies"] == 2
            elif book["title"] == "Book 2":
                assert book["available_copies"] == 1
                assert book["total_copies"] == 2


# ============================================================================
# Run tests with: pytest test_main.py -v
# Run with coverage: pytest test_main.py -v --cov=. --cov-report=html
# ============================================================================
