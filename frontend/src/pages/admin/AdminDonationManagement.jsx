import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../utils/toast';
import { getSafeUserName, getSafeBookTitle, getSafeAuthor, getSafeNumber, getSafeDate } from '../../utils/dataHelpers';
import { 
  Gift, 
  Search, 
  Filter, 
  BookOpen,
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  HandHeart,
  RefreshCw,
  Eye,
  User,
  Calendar,
  Book,
  ArrowRight,
  CheckCheck,
  Ban,
  Package,
  Heart,
  Users,
  TrendingUp,
  Award
} from 'lucide-react';
import { apiServices } from '../../api';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import UserTimeline from '../../components/UserTimeline';
import { useTranslation } from '../../hooks/useTranslation';

// Helper function to transform API responses into timeline activities
const transformUserActivities = (borrows, donations, t, bookFilter = null) => {
  const activities = [];

  // Transform borrows into activities - show ALL historical steps
  borrows.forEach(borrow => {
    // If bookFilter is provided, only include activities for that specific book
    if (bookFilter && borrow.book_id !== bookFilter.bookId) {
      return;
    }

    const borrowActivities = [];

    // Always show pending step (when request was created)
    if (borrow.created_at) {
      borrowActivities.push({
        id: `${borrow.id}-pending`,
        type: 'borrow',
        status: 'pending',
        timestamp: borrow.created_at,
        bookTitle: borrow.book_title,
        bookAuthor: borrow.book_author,
        notes: ''
      });
    }

    // Show approved step (when request was reviewed and approved)
    if (borrow.status !== 'pending' && borrow.status !== 'rejected' && borrow.reviewed_at) {
      borrowActivities.push({
        id: `${borrow.id}-approved`,
        type: 'borrow',
        status: 'approved',
        timestamp: borrow.reviewed_at,
        bookTitle: borrow.book_title,
        bookAuthor: borrow.book_author,
        notes: t('admin.approvedNote')
      });
    }

    // Show collected step (when book was handed over)
    if ((borrow.status === 'collected' || borrow.status === 'return_requested' || borrow.status === 'completed') && borrow.collected_at) {
      borrowActivities.push({
        id: `${borrow.id}-collected`,
        type: 'borrow',
        status: 'collected',
        timestamp: borrow.collected_at,
        bookTitle: borrow.book_title,
        bookAuthor: borrow.book_author,
        notes: t('admin.handoverNote')
      });
    }

    // Show return requested step (when user requested return)
    if ((borrow.status === 'return_requested' || borrow.status === 'completed') && (borrow.return_requested_at || (borrow.status === 'return_requested' && borrow.updated_at))) {
      borrowActivities.push({
        id: `${borrow.id}-return_requested`,
        type: 'borrow',
        status: 'return_requested',
        timestamp: borrow.return_requested_at || borrow.updated_at,
        bookTitle: borrow.book_title,
        bookAuthor: borrow.book_author,
        notes: ''
      });
    }

    // Show completed step (when book was returned)
    if (borrow.status === 'completed' && borrow.updated_at) {
      borrowActivities.push({
        id: `${borrow.id}-completed`,
        type: 'borrow',
        status: 'completed',
        timestamp: borrow.updated_at,
        bookTitle: borrow.book_title,
        bookAuthor: borrow.book_author,
        notes: t('admin.returnNote')
      });
    }

    // Show rejected step (if rejected)
    if (borrow.status === 'rejected' && borrow.reviewed_at) {
      borrowActivities.push({
        id: `${borrow.id}-rejected`,
        type: 'borrow',
        status: 'rejected',
        timestamp: borrow.reviewed_at,
        bookTitle: borrow.book_title,
        bookAuthor: borrow.book_author,
        notes: t('admin.rejectedReason')
      });
    }

    activities.push(...borrowActivities);
  });

  // Transform donations into activities - show ALL historical steps
  donations.forEach(donation => {
    // If bookFilter is provided, only include activities for that specific book
    if (bookFilter) {
      const matchesBook = donation.book_id === bookFilter.bookId ||
                         (donation.donation_title === bookFilter.title && 
                          donation.donation_author === bookFilter.author);
      if (!matchesBook) {
        return;
      }
    }

    const donationActivities = [];

    // Always show pending step (when request was created)
    if (donation.created_at) {
      donationActivities.push({
        id: `${donation.id}-pending`,
        type: 'donation',
        status: 'pending',
        timestamp: donation.created_at,
        bookTitle: donation.donation_title,
        bookAuthor: donation.donation_author,
        notes: ''
      });
    }

    // Show approved step (when request was reviewed and approved)
    if (donation.status !== 'pending' && donation.status !== 'rejected' && donation.reviewed_at) {
      donationActivities.push({
        id: `${donation.id}-approved`,
        type: 'donation',
        status: 'approved',
        timestamp: donation.reviewed_at,
        bookTitle: donation.donation_title,
        bookAuthor: donation.donation_author,
        notes: t('admin.approvedNote')
      });
    }

    // Show completed step (when donation was completed)
    if (donation.status === 'completed' && donation.completed_at) {
      donationActivities.push({
        id: `${donation.id}-completed`,
        type: 'donation',
        status: 'completed',
        timestamp: donation.completed_at,
        bookTitle: donation.donation_title,
        bookAuthor: donation.donation_author,
        notes: t('admin.donationCompletedNote')
      });
    }

    // Show rejected step (if rejected)
    if (donation.status === 'rejected' && donation.reviewed_at) {
      donationActivities.push({
        id: `${donation.id}-rejected`,
        type: 'donation',
        status: 'rejected',
        timestamp: donation.reviewed_at,
        bookTitle: donation.donation_title,
        bookAuthor: donation.donation_author,
        notes: t('admin.rejectedReason')
      });
    }

    activities.push(...donationActivities);
  });

  // Sort activities by timestamp (newest first)
  return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const AdminDonationManagement = () => {
  const queryClient = useQueryClient();
  const { confirmUpdate, confirmSubmit } = useConfirmation();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showDonationDetails, setShowDonationDetails] = useState(false);

  // Fetch all donations
  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['admin', 'donations'],
    queryFn: apiServices.admin.getDonationRequests,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch user activities for timeline (only when modal is open)
  const { data: userBorrows = [] } = useQuery({
    queryKey: ['admin', 'user-borrows', selectedDonation?.member_id],
    queryFn: () => selectedDonation ? apiServices.admin.getUserBorrows(selectedDonation.member_id) : [],
    enabled: !!selectedDonation && showDonationDetails,
    staleTime: 2 * 60 * 1000,
  });

  const { data: userDonations = [] } = useQuery({
    queryKey: ['admin', 'user-donations', selectedDonation?.member_id],
    queryFn: () => selectedDonation ? apiServices.admin.getUserDonations(selectedDonation.member_id) : [],
    enabled: !!selectedDonation && showDonationDetails,
    staleTime: 2 * 60 * 1000,
  });

  // Approve donation (step 1) mutation
  const approveDonationMutation = useMutation({
    mutationFn: apiServices.admin.approveDonation,
    onSuccess: () => {
      toast.success(t('messages.bookBorrowed'));
      queryClient.invalidateQueries(['admin', 'donations']);
    },
    onError: (error) => {
      toast.error(t('messages.operationFailed') + ': ' + (error?.response?.data?.detail || t('messages.networkError')));
    }
  });

  // Complete donation (step 2) mutation  
  const completeDonationMutation = useMutation({
    mutationFn: (donationId) => apiServices.admin.completeDonation(donationId),
    onSuccess: () => {
      toast.success(t('messages.bookDonated'));
      queryClient.invalidateQueries(['admin', 'donations']);
    },
    onError: (error) => {
      toast.error(t('messages.operationFailed') + ': ' + (error?.response?.data?.detail || t('messages.networkError')));
    }
  });

  // Reject donation mutation
  const rejectDonationMutation = useMutation({
    mutationFn: ({ donationId, reason }) => apiServices.admin.rejectDonation(donationId, reason),
    onSuccess: () => {
      toast.success(t('common.success'));
      queryClient.invalidateQueries(['admin', 'donations']);
    },
    onError: (error) => {
      toast.error(t('messages.operationFailed') + ': ' + (error?.response?.data?.detail || t('messages.networkError')));
    }
  });

  // Filter donations based on search and status
  const filteredDonations = donations.filter(donation => {
    const donorName = getSafeUserName(donation.member_name);
    const bookTitle = getSafeBookTitle(donation.donation_title);
    
    const matchesSearch = donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         donation.id.toString().includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'completed': return Award;
      case 'rejected': return XCircle;
      default: return AlertCircle;
    }
  };

  const getStatusName = (status) => {
    return t(`status.${status}`) || t('common.unknown');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('bn-BD');
  };

  const handleApprove = async (donationId) => {
    const confirmed = await confirmUpdate(
      t('admin.approveDonation'), 
      t('messages.confirmDelete')
    );
    
    if (confirmed) {
      approveDonationMutation.mutate(donationId);
    }
  };

  const handleComplete = async (donationId) => {
    const confirmed = await confirmSubmit(
      t('admin.donationManagement'), 
      t('messages.confirmDelete')
    );
    
    if (confirmed) {
      completeDonationMutation.mutate(donationId);
    }
  };

  const handleReject = async (donationId, reason = t('messages.operationFailed')) => {
    const confirmed = await confirmUpdate(
      t('admin.rejectDonation'), 
      t('messages.confirmDelete')
    );
    
    if (confirmed) {
      rejectDonationMutation.mutate({ donationId, reason });
    }
  };

  // Calculate statistics
  const stats = {
    total: donations.length,
    pending: donations.filter(d => d.status === 'pending').length,
    approved: donations.filter(d => d.status === 'approved').length,
    completed: donations.filter(d => d.status === 'completed').length,
    rejected: donations.filter(d => d.status === 'rejected').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('nav.admin.donations')}</h1>
          <p className="text-gray-600 mt-2">{t('admin.donationManagement')}</p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries(['admin', 'donations'])}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.refresh')}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.donations')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Gift className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('status.pending')}</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('status.approved')}</p>
              <p className="text-2xl font-bold text-blue-900">{stats.approved}</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('status.completed')}</p>
              <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('status.rejected')}</p>
              <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
            </div>
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('admin.userManagement.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">{t('table.all')}</option>
              <option value="pending">{t('status.pending')}</option>
              <option value="approved">{t('status.approved')}</option>
              <option value="completed">{t('status.completed')}</option>
              <option value="rejected">{t('status.rejected')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('history.donation')} ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.userManagement.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('books.title')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDonations.map((donation) => {
                const StatusIcon = getStatusIcon(donation.status);
                return (
                  <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{donation.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                          {donation.member_name?.charAt(0) || 'দ'}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {donation.member_name || t('common.unknown')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {donation.member_email || t('admin.userManagement.phoneNotAvailable')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-10 bg-purple-200 rounded shadow-sm flex items-center justify-center mr-3">
                          <span className="text-purple-700 font-bold text-xs">BOOK</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {donation.donation_title || t('common.unknownBook')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {donation.donation_author || t('common.unknownAuthor')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {getStatusName(donation.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(donation.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {/* View Details */}
                        <button
                          onClick={() => {
                            setSelectedDonation(donation);
                            setShowDonationDetails(true);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                          title={t('common.view')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Status-specific actions */}
                        {donation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(donation.id)}
                              disabled={approveDonationMutation.isPending}
                              className="text-green-600 hover:text-green-700 disabled:opacity-50"
                              title={t('admin.approveDonation')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(donation.id)}
                              disabled={rejectDonationMutation.isPending}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              title={t('admin.rejectDonation')}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {donation.status === 'approved' && (
                          <>
                            <button
                              onClick={() => handleComplete(donation.id)}
                              disabled={completeDonationMutation.isPending}
                              className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                              title={t('admin.donationManagement')}
                            >
                              <Package className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(donation.id)}
                              disabled={rejectDonationMutation.isPending}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              title={t('admin.rejectDonation')}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDonations.length === 0 && (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t('table.noData')}</p>
          </div>
        )}
      </div>

      {/* Donation Details Modal */}
      {showDonationDetails && selectedDonation && (
        <DonationDetailsModal
          donation={selectedDonation}
          onClose={() => {
            setShowDonationDetails(false);
            setSelectedDonation(null);
          }}
          onApprove={() => handleApprove(selectedDonation.id)}
          onComplete={() => handleComplete(selectedDonation.id)}
          onReject={() => handleReject(selectedDonation.id)}
          userBorrows={userBorrows}
          userDonations={userDonations}
        />
      )}
    </div>
  );
};

// Donation Details Modal Component
const DonationDetailsModal = ({ donation, onClose, onApprove, onComplete, onReject, userBorrows, userDonations }) => {
  const { t } = useTranslation();
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (status) => {
    return t(`status.${status}`) || t('common.unknown');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('bn-BD');
  };

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('history.donation')} {t('common.details')} #{donation.id}</h2>
              <p className="text-gray-600">{t('admin.donationManagement')}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('table.status')}</h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(donation.status)}`}>
              {getStatusName(donation.status)}
            </span>
          </div>

          {/* Donor Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.userManagement.user')}</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                  {donation.member_name?.charAt(0) || 'U'}
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-gray-900">{donation.member_name || t('common.unknown')}</div>
                  <div className="text-sm text-gray-500">{donation.member_email || t('admin.userManagement.phoneNotAvailable')}</div>
                  <div className="text-sm text-gray-500">ID: #{donation.member_id}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Book Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('books.title')}</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="h-24 w-16 bg-purple-200 rounded shadow-sm flex items-center justify-center">
                  <span className="text-purple-700 font-bold text-xs">BOOK</span>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-lg font-medium text-gray-900">
                    {donation.donation_title || t('common.unknownBook')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('books.author')}: {donation.donation_author || t('common.unknownAuthor')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t('books.year')}: {donation.donation_year || t('common.unknown')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t('books.pages')}: {donation.donation_pages || t('common.unknown')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.recentActivity')}</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <UserTimeline
                userId={donation.member_id}
                userName={donation.member_name}
                activities={transformUserActivities(userBorrows, userDonations, t, {
                  bookId: donation.book_id,
                  title: donation.donation_title,
                  author: donation.donation_author
                })}
              />
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('table.actions')}</h3>
            <div className="flex flex-wrap gap-3">
              {donation.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      onApprove();
                      onClose();
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('admin.approveDonation')}
                  </button>
                  <button
                    onClick={() => {
                      onReject();
                      onClose();
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('admin.rejectDonation')}
                  </button>
                </>
              )}

              {donation.status === 'approved' && (
                <>
                  <button
                    onClick={() => {
                      onComplete();
                      onClose();
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {t('admin.donationManagement')}
                  </button>
                  <button
                    onClick={() => {
                      onReject();
                      onClose();
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('admin.rejectDonation')}
                  </button>
                </>
              )}

              {(donation.status === 'completed' || donation.status === 'rejected') && (
                <p className="text-gray-500 italic">{t('messages.operationFailed')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDonationManagement;
