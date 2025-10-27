import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../utils/toast';
import { getSafeCategoryName } from '../../utils/dataHelpers';
import { useTranslation } from '../../hooks/useTranslation';
import { 
  Book, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw,
  Eye,
  Tag,
  BookOpen,
  AlertCircle,
  Image as ImageIcon,
  Users,
} from 'lucide-react';
import { apiServices } from '../../api';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import OptimizedImage from '../../components/OptimizedImage';
import ImageUpload from '../../components/ImageUpload';
import { storageService } from '../../services/storage';

const AdminBookManagement = () => {
  const queryClient = useQueryClient();
  const { confirmDelete, confirmUpdate, confirmSubmit } = useConfirmation();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState(null);

  // Fetch books
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
    mutationFn: (variables) => apiServices.books.addBook(variables),
    onSuccess: (createdBook, variables) => {
      // Always invalidate queries immediately after book creation
      queryClient.invalidateQueries(['admin', 'books']);
      
      // If there's a selected file from the form, upload it
      if (variables.selectedFile) {
        // Handle cover upload for new books
        storageService.uploadBookCover(variables.selectedFile, createdBook.id)
          .then((uploadResult) => {
            return apiServices.books.updateBook(createdBook.id, {
              cover_image_url: uploadResult.url
            });
          })
          .then(() => {
            toast.success('বই এবং কভার ছবি সফলভাবে যোগ করা হয়েছে!');
            // No need to invalidate again since we already did it
          })
          .catch((error) => {
            console.error('Cover upload error:', error);
            toast.error('বই যোগ করা হয়েছে কিন্তু কভার আপলোড ব্যর্থ হয়েছে');
            // No need to invalidate again since we already did it
          });
      } else {
        toast.success('নতুন বই সফলভাবে যোগ করা হয়েছে!');
      }
      setShowAddModal(false);
    },
    onError: (error) => {
      toast.error('বই যোগ করতে সমস্যা হয়েছে: ' + (error?.response?.data?.detail || 'অজানা সমস্যা'));
    }
  });

  // Update book mutation
  const updateBookMutation = useMutation({
    mutationFn: (variables) => apiServices.books.updateBook(variables.id, variables.bookData),
    onSuccess: (updatedBook, variables) => {
      // Always invalidate queries immediately after book update
      queryClient.invalidateQueries(['admin', 'books']);
      
      // If there's a selected file from the form, upload it
      if (variables.selectedFile) {
        storageService.uploadBookCover(variables.selectedFile, variables.id)
          .then((uploadResult) => {
            return apiServices.books.updateBook(variables.id, {
              cover_image_url: uploadResult.url
            });
          })
          .then(() => {
            toast.success('বই এবং কভার ছবি সফলভাবে আপডেট হয়েছে!');
            // No need to invalidate again since we already did it
          })
          .catch((error) => {
            console.error('Cover upload error:', error);
            toast.error('বই আপডেট হয়েছে কিন্তু কভার আপলোড ব্যর্থ হয়েছে');
            // No need to invalidate again since we already did it
          });
      } else {
        toast.success('বইয়ের তথ্য সফলভাবে আপডেট করা হয়েছে!');
      }
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
    onSuccess: (data, bookId) => {
      toast.success(data?.message || 'বই সফলভাবে মুছে ফেলা হয়েছে!');
      queryClient.invalidateQueries(['admin', 'books']);
      setDeletingBookId(null);
    },
    onError: (error, bookId) => {
      console.error('Delete book error:', error);
      setDeletingBookId(null);
      
      const errorDetail = error?.response?.data?.detail || error?.message || '';
      
      // Handle specific error cases
      if (error?.response?.status === 404) {
        toast.error('❌ বইটি খুঁজে পাওয়া যায়নি');
      } else if (error?.response?.status === 400 && 
                 (errorDetail.includes('বই ধার') || errorDetail.includes('issued') || errorDetail.includes('borrowed'))) {
        toast.error('❌ এই বইটি বর্তমানে ধার দেওয়া হয়েছে। প্রথমে বই ফেরত নিন।', { duration: 6000 });
      } else if (error?.response?.status === 400 && 
                 (errorDetail.includes('foreign key') || errorDetail.includes('constraint'))) {
        toast.error('❌ এই বইটির সাথে অন্যান্য ডেটা সংযুক্ত রয়েছে। মুছে ফেলা যাবে না।', { duration: 6000 });
      } else if (error?.response?.status === 403) {
        toast.error('❌ আপনার এই বইটি মুছে ফেলার অনুমতি নেই');
      } else if (error?.response?.status === 500) {
        toast.error('🔧 সার্ভার সমস্যা। অনুগ্রহ করে পরে চেষ্টা করুন');
      } else {
        toast.error(`❌ বই মুছতে সমস্যা হয়েছে: ${errorDetail || 'অজানা সমস্যা'}`);
      }
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
    return getSafeCategoryName(category?.name);
  };

  const handleEditBook = (book) => {
    setSelectedBook(book);
    setShowEditModal(true);
  };

  const handleDeleteBook = async (book) => {
    const confirmed = await confirmDelete(
      `"${book.title}" বইটি মুছে ফেলুন`,
      `আপনি কি নিশ্চিত যে "${book.title}" বইটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।`,
      'মুছে ফেলুন',
      'বাতিল',
      'danger'
    );
    
    if (confirmed) {
      setDeletingBookId(book.id);
      deleteBookMutation.mutate(book.id);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => ({
    total: books.length,
    available: books.reduce((sum, book) => sum + (book.total_copies || 0), 0),
    borrowed: books.reduce((sum, book) => sum + (book.times_borrowed || 0), 0),
    categories: categories.length,
  }), [books, categories]);

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
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.bookManagement')}</h1>
          <p className="text-gray-600 mt-2">{t('admin.bookManagement')}</p>
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
            {t('common.refresh')}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.addBook')}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.totalBooks')}</p>
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
              <p className="text-sm font-medium text-gray-600">{t('books.availableCopies')}</p>
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
              <p className="text-sm font-medium text-gray-600">{t('admin.totalBorrows')}</p>
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
              <p className="text-sm font-medium text-gray-600">{t('admin.dashboard.bookCategories')}</p>
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
                placeholder={t('books.searchPlaceholder')}
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
              <option value="all">{t('books.allCategories')}</option>
              <option value="uncategorized">{t('common.unknown')}</option>
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
            <p className="text-gray-500">{t('books.noBooks')}</p>
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
                        disabled={deletingBookId === book.id}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        title={deletingBookId === book.id ? "মুছে ফেলা হচ্ছে..." : "মুছে ফেলুন"}
                      >
                        {deletingBookId === book.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
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
          books={books}
          onClose={() => setShowAddModal(false)}
          onSubmit={(bookData, selectedFile) => addBookMutation.mutate({ ...bookData, selectedFile })}
          isLoading={addBookMutation.isPending}
          queryClient={queryClient}
          t={t}
        />
      )}

      {showEditModal && selectedBook && (
        <BookModal
          isEdit={true}
          book={selectedBook}
          categories={categories}
          books={books}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBook(null);
          }}
          onSubmit={(bookData, selectedFile) => updateBookMutation.mutate({ id: selectedBook.id, bookData, selectedFile })}
          isLoading={updateBookMutation.isPending}
          queryClient={queryClient}
          t={t}
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
          t={t}
        />
      )}
    </div>
  );
};

// Book Modal Component (Add/Edit)
const BookModal = ({ isEdit, book, categories, books, onClose, onSubmit, isLoading, queryClient, t }) => {
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
  const [selectedFile, setSelectedFile] = useState(null); // For deferred upload

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

    let submitData = {
      ...formData,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      published_year: parseInt(formData.published_year),
      pages: parseInt(formData.pages),
      total_copies: parseInt(formData.total_copies) || 1
    };

    if (isEdit) {
      // For editing, update the book
      onSubmit(submitData, selectedFile);
    } else {
      // For new books, create the book
      onSubmit(submitData, selectedFile);
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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {isEdit ? t('admin.editBook') : t('admin.addBook')}
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
                <h4 className="font-medium text-blue-900 mb-1">{t('donation.modal.title')}</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• {t('donation.modal.instruction1')}</li>
                  <li>• {t('donation.modal.instruction2')}</li>
                  <li>• {t('donation.modal.instruction3')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('donation.bookTitle')}
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder={t('donation.bookTitlePlaceholder')}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('donation.authorName')}
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder={t('donation.authorPlaceholder')}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('books.category')}
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isLoading}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
                disabled={isLoading}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder={t('donation.pageCountPlaceholder')}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('books.totalCopies')} *
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
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Cover Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('donation.uploadCover')}
            </label>
            
            {/* Cloudinary Image Upload */}
            <ImageUpload
              folder="book-covers"
              maxSize={5 * 1024 * 1024} // 5MB
              allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              placeholder={t('donation.uploadImage')}
              showPreview={true}
              transformations={{
                width: 300,
                height: 400,
                crop: 'fill',
                gravity: 'center'
              }}
              value={formData.cover_public_id}
              deferred={true}
              disabled={isLoading}
              onFileSelect={(result) => {
                console.log('📁 AdminBookManagement: File selected:', result.file.name);
                setSelectedFile(result.file);
                setFormData(prev => ({
                  ...prev,
                  cover_public_id: null, // Clear any existing uploaded image
                  cover: result.previewUrl // Use preview URL temporarily
                }));
                setUseCustomImage(true);
              }}
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">{t('donation.modal.preview')}</h4>
            <div className="flex items-start space-x-4">
              <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {selectedFile ? (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Selected cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : formData.cover_public_id ? (
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
                  <span>{formData.pages} {t('bookDetails.pages')}</span>
                  <span>{formData.total_copies} {t('books.copies')}</span>
                  {selectedFile && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {t('donation.modal.uploadedImage')}
                    </span>
                  )}
                  {formData.cover_public_id && !selectedFile && (
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800">
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Book className="h-4 w-4" />
              <span>{isLoading ? t('common.processing') : (isEdit ? t('common.save') : t('common.submit'))}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



// Book Details Modal
const BookDetailsModal = ({ book, categories, onClose, t }) => {
  const getCategoryName = (categoryId) => {
    if (!categoryId) return t('common.unknown');
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : t('common.unknown');
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
              <h2 className="text-2xl font-bold text-gray-900">{t('bookDetails.details')}</h2>
              <p className="text-gray-600">{t('common.details')}</p>
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
                <p className="text-lg text-gray-600">{t('books.author')}: {book.author}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">{t('books.category')}</p>
                  <p className="font-medium">{getCategoryName(book.category_id)}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">{t('bookDetails.published')}</p>
                  <p className="font-medium">{book.published_year}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">{t('bookDetails.pages')}</p>
                  <p className="font-medium">{book.pages || t('common.unknown')}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">{t('bookDetails.id')}</p>
                  <p className="font-medium">#{book.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-600">{t('bookDetails.availableCopies')}</p>
                  <p className="text-2xl font-bold text-green-700">{book.total_copies || 0}</p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-600">{t('bookDetails.totalBorrows')}</p>
                  <p className="text-2xl font-bold text-blue-700">{book.times_borrowed || 0}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">{t('bookDetails.added')}</p>
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
