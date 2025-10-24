import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, 
  Heart, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Gift,
  Upload,
  Trash2,
  Camera,
  Eye
} from 'lucide-react';
import { toast } from '../../utils/toast';
import { apiServices } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useTranslation } from '../../hooks/useTranslation';

const DonateBook = () => {
  const { user } = useAuth();
  const { confirmSubmit } = useConfirmation();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Modal state
  const [showDonateModal, setShowDonateModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category_id: '',
    published_year: new Date().getFullYear(),
    pages: '',
    cover: 'cover-1.jpg',
    condition: 'good',
    description: ''
  });

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [useCustomImage, setUseCustomImage] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: apiServices.categories.getCategories,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's donations
  const { data: userDonations = [] } = useQuery({
    queryKey: ['userDonations', user?.id],
    queryFn: apiServices.donations.getDonations,
    enabled: !!user,
    retry: 1,
  });

  // Create donation mutation
  const createDonationMutation = useMutation({
    mutationFn: apiServices.donations.createDonationWithNewBook,
    onSuccess: () => {
      toast.success(t('donation.submitSuccess'));
      queryClient.invalidateQueries(['userDonations']);
      queryClient.invalidateQueries(['books']);
      resetForm();
      setShowDonateModal(false);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || error.message || t('donation.submitError');
      toast.error(errorMessage);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      category_id: '',
      published_year: new Date().getFullYear(),
      pages: '',
      cover: 'cover-1.jpg',
      condition: 'good',
      description: ''
    });
    setUploadedImage(null);
    setImagePreview(null);
    setUseCustomImage(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(t('profile.invalidFileType'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('profile.fileSizeError'));
        return;
      }

      setUploadedImage(file);
      setUseCustomImage(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCustomImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setUseCustomImage(false);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error(t('donation.titleRequired'));
      return false;
    }
    if (!formData.author.trim()) {
      toast.error(t('donation.authorRequired'));
      return false;
    }
    if (!formData.pages || formData.pages < 1) {
      toast.error(t('donation.pagesRequired'));
      return false;
    }
    if (formData.published_year < 1000 || formData.published_year > new Date().getFullYear()) {
      toast.error(t('donation.yearRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    const confirmed = await confirmSubmit(
      t('donation.confirmTitle'),
      t('donation.confirmMessage')
    );
    
    if (!confirmed) return;
    
    try {
      let donationData = {
        user_id: user.id,
        title: formData.title,
        author: formData.author,
        cover: formData.cover,
        published_year: parseInt(formData.published_year),
        pages: parseInt(formData.pages)
      };
      
      if (formData.category_id && formData.category_id !== '') {
        donationData.category_id = parseInt(formData.category_id);
      } else {
        donationData.category_id = null;
      }
      
      if (useCustomImage && uploadedImage) {
        donationData.cover = 'cover-1.jpg';
      }
      
      await createDonationMutation.mutateAsync(donationData);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: t('status.pending') },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: t('status.approved') },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: t('status.completed') },
      rejected: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: t('status.rejected') }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 md:p-12 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="h-8 w-8 text-red-300 animate-pulse" />
                <h1 className="text-3xl md:text-4xl font-bold">
                  বই দান করুন
                </h1>
              </div>
              <p className="text-lg md:text-xl mb-6 text-green-50">
                একটি বই দান করে আলোকিত করুন অন্যের জীবন। আপনার পুরনো বইটি হতে পারে কারো নতুন জ্ঞানের উৎস।
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <BookOpen className="h-6 w-6 mb-2" />
                  <p className="font-semibold">জ্ঞান ভাগ করুন</p>
                  <p className="text-sm text-green-100">আপনার বই অন্যদের শেখার সুযোগ দেয়</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Heart className="h-6 w-6 mb-2" />
                  <p className="font-semibold">সমাজ সেবা করুন</p>
                  <p className="text-sm text-green-100">শিক্ষার আলো ছড়িয়ে দিন সবার মাঝে</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Gift className="h-6 w-6 mb-2" />
                  <p className="font-semibold">পরিবেশ রক্ষা করুন</p>
                  <p className="text-sm text-green-100">বই পুনর্ব্যবহার করে সম্পদ বাঁচান</p>
                </div>
              </div>
              <button
                onClick={() => setShowDonateModal(true)}
                className="bg-white text-green-700 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <Gift className="h-5 w-5" />
                <span>এখনই দান করুন</span>
              </button>
            </div>
            <div className="flex-shrink-0">
              <div className="w-48 h-48 md:w-64 md:h-64 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                <BookOpen className="h-24 w-24 md:h-32 md:w-32 text-white/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <p className="text-3xl font-bold text-blue-700">{userDonations.length}</p>
              <p className="text-sm text-blue-600 font-medium">মোট দান</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
              <p className="text-3xl font-bold text-yellow-700">
                {userDonations.filter(d => d.status === 'pending').length}
              </p>
              <p className="text-sm text-yellow-600 font-medium">অপেক্ষমাণ</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <p className="text-3xl font-bold text-green-700">
                {userDonations.filter(d => d.status === 'completed').length}
              </p>
              <p className="text-sm text-green-600 font-medium">সম্পন্ন</p>
            </div>
          </div>
        </div>

        {/* How to Donate */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <AlertCircle className="h-6 w-6 mr-3 text-green-600" />
            কীভাবে বই দান করবেন?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Option 1 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-green-400 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300 blur"></div>
              <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-400 transition-all">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-600">১</span>
                </div>
                <Camera className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">অনলাইনে রিকোয়েস্ট করুন</h3>
                <p className="text-gray-600 text-sm mb-4">
                  "বই দান করুন" বাটনে ক্লিক করে বইয়ের তথ্য দিন। আমরা আপনার কাছ থেকে বই সংগ্রহ করে নেব।
                </p>
                <button
                  onClick={() => setShowDonateModal(true)}
                  className="text-green-600 font-medium text-sm hover:text-green-700 flex items-center"
                >
                  রিকোয়েস্ট করুন →
                </button>
              </div>
            </div>

            {/* Option 2 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300 blur"></div>
              <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-400 transition-all">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">২</span>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">সরাসরি লাইব্রেরিতে আসুন</h3>
                <p className="text-gray-600 text-sm mb-4">
                  সরাসরি আমাদের লাইব্রেরিতে এসে বই দান করতে পারেন। আমরা আপনার বই গ্রহণ করব।
                </p>
                <div className="text-sm text-gray-500">
                  <p>সময়: সকাল ৯টা - সন্ধ্যা ৬টা</p>
                  <p>সাপ্তাহিক ছুটি: শুক্রবার</p>
                </div>
              </div>
            </div>

            {/* Option 3 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300 blur"></div>
              <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-400 transition-all">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-purple-600">৩</span>
                </div>
                <svg className="h-8 w-8 text-purple-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900 mb-2">ফোন করুন</h3>
                <p className="text-gray-600 text-sm mb-4">
                  আমাদের সাথে যোগাযোগ করুন এবং বই সংগ্রহের ব্যবস্থা করুন।
                </p>
                <a href="tel:+8801XXXXXXXXX" className="text-purple-600 font-semibold text-sm hover:text-purple-700 flex items-center">
                  📞 +880 1XXX-XXXXXX
                </a>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-green-500 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              দান করার নিয়মাবলী
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>বইটি পড়ার যোগ্য অবস্থায় থাকতে হবে (ছেঁড়া বা ক্ষতিগ্রস্ত নয়)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>শিক্ষামূলক, সাহিত্য, বিজ্ঞান বা অন্যান্য উপকারী বিষয়ের বই হতে হবে</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>বইয়ের সম্পূর্ণ তথ্য (নাম, লেখক, প্রকাশনা বছর) প্রদান করুন</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>অশ্লীল, রাজনৈতিক বিতর্কিত বা সাম্প্রদায়িক বই গ্রহণযোগ্য নয়</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Donation History */}
        {userDonations.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Clock className="h-6 w-6 mr-3 text-green-600" />
              আমার দানের ইতিহাস
            </h2>
            
            <div className="space-y-4">
              {userDonations.map((donation) => (
                <div key={donation.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4">
                      <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={`/book-covers/${donation.cover}`}
                          alt={donation.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/vite.svg';
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{donation.title}</h3>
                        <p className="text-sm text-gray-600">{donation.author}</p>
                        <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                          <span>{donation.published_year}</span>
                          <span>•</span>
                          <span>{donation.pages} পৃষ্ঠা</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(donation.status)}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(donation.created_at).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Donate Modal */}
      {showDonateModal && (
        <DonateBookModal
          categories={categories}
          onClose={() => setShowDonateModal(false)}
          onSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          handleInputChange={handleInputChange}
          handleImageUpload={handleImageUpload}
          removeCustomImage={removeCustomImage}
          imagePreview={imagePreview}
          useCustomImage={useCustomImage}
          isLoading={createDonationMutation.isPending}
          t={t}
        />
      )}
    </div>
  );
};

// Donate Book Modal Component
const DonateBookModal = ({ 
  categories, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData,
  handleInputChange, 
  handleImageUpload, 
  removeCustomImage,
  imagePreview,
  useCustomImage,
  isLoading,
  t 
}) => {
  const availableCovers = [
    'cover-1.jpg', 'cover-2.jpg', 'cover-3.jpg', 'cover-4.jpg', 'cover-5.jpg',
    'cover-6.jpg', 'cover-7.jpg', 'cover-8.jpg', 'cover-9.jpg', 'cover-10.jpg'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Gift className="h-6 w-6" />
              <div>
                <h2 className="text-2xl font-bold">বই দান করুন</h2>
                <p className="text-green-100 text-sm">বইয়ের সম্পূর্ণ তথ্য দিন</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">দয়া করে নিশ্চিত করুন:</p>
                <ul className="space-y-1 text-xs">
                  <li>• বইটি পড়ার যোগ্য অবস্থায় আছে</li>
                  <li>• সঠিক ও সম্পূর্ণ তথ্য প্রদান করছেন</li>
                  <li>• বইটি শিক্ষামূলক বা উপকারী বিষয়ের</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                বইয়ের নাম *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="যেমন: আমার দেখা নয়াচীন"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                লেখকের নাম *
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="যেমন: বঙ্গবন্ধু শেখ মুজিবুর রহমান"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                বিভাগ
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              >
                <option value="">নির্বাচন করুন</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                প্রকাশনা বছর *
              </label>
              <input
                type="number"
                name="published_year"
                value={formData.published_year}
                onChange={handleInputChange}
                min="1000"
                max={new Date().getFullYear()}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                পৃষ্ঠা সংখ্যা *
              </label>
              <input
                type="number"
                name="pages"
                value={formData.pages}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="যেমন: 250"
                required
              />
            </div>
          </div>

          {/* Book Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              বইয়ের অবস্থা
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'excellent', label: 'চমৎকার', color: 'green', icon: '⭐' },
                { value: 'good', label: 'ভালো', color: 'blue', icon: '👍' },
                { value: 'fair', label: 'গ্রহণযোগ্য', color: 'yellow', icon: '✓' }
              ].map((condition) => (
                <label 
                  key={condition.value} 
                  className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.condition === condition.value 
                      ? 'border-green-500 bg-green-50 shadow-md' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="condition"
                    value={condition.value}
                    checked={formData.condition === condition.value}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <span className="text-2xl mr-2">{condition.icon}</span>
                  <span className="font-medium">{condition.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cover Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              কভার আপলোড করুন
            </label>
            
            <div className="flex flex-wrap gap-3 mb-4">
              <label className="cursor-pointer flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
                <Upload className="h-4 w-4" />
                <span>ছবি আপলোড</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {useCustomImage && (
                <button
                  type="button"
                  onClick={removeCustomImage}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>মুছুন</span>
                </button>
              )}
            </div>

            {/* Custom Image Preview */}
            {useCustomImage && imagePreview && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-600 mb-2">আপলোড করা ছবি:</p>
                <img
                  src={imagePreview}
                  alt="Custom book cover"
                  className="w-24 h-32 object-cover rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Default Cover Options */}
            {!useCustomImage && (
              <div>
                <p className="text-sm text-gray-600 mb-3">অথবা নিচের থেকে একটি কভার নির্বাচন করুন:</p>
                <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
                  {availableCovers.map((cover) => (
                    <div
                      key={cover}
                      onClick={() => setFormData(prev => ({ ...prev, cover }))}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all transform hover:scale-105 ${
                        formData.cover === cover
                          ? 'border-green-500 ring-4 ring-green-200 shadow-lg' 
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <img
                        src={`/book-covers/${cover}`}
                        alt={`Cover ${cover}`}
                        className="w-full h-20 object-cover"
                        onError={(e) => {
                          e.target.src = '/vite.svg';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              অতিরিক্ত বিবরণ
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              placeholder="বইয়ের বিশেষ কোন তথ্য বা মন্তব্য লিখুন (ঐচ্ছিক)..."
            />
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-5">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center">
              <Eye className="h-5 w-5 mr-2 text-green-600" />
              প্রিভিউ
            </h4>
            <div className="flex items-start space-x-4 bg-white rounded-lg p-4">
              <div className="w-20 h-28 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                {useCustomImage && imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Uploaded cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={`/book-covers/${formData.cover}`}
                    alt="Selected cover"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/vite.svg';
                    }}
                  />
                )}
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-gray-900 text-lg">
                  {formData.title || 'বইয়ের নাম লিখুন'}
                </h5>
                <p className="text-gray-600 mb-2">
                  {formData.author || 'লেখকের নাম লিখুন'}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                    {formData.published_year}
                  </span>
                  {formData.pages && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                      {formData.pages} পৃষ্ঠা
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full font-medium ${
                    formData.condition === 'excellent' ? 'bg-green-100 text-green-700' :
                    formData.condition === 'good' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {formData.condition === 'excellent' ? 'চমৎকার' :
                     formData.condition === 'good' ? 'ভালো' : 'গ্রহণযোগ্য'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium transition-all shadow-md"
            >
              <Gift className="h-5 w-5" />
              <span>{isLoading ? 'প্রক্রিয়াকরণ...' : 'দান করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonateBook;