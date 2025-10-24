import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookMarked, Gift, HistoryIcon, Calendar, User, BookOpen } from 'lucide-react';
import { toast } from '../../utils/toast';
import { apiServices } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import ConfirmationModal from '../../components/ConfirmationModal';
import OptimizedImage from '../../components/OptimizedImage';

const History = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null, type: null });

  // API calls for user history
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats'],
    queryFn: apiServices.users.getUserStats,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Real API calls for borrow and donation history
  const { data: borrowHistory = [], isLoading: borrowsLoading } = useQuery({
    queryKey: ['borrowHistory'],
    queryFn: apiServices.borrows.getBorrowHistory,
    retry: 1,
    staleTime: 30 * 1000, // Refresh every 30 seconds for real-time updates
    refetchInterval: 60 * 1000, // Auto-refetch every minute
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  const { data: donationHistory = [], isLoading: donationsLoading } = useQuery({
    queryKey: ['donationHistory'],
    queryFn: apiServices.donations.getDonationHistory,
    retry: 1,
    staleTime: 30 * 1000, // Refresh every 30 seconds for real-time updates
    refetchInterval: 60 * 1000, // Auto-refetch every minute
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Cancel mutations
  const cancelBorrowMutation = useMutation({
    mutationFn: apiServices.borrows.cancelBorrow,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['borrowHistory']);
      queryClient.invalidateQueries(['userStats']);
      toast.success(t('history.borrowCancelSuccess'));
    },
    onError: (error) => {
      console.error('Cancel borrow error:', error);
      toast.error(`${t('history.borrowCancelError')}: ${error.response?.data?.detail || t('common.error')}`);
    }
  });

  const cancelDonationMutation = useMutation({
    mutationFn: apiServices.donations.cancelDonation,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['donationHistory']);
      queryClient.invalidateQueries(['userStats']);
      toast.success(t('history.donationCancelSuccess'));
    },
    onError: (error) => {
      console.error('Cancel donation error:', error);
      toast.error(`${t('history.donationCancelError')}: ${error.response?.data?.detail || t('common.error')}`);
    }
  });

  // Combine and filter data - transform API data to match UI expectations
  const transformBorrowHistory = borrowHistory.map(borrow => {
    // API returns flat structure with book data at top level
    return {
      id: borrow.id,
      type: 'borrow',
      book: {
        id: borrow.book_id,
        title: borrow.book_title || t('common.unknownBook'),
        author: borrow.book_author || t('common.unknownAuthor'),
        isbn: null,
        published_year: null,
        pages: null,
        category: null,
        image_url: borrow.book_cover_url || borrow.book_cover || null,
        cover_public_id: null
      },
      status: borrow.status,
      requestDate: borrow.created_at,
      approvedDate: borrow.reviewed_at,  // When admin reviewed/approved
      handoverDate: borrow.collected_at, // When book was collected
      returnDate: null, // TODO: Add return date field when available from API
      dueDate: borrow.due_date || null,  // Due date from IssueBook
      isOverdue: borrow.is_overdue || false, // Overdue flag from API
      overdueDays: borrow.overdue_days || 0, // Days overdue
      updatedAt: borrow.created_at // Fallback
    };
  });

  const transformDonationHistory = donationHistory.map(donation => {
    // API returns flat structure with donation data at top level
    return {
      id: donation.id,
      type: 'donation',
      book: {
        id: donation.id, // Use donation ID as book ID
        title: donation.donation_title || t('history.donatedBook'),
        author: donation.donation_author || t('common.unknownAuthor'),
        isbn: null,
        published_year: donation.donation_year || null,
        pages: donation.donation_pages || null,
        category: null,
        image_url: null, // Donations don't have cover images
        cover_public_id: null
      },
      status: donation.status,
      requestDate: donation.created_at,
      approvedDate: donation.reviewed_at, // When admin reviewed/approved
      completedDate: null, // TODO: Add completed date field
      updatedAt: donation.created_at // Fallback
    };
  });

  const allHistory = [...transformBorrowHistory, ...transformDonationHistory];
  
  const filteredHistory = allHistory.filter(item => {
    const tabFilter = activeTab === 'all' || item.type === activeTab;
    const statusFilterMatch = statusFilter === 'all' || item.status === statusFilter;
    return tabFilter && statusFilterMatch;
  });

  // Sort data
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.requestDate) - new Date(a.requestDate);
      case 'oldest':
        return new Date(a.requestDate) - new Date(b.requestDate);
      case 'title':
        return a.book.title.localeCompare(b.book.title);
      default:
        return 0;
    }
  });

  const getStatusBadge = (status, type) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('status.pending') },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('status.approved') },
      collected: { bg: 'bg-green-100', text: 'text-green-800', label: t('status.collected') },
      return_requested: { bg: 'bg-purple-100', text: 'text-purple-800', label: t('status.return_requested') },
      returned: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('status.returned') },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: t('status.completed') },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: t('status.rejected') }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common.noData');
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('common.noData');
      
      const locale = t('language') === 'bn' ? 'bn-BD' : 'en-US';
      return date.toLocaleDateString(locale, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'Asia/Dhaka'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return t('common.noData');
    }
  };

  const formatDateWithTime = (dateString) => {
    if (!dateString) return t('common.noData');
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('common.noData');
      
      const locale = t('language') === 'bn' ? 'bn-BD' : 'en-US';
      return date.toLocaleString(locale, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Asia/Dhaka'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return t('common.noData');
    }
  };

  const returnBookMutation = useMutation({
    mutationFn: apiServices.borrows.returnBook,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['borrowHistory']);
      queryClient.invalidateQueries(['userBorrows', user?.id]);
      queryClient.invalidateQueries(['userStats']);
      toast.success('বই সফলভাবে ফেরত দেওয়া হয়েছে');
    },
    onError: (error) => {
      console.error('Return book error:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'বই ফেরত দিতে ব্যর্থ';
      toast.error(`বই ফেরত দেওয়ার ত্রুটি: ${errorMessage}`);
    }
  });

  const handleReturn = async (item) => {
    setConfirmModal({
      isOpen: true,
      item: item,
      type: 'return',
      title: 'বই ফেরত দিন',
      message: `আপনি কি নিশ্চিত যে আপনি "${item.book.title}" বইটি ফেরত দিতে চান?`
    });
  };

  const handleCancel = (item) => {
    const itemType = item.type === 'borrow' ? t('history.borrow') : t('history.donation');
    setConfirmModal({
      isOpen: true,
      item: item,
      type: 'cancel',
      title: `${itemType} ${t('history.cancelRequest')}`,
      message: `${t('history.confirmCancel')} "${item.book.title}" ${t('history.requestFor')} ${itemType} ${t('history.wantToCancel')}?`
    });
  };

  const confirmAction = async () => {
    try {
      const item = confirmModal.item;
      const actionType = confirmModal.type;
      
      if (actionType === 'return') {
        await returnBookMutation.mutateAsync(item.id);
      } else if (actionType === 'cancel') {
        if (item.type === 'borrow') {
          await cancelBorrowMutation.mutateAsync(item.id);
        } else if (item.type === 'donation') {
          await cancelDonationMutation.mutateAsync(item.id);
        }
      }
    } catch (error) {
      console.error('Action error:', error);
      // Error handling is done in mutation onError callbacks
    }
  };

  const stats = userStats?.activity_summary || {
    borrows: { total: 0, active: 0, returned: 0, pending: 0 },
    donations: { total: 0, completed: 0, pending: 0 }
  };

  // Show loading state
  if (borrowsLoading || donationsLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="flex space-x-4">
              <div className="h-16 bg-gray-200 rounded w-24"></div>
              <div className="h-16 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('history.title')}</h1>
            <p className="text-gray-600 mt-1">{t('history.subtitle')}</p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.borrows.total}</p>
              <p className="text-sm text-gray-600">{t('history.totalBorrows')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.donations.total}</p>
              <p className="text-sm text-gray-600">{t('history.totalDonations')}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards for Mobile */}
        <div className="grid grid-cols-2 gap-4 md:hidden mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.borrows.total}</p>
            <p className="text-sm text-gray-600">{t('history.totalBorrows')}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-green-600">{stats.donations.total}</p>
            <p className="text-sm text-gray-600">{t('history.totalDonations')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: t('history.all'), count: allHistory.length },
            { key: 'borrow', label: t('history.borrows'), count: transformBorrowHistory.length },
            { key: 'donation', label: t('history.donations'), count: transformDonationHistory.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('history.status')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">{t('history.allStatus')}</option>
              <option value="pending">{t('status.pending')}</option>
              <option value="approved">{t('status.approved')}</option>
              <option value="collected">{t('status.collected')}</option>
              <option value="return_requested">{t('status.return_requested')}</option>
              <option value="returned">{t('status.returned')}</option>
              <option value="completed">{t('status.completed')}</option>
              <option value="rejected">{t('status.rejected')}</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('history.sortBy')}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="newest">{t('history.newest')}</option>
              <option value="oldest">{t('history.oldest')}</option>
              <option value="title">{t('history.byTitle')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {sortedHistory.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {sortedHistory.map((item) => (
              <div key={`${item.type}-${item.id}`} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4 mb-4">
                      {/* Book Cover */}
                      <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.book.image_url ? (
                          <img
                            src={item.book.image_url}
                            alt={item.book.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="flex flex-col items-center justify-center text-gray-400 p-2" 
                          style={{display: item.book.image_url ? 'none' : 'flex'}}
                        >
                          <BookOpen className="h-6 w-6" />
                        </div>
                      </div>

                      {/* Book Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            item.type === 'borrow' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            {item.type === 'borrow' ? (
                              <BookMarked className={`h-4 w-4 ${
                                item.type === 'borrow' ? 'text-blue-600' : 'text-green-600'
                              }`} />
                            ) : (
                              <Gift className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(item.status, item.type)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.type === 'borrow' 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'bg-green-50 text-green-700'
                            }`}>
                              {item.type === 'borrow' ? t('history.borrow') : t('history.donation')}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.book.title}</h3>
                        <p className="text-gray-600 mb-2">{item.book.author}</p>
                        
                        {/* Book Metadata */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          {item.book.published_year && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{item.book.published_year}</span>
                            </div>
                          )}
                          {item.book.pages && (
                            <div className="flex items-center space-x-1">
                              <BookOpen className="h-3 w-3" />
                              <span>{item.book.pages} {t('history.pages')}</span>
                            </div>
                          )}
                          {item.book.category && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {item.book.category}
                            </span>
                          )}
                        </div>
                        
                        {/* Transaction Details */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">{t('history.transactionDetails')}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                            {/* Request Date - Always shown */}
                            <div>
                              <span className="text-gray-500 block">{t('history.requestDate')}:</span>
                              <p className="font-medium text-gray-900">{formatDateWithTime(item.requestDate)}</p>
                            </div>
                            
                            {/* Status Update Date - Show the current status date when available */}
                            {item.approvedDate && (
                              <div>
                                <span className="text-gray-500 block">{t('history.approvalDate')}:</span>
                                <p className="font-medium text-blue-600">{formatDateWithTime(item.approvedDate)}</p>
                              </div>
                            )}
                            
                            {item.type === 'borrow' && item.handoverDate && (
                              <div>
                                <span className="text-gray-500 block">{t('history.handoverDate')}:</span>
                                <p className="font-medium text-green-600">{formatDateWithTime(item.handoverDate)}</p>
                              </div>
                            )}
                            
                            {item.type === 'borrow' && item.returnDate && (
                              <div>
                                <span className="text-gray-500 block">{t('history.returnDate')}:</span>
                                <p className="font-medium text-green-600">{formatDateWithTime(item.returnDate)}</p>
                              </div>
                            )}
                            
                            {item.type === 'donation' && item.completedDate && (
                              <div>
                                <span className="text-gray-500 block">{t('history.completedDate')}:</span>
                                <p className="font-medium text-green-600">{formatDateWithTime(item.completedDate)}</p>
                              </div>
                            )}
                            
                            {/* Show rejected date using updated_at */}
                            {item.status === 'rejected' && (
                              <div>
                                <span className="text-gray-500 block">{t('history.rejectedDate')}:</span>
                                <p className="font-medium text-red-600">{formatDateWithTime(item.updatedAt)}</p>
                              </div>
                            )}
                            
                            {/* Show last updated for pending status */}
                            {item.status === 'pending' && item.updatedAt !== item.requestDate && (
                              <div>
                                <span className="text-gray-500 block">{t('history.lastUpdate')}:</span>
                                <p className="font-medium text-gray-600">{formatDateWithTime(item.updatedAt)}</p>
                              </div>
                            )}
                            
                            {/* Due Date - Show for collected and return_requested borrows */}
                            {item.type === 'borrow' && item.dueDate && (item.status === 'collected' || item.status === 'return_requested') && (
                              <div>
                                <span className="text-gray-500 block">{t('history.dueDate')}:</span>
                                <p className={`font-medium ${
                                  item.isOverdue
                                    ? 'text-red-600'
                                    : 'text-orange-600'
                                }`}>
                                  {formatDate(item.dueDate)}
                                  {item.isOverdue && item.overdueDays > 0 && (
                                    <span className="block text-xs text-red-600 font-semibold">
                                      মেয়াদ শেষ - {item.overdueDays} দিন অতিক্রান্ত
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}
                            
                            {/* Status-specific messages */}
                            {item.status === 'pending' && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                  <span className="text-yellow-800 text-xs font-medium">
                                    ⏳ {t('history.pendingMessage')}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {item.status === 'approved' && item.type === 'borrow' && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                  <span className="text-blue-800 text-xs font-medium">
                                    📚 {t('history.borrowApprovedMessage')}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {item.status === 'approved' && item.type === 'donation' && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                  <span className="text-blue-800 text-xs font-medium">
                                    🎁 {t('history.donationApprovedMessage')}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {item.status === 'collected' && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <div className="bg-green-50 border border-green-200 rounded p-2">
                                  <span className="text-green-800 text-xs font-medium">
                                    ✅ {t('history.activeMessage')}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {item.status === 'rejected' && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <div className="bg-red-50 border border-red-200 rounded p-2">
                                  <span className="text-red-800 text-xs font-medium">
                                    ❌ {t('history.rejectedMessage')}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex items-center space-x-3">
                          <button
                            onClick={() => navigate(`/books/${item.book.id}`)}
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            {t('history.viewBook')} →
                          </button>
                          
                          {item.status === 'collected' && item.type === 'borrow' && (
                            <button 
                              onClick={() => handleReturn(item)}
                              disabled={returnBookMutation.isPending}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {returnBookMutation.isPending ? 'ফেরত দেওয়া হচ্ছে...' : 'বই ফেরত দিন'}
                            </button>
                          )}
                          
                          {item.status === 'return_requested' && item.type === 'borrow' && (
                            <span className="text-purple-600 text-sm font-medium">
                              ফেরত অনুরোধ জমা হয়েছে
                            </span>
                          )}
                          
                          {(item.status === 'pending' || item.status === 'approved') && (
                            <button 
                              onClick={() => handleCancel(item)}
                              disabled={cancelBorrowMutation.isPending || cancelDonationMutation.isPending}
                              className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {(cancelBorrowMutation.isPending || cancelDonationMutation.isPending) ? t('history.cancelling') : t('history.cancel')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <HistoryIcon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">{t('history.noHistory')}</p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'all' 
                ? t('history.noHistoryMessage')
                : `${t('history.noSpecific')} ${activeTab === 'borrow' ? t('history.borrowHistory') : t('history.donationHistory')}`
              }
            </p>
            <button
              onClick={() => navigate('/books')}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('common.searchBooks')}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, item: null, type: null })}
        onConfirm={confirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type === 'return' ? 'warning' : 'danger'}
        confirmText={confirmModal.type === 'return' ? 'ফেরত দিন' : t('history.cancel')}
        cancelText={t('common.cancel')}
      />
    </div>
  );
};

export default History;
