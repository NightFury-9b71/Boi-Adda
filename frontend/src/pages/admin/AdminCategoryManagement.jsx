import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../utils/toast';
import {
  Tag,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  MoreVertical,
  Eye,
  X,
  AlertCircle,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { apiServices } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';
import { useConfirmation } from '../../contexts/ConfirmationContext';

const AdminCategoryManagement = () => {
  const queryClient = useQueryClient();
  const { confirmUpdate, confirmDelete } = useConfirmation();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [updatingCategoryId, setUpdatingCategoryId] = useState(null);

  // Fetch all categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: apiServices.categories.getCategories,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all books to count books per category
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['books'],
    queryFn: () => apiServices.books.getBooks(),
    staleTime: 5 * 60 * 1000,
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (categoryData) => apiServices.categories.createCategory(categoryData),
    onSuccess: () => {
      toast.success('ক্যাটেগরি সফলভাবে তৈরি করা হয়েছে');
      queryClient.invalidateQueries(['admin', 'categories']);
      setShowCreateModal(false);
    },
    onError: (error) => {
      console.error('Create category error:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'ক্যাটেগরি তৈরি করতে সমস্যা হয়েছে';
      toast.error('ক্যাটেগরি তৈরি করতে সমস্যা হয়েছে: ' + errorMessage);
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ categoryId, categoryData }) => apiServices.categories.updateCategory(categoryId, categoryData),
    onSuccess: () => {
      toast.success('ক্যাটেগরি সফলভাবে আপডেট করা হয়েছে');
      queryClient.invalidateQueries(['admin', 'categories']);
      setUpdatingCategoryId(null);
      setSelectedCategory(null);
      setShowCategoryDetails(false);
    },
    onError: (error) => {
      console.error('Update category error:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'ক্যাটেগরি আপডেট করতে সমস্যা হয়েছে';
      toast.error('ক্যাটেগরি আপডেট করতে সমস্যা হয়েছে: ' + errorMessage);
      setUpdatingCategoryId(null);
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId) => apiServices.categories.deleteCategory(categoryId),
    onSuccess: () => {
      toast.success('ক্যাটেগরি সফলভাবে মুছে ফেলা হয়েছে');
      queryClient.invalidateQueries(['admin', 'categories']);
      setDeletingCategoryId(null);
    },
    onError: (error) => {
      console.error('Delete category error:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'ক্যাটেগরি মুছতে সমস্যা হয়েছে';
      toast.error('ক্যাটেগরি মুছতে সমস্যা হয়েছে: ' + errorMessage);
      setDeletingCategoryId(null);
    }
  });

  // Count books per category
  const getBooksCountForCategory = (categoryId) => {
    return books.filter(book => book.category_id === categoryId).length;
  };

  const handleCreateCategory = (categoryData) => {
    createCategoryMutation.mutate(categoryData);
  };

  const handleUpdateCategory = (categoryId, categoryData) => {
    setUpdatingCategoryId(categoryId);
    updateCategoryMutation.mutate({ categoryId, categoryData });
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    const confirmed = await confirmDelete(
      `আপনি কি নিশ্চিত যে "${categoryName}" ক্যাটেগরিটি মুছে ফেলতে চান?`,
      'এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না। এই ক্যাটেগরির সাথে সম্পর্কিত সকল বই এর ক্যাটেগরি পরিবর্তন হয়ে যাবে।',
      'মুছে ফেলুন',
      'বাতিল',
      'danger'
    );

    if (confirmed) {
      setDeletingCategoryId(categoryId);
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (categoriesLoading || booksLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ক্যাটেগরি লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ক্যাটেগরি ব্যবস্থাপনা</h1>
          <p className="text-gray-600 mt-2">সকল ক্যাটেগরি দেখুন এবং পরিচালনা করুন</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          নতুন ক্যাটেগরি
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">মোট ক্যাটেগরি</p>
              <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Tag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">মোট বই</p>
              <p className="text-3xl font-bold text-green-900">{books.length}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">সক্রিয় ক্যাটেগরি</p>
              <p className="text-3xl font-bold text-blue-900">
                {categories.filter(cat => getBooksCountForCategory(cat.id) > 0).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">খালি ক্যাটেগরি</p>
              <p className="text-3xl font-bold text-orange-900">
                {categories.filter(cat => getBooksCountForCategory(cat.id) === 0).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ক্যাটেগরি নাম বা বিবরণ দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ক্যাটেগরি
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  বিবরণ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  বইয়ের সংখ্যা
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  কার্যক্রম
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Tag className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {category.description || 'কোন বিবরণ নেই'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getBooksCountForCategory(category.id)} টি বই
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowCategoryDetails(true);
                        }}
                        className="text-green-600 hover:text-green-700 p-1 rounded transition-colors"
                        title="বিস্তারিত দেখুন"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        disabled={deletingCategoryId === category.id}
                        className="text-red-600 hover:text-red-700 p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        title="মুছে ফেলুন"
                      >
                        {deletingCategoryId === category.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">কোন ক্যাটেগরি পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {/* Category Details Modal */}
      {showCategoryDetails && selectedCategory && (
        <CategoryDetailsModal
          category={selectedCategory}
          onClose={() => {
            setShowCategoryDetails(false);
            setSelectedCategory(null);
          }}
          onUpdate={handleUpdateCategory}
          isUpdating={updatingCategoryId === selectedCategory.id}
        />
      )}

      {/* Create Category Modal */}
      {showCreateModal && (
        <CreateCategoryModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCategory}
          isCreating={createCategoryMutation.isPending}
        />
      )}
    </div>
  );
};

// Category Details Modal Component
const CategoryDetailsModal = ({ category, onClose, onUpdate, isUpdating }) => {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('ক্যাটেগরির নাম আবশ্যক');
      return;
    }

    const updateData = {};
    if (formData.name !== category.name) updateData.name = formData.name;
    if (formData.description !== (category.description || '')) updateData.description = formData.description;

    if (Object.keys(updateData).length > 0) {
      onUpdate(category.id, updateData);
    } else {
      toast.info('কোন পরিবর্তন করা হয়নি');
    }
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
            <h2 className="text-2xl font-bold text-gray-900">ক্যাটেগরি সম্পাদনা</h2>
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
              ক্যাটেগরির নাম *
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
              বিবরণ
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="ক্যাটেগরির বিবরণ লিখুন..."
            />
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
              disabled={isUpdating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Category Modal Component
const CreateCategoryModal = ({ onClose, onCreate, isCreating }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('ক্যাটেগরির নাম আবশ্যক');
      return;
    }

    onCreate(formData);
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
            <h2 className="text-2xl font-bold text-gray-900">নতুন ক্যাটেগরি তৈরি</h2>
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
              ক্যাটেগরির নাম *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="ক্যাটেগরির নাম লিখুন"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              বিবরণ
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="ক্যাটেগরির বিবরণ লিখুন..."
            />
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
              disabled={isCreating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isCreating ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCategoryManagement;