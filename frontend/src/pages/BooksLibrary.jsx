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
import { useAuth, apiServices } from '../App';

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

  const handleLoginPrompt = () => {
    navigate('/login');
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
      {/* Public Access Header for Non-Authenticated Users */}
      {!user && (
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">📚 বই লাইব্রেরি ব্রাউজ করুন</h2>
              <p className="text-green-100 text-base sm:text-lg">
                আমাদের বিস্তৃত বই সংগ্রহ দেখুন। বই ধার নিতে চাইলে লগইন করুন।
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => navigate('/')}
                className="border-2 border-white text-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-green-700 transition-all transform hover:scale-105"
              >
                হোমে ফিরুন
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-green-600 px-6 py-3 rounded-full font-semibold hover:bg-green-50 transition-all transform hover:scale-105 shadow-lg"
              >
                লগইন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">
              বই লাইব্রেরি
            </h1>
            <p className="text-gray-600 mt-1 text-base sm:text-lg">
              🔍 মোট <span className="font-semibold text-green-600">{sortedBooks.length}</span> টি বই পাওয়া গেছে
            </p>
          </div>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin/books/add')}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-full hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 flex items-center space-x-2 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>নতুন বই যোগ করুন</span>
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="বইয়ের নাম বা লেখকের নাম লিখুন..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-base"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-full hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 font-semibold shadow-lg"
            >
              🔍 খুঁজুন
            </button>
          </form>

          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-gray-50 p-4 rounded-xl">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm">
                <Filter className="h-5 w-5 text-green-600" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-40"
                >
                  <option value="all">সব ক্যাটাগরি</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white p-3 rounded-lg shadow-sm">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-48"
                >
                  <option value="newest">🆕 নতুন আগে</option>
                  <option value="oldest">📅 পুরাতন আগে</option>
                  <option value="title">📚 বইয়ের নাম অনুযায়ী</option>
                  <option value="author">✍️ লেখকের নাম অনুযায়ী</option>
                  <option value="popular">⭐ জনপ্রিয়তা অনুযায়ী</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg transition-all ${viewMode === 'grid' 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md transform scale-105' 
                  : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-lg transition-all ${viewMode === 'list' 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md transform scale-105' 
                  : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Books Display */}
      {paginatedBooks.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-6"
        }>
          {paginatedBooks.map((book) => (
            <div
              key={book.id}
              className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all transform hover:scale-[1.02] cursor-pointer group ${
                viewMode === 'list' ? 'flex' : ''
              }`}
              onClick={() => handleBookClick(book.id)}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="relative">
                    <div className="w-full h-48 sm:h-56 bg-gradient-to-br from-blue-50 to-blue-100 rounded-t-xl overflow-hidden flex items-center justify-center">
                      {book.cover ? (
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="flex flex-col items-center justify-center text-blue-400 p-4" style={{display: book.cover ? 'none' : 'flex'}}>
                        <BookOpen className="h-16 w-16 mb-3" />
                        <span className="text-sm text-center font-medium text-blue-600">{book.title}</span>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 flex space-x-2">
                      {book.total_copies > 0 ? (
                        <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full shadow-lg backdrop-blur-sm font-medium">
                          ✅ {book.total_copies} কপি
                        </span>
                      ) : (
                        <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow-lg backdrop-blur-sm font-medium">
                          ❌ স্টকে নেই
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded-full shadow-sm">
                        📖 #{book.id}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-5">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg group-hover:text-green-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-gray-600 mb-3 font-medium">✍️ {book.author}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <span>{book.published_year}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-green-500" />
                        <span>{book.times_borrowed || 0} বার</span>
                      </div>
                    </div>
                    
                    {/* Donor Information */}
                    {book.donors && book.donors.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Heart className="h-4 w-4 mr-1 text-red-500" />
                          <span className="font-medium">দানকারী:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {book.donors.slice(0, 2).map((donor) => (
                            <button
                              key={donor.id}
                              onClick={(e) => handleDonorClick(donor.id, e)}
                              className="text-xs bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 px-3 py-1 rounded-full hover:from-pink-200 hover:to-pink-300 transition-all transform hover:scale-105 font-medium"
                            >
                              💝 {donor.name}
                            </button>
                          ))}
                          {book.donors.length > 2 && (
                            <span className="text-xs text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
                              +{book.donors.length - 2} আরো
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookClick(book.id);
                        }}
                        className="text-green-600 hover:text-green-700 text-sm font-semibold flex items-center space-x-1 hover:bg-green-50 px-3 py-1 rounded-full transition-all"
                      >
                        <Eye className="h-4 w-4" />
                        <span>বিস্তারিত</span>
                      </button>
                      
                      {(() => {
                        const statusDisplay = getBorrowStatusDisplay(book.id);
                        if (statusDisplay) {
                          return (
                            <span className={`${statusDisplay.className} font-medium`}>
                              {statusDisplay.text}
                            </span>
                          );
                        } else if (!user) {
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoginPrompt();
                              }}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm px-4 py-2 rounded-full hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 font-medium shadow-lg"
                            >
                              🔑 লগইন করুন
                            </button>
                          );
                        } else if (book.total_copies > 0) {
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBorrowRequest(book);
                              }}
                              className="bg-gradient-to-r from-green-600 to-green-700 text-white text-sm px-4 py-2 rounded-full hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 font-medium shadow-lg"
                            >
                              📖 ধার নিন
                            </button>
                          );
                        } else {
                          return (
                            <span className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full font-medium">
                              😔 স্টকে নেই
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
                          } else if (!user) {
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLoginPrompt();
                                }}
                                className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                              >
                                লগইন করুন
                              </button>
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
        <div className="bg-white rounded-xl p-8 sm:p-12 text-center shadow-lg border border-gray-100">
          <div className="h-20 w-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">📚 কোন বই পাওয়া যায়নি</h3>
          <p className="text-gray-600 mb-6 text-lg">
            {searchQuery || selectedCategory !== 'all'
              ? '🔍 আপনার অনুসন্ধান অনুযায়ী কোন বই পাওয়া যায়নি। অন্য কিছু খুঁজে দেখুন।'
              : '📖 এখনো কোন বই যোগ করা হয়নি। শীঘ্রই নতুন বই যোগ করা হবে।'
            }
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-full hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 font-semibold shadow-lg"
            >
              🔄 সব বই দেখুন
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <p className="text-gray-600 font-medium">
              📊 দেখানো হচ্ছে <span className="text-green-600 font-bold">{startIndex + 1}-{Math.min(startIndex + booksPerPage, sortedBooks.length)}</span> এর মধ্যে <span className="text-green-600 font-bold">{sortedBooks.length}</span> টি
            </p>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-3 border-2 border-gray-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-50 hover:border-green-300 transition-all transform hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5" />
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
                      return <span key={page} className="px-3 py-2 text-gray-400 font-bold">...</span>;
                    }
                    return null;
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-full font-semibold transition-all transform hover:scale-105 ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
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
                className="p-3 border-2 border-gray-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-50 hover:border-green-300 transition-all transform hover:scale-105"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BooksLibrary;
