/**
 * Legacy Cloudinary service - now proxies to Supabase Storage
 * Maintained for backward compatibility
 */

import { storageService } from './storage';

// Re-export storage service as cloudinary service for backward compatibility
export default storageService;

// Export all methods
export const {
  uploadFile,
  uploadBookCover,
  uploadUserProfile,
  uploadUserCover,
  deleteBookCover,
  deleteUserProfile,
  deleteUserCover,
  getOptimizedUrl,
  getBookCoverUrl,
  getUserProfileUrl,
  getUserCoverUrl,
  validateFile,
} = storageService;
