"""
Comprehensive tests for authentication endpoints
Tests: /auth/* routes
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from auth import get_current_user, require_admin, require_member_or_admin


class TestSignUp:
    """Test user registration endpoint"""
    
    @patch('auth.supabase')
    def test_signup_success_member(self, mock_supabase, client):
        """Test successful member registration"""
        mock_response = Mock()
        mock_response.user = Mock(id="user123", email="newuser@test.com")
        mock_response.session = Mock(access_token="token", refresh_token="refresh")
        mock_supabase.auth.sign_up.return_value = mock_response
        
        response = client.post("/auth/signup", json={
            "email": "newuser@test.com",
            "password": "SecurePass123",
            "name": "New User",
            "role": "member"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "newuser@test.com"
        assert data["user"]["role"] == "member"
        assert "access_token" in data
    
    @patch('auth.supabase')
    def test_signup_success_admin(self, mock_supabase, client):
        """Test successful admin registration"""
        mock_response = Mock()
        mock_response.user = Mock(id="admin123", email="admin@test.com")
        mock_response.session = Mock(access_token="token", refresh_token="refresh")
        mock_supabase.auth.sign_up.return_value = mock_response
        
        response = client.post("/auth/signup", json={
            "email": "admin@test.com",
            "password": "AdminPass123",
            "name": "Admin User",
            "role": "admin"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "admin"
    
    @patch('auth.supabase')
    def test_signup_invalid_email(self, mock_supabase, client):
        """Test signup with invalid email format"""
        response = client.post("/auth/signup", json={
            "email": "invalid-email",
            "password": "SecurePass123",
            "name": "Test User"
        })
        
        assert response.status_code == 422  # Validation error
    
    @patch('auth.supabase')
    def test_signup_missing_password(self, mock_supabase, client):
        """Test signup without password"""
        response = client.post("/auth/signup", json={
            "email": "test@test.com",
            "name": "Test User"
        })
        
        assert response.status_code == 422
    
    @patch('auth.supabase')
    def test_signup_duplicate_email(self, mock_supabase, client):
        """Test signup with existing email"""
        mock_supabase.auth.sign_up.side_effect = Exception("User already exists")
        
        response = client.post("/auth/signup", json={
            "email": "existing@test.com",
            "password": "SecurePass123",
            "name": "Test User"
        })
        
        assert response.status_code == 400
    
    @patch('auth.supabase')
    def test_signup_weak_password(self, mock_supabase, client):
        """Test signup with weak password"""
        mock_supabase.auth.sign_up.side_effect = Exception("Password is too weak")
        
        response = client.post("/auth/signup", json={
            "email": "test@test.com",
            "password": "123",
            "name": "Test User"
        })
        
        assert response.status_code == 400
    
    @patch('auth.supabase')
    def test_signup_empty_name(self, mock_supabase, client):
        """Test signup with empty name"""
        response = client.post("/auth/signup", json={
            "email": "test@test.com",
            "password": "SecurePass123",
            "name": ""
        })
        
        assert response.status_code == 422


class TestSignIn:
    """Test user sign in endpoint"""
    
    @patch('auth.supabase')
    def test_signin_success(self, mock_supabase, client):
        """Test successful sign in"""
        mock_response = Mock()
        mock_response.user = Mock(
            id="user123",
            email="test@test.com",
            user_metadata={"name": "Test User", "role": "member"}
        )
        mock_response.session = Mock(access_token="token", refresh_token="refresh")
        mock_supabase.auth.sign_in_with_password.return_value = mock_response
        
        response = client.post("/auth/signin", json={
            "email": "test@test.com",
            "password": "SecurePass123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "test@test.com"
    
    @patch('auth.supabase')
    def test_signin_invalid_credentials(self, mock_supabase, client):
        """Test sign in with wrong password"""
        mock_supabase.auth.sign_in_with_password.side_effect = Exception("Invalid credentials")
        
        response = client.post("/auth/signin", json={
            "email": "test@test.com",
            "password": "WrongPassword"
        })
        
        assert response.status_code == 401
    
    @patch('auth.supabase')
    def test_signin_nonexistent_user(self, mock_supabase, client):
        """Test sign in with non-existent email"""
        mock_supabase.auth.sign_in_with_password.side_effect = Exception("User not found")
        
        response = client.post("/auth/signin", json={
            "email": "nonexistent@test.com",
            "password": "SecurePass123"
        })
        
        assert response.status_code == 401
    
    @patch('auth.supabase')
    def test_signin_missing_email(self, mock_supabase, client):
        """Test sign in without email"""
        response = client.post("/auth/signin", json={
            "password": "SecurePass123"
        })
        
        assert response.status_code == 422
    
    @patch('auth.supabase')
    def test_signin_no_session(self, mock_supabase, client):
        """Test sign in with no session returned"""
        mock_response = Mock()
        mock_response.session = None
        mock_supabase.auth.sign_in_with_password.return_value = mock_response
        
        response = client.post("/auth/signin", json={
            "email": "test@test.com",
            "password": "SecurePass123"
        })
        
        assert response.status_code == 401


class TestSignOut:
    """Test user sign out endpoint"""
    
    @patch('auth.supabase')
    @patch('auth.get_current_user')
    def test_signout_success(self, mock_get_user, mock_supabase, client):
        """Test successful sign out"""
        mock_get_user.return_value = Mock(email="test@test.com")
        
        response = client.post(
            "/auth/signout",
            headers={"Authorization": "Bearer valid_token"}
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "Signed out successfully"
    
    def test_signout_no_auth(self, client):
        """Test sign out without authentication"""
        response = client.post("/auth/signout")
        
        assert response.status_code == 403  # No auth header


class TestGetMe:
    """Test get current user endpoint"""
    
    @patch('auth.get_current_user')
    def test_get_me_member(self, mock_get_user, client, member_user):
        """Test get current user as member"""
        mock_get_user.return_value = Mock(
            id="user123",
            email=member_user.email,
            user_metadata={"name": member_user.name, "role": "member"}
        )
        
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == member_user.email
        assert data["role"] == "member"
    
    @patch('auth.get_current_user')
    def test_get_me_admin(self, mock_get_user, client, admin_user):
        """Test get current user as admin"""
        mock_get_user.return_value = Mock(
            id="admin123",
            email=admin_user.email,
            user_metadata={"name": admin_user.name, "role": "admin"}
        )
        
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == admin_user.email
        assert data["role"] == "admin"
    
    def test_get_me_no_auth(self, client):
        """Test get current user without authentication"""
        response = client.get("/auth/me")
        
        assert response.status_code == 403


class TestRefreshToken:
    """Test token refresh endpoint"""
    
    @patch('auth.supabase')
    def test_refresh_token_success(self, mock_supabase, client):
        """Test successful token refresh"""
        mock_response = Mock()
        mock_response.user = Mock(
            id="user123",
            email="test@test.com",
            user_metadata={"name": "Test User", "role": "member"}
        )
        mock_response.session = Mock(access_token="new_token", refresh_token="new_refresh")
        mock_supabase.auth.refresh_session.return_value = mock_response
        
        response = client.post("/auth/refresh?refresh_token=valid_refresh_token")
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
    
    @patch('auth.supabase')
    def test_refresh_token_invalid(self, mock_supabase, client):
        """Test refresh with invalid token"""
        mock_response = Mock()
        mock_response.session = None
        mock_supabase.auth.refresh_session.return_value = mock_response
        
        response = client.post("/auth/refresh?refresh_token=invalid_token")
        
        assert response.status_code == 401
    
    @patch('auth.supabase')
    def test_refresh_token_expired(self, mock_supabase, client):
        """Test refresh with expired token"""
        mock_supabase.auth.refresh_session.side_effect = Exception("Token expired")
        
        response = client.post("/auth/refresh?refresh_token=expired_token")
        
        assert response.status_code == 401


class TestProfilePhoto:
    """Test profile photo upload/delete endpoints"""
    
    @patch('auth.get_current_user')
    @patch('auth.upload_profile_photo')
    def test_upload_profile_photo_member(self, mock_upload, mock_get_user, client, member_user):
        """Test member uploading profile photo"""
        mock_get_user.return_value = Mock(
            email=member_user.email,
            user_metadata={"role": "member"}
        )
        mock_upload.return_value = "https://storage.url/photo.jpg"
        
        response = client.post(
            "/auth/profile-photo",
            headers={"Authorization": "Bearer token"},
            files={"file": ("photo.jpg", b"fake image data", "image/jpeg")}
        )
        
        assert response.status_code == 200
        assert "uploaded successfully" in response.json()["message"]
    
    @patch('auth.get_current_user')
    @patch('auth.upload_profile_photo')
    def test_upload_profile_photo_admin(self, mock_upload, mock_get_user, client, admin_user):
        """Test admin uploading profile photo"""
        mock_get_user.return_value = Mock(
            email=admin_user.email,
            user_metadata={"role": "admin"}
        )
        mock_upload.return_value = "https://storage.url/photo.jpg"
        
        response = client.post(
            "/auth/profile-photo",
            headers={"Authorization": "Bearer token"},
            files={"file": ("photo.jpg", b"fake image data", "image/jpeg")}
        )
        
        assert response.status_code == 200
    
    @patch('auth.get_current_user')
    def test_upload_profile_photo_guest(self, mock_get_user, client):
        """Test guest user cannot upload profile photo"""
        mock_get_user.return_value = Mock(
            email="guest@test.com",
            user_metadata={"role": "guest"}
        )
        
        response = client.post(
            "/auth/profile-photo",
            headers={"Authorization": "Bearer token"},
            files={"file": ("photo.jpg", b"fake image data", "image/jpeg")}
        )
        
        assert response.status_code == 403
    
    def test_upload_profile_photo_no_auth(self, client):
        """Test uploading profile photo without authentication"""
        response = client.post(
            "/auth/profile-photo",
            files={"file": ("photo.jpg", b"fake image data", "image/jpeg")}
        )
        
        assert response.status_code == 403
    
    @patch('auth.get_current_user')
    @patch('auth.delete_profile_photo')
    def test_delete_profile_photo_success(self, mock_delete, mock_get_user, client, member_user):
        """Test deleting profile photo"""
        mock_get_user.return_value = Mock(
            email=member_user.email,
            user_metadata={"role": "member"}
        )
        
        response = client.delete(
            "/auth/profile-photo",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]


class TestPasswordReset:
    """Test password reset endpoints"""
    
    @patch('auth.supabase')
    def test_forgot_password_success(self, mock_supabase, client):
        """Test forgot password request"""
        response = client.post("/auth/forgot-password?email=test@test.com")
        
        assert response.status_code == 200
        assert "reset email sent" in response.json()["message"]
    
    @patch('auth.supabase')
    def test_forgot_password_invalid_email(self, mock_supabase, client):
        """Test forgot password with invalid email"""
        mock_supabase.auth.reset_password_email.side_effect = Exception("Invalid email")
        
        response = client.post("/auth/forgot-password?email=invalid@test.com")
        
        assert response.status_code == 400
    
    @patch('auth.supabase')
    def test_reset_password_success(self, mock_supabase, client):
        """Test password reset with token"""
        response = client.post(
            "/auth/reset-password?token=reset_token&new_password=NewSecurePass123"
        )
        
        assert response.status_code == 200
        assert "reset successfully" in response.json()["message"]
    
    @patch('auth.supabase')
    def test_reset_password_invalid_token(self, mock_supabase, client):
        """Test password reset with invalid token"""
        mock_supabase.auth.update_user.side_effect = Exception("Invalid token")
        
        response = client.post(
            "/auth/reset-password?token=invalid_token&new_password=NewPass123"
        )
        
        assert response.status_code == 400


class TestUpdateProfile:
    """Test profile update endpoint"""
    
    @patch('auth.supabase')
    @patch('auth.get_current_user')
    def test_update_profile_name(self, mock_get_user, mock_supabase, client):
        """Test updating profile name"""
        mock_get_user.return_value = Mock(
            id="user123",
            email="test@test.com",
            user_metadata={"name": "Old Name", "role": "member"}
        )
        
        mock_response = Mock()
        mock_response.user = Mock(
            id="user123",
            email="test@test.com",
            user_metadata={"name": "New Name", "role": "member"}
        )
        mock_supabase.auth.update_user.return_value = mock_response
        
        response = client.put(
            "/auth/update-profile?name=New%20Name",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
    
    @patch('auth.get_current_user')
    def test_update_profile_no_changes(self, mock_get_user, client):
        """Test update profile with no data"""
        mock_get_user.return_value = Mock(
            id="user123",
            email="test@test.com",
            user_metadata={"name": "Test", "role": "member"}
        )
        
        response = client.put(
            "/auth/update-profile",
            headers={"Authorization": "Bearer token"}
        )
        
        assert response.status_code == 200
