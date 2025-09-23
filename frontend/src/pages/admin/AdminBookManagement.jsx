import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Book, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw,
  Eye,
  Calendar,
  User,
  Hash,
  Tag,
  BookOpen,
  Library,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  FileText,
  Users,
  BarChart3,
  Camera
} from 'lucide-react';
import { apiServices } from '../../api';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import OptimizedImage from '../../components/OptimizedImage';
import ImageUpload from '../../components/ImageUpload';

const AdminBookManagement = () => {
  const queryClient = useQueryClient();
  const { confirmDelete, confirmUpdate, confirmSubmit } = useConfirmation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookDetails, setShowBookDetails] = useState(false);

  // Fetch all books
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['admin', 'books'],
    queryFn: apiServices.books.getBooks,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: apiServices.categories.getCategories,
    staleTime: 5 * 60 * 1000,
  });

  // Add book mutation
  const addBookMutation = useMutation({
    mutationFn: apiServices.books.addBook,
    onSuccess: () => {
      toast.success('নতুন বই সফলভাবে যোগ করা হয়েছে!');
      queryClient.invalidateQueries(['admin', 'books']);
      setShowAddModal(false);
    },
    onError: (error) => {
      toast.error('বই যোগ করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  // Update book mutation
  const updateBookMutation = useMutation({
    mutationFn: ({ id, bookData }) => apiServices.books.updateBook(id, bookData),
    onSuccess: () => {
      toast.success('বইয়ের তথ্য সফলভাবে আপডেট করা হয়েছে!');
      queryClient.invalidateQueries(['admin', 'books']);
      setShowEditModal(false);
      setSelectedBook(null);
    },
    onError: (error) => {
      toast.error('বই আপডেট করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: apiServices.books.deleteBook,
    onSuccess: () => {
      toast.success('বই সফলভাবে মুছে ফেলা হয়েছে!');
      queryClient.invalidateQueries(['admin', 'books']);
    },
    onError: (error) => {
      toast.error('বই মুছতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  // Filter books based on search and category
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.id.toString().includes(searchQuery);
    
    const matchesCategory = categoryFilter === 'all' || 
                           (book.category_id ? book.category_id.toString() === categoryFilter : categoryFilter === 'uncategorized');
    
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('bn-BD');
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'বিভাগহীন';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'অজানা বিভাগ';
  };

  const handleEditBook = (book) => {
    setSelectedBook(book);
    setShowEditModal(true);
  };

  const handleDeleteBook = async (book) => {
    const confirmed = await confirmDelete(`"${book.title}" বইটি`);
    if (confirmed) {
      deleteBookMutation.mutate(book.id);
    }
  };

  // Calculate statistics
  const stats = {
    total: books.length,
    available: books.reduce((sum, book) => sum + (book.total_copies || 0), 0),
    borrowed: books.reduce((sum, book) => sum + (book.times_borrowed || 0), 0),
    categories: categories.length,
  };

  if (booksLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">বইয়ের তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">বই ব্যবস্থাপনা</h1>
          <p className="text-gray-600 mt-2">সকল বই পরিচালনা ও ব্যবস্থাপনা করুন</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={async () => {
              const confirmed = await confirmUpdate('সকল বইয়ের তথ্য রিফ্রেশ করতে');
              if (confirmed) {
                queryClient.invalidateQueries(['admin', 'books']);
                toast.success('বইয়ের তথ্য রিফ্রেশ করা হয়েছে!');
              }
            }}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            রিফ্রেশ
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            নতুন বই
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">মোট বই</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Book className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">উপলব্ধ কপি</p>
              <p className="text-3xl font-bold text-green-900">{stats.available}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ধার নেওয়া</p>
              <p className="text-3xl font-bold text-orange-900">{stats.borrowed}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">বিভাগ</p>
              <p className="text-3xl font-bold text-purple-900">{stats.categories}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Tag className="h-6 w-6 text-purple-600" />
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
                placeholder="বইয়ের নাম, লেখক বা ID দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">সকল বিভাগ</option>
              <option value="uncategorized">বিভাগহীন</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">কোন বই পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {filteredBooks.map((book) => (
              <div key={book.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                {/* Book Cover */}
                <div className="aspect-[3/4] bg-white rounded-md mb-4 overflow-hidden shadow-sm">
                  <OptimizedImage
                    publicId={book.cover_public_id || book.cover}
                    alt={book.title}
                    type="bookCover"
                    size="small"
                    className="w-full h-full object-cover"
                    placeholderText="Book Cover"
                  />
                </div>

                {/* Book Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {book.author}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{getCategoryName(book.category_id)}</span>
                    <span>{book.published_year}</span>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      {book.total_copies || 0} কপি
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {book.times_borrowed || 0} ধার
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        setSelectedBook(book);
                        setShowBookDetails(true);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                      title="বিস্তারিত দেখুন"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditBook(book)}
                        className="text-blue-600 hover:text-blue-700"
                        title="সম্পাদনা করুন"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book)}
                        className="text-red-600 hover:text-red-700"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <BookModal
          isEdit={false}
          book={null}
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSubmit={(bookData) => addBookMutation.mutate(bookData)}
          isLoading={addBookMutation.isPending}
        />
      )}

      {showEditModal && selectedBook && (
        <BookModal
          isEdit={true}
          book={selectedBook}
          categories={categories}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBook(null);
          }}
          onSubmit={(bookData) => updateBookMutation.mutate({ id: selectedBook.id, bookData })}
          isLoading={updateBookMutation.isPending}
        />
      )}

      {showBookDetails && selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          categories={categories}
          onClose={() => {
            setShowBookDetails(false);
            setSelectedBook(null);
          }}
        />
      )}
    </div>
  );
};

// Book Modal Component (Add/Edit)
const BookModal = ({ isEdit, book, categories, onClose, onSubmit, isLoading }) => {
  const { confirmSubmit } = useConfirmation();
  const [formData, setFormData] = useState({
    title: book?.title || '',
    author: book?.author || '',
    cover: book?.cover || 'cover-1.jpg',
    cover_public_id: book?.cover_public_id || null,
    category_id: book?.category_id || '',
    published_year: book?.published_year || new Date().getFullYear(),
    pages: book?.pages || '',
    total_copies: book?.total_copies || 1
  });

  const [useCustomImage, setUseCustomImage] = useState(!!book?.cover_public_id);

  const availableCovers = [
    'cover-1.jpg', 'cover-2.jpg', 'cover-3.jpg', 'cover-4.jpg', 'cover-5.jpg',
    'cover-6.jpg', 'cover-7.jpg', 'cover-8.jpg', 'cover-9.jpg', 'cover-10.jpg',
    'cover-11.jpg', 'cover-12.jpg', 'cover-13.jpg', 'cover-14.jpg', 'cover-15.jpg'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.author.trim()) {
      toast.error('বইয়ের নাম এবং লেখকের নাম আবশ্যক');
      return;
    }

    if (!formData.pages || formData.pages < 1) {
      toast.error('সঠিক পৃষ্ঠা সংখ্যা দিন');
      return;
    }

    if (formData.published_year < 1000 || formData.published_year > new Date().getFullYear()) {
      toast.error('সঠিক প্রকাশনা বছর দিন');
      return;
    }

    const actionText = isEdit ? `"${formData.title}" বইয়ের তথ্য আপডেট করতে` : `"${formData.title}" নতুন বই যোগ করতে`;
    const confirmed = await confirmSubmit(actionText);
    
    if (!confirmed) return;

    const submitData = {
      ...formData,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      published_year: parseInt(formData.published_year),
      pages: parseInt(formData.pages),
      total_copies: parseInt(formData.total_copies) || 1
    };

    onSubmit(submitData);
  };

  // Handle Cloudinary upload success
  const handleUploadSuccess = (result) => {
    setFormData(prev => ({
      ...prev,
      cover_public_id: result.publicId,
      cover: result.secureUrl
    }));
    setUseCustomImage(true);
    toast.success('ছবি সফলভাবে আপলোড হয়েছে!');
  };

  // Handle upload error
  const handleUploadError = (error) => {
    toast.error('ছবি আপলোড করতে সমস্যা হয়েছে: ' + error);
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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {isEdit ? 'বই সম্পাদনা' : 'নতুন বই যোগ'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">বই যোগ করার নির্দেশনা</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• বইটির সঠিক ও সম্পূর্ণ তথ্য প্রদান করুন</li>
                  <li>• স্পষ্ট ও উন্নত মানের কভার ছবি ব্যবহার করুন</li>
                  <li>• সঠিক বিভাগ নির্বাচন করুন</li>
                </ul>
              </div>
            </div>
          </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="বইয়ের সম্পূর্ণ নাম লিখুন..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                লেখক *
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="লেখকের নাম লিখুন..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                বিভাগ
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">বিভাগ নির্বাচন করুন</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="পৃষ্ঠা"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                কপি সংখ্যা *
              </label>
              <input
                type="number"
                name="total_copies"
                value={formData.total_copies}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="কপি"
                required
              />
            </div>
          </div>

          {/* Cover Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              কভার নির্বাচন করুন
            </label>
            
            {/* Cloudinary Image Upload */}
            <ImageUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              folder="book-covers"
              maxSize={5 * 1024 * 1024} // 5MB
              allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              placeholder="বইয়ের কভারের ছবি আপলোড করুন"
              showPreview={true}
              transformations={{
                width: 300,
                height: 400,
                crop: 'fill',
                gravity: 'center'
              }}
              value={formData.cover_public_id}
            />

            {/* Default Cover Options */}
            {!formData.cover_public_id && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">অথবা নিচের থেকে একটি কভার নির্বাচন করুন:</p>
                <div className="grid grid-cols-5 gap-3 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {availableCovers.map((cover) => (
                    <div
                      key={cover}
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        cover,
                        cover_public_id: null 
                      }))}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        formData.cover === cover && !formData.cover_public_id
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

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">প্রিভিউ</h4>
            <div className="flex items-start space-x-4">
              <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {formData.cover_public_id ? (
                  <OptimizedImage
                    publicId={formData.cover_public_id}
                    alt="Uploaded cover preview"
                    type="bookCover"
                    size="thumbnail"
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
                  <span>{formData.total_copies} কপি</span>
                  {formData.cover_public_id && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Cloudinary
                    </span>
                  )}
                </div>
              </div>
            </div>
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
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Book className="h-4 w-4" />
              <span>{isLoading ? 'প্রক্রিয়াকরণ...' : (isEdit ? 'আপডেট' : 'যোগ করুন')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



// Book Details Modal
const BookDetailsModal = ({ book, categories, onClose }) => {
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'বিভাগহীন';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'অজানা বিভাগ';
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
              <h2 className="text-2xl font-bold text-gray-900">বইয়ের বিবরণ</h2>
              <p className="text-gray-600">সম্পূর্ণ তথ্য দেখুন</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Book Cover */}
            <div className="md:w-48">
              <div className="aspect-[3/4] bg-white rounded-lg overflow-hidden shadow-md">
                <OptimizedImage
                  publicId={book.cover_public_id || book.cover}
                  alt={book.title}
                  type="bookCover"
                  size="default"
                  className="w-full h-full object-cover"
                  placeholderText="Book Cover"
                />
              </div>
            </div>

            {/* Book Information */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{book.title}</h3>
                <p className="text-lg text-gray-600">লেখক: {book.author}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">বিভাগ</p>
                  <p className="font-medium">{getCategoryName(book.category_id)}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">প্রকাশনার বছর</p>
                  <p className="font-medium">{book.published_year}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">পৃষ্ঠা সংখ্যা</p>
                  <p className="font-medium">{book.pages || 'তথ্য নেই'}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">বই ID</p>
                  <p className="font-medium">#{book.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-600">উপলব্ধ কপি</p>
                  <p className="text-2xl font-bold text-green-700">{book.total_copies || 0}</p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-600">মোট ধার</p>
                  <p className="text-2xl font-bold text-blue-700">{book.times_borrowed || 0}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">যোগ করা হয়েছে</p>
                <p className="font-medium">{formatDate(book.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBookManagement;
