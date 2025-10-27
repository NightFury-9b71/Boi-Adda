import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, User, Calendar } from 'lucide-react';
import { apiServices } from '../../api';;

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);

  // API call to search books
  const { data: searchResults = [], isLoading, error } = useQuery({
    queryKey: ['searchBooks', query],
    queryFn: () => apiServices.books.searchBooks(query),
    enabled: !!query,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput)}`);
    }
  };

  const handleBookClick = (bookId) => {
    navigate(`/books/${bookId}`);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('books.searchTitle')}</h1>
            {query && (
              <p className="text-gray-600 mt-1">
                {t('books.searchResultsFor', { query })}
              </p>
            )}
          </div>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('books.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </form>
        </div>
      </div>

      {/* Search Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {!query ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">{t('books.searchInstruction')}</p>
          </div>
        ) : isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                  <div className="h-16 w-12 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-red-500">{t('books.searchError')}</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">{t('books.noResultsFor', { query })}</p>
            <p className="text-sm text-gray-400 mt-1">
              {t('books.searchSuggestion')}
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {t('books.booksFound', { count: searchResults.length })}
              </p>
            </div>
            
            <div className="space-y-4">
              {searchResults.map((book) => (
                <div
                  key={book.id}
                  onClick={() => handleBookClick(book.id)}
                  className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 cursor-pointer transition-all"
                >
                  <div className="h-16 w-12 bg-gradient-to-br from-green-100 to-green-200 rounded flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{book.title}</h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>{book.author}</span>
                      </div>
                      {book.publication_year && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{book.publication_year}</span>
                        </div>
                      )}
                    </div>
                    {book.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {book.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      book.total_copies > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {book.total_copies > 0 ? t('books.available') : t('books.unavailable')}
                    </span>
                    {book.total_copies > 0 && (
                      <span className="text-xs text-gray-500">
                        {book.total_copies} {t('books.copies')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
