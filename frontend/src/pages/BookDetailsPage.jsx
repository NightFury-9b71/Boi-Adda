import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, 
  Calendar, 
  User, 
  FileText, 
  Tag, 
  Users, 
  Heart, 
  Share2, 
  ArrowLeft,
  Clock,
  CheckCircle,
  Download,
  AlertCircle,
  Star,
  Eye,
  MessageCircle,
  Bookmark,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, apiServices } from '../App';

const BookDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isBorrowLoading, setIsBorrowLoading] = useState(false);

  // Fetch book details
  const { data: book, isLoading: bookLoading, error: bookError } = useQuery({
    queryKey: ['book', id],
    queryFn: () => apiServices.books.getBook(parseInt(id)),
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch book category
  const { data: category } = useQuery({
    queryKey: ['category', book?.category_id],
    queryFn: () => apiServices.categories.getCategory(book.category_id),
    enabled: !!book?.category_id,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Get user's current borrows to check for active requests
  const { data: userBorrows = [] } = useQuery({
    queryKey: ['userBorrows', user?.id],
    queryFn: apiServices.borrows.getBorrows,
    enabled: !!user,
    retry: 1,
    staleTime: 30 * 1000, // Refresh every 30 seconds for real-time updates
    refetchInterval: 60 * 1000, // Auto-refetch every minute
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Helper function to get borrow status for this book
  const getBorrowStatusForBook = () => {
    if (!user || !userBorrows || userBorrows.length === 0) return null;
    
    const borrow = userBorrows.find(borrow => {
      const borrowBookId = borrow.book_copy?.book?.id || borrow.book_copy?.book_id;
      const isActiveStatus = ['pending', 'approved', 'active'].includes(borrow.status);
      return borrowBookId === parseInt(id) && isActiveStatus;
    });
    
    return borrow ? borrow.status : null;
  };

  // Helper function to check if user has an active borrow for this book
  const hasActiveBorrowForBook = () => {
    return getBorrowStatusForBook() !== null;
  };

  // Helper function to get status display info
  const getBorrowStatusDisplay = () => {
    const status = getBorrowStatusForBook();
    
    switch (status) {
      case 'pending':
        return {
          text: 'অনুরোধ করা হয়েছে',
          description: 'আপনার ধার অনুরোধ বিবেচনাধীন আছে',
          className: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          icon: Clock
        };
      case 'approved':
        return {
          text: 'অনুমোদিত - নিতে আসুন',
          description: 'আপনার অনুরোধ অনুমোদিত হয়েছে। দয়া করে লাইব্রেরিতে এসে বইটি নিয়ে যান',
          className: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          icon: CheckCircle
        };
      case 'active':
        return {
          text: 'আপনার কাছে আছে',
          description: 'এই বইটি বর্তমানে আপনার কাছে রয়েছে',
          className: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          icon: CheckCircle
        };
      default:
        return null;
    }
  };

  const handleBorrowRequest = async () => {
    try {
      if (!user) {
        toast.error('বই ধার নিতে লগইন করুন');
        navigate('/login');
        return;
      }

      // Check if user already has an active borrow for this book
      if (hasActiveBorrowForBook()) {
        toast.error('আপনি ইতিমধ্যে এই বইয়ের জন্য অনুরোধ করেছেন');
        return;
      }

      // Check if book has available copies
      if (!book.total_copies || book.total_copies === 0) {
        toast.error('এই বইয়ের কোন কপি পাওয়া যাচ্ছে না');
        return;
      }

      setIsBorrowLoading(true);

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
      queryClient.invalidateQueries(['book', id]);
    } catch (error) {
      console.error('Borrow request error:', error);
      toast.error(`ধার অনুরোধ পাঠাতে সমস্যা হয়েছে: ${error.response?.data?.detail || 'অজানা ত্রুটি'}`);
    } finally {
      setIsBorrowLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'অজানা';
    return new Date(dateString).toLocaleDateString('bn-BD');
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: book.title,
          text: `"${book.title}" - ${book.author}`,
          url: window.location.href,
        });
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('লিংক কপি করা হয়েছে!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast.error('শেয়ার করতে সমস্যা হয়েছে');
    }
  };

  if (bookLoading) {
    return (
      <div className="space-y-6">
        {/* Back Button Skeleton */}
        <div className="animate-pulse">
          <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Info Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="h-80 w-56 bg-gray-200 rounded-lg mx-auto md:mx-0"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions Skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded-lg"></div>
                <div className="h-10 bg-gray-200 rounded-lg"></div>
                <div className="h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bookError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center max-w-md">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">বই পাওয়া যায়নি</h3>
          <p className="text-gray-600 mb-6">
            দুঃখিত, এই বইটি খুঁজে পাওয়া যায়নি। এটি মুছে ফেলা হতে পারে বা বিদ্যমান নাও থাকতে পারে।
          </p>
          <button
            onClick={() => navigate('/books')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            বই লাইব্রেরিতে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Public Access Header for Non-Authenticated Users */}
      {!user && (
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">📖 বইটি পছন্দ হয়েছে?</h2>
              <p className="text-green-100 text-base sm:text-lg">
                এই বইটি ধার নিতে চাইলে লগইন করুন এবং অনুরোধ পাঠান।
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => navigate('/books')}
                className="border-2 border-white text-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-green-700 transition-all transform hover:scale-105"
              >
                🔍 আরো বই দেখুন
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-green-600 px-6 py-3 rounded-full font-semibold hover:bg-green-50 transition-all transform hover:scale-105 shadow-lg"
              >
                🔑 লগইন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-green-600 hover:text-green-700 font-semibold transition-all hover:bg-green-50 px-4 py-2 rounded-full transform hover:scale-105"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        ⬅️ ফিরে যান
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Book Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Book Header */}
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Book Cover */}
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <div className="relative group">
                  <div className="w-64 h-96 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl overflow-hidden shadow-2xl group-hover:shadow-3xl transition-all duration-300">
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center text-blue-400 p-6"
                      style={{display: book.cover ? 'none' : 'flex'}}
                    >
                      <BookOpen className="h-20 w-20 mb-6" />
                      <span className="text-lg text-center font-bold text-blue-600">{book.title}</span>
                    </div>
                  </div>
                  
                  {/* Availability Badge */}
                  <div className="absolute -top-2 -right-2">
                    {book.total_copies > 0 ? (
                      <span className="bg-green-500 text-white text-sm px-4 py-2 rounded-full font-bold shadow-lg backdrop-blur-sm">
                        ✅ {book.total_copies} কপি আছে
                      </span>
                    ) : (
                      <span className="bg-red-500 text-white text-sm px-4 py-2 rounded-full font-bold shadow-lg backdrop-blur-sm">
                        ❌ স্টকে নেই
                      </span>
                    )}
                  </div>
                  
                  {/* Book ID Badge */}
                  <div className="absolute -bottom-2 -left-2">
                    <span className="bg-purple-500 text-white text-sm px-3 py-1 rounded-full font-medium shadow-lg">
                      📖 #{book.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Book Details */}
              <div className="flex-1 space-y-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-4">
                    {book.title}
                  </h1>
                  <div className="flex items-center text-xl text-gray-700 mb-6 bg-gray-50 p-4 rounded-lg">
                    <User className="h-6 w-6 mr-3 text-blue-500" />
                    <span className="font-semibold">লেখক: </span>
                    <span className="ml-2 text-gray-900 font-bold">✍️ {book.author}</span>
                  </div>
                </div>

                {/* Book Meta Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {category && (
                    <div className="flex items-center text-gray-600 bg-blue-50 p-4 rounded-lg">
                      <Tag className="h-6 w-6 mr-3 text-blue-500" />
                      <div>
                        <span className="font-semibold block text-sm text-gray-500">ক্যাটাগরি</span>
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          📚 {category.name}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-600 bg-purple-50 p-4 rounded-lg">
                    <Calendar className="h-6 w-6 mr-3 text-purple-500" />
                    <div>
                      <span className="font-semibold block text-sm text-gray-500">প্রকাশ</span>
                      <span className="text-lg font-bold text-purple-600">📅 {book.published_year}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600 bg-orange-50 p-4 rounded-lg">
                    <FileText className="h-6 w-6 mr-3 text-orange-500" />
                    <div>
                      <span className="font-semibold block text-sm text-gray-500">পৃষ্ঠা</span>
                      <span className="text-lg font-bold text-orange-600">📄 {book.pages} পৃষ্ঠা</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600 bg-green-50 p-4 rounded-lg">
                    <Users className="h-6 w-6 mr-3 text-green-500" />
                    <div>
                      <span className="font-semibold block text-sm text-gray-500">ধার</span>
                      <span className="text-lg font-bold text-green-600">📊 {book.times_borrowed || 0} বার</span>
                    </div>
                  </div>
                </div>

                {/* Book Statistics */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4 text-xl">📈 বইটির পরিসংখ্যান</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="text-center bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-green-600 mb-1">{book.total_copies}</div>
                      <div className="text-sm text-gray-600 font-medium">📚 উপলব্ধ কপি</div>
                    </div>
                    <div className="text-center bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{book.times_borrowed || 0}</div>
                      <div className="text-sm text-gray-600 font-medium">📊 মোট ধার</div>
                    </div>
                    <div className="text-center bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-lg font-bold text-purple-600 mb-1">{formatDate(book.created_at)}</div>
                      <div className="text-sm text-gray-600 font-medium">📅 যোগ করা হয়েছে</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Book Description/Additional Info */}
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              📝 বই সম্পর্কে
            </h2>
            <div className="prose prose-lg max-w-none">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-l-4 border-blue-500">
                <p className="text-gray-800 leading-relaxed text-lg">
                  📚 "<span className="font-bold text-blue-600">{book.title}</span>" বইটি 
                  <span className="font-semibold text-purple-600"> ✍️ {book.author}</span> এর লেখা একটি 
                  <span className="font-medium text-green-600">{category?.name || 'বই'}</span>। 
                  এই বইটি <span className="font-bold text-orange-600">📅 {book.published_year}</span> সালে প্রকাশিত হয়েছে এবং এতে মোট 
                  <span className="font-bold text-red-600">📄 {book.pages} পৃষ্ঠা</span> রয়েছে।
                  {book.times_borrowed > 0 && ` 📊 এই বইটি এ পর্যন্ত ${book.times_borrowed} বার ধার দেওয়া হয়েছে, যা এর জনপ্রিয়তার প্রমাণ।`}
                </p>
              </div>
              
              {category?.description && (
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-l-4 border-green-500">
                  <p className="text-green-800 font-bold text-lg mb-2 flex items-center">
                    🏷️ ক্যাটাগরি সম্পর্কে:
                  </p>
                  <p className="text-green-700 text-base leading-relaxed">{category.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reading Progress & Reviews (Future Feature) */}
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              💬 পাঠক মতামত
            </h2>
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageCircle className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">🚀 শীঘ্রই আসছে...</h3>
              <p className="text-gray-600 text-lg mb-4">পাঠকরা শীঘ্রই এই বইটি সম্পর্কে মতামত দিতে পারবেন</p>
              <div className="flex justify-center space-x-4 text-sm text-gray-500">
                <span>⭐ রেটিং</span>
                <span>•</span>
                <span>📝 রিভিউ</span>
                <span>•</span>
                <span>💭 আলোচনা</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          {/* Borrow Action */}
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              📚 বই ধার নিন
            </h3>
            
            {!user ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <AlertCircle className="h-6 w-6 text-blue-600 mr-3" />
                    <span className="text-blue-800 font-bold text-lg">🔑 লগইন প্রয়োজন</span>
                  </div>
                  <p className="text-blue-700 text-base leading-relaxed">
                    বই ধার নিতে চাইলে প্রথমে লগইন করুন এবং আপনার অ্যাকাউন্ট তৈরি করুন
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 font-bold text-lg flex items-center justify-center shadow-lg"
                >
                  <User className="h-6 w-6 mr-3" />
                  🔑 লগইন করুন
                </button>
              </div>
            ) : book.total_copies > 0 ? (
              <div className="space-y-6">
                {(() => {
                  const statusDisplay = getBorrowStatusDisplay();
                  if (statusDisplay) {
                    const IconComponent = statusDisplay.icon;
                    return (
                      <div className={`border-2 rounded-xl p-6 ${statusDisplay.className}`}>
                        <div className="flex items-center mb-3">
                          <IconComponent className={`h-6 w-6 mr-3 ${statusDisplay.iconColor}`} />
                          <span className={`font-bold text-lg ${statusDisplay.textColor}`}>
                            ✅ {statusDisplay.text}
                          </span>
                        </div>
                        <p className={`text-base leading-relaxed ${statusDisplay.textColor.replace('800', '700')}`}>
                          {statusDisplay.description}
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <button
                        onClick={handleBorrowRequest}
                        disabled={isBorrowLoading}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                      >
                        {isBorrowLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                            ⏳ অনুরোধ পাঠানো হচ্ছে...
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-6 w-6 mr-3" />
                            📖 ধার নিন
                          </>
                        )}
                      </button>
                    );
                  }
                })()}
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center text-green-800 font-medium">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>✅ {book.total_copies} কপি উপলব্ধ</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                  <span className="text-red-800 font-bold text-lg">❌ স্টকে নেই</span>
                </div>
                <p className="text-red-700 text-base leading-relaxed">
                  এই বইটি বর্তমানে উপলব্ধ নেই। শীঘ্রই নতুন কপি যোগ করা হবে।
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              ⚡ দ্রুত কার্যক্রম
            </h3>
            <div className="space-y-4">
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center px-6 py-4 border-2 border-green-300 rounded-xl hover:bg-green-50 transition-all transform hover:scale-105 font-semibold text-green-700 shadow-sm"
              >
                <Share2 className="h-5 w-5 mr-3" />
                📤 শেয়ার করুন
              </button>
              
              <button
                onClick={() => toast.info('এই ফিচারটি শীঘ্রই আসছে')}
                className="w-full flex items-center justify-center px-6 py-4 border-2 border-blue-300 rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105 font-semibold text-blue-700 shadow-sm"
              >
                <Bookmark className="h-5 w-5 mr-3" />
                🔖 বুকমার্ক করুন
              </button>
              
              <button
                onClick={() => navigate('/books')}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all transform hover:scale-105 font-semibold shadow-sm"
              >
                <Eye className="h-5 w-5 mr-3" />
                🔍 আরো বই দেখুন
              </button>
            </div>
          </div>

          {/* Book Information Summary */}
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              ℹ️ বইয়ের তথ্য
            </h3>
            <div className="space-y-4 text-base">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">📖 আইডি:</span>
                <span className="font-bold text-purple-600">#{book.id}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">📅 যোগ হয়েছে:</span>
                <span className="font-bold text-green-600">{formatDate(book.created_at)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">🔄 আপডেট:</span>
                <span className="font-bold text-blue-600">{formatDate(book.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsPage;
