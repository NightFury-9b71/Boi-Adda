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
import { apiServices } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import OptimizedImage from '../../components/OptimizedImage';

const BookDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();
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
      toast.success(t('messages.borrowRequestSent', { title: book.title }));
      
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
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-green-600 hover:text-green-700 font-medium transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        ফিরে যান
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Book Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Book Header */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Book Cover */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="relative">
                  <div className="w-56 h-80 bg-gray-100 rounded-lg overflow-hidden shadow-lg">
                    <OptimizedImage
                      publicId={book.cover_public_id || book.cover}
                      alt={book.title}
                      type="bookCover"
                      size="default"
                      className="w-full h-full object-cover"
                      placeholderText={book.title}
                    />
                  </div>
                  
                  {/* Availability Badge */}
                  <div className="absolute top-3 right-3">
                    {book.total_copies > 0 ? (
                      <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                        {book.total_copies} কপি আছে
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                        স্টকে নেই
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Book Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                  <div className="flex items-center text-lg text-gray-600 mb-4">
                    <User className="h-5 w-5 mr-2" />
                    <span>লেখক: {book.author}</span>
                  </div>
                </div>

                {/* Book Meta Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {category && (
                    <div className="flex items-center text-gray-600">
                      <Tag className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="font-medium">ক্যাটাগরি:</span>
                      <span className="ml-2 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm">
                        {category.name}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                    <span className="font-medium">প্রকাশ:</span>
                    <span className="ml-2">{book.published_year}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <FileText className="h-5 w-5 mr-2 text-orange-500" />
                    <span className="font-medium">পৃষ্ঠা:</span>
                    <span className="ml-2">{book.pages} পৃষ্ঠা</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2 text-green-500" />
                    <span className="font-medium">ধার:</span>
                    <span className="ml-2">{book.times_borrowed || 0} বার</span>
                  </div>
                </div>

                {/* Book Statistics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">বইটির পরিসংখ্যান</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{book.total_copies}</div>
                      <div className="text-sm text-gray-600">উপলব্ধ কপি</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{book.times_borrowed || 0}</div>
                      <div className="text-sm text-gray-600">মোট ধার</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{formatDate(book.created_at)}</div>
                      <div className="text-sm text-gray-600">যোগ করা হয়েছে</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Book Description/Additional Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">বই সম্পর্কে</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">
                "{book.title}" বইটি {book.author} এর লেখা একটি {category?.name || 'বই'}। 
                এই বইটি {book.published_year} সালে প্রকাশিত হয়েছে এবং এতে মোট {book.pages} পৃষ্ঠা রয়েছে।
                {book.times_borrowed > 0 && ` এই বইটি এ পর্যন্ত ${book.times_borrowed} বার ধার দেওয়া হয়েছে।`}
              </p>
              
              {category?.description && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-blue-800 font-medium">ক্যাটাগরি সম্পর্কে:</p>
                  <p className="text-blue-700 mt-1">{category.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reading Progress & Reviews (Future Feature) */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">পাঠক মতামত</h2>
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">এই ফিচারটি শীঘ্রই আসছে...</p>
              <p className="text-sm text-gray-500 mt-2">পাঠকরা শীঘ্রই এই বইটি সম্পর্কে মতামত দিতে পারবেন</p>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          {/* Borrow Action */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">বই ধার নিন</h3>
            
            {book.total_copies > 0 ? (
              <div className="space-y-4">
                {(() => {
                  const statusDisplay = getBorrowStatusDisplay();
                  if (statusDisplay) {
                    const IconComponent = statusDisplay.icon;
                    return (
                      <div className={`border rounded-lg p-4 ${statusDisplay.className}`}>
                        <div className="flex items-center">
                          <IconComponent className={`h-5 w-5 mr-2 ${statusDisplay.iconColor}`} />
                          <span className={`font-medium ${statusDisplay.textColor}`}>
                            {statusDisplay.text}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${statusDisplay.textColor.replace('800', '700')}`}>
                          {statusDisplay.description}
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <button
                        onClick={handleBorrowRequest}
                        disabled={isBorrowLoading}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isBorrowLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            অনুরোধ পাঠানো হচ্ছে...
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-5 w-5 mr-2" />
                            ধার নিন
                          </>
                        )}
                      </button>
                    );
                  }
                })()}
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center text-green-800 text-sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>{book.total_copies} কপি উপলব্ধ</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">স্টকে নেই</span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  এই বইটি বর্তমানে উপলব্ধ নেই
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">দ্রুত কার্যক্রম</h3>
            <div className="space-y-3">
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-4 w-4 mr-2" />
                শেয়ার করুন
              </button>
              
              <button
                onClick={() => toast.info('এই ফিচারটি শীঘ্রই আসছে')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Bookmark className="h-4 w-4 mr-2" />
                বুকমার্ক করুন
              </button>
              
              <button
                onClick={() => navigate('/books')}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                আরো বই দেখুন
              </button>
            </div>
          </div>

          {/* Book Information Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">বইয়ের তথ্য</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">আইডি:</span>
                <span className="font-medium">#{book.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">যোগ হয়েছে:</span>
                <span className="font-medium">{formatDate(book.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">আপডেট:</span>
                <span className="font-medium">{formatDate(book.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsPage;