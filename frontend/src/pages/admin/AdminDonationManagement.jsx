import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../utils/toast';
import { getSafeUserName, getSafeBookTitle, getSafeAuthor, getSafeNumber, getSafeDate } from '../../utils/dataHelpers';
import { 
  Gift, 
  Search, 
  Filter, 
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

const AdminDonationManagement = () => {
  const queryClient = useQueryClient();
  const { confirmUpdate, confirmSubmit } = useConfirmation();
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

  // Approve donation (step 1) mutation
  const approveDonationMutation = useMutation({
    mutationFn: apiServices.admin.approveDonation,
    onSuccess: () => {
      toast.success('দানের অনুরোধ অনুমোদিত হয়েছে! ব্যবহারকারীকে বই নিয়ে আসার জন্য বলুন।');
      queryClient.invalidateQueries(['admin', 'donations']);
    },
    onError: (error) => {
      toast.error('অনুমোদন করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  // Complete donation (step 2) mutation  
  const completeDonationMutation = useMutation({
    mutationFn: (donationId) => apiServices.admin.completeDonation(donationId),
    onSuccess: () => {
      toast.success('দান সফলভাবে সম্পন্ন হয়েছে! বই লাইব্রেরিতে যোগ করা হয়েছে।');
      queryClient.invalidateQueries(['admin', 'donations']);
    },
    onError: (error) => {
      toast.error('সম্পন্ন করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  // Reject donation mutation
  const rejectDonationMutation = useMutation({
    mutationFn: ({ donationId, reason }) => apiServices.admin.rejectDonation(donationId, reason),
    onSuccess: () => {
      toast.success('দানের অনুরোধ প্রত্যাখ্যান করা হয়েছে।');
      queryClient.invalidateQueries(['admin', 'donations']);
    },
    onError: (error) => {
      toast.error('প্রত্যাখ্যান করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
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
    switch (status) {
      case 'pending': return 'অপেক্ষমাণ';
      case 'approved': return 'অনুমোদিত';
      case 'completed': return 'সম্পন্ন';
      case 'rejected': return 'প্রত্যাখ্যাত';
      default: return 'অজানা';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('bn-BD');
  };

  const handleApprove = async (donationId) => {
    const confirmed = await confirmUpdate(
      'দান অনুমোদন', 
      'আপনি কি নিশ্চিত যে এই দানটি অনুমোদন করতে চান?'
    );
    
    if (confirmed) {
      approveDonationMutation.mutate(donationId);
    }
  };

  const handleComplete = async (donationId) => {
    const confirmed = await confirmSubmit(
      'দান সম্পূর্ণ', 
      'আপনি কি নিশ্চিত যে এই দানটি সম্পূর্ণ হয়েছে?'
    );
    
    if (confirmed) {
      completeDonationMutation.mutate(donationId);
    }
  };

  const handleReject = async (donationId, reason = "প্রশাসনিক কারণে প্রত্যাখ্যাত") => {
    const confirmed = await confirmUpdate(
      'দান প্রত্যাখ্যান', 
      'আপনি কি নিশ্চিত যে এই দানটি প্রত্যাখ্যান করতে চান?'
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
          <p className="text-gray-600">দানের তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">দান ব্যবস্থাপনা</h1>
          <p className="text-gray-600 mt-2">সকল দানের অনুরোধ পর্যালোচনা ও অনুমোদন করুন</p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries(['admin', 'donations'])}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          রিফ্রেশ
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">মোট দান</p>
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
              <p className="text-sm font-medium text-gray-600">সম্পন্ন</p>
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
                placeholder="দাতা, বই বা ID দিয়ে খুঁজুন..."
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
              <option value="completed">সম্পন্ন</option>
              <option value="rejected">প্রত্যাখ্যাত</option>
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
                  দান ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  দাতা
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
                            {donation.member_name || 'অজানা দাতা'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {donation.member_email || 'ইমেইল নেই'}
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
                            {donation.donation_title || 'অজানা বই'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {donation.donation_author || 'অজানা লেখক'}
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
                          title="বিস্তারিত দেখুন"
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
                              title="অনুমোদন করুন"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(donation.id)}
                              disabled={rejectDonationMutation.isPending}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              title="প্রত্যাখ্যান করুন"
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
                              title="দান সম্পন্ন করুন"
                            >
                              <Package className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(donation.id)}
                              disabled={rejectDonationMutation.isPending}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              title="প্রত্যাখ্যান করুন"
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
            <p className="text-gray-500">কোন দানের রেকর্ড পাওয়া যায়নি</p>
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
        />
      )}
    </div>
  );
};

// Donation Details Modal Component
const DonationDetailsModal = ({ donation, onClose, onApprove, onComplete, onReject }) => {
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
    switch (status) {
      case 'pending': return 'অপেক্ষমাণ';
      case 'approved': return 'অনুমোদিত';
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
              <h2 className="text-2xl font-bold text-gray-900">দান বিবরণ #{donation.id}</h2>
              <p className="text-gray-600">দানের সম্পূর্ণ তথ্য দেখুন ও প্রয়োজনীয় ব্যবস্থা নিন</p>
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
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(donation.status)}`}>
              {getStatusName(donation.status)}
            </span>
          </div>

          {/* Donor Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">দাতা</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                  {donation.member_name?.charAt(0) || 'দ'}
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-gray-900">{donation.member_name || 'অজানা দাতা'}</div>
                  <div className="text-sm text-gray-500">{donation.member_email || 'ইমেইল নেই'}</div>
                  <div className="text-sm text-gray-500">ID: #{donation.member_id}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Book Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">বইয়ের তথ্য</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="h-24 w-16 bg-purple-200 rounded shadow-sm flex items-center justify-center">
                  <span className="text-purple-700 font-bold text-xs">BOOK</span>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-lg font-medium text-gray-900">
                    {donation.donation_title || 'অজানা বই'}
                  </div>
                  <div className="text-sm text-gray-600">
                    লেখক: {donation.donation_author || 'অজানা লেখক'}
                  </div>
                  <div className="text-sm text-gray-500">
                    প্রকাশ: {donation.donation_year || 'অজানা'}
                  </div>
                  <div className="text-sm text-gray-500">
                    পৃষ্ঠা: {donation.donation_pages || 'অজানা'}
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
                  <p className="text-sm text-blue-600 font-medium">দানের অনুরোধ করা হয়েছে</p>
                  <p className="text-sm text-gray-600">{formatDate(donation.created_at)}</p>
                </div>
              </div>
              
              {donation.status !== 'pending' && (
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">স্ট্যাটাস আপডেট</p>
                    <p className="text-sm text-gray-600">{formatDate(donation.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">কার্যক্রম</h3>
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
                    দান সম্পন্ন করুন
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

              {(donation.status === 'completed' || donation.status === 'rejected') && (
                <p className="text-gray-500 italic">এই দানের জন্য আর কোন কার্যক্রম প্রয়োজন নেই।</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDonationManagement;
