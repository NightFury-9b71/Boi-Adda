import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  Upload,
  UserCircle,
  BookOpen,
  Gift,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuth, apiServices } from '../App';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const coverFileRef = useRef(null);
  const profileFileRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || '',
    date_of_birth: user?.date_of_birth || '',
  });

  // Sync formData with user data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        date_of_birth: user.date_of_birth || '',
      });
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: apiServices.users.updateProfile,
    onSuccess: () => {
      toast.success('প্রোফাইল সফলভাবে আপডেট হয়েছে!');
      setIsEditing(false);
      queryClient.invalidateQueries(['currentUser']);
    },
    onError: (error) => {
      toast.error('প্রোফাইল আপডেট করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  // Profile image upload mutation
  const uploadProfileImageMutation = useMutation({
    mutationFn: apiServices.users.uploadProfileImage,
    onSuccess: (data) => {
      toast.success('প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে!');
      // Update the user cache with new image path
      queryClient.invalidateQueries(['currentUser']);
      // Also update the auth cache to refresh the user object
      queryClient.refetchQueries(['currentUser']);
      // Clear the preview since we now have the uploaded image
      setProfilePreview(null);
      setProfileImage(null);
    },
    onError: (error) => {
      toast.error('ছবি আপলোড করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
      // Clear the preview on error
      setProfilePreview(null);
      setProfileImage(null);
    }
  });

  // Cover image upload mutation
  const uploadCoverImageMutation = useMutation({
    mutationFn: apiServices.users.uploadCoverImage,
    onSuccess: (data) => {
      toast.success('কভার ছবি সফলভাবে আপলোড হয়েছে!');
      // Update the user cache with new image path
      queryClient.invalidateQueries(['currentUser']);
      // Also update the auth cache to refresh the user object
      queryClient.refetchQueries(['currentUser']);
      // Clear the preview since we now have the uploaded image
      setCoverPreview(null);
      setCoverImage(null);
    },
    onError: (error) => {
      toast.error('কভার ছবি আপলোড করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
      // Clear the preview on error
      setCoverPreview(null);
      setCoverImage(null);
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (file, type) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'cover') {
          setCoverPreview(e.target.result);
          setCoverImage(file);
        } else {
          setProfilePreview(e.target.result);
          setProfileImage(file);
        }
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন');
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview immediately
      handleImageUpload(file, 'cover');
      
      try {
        // Upload to server
        await uploadCoverImageMutation.mutateAsync(file);
      } catch (error) {
        console.error('Cover upload failed:', error);
      }
    }
  };

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview immediately
      handleImageUpload(file, 'profile');
      
      try {
        // Upload to server
        await uploadProfileImageMutation.mutateAsync(file);
      } catch (error) {
        console.error('Profile upload failed:', error);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error('নাম আবশ্যক');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('ইমেইল আবশ্যক');
      return;
    }

    // Update profile data
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    // Reset form data to current user data
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      bio: user?.bio || '',
      date_of_birth: user?.date_of_birth || '',
    });
    // Clear image previews
    setCoverPreview(null);
    setProfilePreview(null);
    setCoverImage(null);
    setProfileImage(null);
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'নির্ধারিত নয়';
    return new Date(dateString).toLocaleDateString('bn-BD');
  };

  const getUserInitials = (name) => {
    if (!name) return 'ব';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Mock user stats - in real app, these would come from API
  const userStats = {
    totalBorrows: 12,
    activeBorrows: 3,
    totalDonations: 8,
    memberSince: user?.created_at || '2024-01-01'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cover Section */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl overflow-hidden">
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : user?.cover_image ? (
            <img
              src={user.cover_image}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-green-600 to-green-800"></div>
          )}
          
          {isEditing && (
            <>
              <button
                onClick={() => coverFileRef.current?.click()}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors"
              >
                <Camera className="h-5 w-5" />
              </button>
              <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </>
          )}
        </div>

        {/* Profile Picture */}
        <div className="absolute -bottom-16 left-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
              {profilePreview ? (
                <img
                  src={profilePreview}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                  {getUserInitials(user?.name)}
                </div>
              )}
            </div>
            
            {isEditing && (
              <>
                <button
                  onClick={() => profileFileRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={profileFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileUpload}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 pt-20">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-gray-600 mt-1">{user?.email}</p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>সদস্য হয়েছেন: {formatDate(userStats.memberSince)}</span>
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
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">ব্যক্তিগত তথ্য</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    নাম
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    ইমেইল
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="আপনার ঠিকানা"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="নিজের সম্পর্কে কিছু লিখুন..."
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg min-h-[100px]">
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">কার্যক্রম পরিসংখ্যান</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700">মোট ধার</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{userStats.totalBorrows}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700">সক্রিয় ধার</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">{userStats.activeBorrows}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Gift className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700">মোট দান</span>
                </div>
                <span className="text-lg font-bold text-green-600">{userStats.totalDonations}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700">সদস্যপদ</span>
                </div>
                <span className="text-sm font-medium text-purple-600">
                  {user?.role === 'admin' ? 'প্রশাসক' : user?.role === 'librarian' ? 'গ্রন্থাগারিক' : 'সাধারণ সদস্য'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
