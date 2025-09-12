import { createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast, Toaster } from 'sonner';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { ProtectedRoute } from './components';

import {SearchPage, BookDetailsPage, UserProfilePage, DonateBook, History, ProfilePage, BooksLibrary, DashboardPage} from './pages/user';
import {AdminDashboard, AdminUserManagement, AdminBorrowManagement, AdminDonationManagement, AdminBookManagement, AdminBookIssue, AdminStatistics} from './pages/admin';

import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import Layout from './pages/layout/Layout'

import { authService } from './api/apiServices';

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
        element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" replace />} 
      />

      <Route path="/unauthorized" element={<PublicLayout />}>
        <Route path="books" element={<BooksLibrary />} />
        {/* <Route path="books/:id" element={<BookDetailsPage />} /> */}
      </Route>
            
      {/* Protected Routes with Layout */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
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
          <Route path="statistics" element={<AdminStatistics />} />
          <Route path="issue" element={<AdminBookIssue />} />
        </Route>
      </Route>
      
      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};


const PublicLayout = ({children}) => {
  return(
    <main className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children || <Outlet />}
      </div>
    </main>
  )
}

// Root Application Component
const App = () => {
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
            <Toaster position="top-right" richColors />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;