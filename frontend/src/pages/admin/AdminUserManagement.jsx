import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../utils/toast';
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
  const { confirmUpdate, confirmDelete } = useConfirmation();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [updatingStatusUserId, setUpdatingStatusUserId] = useState(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState(null);

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
      toast.success(t('messages.profileUpdated'));
      queryClient.invalidateQueries(['admin', 'users']);
      setUpdatingRoleUserId(null);
    },
    onError: (error) => {
      console.error('Role update error:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || t('messages.operationFailed');
      toast.error(t('messages.operationFailed') + ': ' + errorMessage);
      setUpdatingRoleUserId(null);
    }
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }) => apiServices.admin.updateUserStatus(userId, isActive),
    onSuccess: (data, variables) => {
      const action = variables.isActive ? t('admin.userManagement.active') : t('admin.userManagement.inactive');
      toast.success(`${t('admin.userManagement.user')} ${action} ${t('messages.success')}!`);
      queryClient.invalidateQueries(['admin', 'users']);
      setUpdatingStatusUserId(null);
    },
    onError: (error) => {
      console.error('Status update error:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || t('messages.operationFailed');
      toast.error(t('messages.operationFailed') + ': ' + errorMessage);
      setUpdatingStatusUserId(null);
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => apiServices.admin.deleteUser(userId),
    onSuccess: (data) => {
      toast.success(data.message || t('messages.success'));
      queryClient.invalidateQueries(['admin', 'users']);
      setDeletingUserId(null);
    },
    onError: (error) => {
      console.error('Delete user error:', error);
      setDeletingUserId(null);
      
      const errorDetail = error?.response?.data?.detail || error?.message || '';
      
      // Handle specific error messages from backend
      if (errorDetail.includes('Cannot delete user with') && errorDetail.includes('pending requests')) {
        toast.error('❌ এই ব্যবহারকারীর অমীমাংসিত অনুরোধ রয়েছে। প্রথমে সকল অনুরোধ প্রক্রিয়া করুন।', { duration: 6000 });
      } else if (errorDetail.includes('Cannot delete user with') && errorDetail.includes('active book issues')) {
        toast.error('❌ এই ব্যবহারকারীর কাছে এখনও বই রয়েছে। প্রথমে সকল বই ফেরত নিন।', { duration: 6000 });
      } else if (errorDetail.includes('Cannot delete user with') && errorDetail.includes('historical data')) {
        toast.error('❌ এই ব্যবহারকারীর ঐতিহাসিক ডেটা রয়েছে যা মুছে ফেলা যাবে না।', { duration: 6000 });
      } else if (errorDetail.includes('Cannot delete your own account')) {
        toast.error('❌ আপনি নিজের অ্যাকাউন্ট মুছে ফেলতে পারবেন না।', { duration: 6000 });
      } else if (errorDetail.includes('NotNullViolation') || 
          errorDetail.includes('null value') || 
          errorDetail.includes('bookrequest') ||
          errorDetail.includes('foreign key constraint')) {
        toast.error(
          '❌ এই ব্যবহারকারীকে মুছে ফেলা যাবে না কারণ তার সাথে বই ধার বা দানের রেকর্ড রয়েছে। ' +
          'প্রথমে সকল বই ধার ও দানের কার্যক্রম সম্পন্ন করুন।',
          { duration: 6000 }
        );
      } else if (error?.response?.status === 404) {
        toast.error('❌ ব্যবহারকারী খুঁজে পাওয়া যায়নি');
      } else if (error?.response?.status === 403) {
        toast.error('❌ আপনার এই ব্যবহারকারীকে মুছে ফেলার অনুমতি নেই');
      } else if (error?.response?.status === 500) {
        toast.error('🔧 সার্ভার সমস্যা। অনুগ্রহ করে পরে চেষ্টা করুন');
      } else {
        toast.error(`❌ ব্যবহারকারী মুছতে সমস্যা হয়েছে: ${errorDetail}`);
      }
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
      setUpdatingRoleUserId(userId);
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
      setUpdatingStatusUserId(userId);
      updateUserStatusMutation.mutate({ userId, isActive: newStatus });
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const confirmed = await confirmDelete(
      `আপনি কি নিশ্চিত যে "${userName}" ব্যবহারকারীকে মুছে ফেলতে চান?`,
      'এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না। ব্যবহারকারীর সকল ডেটা স্থায়ীভাবে মুছে যাবে।',
      'মুছে ফেলুন',
      'বাতিল',
      'danger'
    );
    
    if (confirmed) {
      setDeletingUserId(userId);
      deleteUserMutation.mutate(userId);
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
          <p className="text-gray-600">{t('admin.userManagement.loadingUsers')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.userManagement.title')}</h1>
          <p className="text-gray-600 mt-2">{t('admin.userManagement.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.userManagement.addNewUser')}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.userManagement.totalUsers')}</p>
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
              <p className="text-sm font-medium text-gray-600">{t('admin.userManagement.activeUsers')}</p>
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
              <p className="text-sm font-medium text-gray-600">{t('admin.userManagement.admins')}</p>
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
              <p className="text-sm font-medium text-gray-600">{t('admin.userManagement.librarians')}</p>
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
                placeholder={t('admin.userManagement.searchPlaceholder')}
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
              <option value="all">{t('admin.userManagement.allRoles')}</option>
              <option value="admin">{t('admin.userManagement.admin')}</option>
              <option value="librarian">{t('admin.userManagement.librarian')}</option>
              <option value="member">{t('admin.userManagement.member')}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">{t('admin.userManagement.allStatuses')}</option>
              <option value="active">{t('admin.userManagement.active')}</option>
              <option value="inactive">{t('admin.userManagement.inactive')}</option>
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
                  {t('admin.userManagement.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.userManagement.contact')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.userManagement.role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.userManagement.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.userManagement.joined')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.userManagement.actions')}
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
                        {user.phone || t('admin.userManagement.phoneNotAvailable')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {updatingRoleUserId === user.id ? (
                          <div className="flex items-center text-xs px-2 py-1 rounded-full bg-gray-100">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                            আপডেট হচ্ছে...
                          </div>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value, user.name)}
                            className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${getRoleColor(user.role)}`}
                            disabled={updatingRoleUserId === user.id}
                          >
                            <option value="member">{t('admin.userManagement.member')}</option>
                            <option value="librarian">{t('admin.userManagement.librarian')}</option>
                            <option value="admin">{t('admin.userManagement.admin')}</option>
                          </select>
                        )}
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
                              {t('admin.userManagement.active')}
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              {t('admin.userManagement.inactive')}
                            </>
                          )}
                        </span>
                        <button
                          onClick={() => handleStatusToggle(user.id, user.is_active, user.name)}
                          disabled={updatingStatusUserId === user.id}
                          className={`text-xs px-2 py-1 rounded transition-colors flex items-center ${
                            user.is_active 
                              ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
                              : 'text-green-600 hover:bg-green-50 hover:text-green-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {updatingStatusUserId === user.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                              আপডেট হচ্ছে...
                            </>
                          ) : (
                            user.is_active ? t('admin.userManagement.deactivate') : t('admin.userManagement.activate')
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}
                          className="text-green-600 hover:text-green-700 p-1 rounded transition-colors"
                          title={t('admin.userManagement.viewDetails')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={deletingUserId === user.id}
                          className="text-red-600 hover:text-red-700 p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          title={t('admin.userManagement.deleteUser')}
                        >
                          {deletingUserId === user.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
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
            <p className="text-gray-500">{t('admin.userManagement.noUsersFound')}</p>
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
      toast.error(t('admin.userManagement.dataLoadError'));
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.userManagement.basicInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">{t('admin.userManagement.email')}</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">{t('admin.userManagement.phone')}</p>
                  <p className="font-medium">{user.phone || 'নেই'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">{t('profile.address')}</p>
                  <p className="font-medium">{user.address || 'নেই'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">{t('admin.userManagement.joinedDate')}</p>
                  <p className="font-medium">{formatDate(user.created_at)}</p>
                </div>
              </div>

              {user.bio && (
                <div className="md:col-span-2">
                  <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <Users className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">{t('admin.userManagement.bio')}</p>
                      <p className="font-medium">{user.bio}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.userManagement.accountStatus')}</h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.userManagement.activitySummary')}</h3>
            
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
                  <p className="text-sm text-gray-600">{t('admin.userManagement.totalBorrows')}</p>
                  {/* <p className="text-xs text-gray-500 mt-1">
                    (API: {statsError ? 'Error' : userStats ? `Borrows: ${JSON.stringify(userStats.borrow_activity)}` : 'No Data'})
                  </p> */}
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Gift className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">
                    {userStats?.donation_activity?.total || 0}
                  </p>
                  <p className="text-sm text-gray-600">{t('admin.userManagement.totalDonations')}</p>
                  {/* <p className="text-xs text-gray-500 mt-1">
                    (API: {statsError ? 'Error' : userStats ? `Donations: ${JSON.stringify(userStats.donation_activity)}` : 'No Data'})
                  </p> */}
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">
                    {userStats?.borrow_activity?.active || 0}
                  </p>
                  <p className="text-sm text-gray-600">{t('admin.userManagement.activeBorrows')}</p>
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
                  <h4 className="font-medium text-gray-700 mb-2">{t('admin.userManagement.borrowDetails')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('admin.userManagement.returned')}:</span>
                      <span className="font-medium">{userStats?.borrow_activity?.returned || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">অপেক্ষমাণ:</span>
                      <span className="font-medium">{userStats?.borrow_activity?.pending || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">{t('admin.userManagement.donationDetails')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('admin.userManagement.returned')}:</span>
                      <span className="font-medium">{userStats?.borrow_activity?.returned || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('admin.userManagement.pending')}:</span>
                      <span className="font-medium">{userStats?.borrow_activity?.pending || 0}</span>
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
      toast.success(t('messages.registrationSuccess'));
      onSuccess();
    },
    onError: (error) => {
      toast.error(t('messages.operationFailed') + ': ' + (error?.response?.data?.detail || t('messages.operationFailed')));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error(`${t('admin.userManagement.nameRequired')} ${t('admin.userManagement.emailRequired')} ${t('admin.userManagement.passwordRequired')}`);
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
            <h2 className="text-2xl font-bold text-gray-900">{t('admin.userManagement.createNewUser')}</h2>
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
              {t('admin.userManagement.name')} *
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
              {t('admin.userManagement.email')} *
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
              {t('common.password')} *
            </label>
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="px-3 py-2"
              placeholder={t('common.password')}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.userManagement.phone')}
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
              {t('profile.address')}
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
              {t('admin.userManagement.role')}
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="member">{t('admin.userManagement.member')}</option>
              <option value="librarian">{t('admin.userManagement.librarian')}</option>
              <option value="admin">{t('admin.userManagement.admin')}</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('admin.userManagement.cancel')}
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {createUserMutation.isPending ? t('admin.userManagement.creating') : t('admin.userManagement.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserManagement;
