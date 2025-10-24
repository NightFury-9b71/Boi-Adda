import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import PasswordInput from '../../components/PasswordInput';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Shield, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  MoreVertical,
  Eye,
  Trash2,
  Crown,
  BookOpen,
  X,
  AlertCircle,
  RefreshCw,
  Gift,
  Clock
} from 'lucide-react';
import { apiServices } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import OptimizedImage from '../../components/OptimizedImage';

const AdminUserManagement = () => {
  const queryClient = useQueryClient();
  const { confirmUpdate } = useConfirmation();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: apiServices.admin.getUsers,
    staleTime: 5 * 60 * 1000,
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => apiServices.admin.updateUserRole(userId, role),
    onSuccess: () => {
      toast.success('ব্যবহারকারীর ভূমিকা সফলভাবে আপডেট হয়েছে!');
      queryClient.invalidateQueries(['admin', 'users']);
    },
    onError: (error) => {
      toast.error('ভূমিকা আপডেট করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }) => apiServices.admin.updateUserStatus(userId, isActive),
    onSuccess: (data, variables) => {
      const action = variables.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়';
      toast.success(`ব্যবহারকারী সফলভাবে ${action} করা হয়েছে!`);
      queryClient.invalidateQueries(['admin', 'users']);
    },
    onError: (error) => {
      toast.error('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = async (userId, newRole, userName) => {
    const roleMap = {
      'admin': 'প্রশাসক',
      'librarian': 'গ্রন্থাগারিক', 
      'member': 'সদস্য'
    };
    
    const confirmed = await confirmUpdate(
      `${userName} এর ভূমিকা ${roleMap[newRole]} এ পরিবর্তন করুন`,
      `আপনি কি নিশ্চিত যে ${userName} এর ভূমিকা ${roleMap[newRole]} এ পরিবর্তন করতে চান?`
    );
    
    if (confirmed) {
      updateUserRoleMutation.mutate({ userId, role: newRole });
    }
  };

  const handleStatusToggle = async (userId, currentStatus, userName) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'সক্রিয়' : 'নিষ্ক্রিয়';
    
    const confirmed = await confirmUpdate(
      `${userName} কে ${action} করুন`,
      `আপনি কি নিশ্চিত যে ${userName} কে ${action} করতে চান?`
    );
    
    if (confirmed) {
      updateUserStatusMutation.mutate({ userId, isActive: newStatus });
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'librarian': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return Crown;
      case 'librarian': return Shield;
      case 'member': return Users;
      default: return Users;
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return 'প্রশাসক';
      case 'librarian': return 'গ্রন্থাগারিক';
      case 'member': return 'সদস্য';
      default: return 'অজানা';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('bn-BD');
  };

  const getUserInitials = (name) => {
    if (!name) return 'ব';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ব্যবহারকারীর তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ব্যবহারকারী ব্যবস্থাপনা</h1>
          <p className="text-gray-600 mt-2">সকল ব্যবহারকারীর তথ্য দেখুন ও পরিচালনা করুন</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          নতুন ব্যবহারকারী
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">মোট ব্যবহারকারী</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">সক্রিয় ব্যবহারকারী</p>
              <p className="text-3xl font-bold text-green-900">
                {users.filter(u => u.is_active).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">প্রশাসক</p>
              <p className="text-3xl font-bold text-red-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Crown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">গ্রন্থাগারিক</p>
              <p className="text-3xl font-bold text-blue-900">
                {users.filter(u => u.role === 'librarian').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
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
                placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">সকল ভূমিকা</option>
              <option value="admin">প্রশাসক</option>
              <option value="librarian">গ্রন্থাগারিক</option>
              <option value="member">সদস্য</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">সকল অবস্থা</option>
              <option value="active">সক্রিয়</option>
              <option value="inactive">নিষ্ক্রিয়</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ব্যবহারকারী
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  যোগাযোগ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ভূমিকা
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  অবস্থা
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  যোগদান
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  কার্যক্রম
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-white p-0.5 shadow-sm overflow-hidden">
                          <OptimizedImage
                            publicId={user.profile_public_id || user.profile_photo_url}
                            alt={user.name}
                            type="userProfile"
                            size="small"
                            className="w-full h-full rounded-full object-cover"
                            placeholderText={getUserInitials(user.name)}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        {user.phone || 'ফোন নেই'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value, user.name)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${getRoleColor(user.role)}`}
                          disabled={updateUserRoleMutation.isPending}
                        >
                          <option value="member">সদস্য</option>
                          <option value="librarian">গ্রন্থাগারিক</option>
                          <option value="admin">প্রশাসক</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              সক্রিয়
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              নিষ্ক্রিয়
                            </>
                          )}
                        </span>
                        <button
                          onClick={() => handleStatusToggle(user.id, user.is_active, user.name)}
                          disabled={updateUserStatusMutation.isPending}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            user.is_active 
                              ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
                              : 'text-green-600 hover:bg-green-50 hover:text-green-700'
                          } disabled:opacity-50`}
                        >
                          {user.is_active ? 'নিষ্ক্রিয়' : 'সক্রিয়'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetails(true);
                        }}
                        className="text-green-600 hover:text-green-700 mr-3"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">কোন ব্যবহারকারী পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['admin', 'users']);
          }}
        />
      )}
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, onClose }) => {
  const queryClient = useQueryClient();
  
  // Fetch user stats
  const { data: userStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin', 'userStats', user.id],
    queryFn: () => apiServices.admin.getSpecificUserStats(user.id),
    enabled: !!user.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
    onError: (error) => {
      console.error('User stats query error:', error);
      toast.error('ব্যবহারকারীর পরিসংখ্যান লোড করতে সমস্যা হয়েছে');
    },
    onSuccess: (data) => {
      toast.info('User stats loaded successfully');
    }
  });

  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return 'প্রশাসক';
      case 'librarian': return 'গ্রন্থাগারিক';
      case 'member': return 'সদস্য';
      default: return 'অজানা';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('bn-BD');
  };

  const getUserInitials = (name) => {
    if (!name) return 'ব';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-white p-1 shadow-lg overflow-hidden">
                <OptimizedImage
                  publicId={user.profile_public_id || user.profile_photo_url}
                  alt={user.name}
                  type="userProfile"
                  size="large"
                  className="w-full h-full rounded-full object-cover"
                  placeholderText={getUserInitials(user.name)}
                />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">{getRoleName(user.role)}</p>
              </div>
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
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">মৌলিক তথ্য</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">ইমেইল</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">ফোন</p>
                  <p className="font-medium">{user.phone || 'নেই'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">ঠিকানা</p>
                  <p className="font-medium">{user.address || 'নেই'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">যোগদান</p>
                  <p className="font-medium">{formatDate(user.created_at)}</p>
                </div>
              </div>

              {user.bio && (
                <div className="md:col-span-2">
                  <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <Users className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">পরিচয়</p>
                      <p className="font-medium">{user.bio}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">অ্যাকাউন্টের অবস্থা</h3>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                user.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
              </span>
              
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                user.role === 'librarian' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {getRoleName(user.role)}
              </span>
            </div>
          </div>

          {/* Activity Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">কার্যক্রম সারসংক্ষেপ</h3>
            
            {statsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">
                  ডেটা লোড করতে সমস্যা হয়েছে: {statsError?.response?.data?.detail || statsError.message}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  API Status: {statsError?.response?.status || 'Network Error'}
                </p>
              </div>
            )}
            
            {statsLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center p-4 bg-gray-50 rounded-lg animate-pulse">
                    <div className="h-8 w-8 bg-gray-200 rounded mx-auto mb-2"></div>
                    <div className="h-6 w-8 bg-gray-200 rounded mx-auto mb-1"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">
                    {userStats?.borrow_activity?.total || 0}
                  </p>
                  <p className="text-sm text-gray-600">মোট ধার</p>
                  {/* <p className="text-xs text-gray-500 mt-1">
                    (API: {statsError ? 'Error' : userStats ? `Borrows: ${JSON.stringify(userStats.borrow_activity)}` : 'No Data'})
                  </p> */}
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Gift className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">
                    {userStats?.donation_activity?.total || 0}
                  </p>
                  <p className="text-sm text-gray-600">মোট দান</p>
                  {/* <p className="text-xs text-gray-500 mt-1">
                    (API: {statsError ? 'Error' : userStats ? `Donations: ${JSON.stringify(userStats.donation_activity)}` : 'No Data'})
                  </p> */}
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">
                    {userStats?.borrow_activity?.active || 0}
                  </p>
                  <p className="text-sm text-gray-600">সক্রিয় ধার</p>
                  {/* <p className="text-xs text-gray-500 mt-1">
                    (API: {statsError ? 'Error' : userStats ? `Active: ${userStats.borrow_activity?.active || 0}` : 'No Data'})
                  </p> */}
                </div>
              </div>
            )}
            
            {/* Detailed breakdown */}
            {!statsLoading && userStats && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">ধারের বিবরণ</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ফেরত দেওয়া:</span>
                      <span className="font-medium">{userStats?.borrow_activity?.returned || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">অপেক্ষমাণ:</span>
                      <span className="font-medium">{userStats?.borrow_activity?.pending || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">দানের বিবরণ</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">সম্পন্ন:</span>
                      <span className="font-medium">{userStats?.donation_activity?.completed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">অপেক্ষমাণ:</span>
                      <span className="font-medium">{userStats?.donation_activity?.pending || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Create User Modal Component
const CreateUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    role: 'member'
  });

  const createUserMutation = useMutation({
    mutationFn: apiServices.admin.createUser || (() => Promise.reject(new Error('API not implemented'))),
    onSuccess: () => {
      toast.success('নতুন ব্যবহারকারী সফলভাবে তৈরি হয়েছে!');
      onSuccess();
    },
    onError: (error) => {
      toast.error('ব্যবহারকারী তৈরি করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('নাম, ইমেইল এবং পাসওয়ার্ড আবশ্যক');
      return;
    }

    createUserMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">নতুন ব্যবহারকারী তৈরি</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              নাম *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ইমেইল *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              পাসওয়ার্ড *
            </label>
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="px-3 py-2"
              placeholder="পাসওয়ার্ড"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ফোন
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ঠিকানা
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ভূমিকা
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="member">সদস্য</option>
              <option value="librarian">গ্রন্থাগারিক</option>
              <option value="admin">প্রশাসক</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {createUserMutation.isPending ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserManagement;
