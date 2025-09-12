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
  Eye,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { apiServices } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const BooksLibrary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 12;

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
      const borrowBookId = borrow.book_copy?.book?.id || borrow.book_copy?.book_id;
      const isActiveStatus = ['pending', 'approved', 'active'].includes(borrow.status);
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
          text: 'অপেক্ষমাণ',
          className: 'bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full',
          canCancel: true
        };
      case 'approved':
        return {
          text: 'অনুমোদিত - নিতে আসুন',
          className: 'bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full',
          canCancel: true
        };
      case 'active':
        return {
          text: 'আপনার কাছে আছে',
          className: 'bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full',
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

  const handleDonorClick = (donorId, e) => {
    e.stopPropagation();
    navigate(`/profile/${donorId}`);
  };

  const handleBorrowRequest = async (book) => {
    try {
      if (!user) {
        toast.error('বই ধার নিতে লগইন করুন');
        navigate('/login');
        return;
      }

      // Check if user already has an active borrow for this book
      if (hasActiveBorrowForBook(book.id)) {
        toast.error('আপনি ইতিমধ্যে এই বইয়ের জন্য অনুরোধ করেছেন');
        return;
      }

      // Find an available book copy
      if (!book.total_copies || book.total_copies === 0) {
        toast.error('এই বইয়ের কোন কপি পাওয়া যাচ্ছে না');
        return;
      }

      // Get available book copies for this book
      const availableCopies = await apiServices.bookCopies.getAvailableForBook(book.id);
      
      if (!availableCopies || availableCopies.length === 0) {
        toast.error('এই বইয়ের কোন কপি এখন উপলব্ধ নেই');
        return;
      }

      // Use the first available copy
      const borrowData = {
        user_id: user.id,
        book_copy_id: availableCopies[0].id
      };

      await apiServices.borrows.createBorrow(borrowData);
      toast.success(`"${book.title}" এর ধার অনুরোধ পাঠানো হয়েছে`);
      
      // Refresh the user's borrows to update the UI
      queryClient.invalidateQueries(['userBorrows', user.id]);
      queryClient.invalidateQueries(['books']);
    } catch (error) {
      console.error('Borrow request error:', error);
      toast.error(`ধার অনুরোধ পাঠাতে সমস্যা হয়েছে: ${error.response?.data?.detail || 'অজানা ত্রুটি'}`);
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
            <h1 className="text-2xl font-bold text-gray-900">বই লাইব্রেরি</h1>
            <p className="text-gray-600 mt-1">
              মোট {sortedBooks.length} টি বই পাওয়া গেছে
            </p>
          </div>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin/books/add')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>নতুন বই যোগ করুন</span>
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
                placeholder="বইয়ের নাম বা লেখকের নাম লিখুন..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              খুঁজুন
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
                  <option value="all">সব ক্যাটাগরি</option>
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
                <option value="newest">নতুন আগে</option>
                <option value="oldest">পুরাতন আগে</option>
                <option value="title">বইয়ের নাম অনুযায়ী</option>
                <option value="author">লেখকের নাম অনুযায়ী</option>
                <option value="popular">জনপ্রিয়তা অনুযায়ী</option>
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
                      {book.cover ? (
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="flex flex-col items-center justify-center text-gray-400" style={{display: book.cover ? 'none' : 'flex'}}>
                        <BookOpen className="h-12 w-12 mb-2" />
                        <span className="text-sm text-center px-2">{book.title}</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex space-x-1">
                      {book.total_copies > 0 ? (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {book.total_copies} কপি
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                          স্টকে নেই
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
                        <span>{book.times_borrowed || 0} বার</span>
                      </div>
                    </div>
                    
                    {/* Donor Information */}
                    {book.donors && book.donors.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center text-xs text-gray-600 mb-1">
                          <Heart className="h-3 w-3 mr-1 text-red-500" />
                          <span>দানকারী:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {book.donors.slice(0, 2).map((donor) => (
                            <button
                              key={donor.id}
                              onClick={(e) => handleDonorClick(donor.id, e)}
                              className="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded-full hover:bg-pink-100 transition-colors"
                            >
                              {donor.name}
                            </button>
                          ))}
                          {book.donors.length > 2 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{book.donors.length - 2} আরো
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookClick(book.id);
                        }}
                        className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>বিস্তারিত</span>
                      </button>
                      
                      {(() => {
                        const statusDisplay = getBorrowStatusDisplay(book.id);
                        if (statusDisplay) {
                          return (
                            <span className={statusDisplay.className}>
                              {statusDisplay.text}
                            </span>
                          );
                        } else if (book.total_copies > 0) {
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBorrowRequest(book);
                              }}
                              className="bg-green-600 text-white text-xs px-3 py-1 rounded-full hover:bg-green-700 transition-colors"
                            >
                              ধার নিন
                            </button>
                          );
                        } else {
                          return (
                            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                              স্টকে নেই
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
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="flex flex-col items-center justify-center text-gray-400 p-2" style={{display: book.cover ? 'none' : 'flex'}}>
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
                            <span>{book.pages} পৃষ্ঠা</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{book.times_borrowed || 0} বার ধার</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {book.total_copies > 0 ? (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {book.total_copies} কপি আছে
                              </span>
                            ) : (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                স্টকে নেই
                              </span>
                            )}
                            
                            {/* Donor Information in List View */}
                            {book.donors && book.donors.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <Heart className="h-3 w-3 text-red-500" />
                                <span className="text-xs text-gray-600">দানকারী:</span>
                                <div className="flex space-x-1">
                                  {book.donors.slice(0, 1).map((donor) => (
                                    <button
                                      key={donor.id}
                                      onClick={(e) => handleDonorClick(donor.id, e)}
                                      className="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded-full hover:bg-pink-100 transition-colors"
                                    >
                                      {donor.name}
                                    </button>
                                  ))}
                                  {book.donors.length > 1 && (
                                    <span className="text-xs text-gray-500">
                                      +{book.donors.length - 1} আরো
                                    </span>
                                  )}
                                </div>
                              </div>
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
                          <span>দেখুন</span>
                        </button>
                        
                        {(() => {
                          const statusDisplay = getBorrowStatusDisplay(book.id);
                          if (statusDisplay) {
                            return (
                              <span className={statusDisplay.className}>
                                {statusDisplay.text}
                              </span>
                            );
                          } else if (book.total_copies > 0) {
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBorrowRequest(book);
                                }}
                                className="bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700 transition-colors"
                              >
                                ধার নিন
                              </button>
                            );
                          } else {
                            return (
                              <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded">
                                স্টকে নেই
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">কোন বই পাওয়া যায়নি</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory !== 'all'
              ? 'আপনার অনুসন্ধান অনুযায়ী কোন বই পাওয়া যায়নি।'
              : 'এখনো কোন বই যোগ করা হয়নি।'
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
              সব বই দেখুন
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + booksPerPage, sortedBooks.length)} এর মধ্যে {sortedBooks.length} টি
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
    </div>
  );
};

export default BooksLibrary;