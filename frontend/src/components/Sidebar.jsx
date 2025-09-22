import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, User, HistoryIcon, X, Home, Gift, BookMarked, LogOut, BarChart3, Users, HeartHandshake, Library, TrendingUp, BookA } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navigationItems = [
  { path: '/dashboard', label: 'ড্যাশবোর্ড', icon: Home },
  { path: '/books', label: 'বইসমূহ', icon: BookOpen },
  { path: '/donate', label: 'বই দান', icon: Gift },
  { path: '/history', label: 'ইতিহাস', icon: HistoryIcon },
  { path: '/profile', label: 'প্রোফাইল', icon: User },
];

const adminItems = [
  { path: '/admin/dashboard', label: 'অ্যাডমিন ড্যাশবোর্ড', icon: BarChart3 },
  { path: '/admin/statistics', label: 'পরিসংখ্যান', icon: TrendingUp },
  { path: '/admin/users', label: 'ব্যবহারকারী', icon: Users },
  { path: '/admin/issue', label: 'বই ইস্যু', icon: BookA },
  { path: '/admin/borrows', label: 'ধার ব্যবস্থাপনা', icon: BookMarked },
    { path: '/admin/donations', label: 'দান ব্যবস্থাপনা', icon: HeartHandshake },
    { path: '/admin/books', label: 'বই ব্যবস্থাপনা', icon: Library },
  ];
  
// Mobile Sidebar Component
const SidebarMobile = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'librarian';

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

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden flex flex-col`}>
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
        </nav>

        {/* Logout Button at the bottom - outside of nav */}
        <div className="p-4 border-t mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium">লগআউট</span>
          </button>
        </div>
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

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:top-0 lg:bottom-0 lg:left-0 bg-white shadow-lg">
      {/* Header Section */}
      <div className="h-16 bg-gradient-to-r from-green-800 to-green-900 flex items-center justify-center">
        <div className="flex items-center">
          <BookOpen className="h-8 w-8 text-yellow-400" />
          <span className="ml-2 text-xl font-bold text-white">বই আড্ডা</span>
        </div>
      </div>
      
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-b from-green-50 to-white">
        <div className="flex items-center space-x-3 cursor-pointer transition-all duration-300 hover:scale-105 rounded-lg p-2 hover:bg-white hover:shadow-lg"
             onClick={() => navigate('/profile')}>
          <div className="h-12 w-12 rounded-full flex items-center justify-center overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:shadow-yellow-400/50 hover:scale-110">
            {user?.profile_image ? (
              <img 
                src={user.profile_image} 
                alt="Profile" 
                className="w-full h-full object-cover transition-all duration-300 hover:brightness-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-green-800 font-bold text-lg transition-all duration-300 hover:from-yellow-300 hover:to-yellow-400 hover:shadow-lg hover:shadow-yellow-400/60">
                {user?.name?.charAt(0) || 'ব'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate transition-all duration-300 hover:text-green-700 hover:drop-shadow-md">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate transition-all duration-300 hover:text-green-600 hover:drop-shadow-sm">{user?.email}</p>
            <div className="flex items-center mt-1">
              <div className={`h-2 w-2 rounded-full mr-2 transition-all duration-300 ${user?.is_active ? 'bg-green-400 hover:bg-green-500 hover:shadow-md hover:shadow-green-400/50' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-600 transition-all duration-300 hover:text-gray-800">
                {user?.role === 'admin' ? 'প্রশাসক' : user?.role === 'librarian' ? 'গ্রন্থাগারিক' : 'সদস্য'}
              </span>
            </div>
          </div>
        </div>
      </div>

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

export default Sidebar;
export {SidebarMobile};