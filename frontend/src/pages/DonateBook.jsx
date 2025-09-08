import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, 
  Heart, 
  Search, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X,
  Gift,
  Users,
  Calendar,
  Sparkles,
  ChevronRight,
  Book,
  Package,
  Upload,
  FileText,
  User as UserIcon,
  Save,
  Trash2,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, apiServices } from '../App';
import ConfirmationModal from '../components/ConfirmationModal';

const DonateBook = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDonation, setPendingDonation] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category_id: '',
    published_year: new Date().getFullYear(),
    pages: '',
    cover: 'cover-1.jpg', // Default cover
    condition: 'good', // good, fair, excellent
    description: ''
  });

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [useCustomImage, setUseCustomImage] = useState(false);

  // Fetch available books
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['books'],
    queryFn: apiServices.books.getBooks,
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: apiServices.categories.getCategories,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's donations
  const { data: userDonations = [], isLoading: donationsLoading } = useQuery({
    queryKey: ['userDonations', user?.id],
    queryFn: apiServices.donations.getDonations,
    enabled: !!user,
    retry: 1,
  });

  // Create donation with new book mutation
  const createDonationWithNewBookMutation = useMutation({
    mutationFn: apiServices.donations.createDonationWithNewBook,
    onSuccess: (donation) => {
      console.log('Donation with new book created successfully:', donation);
      toast.success('বই দানের অনুরোধ সফলভাবে জমা দেওয়া হয়েছে!');
      queryClient.invalidateQueries(['userDonations']);
      queryClient.invalidateQueries(['books']);
      resetForm();
      setShowDonationForm(false);
      setShowConfirmModal(false);
      setPendingDonation(null);
    },
    onError: (error) => {
      console.error('Donation creation error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'দানের অনুরোধ জমা দিতে সমস্যা হয়েছে';
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ছবির সাইজ ৫ মেগাবাইটের চেয়ে ছোট হতে হবে');
        return;
      }

      setUploadedImage(file);
      setUseCustomImage(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // For now, we'll use the file input with camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera on mobile devices
    input.onchange = handleImageUpload;
    input.click();
  };

  const removeCustomImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setUseCustomImage(false);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('বইয়ের নাম প্রয়োজন');
      return false;
    }
    if (!formData.author.trim()) {
      toast.error('লেখকের নাম প্রয়োজন');
      return false;
    }
    if (!formData.pages || formData.pages < 1) {
      toast.error('সঠিক পৃষ্ঠা সংখ্যা দিন');
      return false;
    }
    if (formData.published_year < 1000 || formData.published_year > new Date().getFullYear()) {
      toast.error('সঠিক প্রকাশনা বছর দিন');
      return false;
    }
    return true;
  };

  const handleSubmitDonation = () => {
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  const confirmDonation = async () => {
    try {
      let donationData = {
        user_id: user.id,
        title: formData.title,
        author: formData.author,
        cover: formData.cover,
        published_year: parseInt(formData.published_year),
        pages: parseInt(formData.pages)
      };
      
      // Convert category_id to number or null
      if (formData.category_id && formData.category_id !== '') {
        donationData.category_id = parseInt(formData.category_id);
      } else {
        donationData.category_id = null;
      }
      
      // If user uploaded a custom image, we'll use a placeholder for now
      // In a real app, you'd upload the image to a server and get a URL
      if (useCustomImage && uploadedImage) {
        // For demo purposes, we'll use a default cover
        // In production, you'd upload the image and get back a URL
        donationData.cover = 'cover-1.jpg'; // Placeholder
        console.log('Custom image would be uploaded:', uploadedImage.name);
      }
      
      console.log('Submitting donation data:', donationData);
      
      // Create donation with new book
      await createDonationWithNewBookMutation.mutateAsync(donationData);
    } catch (error) {
      console.error('Donation submission error:', error);
    }
  };

  const getDateLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'জমা দেওয়া হয়েছে';
      case 'approved':
        return 'অনুমোদিত হয়েছে';
      case 'completed':
        return 'সম্পন্ন হয়েছে';
      case 'rejected':
        return 'প্রত্যাখ্যাত হয়েছে';
      default:
        return 'তারিখ';
    }
  };

  const getDisplayDate = (donation) => {
    switch (donation.status) {
      case 'pending':
        return donation.created_at;
      case 'approved':
        return donation.approved_at || donation.created_at;
      case 'completed':
        return donation.completed_at || donation.approved_at || donation.created_at;
      case 'rejected':
        return donation.updated_at || donation.created_at; // Use updated_at for rejection date
      default:
        return donation.created_at;
    }
  };

  const getDonationStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'অপেক্ষমান' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'অনুমোদিত' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'সম্পন্ন' },
      rejected: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'প্রত্যাখ্যাত' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const availableCovers = [
    'cover-1.jpg', 'cover-2.jpg', 'cover-3.jpg', 'cover-4.jpg', 'cover-5.jpg',
    'cover-6.jpg', 'cover-7.jpg', 'cover-8.jpg', 'cover-9.jpg', 'cover-10.jpg',
    'cover-11.jpg', 'cover-12.jpg', 'cover-13.jpg', 'cover-14.jpg', 'cover-15.jpg'
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Gift className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">বই দান করুন</h1>
                <p className="text-gray-600">লাইব্রেরিতে বই দান করে জ্ঞান ভাগাভাগি করুন</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-green-100">
                <div className="flex items-center space-x-3">
                  <Heart className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">মোট দান</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {userDonations.length}টি বই
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-green-100">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">অপেক্ষমান</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {userDonations.filter(d => d.status === 'pending').length}টি
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-green-100">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">সম্পন্ন</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {userDonations.filter(d => d.status === 'completed').length}টি
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <button
              onClick={() => setShowDonationForm(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>নতুন বই দান করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Donation Form Modal */}
      {showDonationForm && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">বই দানের ফর্ম</h3>
              <button
                onClick={() => {
                  setShowDonationForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">দান করার আগে</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• বইটির সঠিক তথ্য প্রদান করুন</li>
                      <li>• বইটি ভালো অবস্থায় আছে তা নিশ্চিত করুন</li>
                      <li>• প্রশাসকের অনুমোদনের পর বই নিয়ে আসুন</li>
                    </ul>
                  </div>
                </div>
              </div>

              <form className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      বইয়ের নাম *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="বইয়ের নাম লিখুন..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      লেখকের নাম *
                    </label>
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="লেখকের নাম লিখুন..."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ক্যাটেগরি
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">ক্যাটেগরি নির্বাচন করুন</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      প্রকাশনা বছর *
                    </label>
                    <input
                      type="number"
                      name="published_year"
                      value={formData.published_year}
                      onChange={handleInputChange}
                      min="1000"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      পৃষ্ঠা সংখ্যা *
                    </label>
                    <input
                      type="number"
                      name="pages"
                      value={formData.pages}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="পৃষ্ঠা সংখ্যা"
                      required
                    />
                  </div>
                </div>

                {/* Book Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    বইয়ের অবস্থা
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'excellent', label: 'চমৎকার', color: 'green' },
                      { value: 'good', label: 'ভালো', color: 'blue' },
                      { value: 'fair', label: 'গ্রহণযোগ্য', color: 'yellow' }
                    ].map((condition) => (
                      <label key={condition.value} className="flex items-center">
                        <input
                          type="radio"
                          name="condition"
                          value={condition.value}
                          checked={formData.condition === condition.value}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${condition.color}-100 text-${condition.color}-800`}>
                          {condition.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cover Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    কভার নির্বাচন করুন
                  </label>
                  
                  {/* Upload Instructions */}
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>টিপস:</strong> বইয়ের সামনের কভারের একটি স্পষ্ট ছবি তুলুন। ছবিটি ৫ মেগাবাইটের চেয়ে ছোট হতে হবে।
                    </p>
                  </div>
                  
                  {/* Upload Options */}
                  <div className="mb-4 space-y-3">
                    <div className="flex flex-wrap gap-3">
                      {/* Upload from Device */}
                      <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                        <Upload className="h-4 w-4" />
                        <span>ডিভাইস থেকে আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Camera Capture */}
                      <button
                        type="button"
                        onClick={handleCameraCapture}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                      >
                        <Camera className="h-4 w-4" />
                        <span>ক্যামেরা ব্যবহার করুন</span>
                      </button>

                      {/* Remove Custom Image */}
                      {useCustomImage && (
                        <button
                          type="button"
                          onClick={removeCustomImage}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>কাস্টম ছবি মুছুন</span>
                        </button>
                      )}
                    </div>

                    {/* Custom Image Preview */}
                    {useCustomImage && imagePreview && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">আপলোড করা ছবি:</p>
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Custom book cover"
                            className="w-20 h-24 object-cover rounded-lg border-2 border-blue-500"
                          />
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          ফাইল: {uploadedImage?.name} ({(uploadedImage?.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Default Cover Options */}
                  {!useCustomImage && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">অথবা নিচের থেকে একটি কভার নির্বাচন করুন:</p>
                      <div className="grid grid-cols-5 gap-3 max-h-40 overflow-y-auto">
                        {availableCovers.map((cover) => (
                          <div
                            key={cover}
                            onClick={() => setFormData(prev => ({ ...prev, cover }))}
                            className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                              formData.cover === cover 
                                ? 'border-green-500 ring-2 ring-green-200' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={`/book-covers/${cover}`}
                              alt={`Cover ${cover}`}
                              className="w-full h-16 object-cover"
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

                {/* Additional Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    অতিরিক্ত বিবরণ
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="বই সম্পর্কে অতিরিক্ত তথ্য (ঐচ্ছিক)..."
                  />
                </div>

                {/* Preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">প্রিভিউ</h4>
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {useCustomImage && imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Custom cover preview"
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
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {formData.title || 'বইয়ের নাম'}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {formData.author || 'লেখকের নাম'}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{formData.published_year}</span>
                        <span>{formData.pages} পৃষ্ঠা</span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          formData.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                          formData.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {formData.condition === 'excellent' ? 'চমৎকার' :
                           formData.condition === 'good' ? 'ভালো' : 'গ্রহণযোগ্য'}
                        </span>
                        {useCustomImage && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            কাস্টম কভার
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowDonationForm(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleSubmitDonation}
                disabled={createDonationWithNewBookMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Gift className="h-4 w-4" />
                <span>দান করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Donations Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">আমার দানসমূহ</h2>
        
        {donationsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-16 h-20 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : userDonations.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">এখনো কোনো দান নেই</h3>
            <p className="text-gray-600">উপরে "নতুন বই দান করুন" বাটনে ক্লিক করে দান করুন</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userDonations.map((donation) => (
              <div key={donation.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {donation.book_copy?.book?.cover && (
                    <img
                      src={`/book-covers/${donation.book_copy.book.cover}`}
                      alt={donation.book_copy.book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/vite.svg';
                      }}
                    />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {donation.book_copy?.book?.title || 'বই তথ্য লোড হচ্ছে...'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {donation.book_copy?.book?.author}
                  </p>
                  <div className="flex items-center space-x-4">
                    {getDonationStatusBadge(donation.status)}
                    <div className="text-xs text-gray-500">
                      <div>{getDateLabel(donation.status)}</div>
                      <div className="font-medium">
                        {new Date(getDisplayDate(donation)).toLocaleDateString('bn-BD')}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDonation}
        title="দান নিশ্চিত করুন"
        message={`আপনি কি নিশ্চিত যে আপনি "${formData.title}" বইটি দান করতে চান? এই অনুরোধ প্রশাসকের অনুমোদনের জন্য পাঠানো হবে।`}
        confirmText="হ্যাঁ, দান করুন"
        cancelText="বাতিল"
        type="default"
      />
    </div>
  );
};

export default DonateBook;
