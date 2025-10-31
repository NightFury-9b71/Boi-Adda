import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components';

import { PublicLayout, ProtectedLayout, AdminLayout } from '../layouts/Layout';

import LandingPage from '../pages/LandingPage';
import NotFound from '../pages/NotFound';
import DeveloperPage from '../pages/DeveloperPage';

import Book from '../components/book';

// Import all pages
import {
  SearchPage,
  BookDetailsPage,
  UserProfilePage,
  DonateBook,
  History,
  ProfilePage,
  BooksLibrary,
  DashboardPage
} from '../pages/user';

import {
  AdminDashboard,
  AdminUserManagement,
  AdminBorrowManagement,
  AdminDonationManagement,
  AdminBookManagement,
  AdminBookIssue,
  AdminStatistics,
  AdminCategoryManagement
} from '../pages/admin';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" replace />} 
      />

      {/* Unauthorized access routes */}
      <Route path="/unauthorized" element={<PublicLayout />}>
        <Route path="books" element={<BooksLibrary />} />
        <Route path="book" element={<Book />} />
      </Route>

      {/* Developer Portfolio Route */}
      <Route path="/developer" element={<DeveloperPage />} />

      {/* Protected User Routes */}
      <Route path="/" element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="books" element={<BooksLibrary />} />
        <Route path="books/:id" element={<BookDetailsPage />} />
        <Route path="donate" element={<DonateBook />} />
        <Route path="history" element={<History />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:userId" element={<UserProfilePage />} />
        <Route path="search" element={<SearchPage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUserManagement />} />
        <Route path="borrows" element={<AdminBorrowManagement />} />
        <Route path="donations" element={<AdminDonationManagement />} />
        <Route path="books" element={<AdminBookManagement />} />
        <Route path="statistics" element={<AdminStatistics />} />
        <Route path="issue" element={<AdminBookIssue />} />
        <Route path="categories" element={<AdminCategoryManagement />} />
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;