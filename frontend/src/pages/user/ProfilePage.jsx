import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Camera, 
  UserCircle,
  BookOpen,
  Gift,
  Clock,
  CheckCircle,
  Loader2,
  RefreshCw,
  Upload,
  Lock
} from 'lucide-react';
import { apiServices } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useTranslation } from '../../hooks/useTranslation';
import OptimizedImage from '../../components/OptimizedImage';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import cloudinaryService from '../../services/cloudinary';

const ProfilePage = () => {
  const { user, refetchUser } = useAuth();
  const { t } = useTranslation();
  const { confirmUpdate } = useConfirmation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const profileFileRef = useRef(null);

  // Form data state with proper initialization
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    bio: ''
  });

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {

      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        date_of_birth: user.date_of_birth || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  // Fetch user statistics with better error handling
  const { data: userStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: () => apiServices.users.getUserStats(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Only retry if it's a network error, not a 404 or permission error
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Update profile mutation with better error handling
  const updateProfileMutation = useMutation({
    mutationFn: (data) => apiServices.users.updateProfile(data),
    onSuccess: () => {
      toast.success(t('profile.updateSuccess'));
      setIsEditing(false);
      // Invalidate and refetch user data
      queryClient.invalidateQueries(['currentUser']);
      refetchUser();
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      const errorMessage = error?.response?.data?.detail || 
                          error?.response?.data?.message || 
                          t('profile.updateError');
      toast.error(errorMessage);
    }
  });

  // Profile image upload mutation
  const uploadProfileImageMutation = useMutation({
    mutationFn: (file) => cloudinaryService.uploadUserProfile(file),
    onMutate: () => {
      setIsUploadingProfile(true);
    },
    onSuccess: async (data) => {
      toast.success(t('profile.profileImageSuccess'));
      // Clear preview
      setProfilePreview(null);
      // Force refetch user data
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await refetchUser();
      // Force a small delay to ensure backend has updated
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }, 500);
    },
    onError: (error) => {
      console.error('Profile upload error:', error);
      const errorMessage = error?.response?.data?.detail || 
                          error?.message || 
                          t('profile.profileImageError');
      toast.error(errorMessage);
      setProfilePreview(null);
    },
    onSettled: () => {
      setIsUploadingProfile(false);
    }
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate and process image files
  const validateImageFile = (file) => {
    if (!file) return { isValid: false, error: t('profile.noFileSelected') };
    
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: t('profile.invalidFileType') };
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { isValid: false, error: t('profile.fileSizeError') };
    }
    
    return { isValid: true };
  };

  // Handle image preview
  const createImagePreview = (file, setPreview) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Handle profile image upload
  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    // Show preview immediately
    createImagePreview(file, setProfilePreview);
    
    try {
      await uploadProfileImageMutation.mutateAsync(file);
    } catch (error) {
      // Error is handled in the mutation
    }
    
    // Reset file input
    e.target.value = '';
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name?.trim()) {
      toast.error(t('profile.nameRequired'));
      return;
    }
    
    if (!formData.email?.trim()) {
      toast.error(t('profile.emailRequired'));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t('profile.emailInvalid'));
      return;
    }

    // Confirm profile update
    const confirmed = await confirmUpdate(
      t('profile.confirmTitle'),
      t('profile.confirmMessage')
    );
    
    if (!confirmed) return;

    try {
      await updateProfileMutation.mutateAsync(formData);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    // Reset form data to current user data
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        date_of_birth: user.date_of_birth || '',
        bio: user.bio || ''
      });
    }
    
    // Clear image preview
    setProfilePreview(null);
    setIsEditing(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return t('profile.notSet');
    try {
      const locale = t('language') === 'bn' ? 'bn-BD' : 'en-US';
      return new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return t('profile.dateFormatError');
    }
  };

  // Get user initials for placeholder
  const getUserInitials = (name) => {
    if (!name) return t('profile.defaultInitial');
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Show loading state if user is not loaded
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Profile Header Section */}
      <div className="relative">
        {/* Header Background - Simple Gradient */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-green-600 to-green-800 rounded-xl overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-6 left-6 w-24 h-24 border-2 border-white rounded-full"></div>
            <div className="absolute bottom-6 right-6 w-20 h-20 border-2 border-white rounded-full"></div>
            <div className="absolute top-1/2 right-1/4 w-16 h-16 border-2 border-white rounded-full"></div>
          </div>
        </div>

        {/* Profile Picture */}
        <div className="absolute -bottom-16 left-4 md:left-8">
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white p-1 shadow-lg">
              {profilePreview ? (
                <img
                  src={profilePreview}
                  alt="Profile Preview"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : user?.profile_photo_url ? (
                <img
                  src={user.profile_photo_url}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                  loading="lazy"
                />
              ) : user?.profile_public_id ? (
                <OptimizedImage
                  publicId={user.profile_public_id}
                  alt="Profile"
                  type="profileImage"
                  size="large"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : user?.profile_photo_url ? (
                <img
                  src={user.profile_photo_url}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xl md:text-2xl font-bold">
                  {getUserInitials(user?.name)}
                </div>
              )}
            </div>
            
            {/* Upload profile button */}
            <button
              onClick={() => profileFileRef.current?.click()}
              disabled={isUploadingProfile}
              className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-green-600 text-white p-1.5 md:p-2 rounded-full hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50"
              title={t('profile.changeProfile')}
            >
              {isUploadingProfile ? (
                <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
              ) : (
                <Camera className="h-3 w-3 md:h-4 md:w-4" />
              )}
            </button>
            
            <input
              ref={profileFileRef}
              type="file"
              accept="image/*"
              onChange={handleProfileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Profile Info Header */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 pt-16 md:pt-20">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{user?.name}</h1>
            <p className="text-gray-600 mb-2">{user?.email}</p>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{t('profile.memberSince')}: {formatDate(user?.created_at)}</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {t('profile.edit')}
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={updateProfileMutation.isPending}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {updateProfileMutation.isPending ? t('profile.saving') : t('common.save')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('profile.personalInfo')}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    {t('profile.name')} *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder={t('profile.namePlaceholder')}
                      required
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg">{user?.name || t('profile.notSet')}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-2" />
                    {t('profile.email')} *
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder={t('profile.emailPlaceholder')}
                      required
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg">{user?.email || t('profile.notSet')}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-2" />
                    {t('profile.phone')}
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder={t('profile.phonePlaceholder')}
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg">{user?.phone || t('profile.notSet')}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    {t('profile.dateOfBirth')}
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg">{formatDate(user?.date_of_birth)}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  {t('profile.address')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder={t('profile.addressPlaceholder')}
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">{user?.address || t('profile.notSet')}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserCircle className="h-4 w-4 inline mr-2" />
                  {t('profile.bio')}
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                    placeholder={t('profile.bioPlaceholder')}
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg min-h-[100px] whitespace-pre-wrap">
                    {user?.bio || t('profile.noBio')}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Activity Stats Sidebar */}
        <div className="space-y-6">
          {/* User Stats */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('profile.activityStats')}</h3>
              <button
                onClick={() => queryClient.invalidateQueries(['userStats'])}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title={t('profile.refreshStats')}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            
            {statsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">
                  {t('profile.statsError')}
                </p>
              </div>
            )}
            
            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                    <div className="flex items-center">
                      <div className="h-5 w-5 bg-gray-200 rounded mr-3"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-6 w-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">{t('profile.totalBorrows')}</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {userStats?.activity_summary?.borrows?.total || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">{t('profile.activeBorrows')}</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">
                    {userStats?.activity_summary?.borrows?.active || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Gift className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">{t('profile.totalDonations')}</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {userStats?.activity_summary?.donations?.total || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">{t('profile.membership')}</span>
                  </div>
                  <span className="text-sm font-medium text-purple-600">
                    {user?.role === 'admin' ? t('roles.admin') : 
                     user?.role === 'librarian' ? t('roles.librarian') : t('roles.member')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.quickActions')}</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/books')}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {t('profile.findBooks')}
              </button>
              
              <button 
                onClick={() => navigate('/donate')}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Gift className="h-4 w-4 mr-2" />
                {t('profile.donateBooks')}
              </button>
              
              <button 
                onClick={() => navigate('/history')}
                className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Clock className="h-4 w-4 mr-2" />
                {t('profile.viewHistory')}
              </button>
              
              <button 
                onClick={() => setShowChangePasswordModal(true)}
                className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Lock className="h-4 w-4 mr-2" />
                {t('profile.changePassword')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
};

export default ProfilePage;
