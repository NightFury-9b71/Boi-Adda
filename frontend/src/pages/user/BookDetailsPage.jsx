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
import { toast } from '../../utils/toast';
import { getSafeDate, getSafeNumber, getSafeString } from '../../utils/dataHelpers';
import { apiServices } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useTranslation } from '../../hooks/useTranslation';
import OptimizedImage from '../../components/OptimizedImage';

const BookDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { confirmSubmit } = useConfirmation();
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
      // API returns book_id directly in the borrow object
      const borrowBookId = borrow.book_id;
      const isActiveStatus = ['pending', 'approved', 'collected', 'return_requested'].includes(borrow.status);
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
          text: t('bookDetails.borrowStatus.pending'),
          description: t('bookDetails.borrowStatus.pendingDesc'),
          className: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          icon: Clock
        };
      case 'approved':
        return {
          text: t('bookDetails.borrowStatus.approved'),
          description: t('bookDetails.borrowStatus.approvedDesc'),
          className: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          icon: CheckCircle
        };
      case 'collected':
        return {
          text: t('bookDetails.borrowStatus.collected'),
          description: t('bookDetails.borrowStatus.collectedDesc'),
          className: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          icon: CheckCircle
        };
      case 'return_requested':
        return {
          text: t('bookDetails.borrowStatus.returnRequested'),
          description: t('bookDetails.borrowStatus.returnRequestedDesc'),
          className: 'bg-purple-50 border-purple-200',
          textColor: 'text-purple-800',
          iconColor: 'text-purple-600',
          icon: Clock
        };
      default:
        return null;
    }
  };

  const handleBorrowRequest = async () => {
    try {
      if (!user) {
        toast.error(t('bookDetails.loginToBorrow'));
        navigate('/login');
        return;
      }

      // Check if user already has an active borrow for this book
      if (hasActiveBorrowForBook()) {
        toast.error(t('bookDetails.alreadyRequested'));
        return;
      }

      // Check if book has available copies
      if (!book.available_copies || book.available_copies === 0) {
        toast.error(t('bookDetails.noCopiesAvailable'));
        return;
      }

      // Show confirmation modal
      const confirmed = await confirmSubmit(
        t('bookDetails.borrowConfirmTitle'),
        t('bookDetails.borrowConfirmMessage', { title: book.title }),
        t('bookDetails.borrowConfirmYes'),
        t('bookDetails.borrowConfirmCancel')
      );

      if (!confirmed) {
        return; // User cancelled
      }

      setIsBorrowLoading(true);

      // Create borrow request with just book_id (backend handles finding available copy)
      const borrowData = {
        book_id: book.id
      };

      await apiServices.borrows.createBorrow(borrowData);
      toast.success(t('bookDetails.borrowSuccess'));
      
      // Refresh the user's borrows and stats to update the UI
      queryClient.invalidateQueries(['userBorrows', user.id]);
      queryClient.invalidateQueries(['userStats']);
      queryClient.invalidateQueries(['books']);
      queryClient.invalidateQueries(['book', id]);
    } catch (error) {
      console.error('Borrow request error:', error);
      
      // Get detailed error message
      let errorMessage = t('bookDetails.unknownError');
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`${t('bookDetails.borrowRequestError')}: ${errorMessage}`);
    } finally {
      setIsBorrowLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common.unknown');
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('common.unknown');
      
      // Use locale-appropriate date formatting
      return date.toLocaleDateString();
    } catch {
      return t('common.unknown');
    }
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
        toast.success(t('bookDetails.linkCopied'));
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast.error(t('bookDetails.shareError'));
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('bookDetails.bookNotFound')}</h3>
          <p className="text-gray-600 mb-6">
            {t('bookDetails.bookNotFoundDesc')}
          </p>
          <button
            onClick={() => navigate('/books')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            {t('bookDetails.backToLibrary')}
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
        {t('bookDetails.back')}
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
                  <div className="w-56 h-80 bg-gray-100 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
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
                    <div 
                      className="flex flex-col items-center justify-center text-gray-400 p-4" 
                      style={{display: (book.cover || book.cover_image_url) ? 'none' : 'flex'}}
                    >
                      <BookOpen className="h-16 w-16 mb-2" />
                      <span className="text-sm text-center">{book.title}</span>
                    </div>
                  </div>
                  
                  {/* Availability Badge */}
                  <div className="absolute top-3 right-3">
                    {book.available_copies > 0 ? (
                      <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                        {book.available_copies} {t('bookDetails.availableCopies')}
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                        {t('bookDetails.outOfStock')}
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
                    <span>{t('bookDetails.author')}: {book.author}</span>
                  </div>
                </div>

                {/* Book Meta Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {category && (
                    <div className="flex items-center text-gray-600">
                      <Tag className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="font-medium">{t('bookDetails.category')}:</span>
                      <span className="ml-2 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm">
                        {category.name}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                    <span className="font-medium">{t('bookDetails.published')}:</span>
                    <span className="ml-2">{book.published_year}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <FileText className="h-5 w-5 mr-2 text-orange-500" />
                    <span className="font-medium">{t('bookDetails.pages')}:</span>
                    <span className="ml-2">{book.pages} {t('bookDetails.pages')}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2 text-green-500" />
                    <span className="font-medium">{t('bookDetails.borrowed')}:</span>
                    <span className="ml-2">{book.times_borrowed || 0} {t('common.of')} {t('bookDetails.borrowed')}</span>
                  </div>
                </div>

                {/* Book Statistics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{t('bookDetails.bookStatistics')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{book.available_copies}</div>
                      <div className="text-sm text-gray-600">{t('bookDetails.availableCopies')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{book.times_borrowed || 0}</div>
                      <div className="text-sm text-gray-600">{t('bookDetails.totalBorrows')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{formatDate(book.created_at)}</div>
                      <div className="text-sm text-gray-600">{t('bookDetails.added')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Book Description/Additional Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('bookDetails.aboutBook')}</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {t('bookDetails.aboutBookDesc', {
                  title: book.title,
                  author: book.author,
                  category: category?.name || t('common.unknownBook'),
                  year: book.published_year,
                  pages: book.pages,
                  borrowedInfo: book.times_borrowed > 0 ? ` This book has been borrowed ${book.times_borrowed} times so far.` : ''
                })}
              </p>
              
              {category?.description && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-blue-800 font-medium">{t('bookDetails.aboutCategory')}:</p>
                  <p className="text-blue-700 mt-1">{category.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reading Progress & Reviews (Future Feature) */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('bookDetails.readerReviews')}</h2>
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('bookDetails.comingSoon')}</p>
              <p className="text-sm text-gray-500 mt-2">{t('bookDetails.reviewsComingSoon')}</p>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          {/* Borrow Action */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('bookDetails.borrowBook')}</h3>
            
            {book.available_copies > 0 ? (
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
                            {t('bookDetails.sendingRequest')}
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-5 w-5 mr-2" />
                            {t('bookDetails.borrow')}
                          </>
                        )}
                      </button>
                    );
                  }
                })()}
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center text-green-800 text-sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>{book.available_copies} {t('bookDetails.availableCopies')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">{t('bookDetails.outOfStock')}</span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  {t('bookDetails.noCopiesAvailable')}
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('bookDetails.quickActions')}</h3>
            <div className="space-y-3">
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t('bookDetails.share')}
              </button>
              
              <button
                onClick={() => toast.info(t('bookDetails.comingSoon'))}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Bookmark className="h-4 w-4 mr-2" />
                {t('bookDetails.bookmark')}
              </button>
              
              <button
                onClick={() => navigate('/books')}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                {t('bookDetails.viewMoreBooks')}
              </button>
            </div>
          </div>

          {/* Book Information Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('bookDetails.bookInformation')}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('bookDetails.id')}:</span>
                <span className="font-medium">#{book.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('bookDetails.added')}:</span>
                <span className="font-medium">{formatDate(book.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsPage;