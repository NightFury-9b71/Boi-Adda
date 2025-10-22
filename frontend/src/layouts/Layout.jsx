import { Sidebar, Header } from '../components';
import { Outlet } from "react-router-dom";

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


export const PublicLayout = () => {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>
    </main>
  );
};

// Protected Layout for authenticated users
export const ProtectedLayout = () => {
  return <Layout />;
};

// Admin Layout for admin users (could be extended with admin-specific navigation)
export const AdminLayout = () => {
  return <Layout />;
};