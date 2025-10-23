import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  Calendar,
  Plus,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { apiServices } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import OptimizedImage from '../../components/OptimizedImage';
import ConfirmationModal from '../../components/ConfirmationModal';

const BooksLibrary = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 12;
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    book: null
  });

  // API calls
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['books'],
    queryFn: () => apiServices.books.getBooks(),
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiServices.categories.getCategories(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Get user's current borrows to check for active requests
  const { data: userBorrows = [], isLoading: borrowsLoading } = useQuery({
    queryKey: ['userBorrows', user?.id],
    queryFn: () => apiServices.borrows.getBorrows(),
    enabled: !!user,
    retry: 1,
    staleTime: 30 * 1000, // Refresh every 30 seconds for real-time updates
    refetchInterval: 60 * 1000, // Auto-refetch every minute
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Helper function to get borrow status for a book
  const getBorrowStatusForBook = (bookId) => {
    if (!user || !userBorrows || userBorrows.length === 0) return null;
    
    const borrow = userBorrows.find(borrow => {
      // API returns book_id directly in the borrow object
      const borrowBookId = borrow.book_id;
      const isActiveStatus = ['pending', 'approved', 'collected', 'return_requested'].includes(borrow.status);
      return borrowBookId === bookId && isActiveStatus;
    });
    
    return borrow ? borrow.status : null;
  };

  // Helper function to check if user has an active borrow for a book
  const hasActiveBorrowForBook = (bookId) => {
    return getBorrowStatusForBook(bookId) !== null;
  };

  // Helper function to get status button/text for borrow
  const getBorrowStatusDisplay = (bookId) => {
    const status = getBorrowStatusForBook(bookId);
    
    switch (status) {
      case 'pending':
        return {
          text: t('books.pending'),
          className: 'bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full',
          canCancel: true
        };
      case 'approved':
        return {
          text: t('books.approvedPickup'),
          className: 'bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full',
          canCancel: true
        };
      case 'collected':
        return {
          text: t('books.withYou'),
          className: 'bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full',
          canCancel: false
        };
      case 'return_requested':
        return {
          text: 'ফেরত অনুরোধ',
          className: 'bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full',
          canCancel: false
        };
      default:
        return null;
    }
  };

  // Filter and sort books
  const filteredBooks = books.filter(book => {
    const matchesSearch = !searchQuery || 
      book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      book.category_id?.toString() === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      case 'oldest':
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case 'author':
        return (a.author || '').localeCompare(b.author || '');
      case 'popular':
        return (b.times_borrowed || 0) - (a.times_borrowed || 0);
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedBooks.length / booksPerPage);
  const startIndex = (currentPage - 1) * booksPerPage;
  const paginatedBooks = sortedBooks.slice(startIndex, startIndex + booksPerPage);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleBookClick = (bookId) => {
    navigate(`/books/${bookId}`);
  };

  // Show confirmation modal before borrowing
  const showBorrowConfirmation = (book) => {
    if (!user) {
      toast.error(t('books.loginToBorrow'));
      navigate('/login');
      return;
    }

    // Check if user already has an active borrow for this book
    if (hasActiveBorrowForBook(book.id)) {
      toast.error(t('books.alreadyRequested'));
      return;
    }

    setConfirmModal({
      isOpen: true,
      book: book
    });
  };

  // Handle borrow confirmation
  const handleBorrowRequest = async (book) => {
    setConfirmModal({ isOpen: false, book: null });
    
    try {
      // Check if book has available copies
      if (!book.available_copies || book.available_copies === 0) {
        toast.error(t('books.noCopiesAvailable'));
        return;
      }

      // Create borrow request with just book_id (backend handles finding available copy)
      const borrowData = {
        book_id: book.id
      };

      await apiServices.borrows.createBorrow(borrowData);
      toast.success(t('books.borrowRequestSent', { title: book.title }));
      
      // Refresh the user's borrows to update the UI
      queryClient.invalidateQueries(['userBorrows', user.id]);
      queryClient.invalidateQueries(['books']);
    } catch (error) {
      console.error('Borrow request error:', error);
      
      // Get detailed error message
      let errorMessage = t('common.error');
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`${t('books.borrowRequestError')}: ${errorMessage}`);
    }
  };

  if (booksLoading || categoriesLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="flex space-x-4">
              <div className="h-10 bg-gray-200 rounded flex-1"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
        
        {/* Books Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('books.title')}</h1>
            <p className="text-gray-600 mt-1">
              {t('books.totalFound', { count: sortedBooks.length })}
            </p>
          </div>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin/books/add')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{t('books.addNewBook')}</span>
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={t('books.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('common.search')}
            </button>
          </form>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">{t('books.allCategories')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="newest">{t('books.newest')}</option>
                <option value="oldest">{t('books.oldest')}</option>
                <option value="title">{t('books.byTitle')}</option>
                <option value="author">{t('books.byAuthor')}</option>
                <option value="popular">{t('books.byPopularity')}</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Books Display */}
      {paginatedBooks.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {paginatedBooks.map((book) => (
            <div
              key={book.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                viewMode === 'list' ? 'flex' : ''
              }`}
              onClick={() => handleBookClick(book.id)}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="relative">
                    <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {book.cover || book.cover_image_url ? (
                        <img
                          src={book.cover || book.cover_image_url}
                          alt={book.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="flex flex-col items-center justify-center text-gray-400" style={{display: (book.cover || book.cover_image_url) ? 'none' : 'flex'}}>
                        <BookOpen className="h-12 w-12 mb-2" />
                        <span className="text-sm text-center px-2">{book.title}</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex space-x-1">
                      {book.available_copies > 0 ? (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {t('books.copiesAvailable', { count: book.available_copies })}
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                          {t('books.outOfStock')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{book.published_year}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{t('books.borrowedTimes', { count: book.times_borrowed || 0 })}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookClick(book.id);
                        }}
                        className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>{t('books.details')}</span>
                      </button>
                      
                      {(() => {
                        const statusDisplay = getBorrowStatusDisplay(book.id);
                        if (statusDisplay) {
                          return (
                            <span className={statusDisplay.className}>
                              {statusDisplay.text}
                            </span>
                          );
                        } else if (book.available_copies > 0) {
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showBorrowConfirmation(book);
                              }}
                              className="bg-green-600 text-white text-xs px-3 py-1 rounded-full hover:bg-green-700 transition-colors"
                            >
                              {t('books.borrow')}
                            </button>
                          );
                        } else {
                          return (
                            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                              {t('books.outOfStock')}
                            </span>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </>
              ) : (
                                <>
                  <div className="w-24 h-32 bg-gray-100 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                    {book.cover || book.cover_image_url ? (
                      <img
                        src={book.cover || book.cover_image_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="flex flex-col items-center justify-center text-gray-400 p-2" style={{display: (book.cover || book.cover_image_url) ? 'none' : 'flex'}}>
                      <BookOpen className="h-6 w-6 mb-1" />
                      <span className="text-xs text-center leading-tight">{book.title?.slice(0, 20)}</span>
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {book.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{book.published_year}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BookOpen className="h-3 w-3" />
                            <span>{book.pages} {t('books.pages')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{t('books.borrowedTimesShort', { count: book.times_borrowed || 0 })}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {book.available_copies > 0 ? (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {t('books.copiesInStock', { count: book.available_copies })}
                              </span>
                            ) : (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                {t('books.outOfStock')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookClick(book.id);
                          }}
                          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center space-x-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>{t('books.view')}</span>
                        </button>
                        
                        {(() => {
                          const statusDisplay = getBorrowStatusDisplay(book.id);
                          if (statusDisplay) {
                            return (
                              <span className={statusDisplay.className}>
                                {statusDisplay.text}
                              </span>
                            );
                          } else if (book.available_copies > 0) {
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showBorrowConfirmation(book);
                                }}
                                className="bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700 transition-colors"
                              >
                                {t('books.borrow')}
                              </button>
                            );
                          } else {
                            return (
                              <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded">
                                {t('books.outOfStock')}
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('books.noBookFound')}</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory !== 'all'
              ? t('books.noBooksBySearch')
              : t('books.noBooksAdded')
            }
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              {t('books.viewAllBooks')}
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + booksPerPage, sortedBooks.length)} {t('common.of')} {sortedBooks.length} {t('books.items')}
            </p>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  const isVisible = 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1);
                  
                  if (!isVisible) {
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg ${
                        currentPage === page
                          ? 'bg-green-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Borrow Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, book: null })}
        onConfirm={() => handleBorrowRequest(confirmModal.book)}
        title={t('books.borrowConfirmTitle')}
        message={t('books.borrowConfirmMessage', { title: confirmModal.book?.title })}
        confirmText={t('books.yesBorrow')}
        cancelText={t('common.cancel')}
        type="default"
      />
    </div>
  );
};

export default BooksLibrary;