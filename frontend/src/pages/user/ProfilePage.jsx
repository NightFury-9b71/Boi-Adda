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
  Upload
} from 'lucide-react';
import { apiServices } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import OptimizedImage from '../../components/OptimizedImage';
import cloudinaryService from '../../services/cloudinary';

const ProfilePage = () => {
  const { user, refetchUser } = useAuth();
  const { confirmUpdate } = useConfirmation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const coverFileRef = useRef(null);
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
      toast.success('প্রোফাইল সফলভাবে আপডেট হয়েছে!');
      setIsEditing(false);
      // Invalidate and refetch user data
      queryClient.invalidateQueries(['currentUser']);
      refetchUser();
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      const errorMessage = error?.response?.data?.detail || 
                          error?.response?.data?.message || 
                          'প্রোফাইল আপডেট করতে সমস্যা হয়েছে';
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
      toast.success('প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে!');
      // Clear preview and refresh user data
      setProfilePreview(null);
      await queryClient.invalidateQueries(['currentUser']);
      await refetchUser();
    },
    onError: (error) => {
      console.error('Profile upload error:', error);
      const errorMessage = error?.response?.data?.detail || 
                          error?.message || 
                          'প্রোফাইল ছবি আপলোড করতে সমস্যা হয়েছে';
      toast.error(errorMessage);
      setProfilePreview(null);
    },
    onSettled: () => {
      setIsUploadingProfile(false);
    }
  });

  // Cover image upload mutation
  const uploadCoverImageMutation = useMutation({
    mutationFn: (file) => cloudinaryService.uploadUserCover(file),
    onMutate: () => {
      setIsUploadingCover(true);
    },
    onSuccess: async (data) => {
      toast.success('কভার ছবি সফলভাবে আপলোড হয়েছে!');
      // Clear preview and refresh user data
      setCoverPreview(null);
      await queryClient.invalidateQueries(['currentUser']);
      await refetchUser();
    },
    onError: (error) => {
      console.error('Cover upload error:', error);
      const errorMessage = error?.response?.data?.detail || 
                          error?.message || 
                          'কভার ছবি আপলোড করতে সমস্যা হয়েছে';
      toast.error(errorMessage);
      setCoverPreview(null);
    },
    onSettled: () => {
      setIsUploadingCover(false);
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
    if (!file) return { isValid: false, error: 'ফাইল নির্বাচন করা হয়নি' };
    
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন' };
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'ছবির সাইজ ৫ এমবি এর কম হতে হবে' };
    }
    
    return { isValid: true };
  };

  // Handle image preview
  const createImagePreview = (file, setPreview) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Handle cover image upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    // Show preview immediately
    createImagePreview(file, setCoverPreview);
    
    try {
      await uploadCoverImageMutation.mutateAsync(file);
    } catch (error) {
      // Error is handled in the mutation
    }
    
    // Reset file input
    e.target.value = '';
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
      toast.error('নাম আবশ্যক');
      return;
    }
    
    if (!formData.email?.trim()) {
      toast.error('ইমেইল আবশ্যক');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('সঠিক ইমেইল ঠিকানা প্রদান করুন');
      return;
    }

    // Confirm profile update
    const confirmed = await confirmUpdate(
      'প্রোফাইল আপডেট',
      'আপনি কি নিশ্চিত যে আপনার প্রোফাইলের তথ্য আপডেট করতে চান?'
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
    
    // Clear image previews
    setCoverPreview(null);
    setProfilePreview(null);
    setIsEditing(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'নির্ধারিত নয়';
    try {
      return new Date(dateString).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'তারিখ ফরম্যাট সমস্যা';
    }
  };

  // Get user initials for placeholder
  const getUserInitials = (name) => {
    if (!name) return 'ব';
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
          <span className="ml-2 text-gray-600">লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Cover Section */}
      <div className="relative">
        <div className="h-48 md:h-64 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl overflow-hidden">
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Cover Preview"
              className="w-full h-full object-cover"
            />
          ) : user?.cover_public_id ? (
            <OptimizedImage
              publicId={user.cover_public_id}
              alt="Cover"
              type="userCover"
              size="medium"
              className="w-full h-full object-cover"
            />
          ) : user?.cover_image ? (
            <img
              src={user.cover_image}
              alt="Cover"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-green-600 to-green-800 flex items-center justify-center">
              <div className="text-center text-white/70">
                <Upload className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">কভার ছবি আপলোড করুন</p>
              </div>
            </div>
          )}
          
          {/* Upload cover button */}
          <button
            onClick={() => coverFileRef.current?.click()}
            disabled={isUploadingCover}
            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors disabled:opacity-50"
            title="কভার ছবি পরিবর্তন করুন"
          >
            {isUploadingCover ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </button>
          
          <input
            ref={coverFileRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />
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
              ) : user?.profile_public_id ? (
                <OptimizedImage
                  publicId={user.profile_public_id}
                  alt="Profile"
                  type="profileImage"
                  size="large"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : user?.profile_image ? (
                <img
                  src={user.profile_image}
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
              title="প্রোফাইল ছবি পরিবর্তন করুন"
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
              <span>সদস্য হয়েছেন: {formatDate(user?.created_at)}</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                সম্পাদনা
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  বাতিল
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
                  {updateProfileMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">ব্যক্তিগত তথ্য</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    নাম *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="আপনার নাম লিখুন"
                      required
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg">{user?.name || 'নির্ধারিত নয়'}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-2" />
                    ইমেইল *
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="আপনার ইমেইল লিখুন"
                      required
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg">{user?.email || 'নির্ধারিত নয়'}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-2" />
                    ফোন
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="ফোন নম্বর"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg">{user?.phone || 'নির্ধারিত নয়'}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    জন্ম তারিখ
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
                  ঠিকানা
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="আপনার ঠিকানা লিখুন"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">{user?.address || 'নির্ধারিত নয়'}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserCircle className="h-4 w-4 inline mr-2" />
                  পরিচয়
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                    placeholder="নিজের সম্পর্কে কিছু লিখুন..."
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg min-h-[100px] whitespace-pre-wrap">
                    {user?.bio || 'কোন পরিচয় দেওয়া হয়নি'}
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
              <h3 className="text-lg font-semibold text-gray-900">কার্যক্রম পরিসংখ্যান</h3>
              <button
                onClick={() => queryClient.invalidateQueries(['userStats'])}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="পরিসংখ্যান রিফ্রেশ করুন"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            
            {statsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">
                  পরিসংখ্যান লোড করতে সমস্যা হয়েছে
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
                    <span className="text-sm font-medium text-gray-700">মোট ধার</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {userStats?.activity_summary?.borrows?.total || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">সক্রিয় ধার</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">
                    {userStats?.activity_summary?.borrows?.active || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Gift className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">মোট দান</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {userStats?.activity_summary?.donations?.total || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">সদস্যপদ</span>
                  </div>
                  <span className="text-sm font-medium text-purple-600">
                    {user?.role === 'admin' ? 'প্রশাসক' : 
                     user?.role === 'librarian' ? 'গ্রন্থাগারিক' : 'সাধারণ সদস্য'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">দ্রুত কার্যক্রম</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/books')}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                বই খুঁজুন
              </button>
              
              <button 
                onClick={() => navigate('/donate')}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Gift className="h-4 w-4 mr-2" />
                বই দান করুন
              </button>
              
              <button 
                onClick={() => navigate('/history')}
                className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Clock className="h-4 w-4 mr-2" />
                ইতিহাস দেখুন
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
