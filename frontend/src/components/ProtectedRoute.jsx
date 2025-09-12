import { useAuth } from "../App";
import { Outlet } from "react-router-dom";
import { Navigate } from "react-router-dom";

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

export default ProtectedRoute;