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
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { apiServices } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useTranslation } from '../../hooks/useTranslation';

const DonateBook = () => {
  const { user } = useAuth();
  const { confirmSubmit } = useConfirmation();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
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
      setShowConfirmModal(false);
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
        donationData.cover = 'cover-1.jpg'; // Placeholder for custom image
      }
      
      await createDonationMutation.mutateAsync(donationData);
    } catch (error) {
      // Error is handled in the mutation
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

  const availableCovers = [
    'cover-1.jpg', 'cover-2.jpg', 'cover-3.jpg', 'cover-4.jpg', 'cover-5.jpg',
    'cover-6.jpg', 'cover-7.jpg', 'cover-8.jpg', 'cover-9.jpg', 'cover-10.jpg'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <Gift className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t('donation.title')}</h1>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{userDonations.length}</p>
              <p className="text-sm text-gray-600">{t('donation.totalDonations')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {userDonations.filter(d => d.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">{t('status.pending')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {userDonations.filter(d => d.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">{t('status.completed')}</p>
            </div>
          </div>
        </div>

        {/* Donation Form */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <Plus className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">{t('donation.donateNewBook')}</h2>
          </div>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('donation.bookTitle')} *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={t('donation.titlePlaceholder')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('donation.authorName')} *
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={t('donation.authorPlaceholder')}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('books.category')}
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">{t('donation.selectCategory')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('donation.publishYear')} *
                </label>
                <input
                  type="number"
                  name="published_year"
                  value={formData.published_year}
                  onChange={handleInputChange}
                  min="1000"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('donation.pageCount')} *
                </label>
                <input
                  type="number"
                  name="pages"
                  value={formData.pages}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={t('donation.pageCountPlaceholder')}
                  required
                />
              </div>
            </div>

            {/* Book Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('donation.bookCondition')}
              </label>
              <div className="flex space-x-4">
                {[
                  { value: 'excellent', label: t('donation.excellent') },
                  { value: 'good', label: t('donation.good') },
                  { value: 'fair', label: t('donation.fair') }
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
                    <span>{condition.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cover Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('donation.uploadCover')}
              </label>
              
              <div className="flex space-x-3 mb-3">
                <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 border border-blue-200">
                  <Upload className="h-4 w-4" />
                  <span>{t('donation.uploadImage')}</span>
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
                    className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 border border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{t('common.delete')}</span>
                  </button>
                )}
              </div>

              {/* Custom Image Preview */}
              {useCustomImage && imagePreview && (
                <div className="mb-3">
                  <img
                    src={imagePreview}
                    alt="Custom book cover"
                    className="w-16 h-20 object-cover rounded border"
                  />
                </div>
              )}

              {/* Default Cover Selection */}
              {!useCustomImage && (
                <div className="grid grid-cols-5 gap-2">
                  {availableCovers.map((cover) => (
                    <div
                      key={cover}
                      onClick={() => setFormData(prev => ({ ...prev, cover }))}
                      className={`cursor-pointer border-2 rounded overflow-hidden ${
                        formData.cover === cover 
                          ? 'border-green-500' 
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
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('donation.additionalDescription')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={t('donation.descriptionPlaceholder')}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                {t('common.reset')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={createDonationMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <Gift className="h-4 w-4" />
                <span>{createDonationMutation.isPending ? t('donation.submitting') : t('donation.donateButton')}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DonateBook;