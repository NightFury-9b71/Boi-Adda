import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../utils/toast';
import { 
  Search, 
  User, 
  Book, 
  Calendar, 
  AlertCircle, 
  RefreshCw,
  BookOpen,
  Users,
  BookMarked,
  HandMetal,

} from 'lucide-react';

import { apiServices } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';

const IssueBook = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBookCopy, setSelectedBookCopy] = useState(null);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [showBookDetails, setShowBookDetails] = useState(false);

  // Fetch users (members)
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: apiServices.admin.getUsers,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch books
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['books'],
    queryFn: apiServices.books.getBooks,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch available book copies when a book is selected
  const { data: availableCopies = [] } = useQuery({
    queryKey: ['book-copies', selectedBook?.id],
    queryFn: () => apiServices.bookCopies.getAvailableForBook(selectedBook.id),
    enabled: !!selectedBook,
    staleTime: 2 * 60 * 1000,
  });

  // Create borrow mutation
  const createBorrowMutation = useMutation({
    mutationFn: (issueData) => apiServices.admin.createIssue(issueData),
    onSuccess: () => {
      toast.success(t('admin.bookIssue.success'));
      resetForm();
      queryClient.invalidateQueries(['admin', 'borrows']);
      queryClient.invalidateQueries(['book-copies']);
    },
    onError: (error) => {
      toast.error(t('admin.bookIssue.error') + (error?.response?.data?.detail || t('common.unknownError')));
    }
  });

  // Filter active members
  const activeMembers = members.filter(member => 
    member.is_verified && member.role === 'member'
  );

  // Filter available books
  const availableBooks = books.filter(book => 
    book.total_copies > 0
  );

  // Filter members based on search
  const filteredMembers = activeMembers.filter(member => 
    member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.id.toString().includes(memberSearch)
  );

  // Filter books based on search
  const filteredBooks = availableBooks.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.isbn && book.isbn.toLowerCase().includes(searchTerm.toLowerCase())) ||
    book.id.toString().includes(searchTerm)
  );

  // Calculate return date (14 days from issue date) - only if not manually set
  useEffect(() => {
    if (issueDate && !returnDate) {
      const date = new Date(issueDate);
      date.setDate(date.getDate() + 14);
      setReturnDate(date.toISOString().split('T')[0]);
    }
  }, [issueDate]);

  // Auto-select first available copy when book is selected
  useEffect(() => {
    if (availableCopies.length > 0) {
      setSelectedBookCopy(availableCopies[0]);
    }
  }, [availableCopies]);

  const handleIssueBook = async () => {
    if (!selectedBook || !selectedMember || !selectedBookCopy) {
      toast.error(t('admin.bookIssue.selectBookAndMember'));
      return;
    }

    const borrowData = {
      user_id: selectedMember.id,
      book_copy_id: selectedBookCopy.id,
      due_date: returnDate ? new Date(returnDate + 'T23:59:59').toISOString() : null,
      notes: notes.trim() || undefined
    };

    createBorrowMutation.mutate(borrowData);
  };

  const resetForm = () => {
    setSelectedBook(null);
    setSelectedMember(null);
    setSelectedBookCopy(null);
    setSearchTerm('');
    setMemberSearch('');
    setNotes('');
  };

  // Calculate quick stats
  const stats = {
    totalMembers: activeMembers.length,
    totalBooks: availableBooks.length,
    availableCopies: books.reduce((sum, book) => sum + (book.total_copies || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.bookIssue.title')}</h1>
          <p className="text-gray-600 mt-2">{t('admin.bookIssue.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            queryClient.invalidateQueries(['admin', 'users']);
            queryClient.invalidateQueries(['books']);
          }}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.refresh')}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.bookIssue.stats.activeMembers')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.bookIssue.stats.availableBooks')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.bookIssue.stats.totalCopies')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.availableCopies}</p>
            </div>
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookMarked className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Book Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Book className="h-5 w-5 mr-2 text-green-600" />
            {t('admin.bookIssue.selectBook')}
          </h2>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.bookIssue.searchBookPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {selectedBook ? (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="h-16 w-12 bg-white rounded shadow-sm overflow-hidden">
                    {selectedBook.cover ? (
                      <img
                        src={selectedBook.cover}
                        alt={selectedBook.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-xs ${selectedBook.cover ? 'hidden' : 'flex'}`}>
                      BOOK
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{selectedBook.title}</h3>
                    <p className="text-sm text-gray-600">{t('common.author')}: {selectedBook.author}</p>
                    <p className="text-sm text-gray-500">{t('books.year')}: {selectedBook.published_year}</p>
                    <p className="text-sm text-green-600 font-medium">{t('admin.bookIssue.availableCopies')}: {selectedBook.total_copies}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedBook(null);
                    setSelectedBookCopy(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {booksLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">{t('admin.bookIssue.loadingBooks')}</p>
                </div>
              ) : filteredBooks.length > 0 ? (
                filteredBooks.map(book => (
                  <div
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="h-12 w-8 bg-white rounded shadow-sm overflow-hidden">
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
                        <div className={`w-full h-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-xs ${book.cover ? 'hidden' : 'flex'}`}>
                          B
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{book.title}</h3>
                        <p className="text-sm text-gray-600">{t('common.author')}: {book.author}</p>
                        <p className="text-xs text-green-600">{t('admin.bookIssue.available')}: {book.total_copies} {t('common.copies')}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? t('admin.bookIssue.noBooksFound') : t('admin.bookIssue.noAvailableBooks')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Member Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            {t('admin.bookIssue.selectMember')}
          </h2>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.bookIssue.searchMemberPlaceholder')}
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {selectedMember ? (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-white p-0.5 shadow-sm">
                    {selectedMember.profile_photo_url ? (
                      <img
                        src={selectedMember.profile_photo_url}
                        alt={selectedMember.name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold ${selectedMember.profile_photo_url ? 'hidden' : 'flex'}`}>
                      {selectedMember.name?.charAt(0) || t('profile.defaultInitial')}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedMember.name}</h3>
                    <p className="text-sm text-gray-600">{selectedMember.email}</p>
                    <p className="text-sm text-blue-600 font-medium">ID: #{selectedMember.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {membersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">{t('admin.bookIssue.loadingMembers')}</p>
                </div>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map(member => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-white p-0.5 shadow-sm">
                          {member.profile_photo_url ? (
                            <img
                              src={member.profile_photo_url}
                              alt={member.name}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs ${member.profile_photo_url ? 'hidden' : 'flex'}`}>
                            {member.name?.charAt(0) || t('profile.defaultInitial')}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{member.name}</h3>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-600 font-medium">ID: #{member.id}</p>
                        <p className="text-xs text-gray-500">
                          {member.is_verified ? t('status.active') : t('status.inactive')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {memberSearch ? t('admin.bookIssue.noMembersFound') : t('admin.bookIssue.noActiveMembers')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Issue Details */}
      {selectedBook && selectedMember && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-purple-600" />
            {t('admin.bookIssue.issueDetails')}
          </h2>
          
          {/* Selected Items Summary */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Book className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('admin.bookIssue.selectedBook')}</p>
                  <p className="font-medium text-gray-900">{selectedBook.title}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('admin.bookIssue.selectedMember')}</p>
                  <p className="font-medium text-gray-900">{selectedMember.name}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.bookIssue.issueDate')}</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.bookIssue.returnDate')}</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.bookIssue.notes')} ({t('common.optional')})</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('admin.bookIssue.notesPlaceholder')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={resetForm}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.reset')}
            </button>
            <button
              onClick={handleIssueBook}
              disabled={createBorrowMutation.isPending || !selectedBookCopy}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                createBorrowMutation.isPending || !selectedBookCopy
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {createBorrowMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('common.processing')}
                </div>
              ) : (
                <div className="flex items-center">
                  <HandMetal className="h-4 w-4 mr-2" />
                  {t('admin.bookIssue.issueBook')}
                </div>
              )}
            </button>
          </div>

          {!selectedBookCopy && selectedBook && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-700">
                  {t('admin.bookIssue.noAvailableCopies')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IssueBook;