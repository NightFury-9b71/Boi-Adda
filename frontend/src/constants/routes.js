// Route constants for better maintainability and type safety
export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  
  // Unauthorized access
  UNAUTHORIZED_BOOKS: '/unauthorized/books',
  
  // Protected user routes
  HOME: '/',
  DASHBOARD: '/dashboard',
  BOOKS: '/books',
  BOOK_DETAILS: '/books/:id',
  DONATE: '/donate',
  HISTORY: '/history',
  PROFILE: '/profile',
  USER_PROFILE: '/profile/:userId',
  SEARCH: '/search',
  
  // Admin routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_BORROWS: '/admin/borrows',
  ADMIN_DONATIONS: '/admin/donations',
  ADMIN_BOOKS: '/admin/books',
  ADMIN_STATISTICS: '/admin/statistics',
  ADMIN_ISSUE: '/admin/issue',
  
  // Error pages
  NOT_FOUND: '*',
};

// Helper functions for dynamic routes
export const getBookDetailsRoute = (id) => `/books/${id}`;
export const getUserProfileRoute = (userId) => `/profile/${userId}`;

// Navigation menu items
export const USER_NAV_ITEMS = [
  { path: ROUTES.DASHBOARD, label: 'ড্যাশবোর্ড', icon: 'home' },
  { path: ROUTES.BOOKS, label: 'বই সমূহ', icon: 'book' },
  { path: ROUTES.DONATE, label: 'বই দান', icon: 'gift' },
  { path: ROUTES.HISTORY, label: 'ইতিহাস', icon: 'history' },
  { path: ROUTES.SEARCH, label: 'অনুসন্ধান', icon: 'search' },
  { path: ROUTES.PROFILE, label: 'প্রোফাইল', icon: 'user' },
];

export const ADMIN_NAV_ITEMS = [
  { path: ROUTES.ADMIN_DASHBOARD, label: 'ড্যাশবোর্ড', icon: 'home' },
  { path: ROUTES.ADMIN_USERS, label: 'ব্যবহারকারী', icon: 'users' },
  { path: ROUTES.ADMIN_BOOKS, label: 'বই ব্যবস্থাপনা', icon: 'book' },
  { path: ROUTES.ADMIN_BORROWS, label: 'ধার ব্যবস্থাপনা', icon: 'bookmark' },
  { path: ROUTES.ADMIN_DONATIONS, label: 'দান ব্যবস্থাপনা', icon: 'gift' },
  { path: ROUTES.ADMIN_ISSUE, label: 'বই প্রদান', icon: 'check' },
  { path: ROUTES.ADMIN_STATISTICS, label: 'পরিসংখ্যান', icon: 'chart' },
];