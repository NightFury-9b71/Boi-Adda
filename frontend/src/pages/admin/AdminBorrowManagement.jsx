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

const AdminBorrowManagement = () => {
  const queryClient = useQueryClient();
  const { confirmUpdate, confirmSubmit } = useConfirmation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [showBorrowDetails, setShowBorrowDetails] = useState(false);

  // Fetch all borrows
  const { data: borrows = [], isLoading } = useQuery({
    queryKey: ['admin', 'borrows'],
    queryFn: apiServices.admin.getBorrowRequests,
    staleTime: 2 * 60 * 1000,
  });

  // Approve borrow (step 1) mutation
  const approveBorrowMutation = useMutation({
    mutationFn: apiServices.admin.approveBorrow,
    onSuccess: () => {
      toast.success('ধারের অনুরোধ অনুমোদিত হয়েছে! ব্যবহারকারীকে বইটি নিতে আসার জন্য বলুন।');
      queryClient.invalidateQueries(['admin', 'borrows']);
    },
    onError: (error) => {
      toast.error('অনুমোদন করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  // Handover book (step 2) mutation  
  const handoverBookMutation = useMutation({
    mutationFn: (borrowId) => apiServices.admin.handoverBook(borrowId),
    onSuccess: () => {
      toast.success('বই সফলভাবে হস্তান্তর করা হয়েছে!');
      queryClient.invalidateQueries(['admin', 'borrows']);
    },
    onError: (error) => {
      toast.error('হস্তান্তর করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  // Reject borrow mutation
  const rejectBorrowMutation = useMutation({
    mutationFn: ({ borrowId, reason }) => apiServices.admin.rejectBorrow(borrowId, reason),
    onSuccess: () => {
      toast.success('ধারের অনুরোধ প্রত্যাখ্যান করা হয়েছে।');
      queryClient.invalidateQueries(['admin', 'borrows']);
    },
    onError: (error) => {
      toast.error('প্রত্যাখ্যান করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  // Return book mutation
  const returnBookMutation = useMutation({
    mutationFn: (borrowId) => apiServices.admin.returnBook(borrowId),
    onSuccess: () => {
      toast.success('বই সফলভাবে ফেরত নেওয়া হয়েছে!');
      queryClient.invalidateQueries(['admin', 'borrows']);
    },
    onError: (error) => {
      toast.error('ফেরত নিতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  // Filter and sort borrows based on search and status (latest first)
  const filteredBorrows = borrows
    .filter(borrow => {
      const borrowerName = borrow.member_name || 'অজানা';
      const bookTitle = borrow.book_title || 'অজানা বই';
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
    switch (status) {
      case 'pending': return 'অপেক্ষমাণ';
      case 'approved': return 'অনুমোদিত';
      case 'collected': return 'সংগৃহীত';
      case 'return_requested': return 'ফেরত অনুরোধ';
      case 'completed': return 'সম্পন্ন';
      case 'rejected': return 'প্রত্যাখ্যাত';
      default: return 'অজানা';
    }
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
        return 'অনুরোধ';
      case 'approved':
        return 'অনুমোদন';
      case 'collected':
        return 'সংগৃহীত';
      case 'return_requested':
        return 'ফেরত অনুরোধ';
      case 'completed':
        return 'সম্পন্ন';
      case 'rejected':
        return 'প্রত্যাখ্যান';
      default:
        return 'তারিখ';
    }
  };

  // Confirmation handlers - show modal before action
  const handleApprove = async (borrowId) => {
    const confirmed = await confirmUpdate(
      'ধারের অনুরোধ অনুমোদন',
      'আপনি কি নিশ্চিত যে এই ধারের অনুরোধটি অনুমোদন করতে চান?'
    );
    
    if (confirmed) {
      approveBorrowMutation.mutate(borrowId);
    }
  };

  const handleHandover = async (borrowId) => {
    const confirmed = await confirmSubmit(
      'বই হস্তান্তর',
      'আপনি কি নিশ্চিত যে বইটি ব্যবহারকারীর কাছে হস্তান্তর করা হয়েছে?'
    );
    
    if (confirmed) {
      handoverBookMutation.mutate(borrowId);
    }
  };

  const handleReject = async (borrowId, reason = "প্রশাসনিক কারণে প্রত্যাখ্যাত") => {
    const confirmed = await confirmUpdate(
      'ধারের অনুরোধ প্রত্যাখ্যান',
      'আপনি কি নিশ্চিত যে এই ধারের অনুরোধটি প্রত্যাখ্যান করতে চান?'
    );
    
    if (confirmed) {
      rejectBorrowMutation.mutate({ borrowId, reason });
    }
  };

  const handleReturn = async (borrowId) => {
    const confirmed = await confirmSubmit(
      'বই ফেরত গ্রহণ',
      'আপনি কি নিশ্চিত যে বইটি ফেরত নেওয়া হয়েছে?'
    );
    
    if (confirmed) {
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
          <p className="text-gray-600">ধারের তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ধার ব্যবস্থাপনা</h1>
          <p className="text-gray-600 mt-2">সকল ধারের অনুরোধ পর্যালোচনা ও অনুমোদন করুন</p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries(['admin', 'borrows'])}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          রিফ্রেশ
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">মোট ধার</p>
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
              <p className="text-sm font-medium text-gray-600">অপেক্ষমাণ</p>
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
              <p className="text-sm font-medium text-gray-600">অনুমোদিত</p>
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
              <p className="text-sm font-medium text-gray-600">সংগৃহীত</p>
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
              <p className="text-sm font-medium text-gray-600">ফেরত অনুরোধ</p>
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
              <p className="text-sm font-medium text-gray-600">সম্পন্ন</p>
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
              <p className="text-sm font-medium text-gray-600">প্রত্যাখ্যাত</p>
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
                placeholder="ব্যবহারকারী, বই, ধার ID বা ব্যবহারকারী ID দিয়ে খুঁজুন..."
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
              <option value="all">সকল অবস্থা</option>
              <option value="pending">অপেক্ষমাণ</option>
              <option value="approved">অনুমোদিত</option>
              <option value="collected">সংগৃহীত</option>
              <option value="return_requested">ফেরত অনুরোধ</option>
              <option value="completed">সম্পন্ন</option>
              <option value="rejected">প্রত্যাখ্যাত</option>
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
                  ধার ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ব্যবহারকারী ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ব্যবহারকারী
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  বই
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  অবস্থা
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  তারিখ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  কার্যক্রম
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
                            {borrow.member_name || 'অজানা ব্যবহারকারী'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {borrow.member_email || 'ইমেইল নেই'}
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
                              বই
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {borrow.book_title || 'অজানা বই'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {borrow.book_author || 'অজানা লেখক'}
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
                          title="বিস্তারিত দেখুন"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Status-specific actions */}
                        {borrow.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(borrow.id)}
                              disabled={approveBorrowMutation.isPending}
                              className="text-green-600 hover:text-green-700 disabled:opacity-50"
                              title="অনুমোদন করুন"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(borrow.id)}
                              disabled={rejectBorrowMutation.isPending}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              title="প্রত্যাখ্যান করুন"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {borrow.status === 'approved' && (
                          <>
                            <button
                              onClick={() => handleHandover(borrow.id)}
                              disabled={handoverBookMutation.isPending}
                              className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                              title="বই হস্তান্তর করুন"
                            >
                              <HandMetal className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(borrow.id)}
                              disabled={rejectBorrowMutation.isPending}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              title="প্রত্যাখ্যান করুন"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {borrow.status === 'return_requested' && (
                          <button
                            onClick={() => handleReturn(borrow.id)}
                            disabled={returnBookMutation.isPending}
                            className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                            title="বই ফেরত গ্রহণ করুন"
                          >
                            <CheckCircle className="h-4 w-4" />
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
            <p className="text-gray-500">কোন ধারের রেকর্ড পাওয়া যায়নি</p>
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
        />
      )}
    </div>
  );
};

// Borrow Details Modal Component
const BorrowDetailsModal = ({ borrow, onClose, onApprove, onHandover, onReject, onReturn }) => {
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
    switch (status) {
      case 'pending': return 'অপেক্ষমাণ';
      case 'approved': return 'অনুমোদিত';
      case 'collected': return 'সংগৃহীত';
      case 'return_requested': return 'ফেরত অনুরোধ';
      case 'completed': return 'সম্পন্ন';
      case 'rejected': return 'প্রত্যাখ্যাত';
      default: return 'অজানা';
    }
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
              <h2 className="text-2xl font-bold text-gray-900">ধার বিবরণ #{borrow.id}</h2>
              <p className="text-gray-600">ধারের সম্পূর্ণ তথ্য দেখুন ও প্রয়োজনীয় ব্যবস্থা নিন</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">বর্তমান অবস্থা</h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(borrow.status)}`}>
              {getStatusName(borrow.status)}
            </span>
          </div>

          {/* User Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ধারকারী</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center text-blue-700 font-semibold shadow-sm">
                  {borrow.member_name?.charAt(0) || 'U'}
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-gray-900">{borrow.member_name || 'অজানা ব্যবহারকারী'}</div>
                  <div className="text-sm text-gray-500">{borrow.member_email || 'ইমেইল নেই'}</div>
                  <div className="text-sm text-gray-500">ID: #{borrow.member_id}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Book Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">বইয়ের তথ্য</h3>
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
                      বই
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-lg font-medium text-gray-900">
                    {borrow.book_title || 'অজানা বই'}
                  </div>
                  <div className="text-sm text-gray-600">
                    লেখক: {borrow.book_author || 'অজানা লেখক'}
                  </div>
                  <div className="text-sm text-gray-500">
                    বই ID: #{borrow.book_id}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">সময়রেখা</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">অনুরোধ করা হয়েছে</p>
                  <p className="text-sm text-gray-600">{formatDate(borrow.created_at)}</p>
                </div>
              </div>
              
              {borrow.status !== 'pending' && (
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">স্ট্যাটাস আপডেট</p>
                    <p className="text-sm text-gray-600">{formatDate(borrow.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">কার্যক্রম</h3>
            <div className="flex flex-wrap gap-3">
              {borrow.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      onApprove();
                      onClose();
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    অনুমোদন করুন
                  </button>
                  <button
                    onClick={() => {
                      onReject();
                      onClose();
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    প্রত্যাখ্যান করুন
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
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <HandMetal className="h-4 w-4 mr-2" />
                    বই হস্তান্তর করুন
                  </button>
                  <button
                    onClick={() => {
                      onReject();
                      onClose();
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    প্রত্যাখ্যান করুন
                  </button>
                </>
              )}

              {borrow.status === 'return_requested' && (
                <button
                  onClick={() => {
                    onReturn();
                    onClose();
                  }}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  বই ফেরত গ্রহণ করুন
                </button>
              )}

              {borrow.status === 'collected' && (
                <p className="text-blue-600 italic">বইটি বর্তমানে সদস্যের কাছে রয়েছে। ফেরত দিতে সদস্যকে অনুরোধ জানান।</p>
              )}

              {(borrow.status === 'completed' || borrow.status === 'rejected') && (
                <p className="text-gray-500 italic">এই ধারের জন্য আর কোন কার্যক্রম প্রয়োজন নেই।</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBorrowManagement;
