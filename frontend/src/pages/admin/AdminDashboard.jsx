import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Book, 
  BookOpen, 
  Gift, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Target,
  Zap,
  Heart,
  Star,
  Library,
  UserCheck,
  BookCopy,
  History,
  Settings
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { apiServices } from '../../api';;

const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState('week'); // week, month, year
  const { t } = useTranslation();

  // Fetch dashboard data
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: apiServices.admin.getUsers,
    staleTime: 5 * 60 * 1000,
  });

  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['admin', 'books'],
    queryFn: apiServices.books.getBooks,
    staleTime: 5 * 60 * 1000,
  });

  const { data: borrows = [], isLoading: borrowsLoading, error: borrowsError } = useQuery({
    queryKey: ['admin', 'borrow-requests'],
    queryFn: apiServices.admin.getBorrowRequests,
    staleTime: 2 * 60 * 1000,
  });

  const { data: donations = [], isLoading: donationsLoading, error: donationsError } = useQuery({
    queryKey: ['admin', 'donation-requests'],
    queryFn: apiServices.admin.getDonationRequests,
    staleTime: 2 * 60 * 1000,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: apiServices.categories.getCategories,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate statistics
  const isLoading = usersLoading || booksLoading || borrowsLoading || donationsLoading || categoriesLoading;

  const stats = {
    users: {
      total: (users || []).length,
      active: (users || []).filter(user => user.role === 'member').length,
      librarians: (users || []).filter(user => user.role === 'librarian').length,
      admins: (users || []).filter(user => user.role === 'admin').length,
    },
    books: {
      total: (books || []).length,
      totalCopies: (books || []).reduce((sum, book) => sum + (book.total_copies || 0), 0),
      categories: (categories || []).length,
      popular: (books || []).sort((a, b) => (b.times_borrowed || 0) - (a.times_borrowed || 0)).slice(0, 5),
    },
    borrows: {
      total: (borrows || []).length,
      pending: (borrows || []).filter(b => b.status === 'pending').length,
      approved: (borrows || []).filter(b => b.status === 'approved').length,
      returned: (borrows || []).filter(b => b.status === 'returned').length,
      overdue: (borrows || []).filter(b => {
        if (b.status !== 'approved') return false;
        const dueDate = new Date(b.due_date);
        return dueDate < new Date();
      }).length,
    },
    donations: {
      total: (donations || []).length,
      pending: (donations || []).filter(d => d.status === 'pending').length,
      approved: (donations || []).filter(d => d.status === 'approved').length,
      completed: (donations || []).filter(d => d.status === 'completed').length,
      rejected: (donations || []).filter(d => d.status === 'rejected').length,
    }
  };

  // Recent activities
  const recentBorrows = (borrows || [])
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const recentDonations = (donations || [])
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('bn-BD');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'completed': 
      case 'returned': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    return t(`status.${status}`) || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('dashboard.loadingMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-600 mt-2">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="week">{t('time.thisWeek')}</option>
            <option value="month">{t('time.thisMonth')}</option>
            <option value="year">{t('time.thisYear')}</option>
            <option value="all">{t('time.allTime')}</option>
          </select>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Users */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">{t('admin.dashboard.users')}</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.users.total}</p>
          <p className="text-xs text-gray-600">{stats.users.active} {t('admin.dashboard.members')}</p>
        </div>

        {/* Books */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Book className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">{t('admin.dashboard.books')}</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.books.total}</p>
          <p className="text-xs text-gray-600">{stats.books.totalCopies} {t('admin.dashboard.copies')}</p>
        </div>

        {/* Active Borrows */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-xs text-gray-500">{t('admin.dashboard.currentBorrows')}</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.borrows.approved}</p>
          <p className="text-xs text-gray-600">{stats.borrows.pending} {t('admin.dashboard.pending')}</p>
        </div>

        {/* Donations */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Gift className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">{t('admin.dashboard.donations')}</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.donations.total}</p>
          <p className="text-xs text-gray-600">{stats.donations.pending} {t('admin.dashboard.pending')}</p>
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-xs text-gray-500">{t('admin.dashboard.overdue')}</span>
          </div>
          <p className="text-xl font-bold text-red-900">{stats.borrows.overdue}</p>
          <p className="text-xs text-gray-600">{t('admin.dashboard.overdueItems')}</p>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Library className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="text-xs text-gray-500">{t('admin.dashboard.categories')}</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.books.categories}</p>
          <p className="text-xs text-gray-600">{t('admin.dashboard.bookCategories')}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.dashboard.quickActions')}</h2>
          <div className="space-y-3">
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <span className="font-medium">ব্যবহারকারী ব্যবস্থাপনা</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            </Link>

            <Link
              to="/admin/books"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center">
                <Book className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium">বই ব্যবস্থাপনা</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            </Link>

            <Link
              to="/admin/borrows"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-orange-600 mr-3" />
                <span className="font-medium">ধার ব্যবস্থাপনা</span>
              </div>
              <div className="flex items-center">
                {stats.borrows.pending > 0 && (
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full mr-2">
                    {stats.borrows.pending}
                  </span>
                )}
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </Link>

            <Link
              to="/admin/donations"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center">
                <Gift className="h-5 w-5 text-purple-600 mr-3" />
                <span className="font-medium">দান ব্যবস্থাপনা</span>
              </div>
              <div className="flex items-center">
                {stats.donations.pending > 0 && (
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mr-2">
                    {stats.donations.pending}
                  </span>
                )}
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </Link>
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.dashboard.statusOverview')}</h2>
          <div className="space-y-4">
            {/* Borrow Status */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">{t('admin.dashboard.borrowStatus')}</span>
                <span className="text-sm text-gray-500">{stats.borrows.total}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-yellow-600">{t('admin.dashboard.pending')}</span>
                  <span className="font-medium">{stats.borrows.pending}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">{t('admin.dashboard.approved')}</span>
                  <span className="font-medium">{stats.borrows.approved}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">{t('admin.dashboard.returned')}</span>
                  <span className="font-medium">{stats.borrows.returned}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">{t('admin.dashboard.overdueItems')}</span>
                  <span className="font-medium">{stats.borrows.overdue}</span>
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Donation Status */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">{t('admin.dashboard.donationStatus')}</span>
                <span className="text-sm text-gray-500">{stats.donations.total}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-yellow-600">{t('admin.dashboard.pending')}</span>
                  <span className="font-medium">{stats.donations.pending}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">{t('admin.dashboard.approved')}</span>
                  <span className="font-medium">{stats.donations.approved}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">{t('admin.dashboard.completed')}</span>
                  <span className="font-medium">{stats.donations.completed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">{t('admin.dashboard.rejected')}</span>
                  <span className="font-medium">{stats.donations.rejected}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Books */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.dashboard.popularBooks')}</h2>
          <div className="space-y-3">
            {stats.books.popular.map((book, index) => (
              <div key={book.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-6 bg-gradient-to-br from-blue-200 to-blue-400 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-700">#{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{book.title}</p>
                  <p className="text-xs text-gray-500 truncate">{book.author}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs text-gray-500">{book.times_borrowed || 0} {t('admin.dashboard.borrows')}</span>
                </div>
              </div>
            ))}
            {stats.books.popular.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">{t('books.noBooks')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Borrows */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('admin.dashboard.recentBorrowRequests')}</h2>
            <Link 
              to="/admin/borrows"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              {t('admin.dashboard.viewAll')}
            </Link>
          </div>
          <div className="space-y-3">
            {recentBorrows.map((borrow) => (
              <div key={borrow.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-200 to-blue-400 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                    {borrow.member_name ? borrow.member_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {borrow.member_name || 'অজানা ব্যবহারকারী'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {borrow.book_title || 'অজানা বই'}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(borrow.status)}`}>
                    {getStatusText(borrow.status)}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(borrow.created_at)}</p>
                </div>
              </div>
            ))}
            {recentBorrows.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">{t('admin.dashboard.noRecentBorrows')}</p>
            )}
          </div>
        </div>

        {/* Recent Donations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('admin.dashboard.recentDonations')}</h2>
            <Link 
              to="/admin/donations"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              {t('admin.dashboard.viewAll')}
            </Link>
          </div>
          <div className="space-y-3">
            {recentDonations.map((donation) => (
              <div key={donation.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gradient-to-br from-purple-200 to-purple-400 rounded-full flex items-center justify-center text-purple-700 font-semibold text-sm">
                    {donation.member_name ? donation.member_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {donation.member_name || 'অজানা দাতা'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {donation.donation_title || 'অজানা বই'}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                    {getStatusText(donation.status)}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(donation.created_at)}</p>
                </div>
              </div>
            ))}
            {recentDonations.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">{t('admin.dashboard.noRecentDonations')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
