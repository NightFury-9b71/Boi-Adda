// API Endpoints
const API_ENDPOINTS = {

  DATABASE: {
    STATS: '/database/stats',
  },
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/signin',
    REGISTER: '/auth/signup',
    ME: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  // Book endpoints
  BOOKS: {
    LIST: '/books',
    DETAIL: (id) => `/books/${id}`,
    CREATE: '/books',
    UPDATE: (id) => `/books/${id}`,
    DELETE: (id) => `/books/${id}`,
    SEARCH: '/books/search',
  },
  // Book Copy endpoints  
  BOOK_COPIES: {
    LIST: '/book-copies',
    DETAIL: (id) => `/book-copies/${id}`,
    AVAILABLE_FOR_BOOK: (bookId) => `/book-copies/book/${bookId}/available`,
  },
  // Category endpoints
  CATEGORIES: {
    LIST: '/categories',
    DETAIL: (id) => `/categories/${id}`,
    CREATE: '/categories',
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },
  // Borrow endpoints
  BORROWS: {
    LIST: '/borrows',
    CREATE: '/borrows',
    HISTORY: '/borrows/history',
  },
  // Donation endpoints
  DONATIONS: {
    LIST: '/donations',
    CREATE: '/donations',
    HISTORY: '/donations/history',
  },
  // User endpoints
  USERS: {
    PROFILE: (userId) => `/users/${userId}`,
    UPDATE_PROFILE: '/users/me',
    STATS: '/users/me/stats',
  },
  // Admin endpoints
  ADMIN: {
    DASHBOARD_STATS: '/admin/dashboard/stats',
    STATS_OVERVIEW: '/admin/stats/overview',
    STATS_USERS: '/admin/stats/users',
    STATS_BOOKS: '/admin/stats/books',
    STATS_BORROWS: '/admin/stats/borrows',
    STATS_DONATIONS: '/admin/stats/donations',
    STATS_TRENDS: '/admin/stats/trends',
    STATS_USER_ACTIVITY: '/admin/stats/user-activity',
    USERS: '/admin/users',
    UPDATE_USER_ROLE: (userId) => `/admin/users/${userId}/role`,
    UPDATE_USER_STATUS: (userId) => `/admin/users/${userId}/status`,
    DELETE_USER: (userId) => `/admin/users/${userId}`,
    ISSUE_BOOK: '/admin/issue',
    BORROW_REQUESTS: '/admin/borrows',
    APPROVE_BORROW: (borrowId) => `/admin/borrows/${borrowId}/approve`,
    HANDOVER_BOOK: (borrowId) => `/admin/borrows/${borrowId}/handover`,
    REJECT_BORROW: (borrowId) => `/admin/borrows/${borrowId}/reject`,
    RETURN_BOOK: (borrowId) => `/admin/borrows/${borrowId}/return`,
    DONATION_REQUESTS: '/admin/donations',
    APPROVE_DONATION: (donationId) => `/admin/donations/${donationId}/approve`,
    COMPLETE_DONATION: (donationId) => `/admin/donations/${donationId}/complete`,
    REJECT_DONATION: (donationId) => `/admin/donations/${donationId}/reject`,
    USER_BORROWS: (userId) => `/admin/borrows/user/${userId}`,
    USER_DONATIONS: (userId) => `/admin/donations/user/${userId}`,
    RESET_USER_CREDENTIALS: (userId) => `/admin/users/${userId}/reset-credentials`,
  },
};

export default API_ENDPOINTS;