import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../utils/toast';

import { authService } from '../api/apiServices';

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
export const AuthProvider = ({ children }) => {
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
    staleTime: 0, // Always refetch when called
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
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
      refetchUser,
      isLoginLoading: loginMutation.isPending,
      isRegisterLoading: registerMutation.isPending
    }}>
      {children}
    </AuthContext.Provider>
  );
};