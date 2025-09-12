import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';

// Custom hook for authentication guards
export const useAuthGuard = (options = {}) => {
  const { 
    requireAuth = true, 
    requireAdmin = false, 
    redirectTo = ROUTES.LOGIN 
  } = options;
  
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      navigate(redirectTo, { replace: true });
      return;
    }

    // Check admin requirement
    if (requireAdmin && user?.role !== 'admin') {
      navigate(ROUTES.DASHBOARD, { replace: true });
      return;
    }

    // Prevent authenticated users from accessing login
    if (!requireAuth && isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
      return;
    }
  }, [isAuthenticated, user, isLoading, requireAuth, requireAdmin, redirectTo, navigate]);

  return {
    isAuthenticated,
    user,
    isLoading,
    isAdmin: user?.role === 'admin'
  };
};

// Hook specifically for admin routes
export const useAdminGuard = () => {
  return useAuthGuard({ requireAuth: true, requireAdmin: true });
};

// Hook for public routes (redirects if authenticated)
export const usePublicGuard = () => {
  return useAuthGuard({ requireAuth: false });
};