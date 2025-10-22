"""
Shared test fixtures and configuration
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from main import app
from db import get_session
from models import Admin, Member, Book, BookCopy, bookStatus, userRole
from auth import get_current_user, require_admin, require_member_or_admin
import os
from dotenv import load_dotenv
from unittest.mock import Mock

load_dotenv()

# Test database setup
@pytest.fixture(name="session", scope="function")
def session_fixture():
    """Create a fresh database session for each test"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
        session.rollback()


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create a test client with overridden database session"""
    def get_session_override():
        yield session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app, raise_server_exceptions=False)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="admin_user")
def admin_user_fixture(session: Session):
    """Create an admin user for testing"""
    admin = Admin(
        name="Test Admin",
        email="admin@test.com",
        role=userRole.ADMIN
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)
    return admin


@pytest.fixture(name="member_user")
def member_user_fixture(session: Session):
    """Create a member user for testing"""
    member = Member(
        name="Test Member",
        email="member@test.com",
        role=userRole.MEMBER
    )
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@pytest.fixture(name="sample_book")
def sample_book_fixture(session: Session):
    """Create a sample book with copies"""
    book = Book(
        title="Test Book",
        author="Test Author",
        published_year=2020,
        pages=300
    )
    session.add(book)
    session.commit()
    session.refresh(book)
    
    # Add 3 copies
    for _ in range(3):
        copy = BookCopy(
            book_id=book.id,
            status=bookStatus.AVAILABLE
        )
        session.add(copy)
    
    session.commit()
    session.refresh(book)
    return book


@pytest.fixture(name="auth_admin")
def auth_admin_fixture(admin_user, client):
    """Mock authentication for admin user and override auth dependencies"""
    mock_user = Mock()
    mock_user.email = admin_user.email
    mock_user.id = 'mock-admin-id'
    mock_user.user_metadata = {'role': 'admin', 'name': admin_user.name}
    
    # Override auth dependencies
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[require_admin] = lambda: mock_user
    app.dependency_overrides[require_member_or_admin] = lambda: mock_user
    
    yield mock_user
    
    # Clean up overrides
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]
    if require_admin in app.dependency_overrides:
        del app.dependency_overrides[require_admin]
    if require_member_or_admin in app.dependency_overrides:
        del app.dependency_overrides[require_member_or_admin]


@pytest.fixture(name="auth_member")
def auth_member_fixture(member_user, client):
    """Mock authentication for member user and override auth dependencies"""
    mock_user = Mock()
    mock_user.email = member_user.email
    mock_user.id = 'mock-member-id'
    mock_user.user_metadata = {'role': 'member', 'name': member_user.name}
    
    # Override auth dependencies
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[require_member_or_admin] = lambda: mock_user
    
    yield mock_user
    
    # Clean up overrides
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]
    if require_member_or_admin in app.dependency_overrides:
        del app.dependency_overrides[require_member_or_admin]
