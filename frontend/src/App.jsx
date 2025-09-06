import { useState, createContext, useContext, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, useParams, Outlet } from 'react-router-dom';
import { BookOpen, User, HistoryIcon, Settings2, Bell, Menu, X, Home, Search, Gift, RefreshCw, Archive, Award, BookMarked, Clock, CheckCircle, AlertCircle, LogOut, Edit3, Download, Trash2, Lock, ChevronRight, BarChart3, Users, HeartHandshake, Library, TrendingUp, Cog, Star, MapPin, Phone, Mail, Calendar, Eye, Heart, Share2, MessageCircle, Filter, SortAsc, Plus, Construction } from 'lucide-react';

// Import page components
import ComingSoon from './pages/ComingSoon';
import SearchPage from './pages/SearchPage';
import BookDetailsPage from './pages/BookDetailsPage';
import UserProfilePage from './pages/UserProfilePage';
import DonateBook from './pages/DonateBook';
import History from './pages/History';
import ProfilePage from './pages/ProfilePage';
import BooksLibrary from './pages/BooksLibrary';
import DashboardWrapper from './pages/DashboardWrapper';
import LandingWrapper from './pages/LandingWrapper';

// Import admin components
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminBorrowManagement from './pages/admin/AdminBorrowManagement';
import AdminDonationManagement from './pages/admin/AdminDonationManagement';
import AdminBookManagement from './pages/admin/AdminBookManagement';

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle token and user management
api.interceptors.response.use(
  (response) => {
    // Handle successful login responses
    if (response.config.url?.includes(API_ENDPOINTS.AUTH.LOGIN) && response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    
    // Handle user data responses
    if (response.config.url?.includes(API_ENDPOINTS.AUTH.ME) && response.data) {
      localStorage.setItem('user_data', JSON.stringify(response.data));
    }
    
    return response;
  },
  (error) => {
    // Handle token expiration or invalid token
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      // You could also trigger a logout event here if needed
    }
    return Promise.reject(error);
  }
);

// API Endpoints
const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  // Book endpoints
  BOOKS: {
    LIST: '/books',
    DETAIL: (id) => `/books/${id}`,
    CREATE: '/books',
    SEARCH: '/books/search',
  },
  // Book Copy endpoints  
  BOOK_COPIES: {
    LIST: '/book-copies',
    DETAIL: (id) => `/book-copies/${id}`,
    AVAILABLE_FOR_BOOK: (bookId) => `/book-copies/book/${bookId}/available`,
  },
  // Category endpoints
  CATEGORIES: {
    LIST: '/categories',
    DETAIL: (id) => `/categories/${id}`,
    CREATE: '/categories',
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },
  // Borrow endpoints
  BORROWS: {
    LIST: '/borrows',
    CREATE: '/borrows',
    HISTORY: '/borrows/history',
  },
  // Donation endpoints
  DONATIONS: {
    LIST: '/donations',
    CREATE: '/donations',
    HISTORY: '/donations/history',
  },
  // User endpoints
  USERS: {
    PROFILE: (userId) => `/users/${userId}`,
    UPDATE_PROFILE: '/users/me',
    STATS: '/users/me/stats',
  },
  // Admin endpoints
  ADMIN: {
    DASHBOARD_STATS: '/admin/dashboard/stats',
    USERS: '/admin/users',
    UPDATE_USER_ROLE: (userId) => `/admin/users/${userId}/role`,
    BORROW_REQUESTS: '/admin/borrows',
    APPROVE_BORROW: (borrowId) => `/admin/borrows/${borrowId}/approve`,
    REJECT_BORROW: (borrowId) => `/admin/borrows/${borrowId}/reject`,
    DONATION_REQUESTS: '/admin/donations',
    APPROVE_DONATION: (donationId) => `/admin/donations/${donationId}/approve`,
  },
};

// API Services
const apiServices = {
  auth: {
    login: async (credentials) => {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      return response.data;
    },
    register: async (userData) => {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    },
    getCurrentUser: async () => {
      const response = await api.get(API_ENDPOINTS.AUTH.ME);
      return response.data;
    }
  },

  books: {
    getBooks: async (params = {}) => {
      const response = await api.get(API_ENDPOINTS.BOOKS.LIST, { params });
      return response.data;
    },
    getBook: async (id) => {
      const response = await api.get(API_ENDPOINTS.BOOKS.DETAIL(id));
      return response.data;
    },
    addBook: async (bookData) => {
      const response = await api.post(API_ENDPOINTS.BOOKS.CREATE, bookData);
      return response.data;
    },
    searchBooks: async (query) => {
      const response = await api.get(`${API_ENDPOINTS.BOOKS.SEARCH}?q=${query}`);
      return response.data;
    }
  },

  categories: {
    getCategories: async () => {
      const response = await api.get(API_ENDPOINTS.CATEGORIES.LIST);
      return response.data;
    },
    getCategory: async (id) => {
      const response = await api.get(API_ENDPOINTS.CATEGORIES.DETAIL(id));
      return response.data;
    },
    createCategory: async (categoryData) => {
      const response = await api.post(API_ENDPOINTS.CATEGORIES.CREATE, categoryData);
      return response.data;
    },
    updateCategory: async (id, categoryData) => {
      const response = await api.put(API_ENDPOINTS.CATEGORIES.UPDATE(id), categoryData);
      return response.data;
    },
    deleteCategory: async (id) => {
      const response = await api.delete(API_ENDPOINTS.CATEGORIES.DELETE(id));
      return response.data;
    }
  },

  bookCopies: {
    getAvailableForBook: async (bookId) => {
      const response = await api.get(API_ENDPOINTS.BOOK_COPIES.AVAILABLE_FOR_BOOK(bookId));
      return response.data;
    },
    getBookCopy: async (id) => {
      const response = await api.get(API_ENDPOINTS.BOOK_COPIES.DETAIL(id));
      return response.data;
    }
  },

  borrows: {
    getBorrows: async () => {
      const response = await api.get(API_ENDPOINTS.BORROWS.LIST);
      return response.data;
    },
    createBorrow: async (borrowData) => {
      const response = await api.post(API_ENDPOINTS.BORROWS.CREATE, borrowData);
      return response.data;
    },
    getBorrowHistory: async () => {
      const response = await api.get(API_ENDPOINTS.BORROWS.LIST);
      return response.data;
    },
    cancelBorrow: async (borrowId) => {
      const response = await api.put(`/borrows/${borrowId}/cancel`);
      return response.data;
    }
  },

  donations: {
    getDonations: async () => {
      const response = await api.get(API_ENDPOINTS.DONATIONS.LIST);
      return response.data;
    },
    createDonation: async (donationData) => {
      const response = await api.post(API_ENDPOINTS.DONATIONS.CREATE, donationData);
      return response.data;
    },
    createDonationWithNewBook: async (donationData) => {
      const response = await api.post('/donations/with-new-book', donationData);
      return response.data;
    },
    getDonationHistory: async () => {
      const response = await api.get(API_ENDPOINTS.DONATIONS.LIST);
      return response.data;
    },
    cancelDonation: async (donationId) => {
      const response = await api.put(`/donations/${donationId}/cancel`);
      return response.data;
    }
  },

  users: {
    getProfile: async (userId) => {
      const response = await api.get(API_ENDPOINTS.USERS.PROFILE(userId));
      return response.data;
    },
    updateProfile: async (userData) => {
      const response = await api.put(API_ENDPOINTS.USERS.UPDATE_PROFILE, userData);
      return response.data;
    },
    getUserStats: async () => {
      const response = await api.get(API_ENDPOINTS.USERS.STATS);
      return response.data;
    },
    uploadProfileImage: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/users/me/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    uploadCoverImage: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/users/me/upload-cover-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
  },

  admin: {
    getDashboardStats: async () => {
      const response = await api.get(API_ENDPOINTS.ADMIN.DASHBOARD_STATS);
      return response.data;
    },
    getUsers: async () => {
      const response = await api.get(API_ENDPOINTS.ADMIN.USERS);
      return response.data;
    },
    updateUserRole: async (userId, role) => {
      const response = await api.put(API_ENDPOINTS.ADMIN.UPDATE_USER_ROLE(userId), { role });
      return response.data;
    },
    getBorrowRequests: async () => {
      const response = await api.get(API_ENDPOINTS.ADMIN.BORROW_REQUESTS);
      return response.data;
    },
    approveBorrow: async (borrowId) => {
      const response = await api.post(API_ENDPOINTS.ADMIN.APPROVE_BORROW(borrowId));
      return response.data;
    },
    rejectBorrow: async (borrowId, reason) => {
      const response = await api.post(API_ENDPOINTS.ADMIN.REJECT_BORROW(borrowId), { reason });
      return response.data;
    },
    getDonationRequests: async () => {
      const response = await api.get(API_ENDPOINTS.ADMIN.DONATION_REQUESTS);
      return response.data;
    },
    approveDonation: async (donationId) => {
      const response = await api.post(API_ENDPOINTS.ADMIN.APPROVE_DONATION(donationId));
      return response.data;
    }
  }
};

// Export apiServices for use in components
export { apiServices };

// Legacy service references for backward compatibility
const authService = apiServices.auth;
const bookService = apiServices.books;
const borrowService = apiServices.borrows;
const donationService = apiServices.donations;
const userService = apiServices.users;
const adminService = apiServices.admin;

// Context for Auth
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider with React Query and Interceptors
const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // Get initial user from localStorage
  const getStoredUser = () => {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };

  // Query for current user
  const {
    data: user = getStoredUser(),
    isLoading,
    refetch: refetchUser
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: !!localStorage.getItem('access_token'),
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    initialData: getStoredUser(),
    onError: () => {
      // Interceptor already handles token removal
      queryClient.setQueryData(['currentUser'], null);
    }
  });

  const isAuthenticated = !!user && !!localStorage.getItem('access_token');

  // Login mutation - simplified since interceptor handles token storage
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async () => {
      // Interceptor already stored the token, now get user data
      await refetchUser();
      toast.success('সফলভাবে লগইন হয়েছে!');
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.detail || 'লগইন ব্যর্থ। আপনার তথ্য পরীক্ষা করুন।';
      toast.error(errorMessage);
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      toast.success('একাউন্ট তৈরি হয়েছে! এখন লগইন করুন।');
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.detail || 'রেজিস্ট্রেশন ব্যর্থ। পুনরায় চেষ্টা করুন।';
      toast.error(errorMessage);
    }
  });

  const login = (credentials) => loginMutation.mutateAsync(credentials);
  const register = (userData) => registerMutation.mutateAsync(userData);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    queryClient.clear();
    toast.success('সফলভাবে লগআউট হয়েছে');
    // Force redirect to login page
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      register,
      isLoginLoading: loginMutation.isPending,
      isRegisterLoading: registerMutation.isPending
    }}>
      {children}
    </AuthContext.Provider>
  );
};



// Header Component
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-gradient-to-r from-green-800 to-green-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-white hover:bg-green-700 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center ml-2 lg:ml-0">
              <BookOpen className="h-8 w-8 text-yellow-400" />
              <span className="ml-2 text-xl font-bold">বই আড্ডা</span>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="বই খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-green-700 text-white placeholder-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </form>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center text-green-800 font-semibold">
                {user?.name?.charAt(0) || 'ব'}
              </div>
              <span className="hidden sm:block text-sm">{user?.name}</span>
            </div>
          </div>
        </div>
      </div>
      <SidebarMobile isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </header>
  );
};

// Mobile Sidebar Component
const SidebarMobile = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'librarian';

  const navigationItems = [
    { path: '/dashboard', label: 'ড্যাশবোর্ড', icon: Home },
    { path: '/books', label: 'বইসমূহ', icon: BookOpen },
    { path: '/donate', label: 'বই দান', icon: Gift },
    { path: '/history', label: 'ইতিহাস', icon: HistoryIcon },
    { path: '/profile', label: 'প্রোফাইল', icon: User },
  ];

  const adminItems = [
    { path: '/admin/dashboard', label: 'অ্যাডমিন ড্যাশবোর্ড', icon: BarChart3 },
    { path: '/admin/users', label: 'ব্যবহারকারী', icon: Users },
    { path: '/admin/borrows', label: 'ধার ব্যবস্থাপনা', icon: BookMarked },
    { path: '/admin/donations', label: 'দান ব্যবস্থাপনা', icon: HeartHandshake },
    { path: '/admin/books', label: 'বই ব্যবস্থাপনা', icon: Library },
  ];

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-lg font-semibold text-green-800">বই আড্ডা</span>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-6 overflow-y-auto flex-1">
          <div className="space-y-2">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">মূল মেনু</h3>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-green-100 text-green-800 border-r-4 border-green-500'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">প্রশাসন</h3>
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-100 text-blue-800 border-r-4 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="font-medium">লগআউট</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

// Desktop Sidebar Component
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'librarian';

  const navigationItems = [
    { path: '/dashboard', label: 'ড্যাশবোর্ড', icon: Home },
    { path: '/books', label: 'বইসমূহ', icon: BookOpen },
    { path: '/donate', label: 'বই দান', icon: Gift },
    { path: '/history', label: 'ইতিহাস', icon: HistoryIcon },
    { path: '/profile', label: 'প্রোফাইল', icon: User },
  ];

  const adminItems = [
    { path: '/admin/dashboard', label: 'অ্যাডমিন ড্যাশবোর্ড', icon: BarChart3 },
    { path: '/admin/users', label: 'ব্যবহারকারী', icon: Users },
    { path: '/admin/borrows', label: 'ধার ব্যবস্থাপনা', icon: BookMarked },
    { path: '/admin/donations', label: 'দান ব্যবস্থাপনা', icon: HeartHandshake },
    { path: '/admin/books', label: 'বই ব্যবস্থাপনা', icon: Library },
  ];

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:top-0 lg:bottom-0 lg:left-0 bg-white shadow-lg">
      <div className="h-16 bg-gradient-to-r from-green-800 to-green-900"></div>
      <nav className="mt-2 pt-6 px-4 space-y-6 overflow-y-auto flex-1">
        <div className="space-y-2">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">মূল মেনু</h3>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-green-100 text-green-800 border-r-4 border-green-500'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {isAdmin && (
          <div className="space-y-2">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">প্রশাসন</h3>
            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-800 border-r-4 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Logout Button at the bottom */}
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span className="font-medium">লগআউট</span>
        </button>
      </div>
    </div>
  );
};

// Search Page Component
// App Routes Component
const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LandingWrapper /> : <Navigate to="/dashboard" replace />} 
      />
      
      {/* Protected Routes with Layout */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardWrapper />} />
        <Route path="books" element={<BooksLibrary />} />
        <Route path="books/:id" element={<BookDetailsPage />} />
        <Route path="donate" element={<DonateBook />} />
        <Route path="history" element={<History />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:userId" element={<UserProfilePage />} />
        <Route path="search" element={<SearchPage />} />
        
        {/* Admin Routes */}
        <Route path="admin" element={<ProtectedRoute requireAdmin />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="borrows" element={<AdminBorrowManagement />} />
          <Route path="donations" element={<AdminDonationManagement />} />
          <Route path="books" element={<AdminBookManagement />} />
        </Route>
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'librarian') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children || <Outlet />;
};

// Layout Component
const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

// Root Application Component
const Application = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
            <AppRoutes />
            <Toaster 
              position="top-right"
              richColors
            />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default Application;