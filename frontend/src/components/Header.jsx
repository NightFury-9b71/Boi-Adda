import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import {SidebarMobile} from './Sidebar';


// Header Component
const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            {/* Only show logo on mobile when sidebar is hidden */}
            <div className="flex items-center ml-2 lg:hidden">
              <BookOpen className="h-8 w-8 text-yellow-400" />
              <span className="ml-2 text-xl font-bold">{t('appName')}</span>
            </div>
          </div>

          {/* Only show profile on mobile when sidebar is hidden */}
          <div className="flex items-center space-x-4 lg:hidden">
            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-2 rounded-lg px-3 py-2 transition-colors duration-300"
            >
              <div className="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/50 hover:scale-110">
                {user?.profile_image ? (
                  <img 
                    src={user.profile_image} 
                    alt="Profile" 
                    className="w-full h-full object-cover transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-yellow-400/60"
                  />
                ) : (
                  <div className="w-full h-full bg-yellow-400 rounded-full flex items-center justify-center text-green-800 font-semibold transition-all duration-300 hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/60 hover:scale-110">
                    {user?.name?.charAt(0) || 'ব'}
                  </div>
                )}
              </div>
              <span className="hidden sm:block text-sm transition-all duration-300 hover:text-yellow-200 hover:drop-shadow-lg hover:scale-105">{user?.name}</span>
            </button>
          </div>
        </div>
      </div>
      <SidebarMobile isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </header>
  );
};

export default Header;