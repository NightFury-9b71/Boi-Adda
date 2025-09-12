import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookMarked, Gift, HistoryIcon, Calendar, User, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { apiServices } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../../components/ConfirmationModal';

const History = () => {
  const { user } = useAuth();
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
      toast.success('ধার অনুরোধ সফলভাবে বাতিল করা হয়েছে');
    },
    onError: (error) => {
      console.error('Cancel borrow error:', error);
      toast.error(`ধার বাতিল করতে সমস্যা হয়েছে: ${error.response?.data?.detail || 'অজানা ত্রুটি'}`);
    }
  });

  const cancelDonationMutation = useMutation({
    mutationFn: apiServices.donations.cancelDonation,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['donationHistory']);
      queryClient.invalidateQueries(['userStats']);
      toast.success('দান অনুরোধ সফলভাবে বাতিল করা হয়েছে');
    },
    onError: (error) => {
      console.error('Cancel donation error:', error);
      toast.error(`দান বাতিল করতে সমস্যা হয়েছে: ${error.response?.data?.detail || 'অজানা ত্রুটি'}`);
    }
  });

  // Combine and filter data - transform API data to match UI expectations
  const transformBorrowHistory = borrowHistory.map(borrow => {
    const book = borrow.book_copy?.book || {};
    
    // Now we have specific date fields from the backend migration
    // Use the actual timestamp fields for each status transition
    // If the new fields are null, fallback to updated_at for current status
    let approvedDate = borrow.approved_at;       // When admin approved
    let handoverDate = borrow.handed_over_at;    // When book was handed over
    let returnDate = borrow.returned_at;         // When book was returned
    
    // Fallback logic for existing records that don't have the new date fields populated
    if (!approvedDate && (borrow.status === 'approved' || borrow.status === 'active' || borrow.status === 'returned')) {
      approvedDate = borrow.updated_at; // Fallback to updated_at
    }
    if (!handoverDate && (borrow.status === 'active' || borrow.status === 'returned')) {
      handoverDate = borrow.updated_at; // Fallback to updated_at
    }
    if (!returnDate && borrow.status === 'returned') {
      returnDate = borrow.updated_at; // Fallback to updated_at
    }
    
    return {
      id: borrow.id,
      type: 'borrow',
      book: {
        id: book.id || borrow.book_copy_id || borrow.id,
        title: book.title || 'অজানা বই',
        author: book.author || 'অজানা লেখক',
        isbn: book.isbn || null,
        published_year: book.published_year || null,
        pages: book.pages || null,
        category: book.category || null,
        image_url: book.cover || book.image_url || null
      },
      status: borrow.status,
      requestDate: borrow.created_at,
      approvedDate: approvedDate,
      handoverDate: handoverDate,
      returnDate: returnDate,
      dueDate: borrow.book_copy?.due_date || null,
      updatedAt: borrow.updated_at // Keep reference to updated_at for rejected status
    };
  });

  const transformDonationHistory = donationHistory.map(donation => {
    const book = donation.book_copy?.book || {};
    
    // Now we have specific date fields from the backend migration
    // Use the actual timestamp fields for each status transition
    // If the new fields are null, fallback to updated_at for current status
    let approvedDate = donation.approved_at;     // When admin approved
    let completedDate = donation.completed_at;   // When donation was completed
    
    // Fallback logic for existing records that don't have the new date fields populated
    if (!approvedDate && (donation.status === 'approved' || donation.status === 'completed')) {
      approvedDate = donation.updated_at; // Fallback to updated_at
    }
    if (!completedDate && donation.status === 'completed') {
      completedDate = donation.updated_at; // Fallback to updated_at
    }
    
    return {
      id: donation.id,
      type: 'donation',
      book: {
        id: book.id || donation.id,
        title: book.title || donation.book_copy?.book?.title || 'দান করা বই',
        author: book.author || donation.book_copy?.book?.author || 'অজানা লেখক',
        isbn: book.isbn || null,
        published_year: book.published_year || null,
        pages: book.pages || null,
        category: book.category || null,
        image_url: book.cover || book.image_url || null
      },
      status: donation.status,
      requestDate: donation.created_at,
      approvedDate: approvedDate,
      completedDate: completedDate,
      updatedAt: donation.updated_at // Keep reference to updated_at for rejected status
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
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'অপেক্ষমাণ' },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'অনুমোদিত' },
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'সক্রিয়' },
      returned: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'ফেরত দেওয়া' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'সম্পন্ন' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'প্রত্যাখ্যাত' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'পাওয়া যায়নি';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'পাওয়া যায়নি';
      
      return date.toLocaleDateString('bn-BD', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'Asia/Dhaka'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'পাওয়া যায়নি';
    }
  };

  const formatDateWithTime = (dateString) => {
    if (!dateString) return 'পাওয়া যায়নি';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'পাওয়া যায়নি';
      
      return date.toLocaleString('bn-BD', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Asia/Dhaka'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'পাওয়া যায়নি';
    }
  };

  const handleReturn = async (itemId) => {
    // TODO: Implement return book functionality
    console.log('Returning book with ID:', itemId);
  };

  const handleCancel = (item) => {
    const itemType = item.type === 'borrow' ? 'ধার' : 'দান';
    setConfirmModal({
      isOpen: true,
      item: item,
      type: 'cancel',
      title: `${itemType} অনুরোধ বাতিল করুন`,
      message: `আপনি কি নিশ্চিত যে আপনি "${item.book.title}" এর ${itemType} অনুরোধ বাতিল করতে চান?`
    });
  };

  const confirmCancel = async () => {
    try {
      const item = confirmModal.item;
      if (item.type === 'borrow') {
        await cancelBorrowMutation.mutateAsync(item.id);
      } else if (item.type === 'donation') {
        await cancelDonationMutation.mutateAsync(item.id);
      }
    } catch (error) {
      console.error('Cancel error:', error);
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
            <h1 className="text-2xl font-bold text-gray-900">আমার ইতিহাস</h1>
            <p className="text-gray-600 mt-1">আপনার ধার ও দানের সম্পূর্ণ ইতিহাস</p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.borrows.total}</p>
              <p className="text-sm text-gray-600">মোট ধার</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.donations.total}</p>
              <p className="text-sm text-gray-600">মোট দান</p>
            </div>
          </div>
        </div>

        {/* Stats Cards for Mobile */}
        <div className="grid grid-cols-2 gap-4 md:hidden mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.borrows.total}</p>
            <p className="text-sm text-gray-600">মোট ধার</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-green-600">{stats.donations.total}</p>
            <p className="text-sm text-gray-600">মোট দান</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: 'সব', count: allHistory.length },
            { key: 'borrow', label: 'ধার', count: transformBorrowHistory.length },
            { key: 'donation', label: 'দান', count: transformDonationHistory.length }
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
            <label className="block text-sm font-medium text-gray-700 mb-1">স্থিতি</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">সব স্থিতি</option>
              <option value="pending">অপেক্ষমাণ</option>
              <option value="approved">অনুমোদিত</option>
              <option value="active">সক্রিয়</option>
              <option value="returned">ফেরত দেওয়া</option>
              <option value="completed">সম্পন্ন</option>
              <option value="rejected">প্রত্যাখ্যাত</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">সাজান</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="newest">নতুন আগে</option>
              <option value="oldest">পুরাতন আগে</option>
              <option value="title">বইয়ের নাম অনুযায়ী</option>
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
                      <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                        <div className="w-full h-full bg-green-100 flex items-center justify-center" 
                             style={{ display: item.book.image_url ? 'none' : 'flex' }}>
                          <BookOpen className="h-6 w-6 text-green-600" />
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
                              {item.type === 'borrow' ? 'ধার' : 'দান'}
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
                              <span>{item.book.pages} পৃষ্ঠা</span>
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
                          <h4 className="text-sm font-medium text-gray-700 mb-2">লেনদেনের বিবরণ</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                            {/* Request Date - Always shown */}
                            <div>
                              <span className="text-gray-500 block">অনুরোধের তারিখ:</span>
                              <p className="font-medium text-gray-900">{formatDateWithTime(item.requestDate)}</p>
                            </div>
                            
                            {/* Status Update Date - Show the current status date when available */}
                            {item.approvedDate && (
                              <div>
                                <span className="text-gray-500 block">অনুমোদনের তারিখ:</span>
                                <p className="font-medium text-blue-600">{formatDateWithTime(item.approvedDate)}</p>
                              </div>
                            )}
                            
                            {item.type === 'borrow' && item.handoverDate && (
                              <div>
                                <span className="text-gray-500 block">হস্তান্তরের তারিখ:</span>
                                <p className="font-medium text-green-600">{formatDateWithTime(item.handoverDate)}</p>
                              </div>
                            )}
                            
                            {item.type === 'borrow' && item.returnDate && (
                              <div>
                                <span className="text-gray-500 block">ফেরতের তারিখ:</span>
                                <p className="font-medium text-green-600">{formatDateWithTime(item.returnDate)}</p>
                              </div>
                            )}
                            
                            {item.type === 'donation' && item.completedDate && (
                              <div>
                                <span className="text-gray-500 block">সম্পন্নের তারিখ:</span>
                                <p className="font-medium text-green-600">{formatDateWithTime(item.completedDate)}</p>
                              </div>
                            )}
                            
                            {/* Show rejected date using updated_at */}
                            {item.status === 'rejected' && (
                              <div>
                                <span className="text-gray-500 block">প্রত্যাখ্যানের তারিখ:</span>
                                <p className="font-medium text-red-600">{formatDateWithTime(item.updatedAt)}</p>
                              </div>
                            )}
                            
                            {/* Show last updated for pending status */}
                            {item.status === 'pending' && item.updatedAt !== item.requestDate && (
                              <div>
                                <span className="text-gray-500 block">সর্বশেষ আপডেট:</span>
                                <p className="font-medium text-gray-600">{formatDateWithTime(item.updatedAt)}</p>
                              </div>
                            )}
                            
                            {/* Due Date - Show for active borrows */}
                            {item.type === 'borrow' && item.dueDate && item.status === 'active' && (
                              <div>
                                <span className="text-gray-500 block">ফেরতের শেষ তারিখ:</span>
                                <p className={`font-medium ${
                                  new Date(item.dueDate) < new Date()
                                    ? 'text-red-600'
                                    : 'text-orange-600'
                                }`}>
                                  {formatDate(item.dueDate)}
                                  {new Date(item.dueDate) < new Date() && (
                                    <span className="block text-xs text-red-500">সময় শেষ!</span>
                                  )}
                                </p>
                              </div>
                            )}
                            
                            {/* Status-specific messages */}
                            {item.status === 'pending' && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                  <span className="text-yellow-800 text-xs font-medium">
                                    ⏳ আপনার অনুরোধ প্রশাসকের অনুমোদনের জন্য অপেক্ষা করছে
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {item.status === 'approved' && item.type === 'borrow' && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                  <span className="text-blue-800 text-xs font-medium">
                                    📚 অনুরোধ অনুমোদিত! দয়া করে লাইব্রেরিতে এসে বইটি নিয়ে যান
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {item.status === 'approved' && item.type === 'donation' && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                  <span className="text-blue-800 text-xs font-medium">
                                    🎁 দান অনুরোধ অনুমোদিত! দয়া করে লাইব্রেরিতে এসে বইটি জমা দিন
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {item.status === 'active' && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <div className="bg-green-50 border border-green-200 rounded p-2">
                                  <span className="text-green-800 text-xs font-medium">
                                    ✅ বইটি আপনার কাছে রয়েছে। নির্ধারিত সময়ে ফেরত দিন
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {item.status === 'rejected' && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <div className="bg-red-50 border border-red-200 rounded p-2">
                                  <span className="text-red-800 text-xs font-medium">
                                    ❌ অনুরোধ প্রত্যাখ্যাত হয়েছে
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
                            বইটি দেখুন →
                          </button>
                          
                          {item.status === 'active' && item.type === 'borrow' && (
                            <button 
                              onClick={() => handleReturn(item.id)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              ফেরত দিন
                            </button>
                          )}
                          
                          {(item.status === 'pending' || item.status === 'approved') && (
                            <button 
                              onClick={() => handleCancel(item)}
                              disabled={cancelBorrowMutation.isPending || cancelDonationMutation.isPending}
                              className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {(cancelBorrowMutation.isPending || cancelDonationMutation.isPending) ? 'বাতিল করা হচ্ছে...' : 'বাতিল করুন'}
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
            <p className="text-gray-500">কোন ইতিহাস পাওয়া যায়নি</p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'all' 
                ? 'আপনি এখনো কোন বই ধার নেননি বা দান করেননি'
                : `আপনার কোন ${activeTab === 'borrow' ? 'ধারের' : 'দানের'} ইতিহাস নেই`
              }
            </p>
            <button
              onClick={() => navigate('/books')}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              বই খুঁজুন
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, item: null, type: null })}
        onConfirm={confirmCancel}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
        confirmText="বাতিল করুন"
        cancelText="রদ করুন"
      />
    </div>
  );
};

export default History;
