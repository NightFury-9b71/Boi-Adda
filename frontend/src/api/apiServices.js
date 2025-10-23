import API_ENDPOINTS from "./endpoints";
import apiClient from "./apiClient";

const apiServices = {

  database:{
    getOverviewStats: async() => {
      const response = await apiClient.get(API_ENDPOINTS.DATABASE.STATS);
      return response.data; // Return full data object with all stats
    }
  },

  auth: {
    login: async (credentials) => {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      return response.data;
    },
    register: async (userData) => {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    },
    verifyEmail: async (data) => {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, data);
      return response.data;
    },
    resendVerification: async (data) => {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, data);
      return response.data;
    },
    getCurrentUser: async () => {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
      return response.data;
    }
  },

  books: {
    getBooks: async (params = {}) => {
      const response = await apiClient.get(API_ENDPOINTS.BOOKS.LIST, { params });
      return response.data;
    },
    getBook: async (id) => {
      const response = await apiClient.get(API_ENDPOINTS.BOOKS.DETAIL(id));
      return response.data;
    },
    addBook: async (bookData) => {
      const response = await apiClient.post(API_ENDPOINTS.BOOKS.CREATE, bookData);
      return response.data;
    },
    searchBooks: async (query) => {
      const response = await apiClient.get(`${API_ENDPOINTS.BOOKS.SEARCH}?q=${query}`);
      return response.data;
    },
    updateBook: async (id, bookData) => {
      const response = await apiClient.put(API_ENDPOINTS.BOOKS.UPDATE(id), bookData);
      return response.data;
    },
    deleteBook: async (id) => {
      const response = await apiClient.delete(API_ENDPOINTS.BOOKS.DELETE(id));
      return response.data;
    }
  },

  categories: {
    getCategories: async () => {
      const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.LIST);
      return response.data;
    },
    getCategory: async (id) => {
      const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.DETAIL(id));
      return response.data;
    },
    createCategory: async (categoryData) => {
      const response = await apiClient.post(API_ENDPOINTS.CATEGORIES.CREATE, categoryData);
      return response.data;
    },
    updateCategory: async (id, categoryData) => {
      const response = await apiClient.put(API_ENDPOINTS.CATEGORIES.UPDATE(id), categoryData);
      return response.data;
    },
    deleteCategory: async (id) => {
      const response = await apiClient.delete(API_ENDPOINTS.CATEGORIES.DELETE(id));
      return response.data;
    }
  },

  bookCopies: {
    getAvailableForBook: async (bookId) => {
      const response = await apiClient.get(API_ENDPOINTS.BOOK_COPIES.AVAILABLE_FOR_BOOK(bookId));
      return response.data;
    },
    getBookCopy: async (id) => {
      const response = await apiClient.get(API_ENDPOINTS.BOOK_COPIES.DETAIL(id));
      return response.data;
    }
  },

  borrows: {
    getBorrows: async () => {
      const response = await apiClient.get(API_ENDPOINTS.BORROWS.LIST);
      return response.data;
    },
    createBorrow: async (borrowData) => {
      const response = await apiClient.post(API_ENDPOINTS.BORROWS.CREATE, borrowData);
      return response.data;
    },
    getBorrowHistory: async () => {
      const response = await apiClient.get(API_ENDPOINTS.BORROWS.LIST);
      return response.data;
    },
    cancelBorrow: async (borrowId) => {
      const response = await apiClient.put(`/borrows/${borrowId}/cancel`);
      return response.data;
    },
    returnBook: async (borrowId) => {
      const response = await apiClient.put(`/borrows/${borrowId}/return`);
      return response.data;
    }
  },

  donations: {
    getDonations: async () => {
      const response = await apiClient.get(API_ENDPOINTS.DONATIONS.LIST);
      return response.data;
    },
    createDonation: async (donationData) => {
      const response = await apiClient.post(API_ENDPOINTS.DONATIONS.CREATE, donationData);
      return response.data;
    },
    createDonationWithNewBook: async (donationData) => {
      const response = await apiClient.post('/donations/with-new-book', donationData);
      return response.data;
    },
    getDonationHistory: async () => {
      const response = await apiClient.get(API_ENDPOINTS.DONATIONS.LIST);
      return response.data;
    },
    cancelDonation: async (donationId) => {
      const response = await apiClient.put(`/donations/${donationId}/cancel`);
      return response.data;
    }
  },

  users: {
    getProfile: async (userId) => {
      const response = await apiClient.get(API_ENDPOINTS.USERS.PROFILE(userId));
      return response.data;
    },
    updateProfile: async (userData) => {
      const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE_PROFILE, userData);
      return response.data;
    },
    getUserStats: async () => {
      const response = await apiClient.get(API_ENDPOINTS.USERS.STATS);
      return response.data;
    },
    uploadProfileImage: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/users/me/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    uploadCoverImage: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/users/me/upload-cover-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
  },

  admin: {
    getDashboardStats: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.DASHBOARD_STATS);
      return response.data;
    },
    getOverviewStats: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.STATS_OVERVIEW);
      return response.data;
    },
    getUserStats: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.STATS_USERS);
      return response.data;
    },
    getBookStats: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.STATS_BOOKS);
      return response.data;
    },
    getBorrowStats: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.STATS_BORROWS);
      return response.data;
    },
    getBorrowRequests: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.BORROW_REQUESTS);
      return response.data;
    },
    getDonationStats: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.STATS_DONATIONS);
      return response.data;
    },
    getUsers: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.USERS);
      return response.data;
    },
    createUser: async (userData) => {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.USERS, userData);
      return response.data;
    },
    updateUserRole: async (userId, role) => {
      const response = await apiClient.put(API_ENDPOINTS.ADMIN.UPDATE_USER_ROLE(userId), null, {
        params: { new_role: role }
      });
      return response.data;
    },
    createIssue: async (issueData) => {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.ISSUE_BOOK, issueData);
      return response.data;
    },
    approveBorrow: async (borrowId) => {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.APPROVE_BORROW(borrowId));
      return response.data;
    },
    rejectBorrow: async (borrowId, reason) => {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.REJECT_BORROW(borrowId), { reason });
      return response.data;
    },
    handoverBook: async (borrowId) => {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.HANDOVER_BOOK(borrowId));
      return response.data;
    },
    returnBook: async (borrowId) => {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.RETURN_BOOK(borrowId));
      return response.data;
    },
    getDonationRequests: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.DONATION_REQUESTS);
      return response.data;
    },
    approveDonation: async (donationId) => {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.APPROVE_DONATION(donationId));
      return response.data;
    },
    completeDonation: async (donationId) => {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.COMPLETE_DONATION(donationId));
      return response.data;
    },
    rejectDonation: async (donationId, reason) => {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.REJECT_DONATION(donationId), { reason });
      return response.data;
    },
    updateUserStatus: async (userId, isActive) => {
      const response = await apiClient.put(API_ENDPOINTS.ADMIN.UPDATE_USER_STATUS(userId), null, {
        params: { is_active: isActive }
      });
      return response.data;
    },
    getUserBorrows: async (userId) => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.USER_BORROWS(userId));
      return response.data;
    },
    getUserDonations: async (userId) => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.USER_DONATIONS(userId));
      return response.data;
    },
    getSpecificUserStats: async (userId) => {
      const response = await apiClient.get(`/admin/users/${userId}/stats`);
      return response.data;
    },
    getTrendsData: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.STATS_TRENDS);
      return response.data;
    },
    getUserActivityData: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.STATS_USER_ACTIVITY);
      return response.data;
    }
  }
};

const authService = apiServices.auth;
const bookService = apiServices.books;
const borrowService = apiServices.borrows;
const donationService = apiServices.donations;
const userService = apiServices.users;
const adminService = apiServices.admin;

export default apiServices;
export {authService, bookService, borrowService, donationService, userService, adminService};
