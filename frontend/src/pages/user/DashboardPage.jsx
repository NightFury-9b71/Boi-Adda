import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, BookMarked, Clock, Gift, AlertCircle, Search, HistoryIcon, User } from 'lucide-react';
import { apiServices } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { getSafeBookTitle, getSafeAuthor, getSafeDate } from '../../utils/dataHelpers';

const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Real API calls using React Query for user-specific data
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats'],
    queryFn: apiServices.users.getUserStats,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: userBorrows = [], isLoading: borrowsLoading } = useQuery({
    queryKey: ['userBorrows', user?.id],
    queryFn: apiServices.borrows.getBorrows,
    enabled: !!user,
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });

  // Extract user activity stats with fallback
  const borrowStats = userStats?.activity_summary?.borrows || {
    total: 0,
    pending: 0,
    approved: 0,
    active: 0,
    returned: 0,
    rejected: 0
  };

  const donationStats = userStats?.activity_summary?.donations || {
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0
  };

  // Get user's collected borrows (actually borrowed books)
  const currentBorrows = userBorrows.filter(borrow => 
    borrow.status === 'collected'
  ).slice(0, 4); // Show only first 4

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t('dashboard.welcome')}, {user?.name}!
            </h1>
            <p className="text-green-100 text-lg">
              {t('dashboard.userWelcome')}
            </p>
          </div>
          <div className="hidden md:block">
            <BookOpen className="h-20 w-20 text-green-200" />
          </div>
        </div>
      </div>

      {/* User Activity Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.totalBorrowed')}</p>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  borrowStats.approved?.toLocaleString() || '0'
                )}
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookMarked className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.currentBorrows')}</p>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  borrowStats.active?.toLocaleString() || '0'
                )}
              </div>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.totalDonated')}</p>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  donationStats.approved?.toLocaleString() || '0'
                )}
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.pendingRequests')}</p>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  (borrowStats.pending + donationStats.pending)?.toLocaleString() || '0'
                )}
              </div>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/books')}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <Search className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">{t('dashboard.browseBooks')}</span>
          </button>
          
          <button
            onClick={() => navigate('/donate')}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <Gift className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">{t('dashboard.donateBooks')}</span>
          </button>
          
          <button
            onClick={() => navigate('/history')}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <HistoryIcon className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">{t('dashboard.viewHistory')}</span>
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <User className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">{t('dashboard.editProfile')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currently Borrowed Books */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('language') === 'bn' ? 'বর্তমানে আপনার কাছে থাকা বই' : 'Currently Borrowed Books'}
            </h2>
            <button 
              onClick={() => navigate('/history')}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              {t('common.view')} →
            </button>
          </div>
          {borrowsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-3 p-3">
                  <div className="h-10 w-8 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : currentBorrows.length > 0 ? (
            <div className="space-y-3">
              {currentBorrows.map((borrow) => {
                const getStatusInfo = (status) => {
                  switch (status) {
                    case 'pending':
                      return { text: t('status.pending'), color: 'bg-yellow-100 text-yellow-800' };
                    case 'approved':
                      return { text: t('status.approved'), color: 'bg-blue-100 text-blue-800' };
                    case 'collected':
                      return { text: t('status.collected'), color: 'bg-green-100 text-green-800' };
                    case 'return_requested':
                      return { text: t('status.return_requested'), color: 'bg-purple-100 text-purple-800' };
                    default:
                      return { text: t('common.unknown'), color: 'bg-gray-100 text-gray-800' };
                  }
                };
                
                const statusInfo = getStatusInfo(borrow.status);
                
                return (
                  <div key={borrow.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                       onClick={() => navigate(`/books/${borrow.book_id}`)}>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-8 bg-gradient-to-br from-green-100 to-green-200 rounded flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{getSafeBookTitle(borrow.book_title)}</p>
                        <p className="text-sm text-gray-600">{getSafeAuthor(borrow.book_author)}</p>
                        <p className="text-xs text-gray-500">
                          {t('common.applicationDate')}: {getSafeDate(borrow.created_at)}
                        </p>
                        {(borrow.status === 'collected' || borrow.status === 'return_requested') && borrow.due_date && (
                          <p className={`text-xs font-medium mt-1 ${
                            borrow.is_overdue ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            ফেরতের তারিখ: {getSafeDate(borrow.due_date)}
                            {borrow.is_overdue && borrow.overdue_days > 0 && (
                              <span className="ml-1 text-red-600 font-semibold">
                                (মেয়াদ শেষ - {borrow.overdue_days} দিন অতিক্রান্ত)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">#{borrow.id}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BookMarked className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">
                {t('language') === 'bn' ? 'আপনার কাছে বর্তমানে কোনো বই নেই' : 'You currently have no borrowed books'}
              </p>
              <button
                onClick={() => navigate('/books')}
                className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
              >
                {t('common.searchBooks')} →
              </button>
            </div>
          )}
        </div>

        {/* My Recent Activities */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('common.recentActivity')}</h2>
          <div className="space-y-4">
            {/* For now showing a message since we don't have activity history API */}
            <div className="text-center py-8">
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <HistoryIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">
                {t('language') === 'bn' ? 'সাম্প্রতিক কার্যক্রমের তথ্য শীঘ্রই পাওয়া যাবে' : 'Recent activity information will be available soon'}
              </p>
              <button
                onClick={() => navigate('/history')}
                className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
              >
                {t('dashboard.viewHistory')} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
