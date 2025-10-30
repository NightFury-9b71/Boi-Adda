import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  HandMetal,
  RefreshCw,
  Eye,
  Calendar,
  CheckCheck,
  RotateCcw,
  BookMarked,

} from 'lucide-react';
import { apiServices } from '../../api';
import OptimizedImage from '../../components/OptimizedImage';
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
        notes: t('admin.approvedNote')
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

const AdminBorrowManagement = () => {
  const queryClient = useQueryClient();
  const { confirmUpdate, confirmSubmit } = useConfirmation();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [showBorrowDetails, setShowBorrowDetails] = useState(false);
  const [approvingBorrowId, setApprovingBorrowId] = useState(null);
  const [rejectingBorrowId, setRejectingBorrowId] = useState(null);
  const [handoverBorrowId, setHandoverBorrowId] = useState(null);
  const [returningBorrowId, setReturningBorrowId] = useState(null);
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState('');

  // Fetch all borrows
  const { data: borrows = [], isLoading } = useQuery({
    queryKey: ['admin', 'borrows'],
    queryFn: apiServices.admin.getBorrowRequests,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch user activities for timeline (only when modal is open)
  const { data: userBorrows = [] } = useQuery({
    queryKey: ['admin', 'user-borrows', selectedBorrow?.member_id],
    queryFn: () => selectedBorrow ? apiServices.admin.getUserBorrows(selectedBorrow.member_id) : [],
    enabled: !!selectedBorrow && showBorrowDetails,
    staleTime: 2 * 60 * 1000,
  });

  const { data: userDonations = [] } = useQuery({
    queryKey: ['admin', 'user-donations', selectedBorrow?.member_id],
    queryFn: () => selectedBorrow ? apiServices.admin.getUserDonations(selectedBorrow.member_id) : [],
    enabled: !!selectedBorrow && showBorrowDetails,
    staleTime: 2 * 60 * 1000,
  });

  // Approve borrow (step 1) mutation
  const approveBorrowMutation = useMutation({
    mutationFn: apiServices.admin.approveBorrow,
    onSuccess: () => {
      toast.success(t('messages.bookBorrowed'));
      queryClient.invalidateQueries(['admin', 'borrows']);
      setApprovingBorrowId(null);
    },
    onError: (error) => {
      toast.error(t('messages.operationFailed') + ': ' + (error?.response?.data?.detail || t('messages.networkError')));
      setApprovingBorrowId(null);
    }
  });

  // Handover book (step 2) mutation  
  const handoverBookMutation = useMutation({
    mutationFn: ({ borrowId, dueDate }) => apiServices.admin.handoverBook(borrowId, dueDate),
    onSuccess: () => {
      toast.success(t('messages.bookBorrowed'));
      queryClient.invalidateQueries(['admin', 'borrows']);
      setHandoverBorrowId(null);
      setShowDueDateModal(false);
      setSelectedDueDate('');
    },
    onError: (error) => {
      toast.error(t('messages.operationFailed') + ': ' + (error?.response?.data?.detail || t('messages.networkError')));
      setHandoverBorrowId(null);
    }
  });

  // Reject borrow mutation
  const rejectBorrowMutation = useMutation({
    mutationFn: ({ borrowId, reason }) => apiServices.admin.rejectBorrow(borrowId, reason),
    onSuccess: () => {
      toast.success(t('common.success'));
      queryClient.invalidateQueries(['admin', 'borrows']);
      setRejectingBorrowId(null);
    },
    onError: (error) => {
      toast.error(t('messages.operationFailed') + ': ' + (error?.response?.data?.detail || t('messages.networkError')));
      setRejectingBorrowId(null);
    }
  });

  // Return book mutation
  const returnBookMutation = useMutation({
    mutationFn: (borrowId) => apiServices.admin.returnBook(borrowId),
    onSuccess: () => {
      toast.success(t('messages.bookReturned'));
      queryClient.invalidateQueries(['admin', 'borrows']);
      setReturningBorrowId(null);
    },
    onError: (error) => {
      toast.error(t('messages.operationFailed') + ': ' + (error?.response?.data?.detail || t('messages.networkError')));
      setReturningBorrowId(null);
    }
  });

  // Filter and sort borrows based on search and status (latest first)
  const filteredBorrows = borrows
    .filter(borrow => {
      const borrowerName = borrow.member_name || t('common.unknown');
      const bookTitle = borrow.book_title || t('common.unknownBook');
      const userId = borrow.member_id || '';
      
      const matchesSearch = borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           borrow.id.toString().includes(searchQuery) ||
                           userId.toString().includes(searchQuery);
      
      const matchesStatus = statusFilter === 'all' || borrow.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'collected': return 'bg-green-100 text-green-800';
      case 'return_requested': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'collected': return BookOpen;
      case 'return_requested': return RotateCcw;
      case 'completed': return CheckCheck;
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

  const getDisplayDate = (borrow) => {
    switch (borrow.status) {
      case 'pending':
        return borrow.created_at;
      case 'approved':
        return borrow.reviewed_at || borrow.created_at;
      case 'collected':
        return borrow.collected_at || borrow.reviewed_at || borrow.created_at;
      case 'return_requested':
        return borrow.created_at; // Show when return was requested
      case 'completed':
        return borrow.created_at; // Show when completed
      case 'rejected':
        return borrow.created_at;
      default:
        return borrow.created_at;
    }
  };

  const getDateLabel = (status) => {
    switch (status) {
      case 'pending':
        return t('history.requestDate');
      case 'approved':
        return t('history.approvalDate');
      case 'collected':
        return t('history.handoverDate');
      case 'return_requested':
        return t('history.returnDate');
      case 'completed':
        return t('history.completedDate');
      case 'rejected':
        return t('history.rejectedDate');
      default:
        return t('table.date');
    }
  };

  // Confirmation handlers - show modal before action
  const handleApprove = async (borrowId) => {
    const confirmed = await confirmUpdate(
      t('admin.borrowManagement'),
      t('messages.confirmDelete')
    );
    
    if (confirmed) {
      setApprovingBorrowId(borrowId);
      approveBorrowMutation.mutate(borrowId);
    }
  };

  const handleHandover = async (borrowId) => {
    // Set default due date to 14 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);
    setSelectedDueDate(defaultDueDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    setHandoverBorrowId(borrowId);
    setShowDueDateModal(true);
  };

  const confirmHandoverWithDueDate = async () => {
    if (!selectedDueDate) {
      toast.error(t('messages.selectDueDate'));
      return;
    }

    // Convert date string to full datetime string for backend
    const dueDateTime = new Date(selectedDueDate + 'T23:59:59').toISOString();

    const confirmed = await confirmSubmit(
      t('admin.issueBook'),
      `${t('messages.confirmDelete')} ${t('admin.dueDate')}: ${new Date(selectedDueDate).toLocaleDateString('bn-BD')}`
    );
    
    if (confirmed) {
      handoverBookMutation.mutate({ 
        borrowId: handoverBorrowId, 
        dueDate: dueDateTime 
      });
    }
  };

  const handleReject = async (borrowId, reason = t('messages.operationFailed')) => {
    const confirmed = await confirmUpdate(
      t('admin.rejectDonation'),
      t('messages.confirmDelete')
    );
    
    if (confirmed) {
      setRejectingBorrowId(borrowId);
      rejectBorrowMutation.mutate({ borrowId, reason });
    }
  };

  const handleReturn = async (borrowId) => {
    const confirmed = await confirmSubmit(
      t('admin.returnBook'),
      t('messages.confirmDelete')
    );
    
    if (confirmed) {
      setReturningBorrowId(borrowId);
      returnBookMutation.mutate(borrowId);
    }
  };

  // Calculate statistics
  const stats = {
    total: borrows.length,
    pending: borrows.filter(b => b.status === 'pending').length,
    approved: borrows.filter(b => b.status === 'approved').length,
    collected: borrows.filter(b => b.status === 'collected').length,
    return_requested: borrows.filter(b => b.status === 'return_requested').length,
    completed: borrows.filter(b => b.status === 'completed').length,
    rejected: borrows.filter(b => b.status === 'rejected').length,
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
          <h1 className="text-3xl font-bold text-gray-900">{t('nav.admin.borrows')}</h1>
          <p className="text-gray-600 mt-2">{t('admin.borrowManagement')}</p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries(['admin', 'borrows'])}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.refresh')}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.borrows')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <BookMarked className="h-5 w-5 text-gray-600" />
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
              <p className="text-sm font-medium text-gray-600">{t('status.collected')}</p>
              <p className="text-2xl font-bold text-green-900">{stats.collected}</p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('status.return_requested')}</p>
              <p className="text-2xl font-bold text-purple-900">{stats.return_requested}</p>
            </div>
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <RotateCcw className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('status.completed')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckCheck className="h-5 w-5 text-gray-600" />
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
              <option value="collected">{t('status.collected')}</option>
              <option value="return_requested">{t('status.return_requested')}</option>
              <option value="completed">{t('status.completed')}</option>
              <option value="rejected">{t('status.rejected')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Borrows Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('history.borrow')} ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.userManagement.user')} ID
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
              {filteredBorrows.map((borrow) => {
                const StatusIcon = getStatusIcon(borrow.status);
                return (
                  <tr key={borrow.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{borrow.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">#{borrow.member_id || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center text-blue-700 font-semibold shadow-sm">
                          {borrow.member_name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {borrow.member_name || t('common.unknown')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {borrow.member_email || t('admin.userManagement.phoneNotAvailable')}
                        </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-10 bg-white rounded shadow-sm overflow-hidden mr-3">
                          {borrow.book_cover_url ? (
                            <OptimizedImage
                              publicId={borrow.book_cover_url}
                              alt={borrow.book_title}
                              type="bookCover"
                              size="thumbnail"
                              className="w-full h-full object-cover"
                              placeholderText="BOOK"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                              {t('admin.bookPlaceholder')}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {borrow.book_title || t('common.unknownBook')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {borrow.book_author || t('common.unknownAuthor')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(borrow.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {getStatusName(borrow.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="text-xs text-gray-400">{getDateLabel(borrow.status)}</div>
                        <div className="font-medium">{formatDate(getDisplayDate(borrow))}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {/* View Details */}
                        <button
                          onClick={() => {
                            setSelectedBorrow(borrow);
                            setShowBorrowDetails(true);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                          title={t('admin.userManagement.viewDetails')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Status-specific actions */}
                        {borrow.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(borrow.id)}
                              disabled={approvingBorrowId === borrow.id}
                              className="text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              title={t('admin.approveDonation')}
                            >
                              {approvingBorrowId === borrow.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(borrow.id)}
                              disabled={rejectingBorrowId === borrow.id}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              title={t('admin.rejectButton')}
                            >
                              {rejectingBorrowId === borrow.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}

                        {borrow.status === 'approved' && (
                          <>
                            <button
                              onClick={() => handleHandover(borrow.id)}
                              disabled={handoverBorrowId === borrow.id}
                              className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              title={t('admin.handoverButton')}
                            >
                              {handoverBorrowId === borrow.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              ) : (
                                <HandMetal className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(borrow.id)}
                              disabled={rejectingBorrowId === borrow.id}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              title={t('admin.rejectButton')}
                            >
                              {rejectingBorrowId === borrow.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}

                        {(borrow.status === 'collected' || borrow.status === 'return_requested') && (
                          <button
                            onClick={() => handleReturn(borrow.id)}
                            disabled={returningBorrowId === borrow.id}
                            className="text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            title={t('admin.returnButton')}
                          >
                            {returningBorrowId === borrow.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBorrows.length === 0 && (
          <div className="text-center py-12">
            <BookMarked className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t('table.noData')}</p>
          </div>
        )}
      </div>

      {/* Borrow Details Modal */}
      {showBorrowDetails && selectedBorrow && (
        <BorrowDetailsModal
          borrow={selectedBorrow}
          onClose={() => {
            setShowBorrowDetails(false);
            setSelectedBorrow(null);
          }}
          onApprove={() => handleApprove(selectedBorrow.id)}
          onHandover={() => handleHandover(selectedBorrow.id)}
          onReject={() => handleReject(selectedBorrow.id)}
          onReturn={() => handleReturn(selectedBorrow.id)}
          loadingStates={{
            approving: approvingBorrowId === selectedBorrow.id,
            rejecting: rejectingBorrowId === selectedBorrow.id,
            handover: handoverBorrowId === selectedBorrow.id,
            returning: returningBorrowId === selectedBorrow.id,
          }}
          userBorrows={userBorrows}
          userDonations={userDonations}
        />
      )}

      {/* Due Date Selection Modal */}
      {showDueDateModal && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{t('admin.setDueDate')}</h2>
                  <p className="text-gray-600">{t('admin.selectReturnDate')}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDueDateModal(false);
                    setHandoverBorrowId(null);
                    setSelectedDueDate('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.dueDate')}
                </label>
                <input
                  type="date"
                  value={selectedDueDate}
                  onChange={(e) => setSelectedDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.dueDateHelp')}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDueDateModal(false);
                    setHandoverBorrowId(null);
                    setSelectedDueDate('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={confirmHandoverWithDueDate}
                  disabled={handoverBookMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {handoverBookMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('admin.issuing')}
                    </>
                  ) : (
                    <>
                      <HandMetal className="h-4 w-4 mr-2" />
                      {t('admin.issueBook')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Borrow Details Modal Component
const BorrowDetailsModal = ({ borrow, onClose, onApprove, onHandover, onReject, onReturn, loadingStates, userBorrows, userDonations }) => {
  const { t } = useTranslation();
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'collected': return 'bg-green-100 text-green-800';
      case 'return_requested': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
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
              <h2 className="text-2xl font-bold text-gray-900">{t('history.borrow')} {t('common.details')} #{borrow.id}</h2>
              <p className="text-gray-600">{t('admin.borrowManagement')}</p>
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
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(borrow.status)}`}>
              {getStatusName(borrow.status)}
            </span>
          </div>

          {/* User Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.personalInfo')}</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center text-blue-700 font-semibold shadow-sm">
                  {borrow.member_name?.charAt(0) || 'U'}
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-gray-900">{borrow.member_name || t('common.unknown')}</div>
                  <div className="text-sm text-gray-500">{borrow.member_email || t('admin.userManagement.phoneNotAvailable')}</div>
                  <div className="text-sm text-gray-500">ID: #{borrow.member_id}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Book Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('books.title')}</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="h-24 w-16 bg-white rounded shadow-sm overflow-hidden">
                  {borrow.book_cover_url ? (
                    <OptimizedImage
                      publicId={borrow.book_cover_url}
                      alt={borrow.book_title}
                      type="bookCover"
                      size="small"
                      className="w-full h-full object-cover"
                      placeholderText="BOOK"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                      {t('admin.bookPlaceholder')}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-lg font-medium text-gray-900">
                    {borrow.book_title || t('common.unknownBook')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('books.author')}: {borrow.book_author || t('common.unknownAuthor')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t('admin.bookIdLabel')} #{borrow.book_id}
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
                userId={borrow.member_id}
                userName={borrow.member_name}
                activities={transformUserActivities(userBorrows, userDonations, t, {
                  bookId: borrow.book_id,
                  title: borrow.book_title,
                  author: borrow.book_author
                })}
              />
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('table.actions')}</h3>
            <div className="flex flex-wrap gap-3">
              {borrow.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      onApprove();
                      onClose();
                    }}
                    disabled={loadingStates?.approving}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingStates?.approving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('admin.approveDonation')}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('admin.approveDonation')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onReject();
                      onClose();
                    }}
                    disabled={loadingStates?.rejecting}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingStates?.rejecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('admin.rejecting')}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('admin.rejectButton')}
                      </>
                    )}
                  </button>
                </>
              )}

              {borrow.status === 'approved' && (
                <>
                  <button
                    onClick={() => {
                      onHandover();
                      onClose();
                    }}
                    disabled={loadingStates?.handover}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingStates?.handover ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('admin.issueBook')}
                      </>
                    ) : (
                      <>
                        <HandMetal className="h-4 w-4 mr-2" />
                        {t('admin.issueBook')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onReject();
                      onClose();
                    }}
                    disabled={loadingStates?.rejecting}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingStates?.rejecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('admin.rejecting')}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('admin.rejectButton')}
                      </>
                    )}
                  </button>
                </>
              )}

              {(borrow.status === 'collected' || borrow.status === 'return_requested') && (
                <button
                  onClick={() => {
                    onReturn();
                    onClose();
                  }}
                  disabled={loadingStates?.returning}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingStates?.returning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('admin.returnBook')}
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t('admin.returnBook')}
                    </>
                  )}
                </button>
              )}

              {(borrow.status === 'completed' || borrow.status === 'rejected') && (
                <p className="text-gray-500 italic">{t('messages.operationFailed')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBorrowManagement;
