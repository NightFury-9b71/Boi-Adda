/**
 * Storage service for handling image uploads and optimization
 * Works with Supabase Storage via backend API
 */

import apiClient from '../api/apiClient';

// Configuration from environment variables
const storageConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
};

class StorageService {
  constructor() {
    this.apiBaseUrl = storageConfig.apiBaseUrl;
  }

  /**
   * Upload image file (alias for uploadFile for compatibility)
   * @param {File} file - The file to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadImage(file, options = {}) {
    console.log('🔧 StorageService.uploadImage called with:', {
      fileName: file?.name,
      fileSize: file?.size,
      options
    });

    try {
      const result = await this.uploadFile(file, options);
      console.log('✅ Upload successful:', result);
      return {
        success: true,
        publicId: result.publicId || result.url,
        secureUrl: result.url,
        url: result.url,
      };
    } catch (error) {
      console.error('❌ Upload failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload file via backend API
   * @param {File} file - The file to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, options = {}) {
    console.log('📤 Starting uploadFile with:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      options
    });

    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    // Determine the upload endpoint based on options
    let uploadEndpoint = '/images/upload'; // Default endpoint
    
    if (options.type === 'book-cover') {
      uploadEndpoint = `/images/upload-book-cover/${options.bookId}`;
    } else if (options.type === 'user-profile') {
      uploadEndpoint = '/users/me/upload-profile-image';
    } else if (options.type === 'user-cover') {
      uploadEndpoint = '/users/me/upload-cover-image';
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post(uploadEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Upload successful:', response.data);
      
      return {
        publicId: response.data.public_id || response.data.url,
        url: response.data.url || response.data.secureUrl || response.data.secure_url,
      };
    } catch (error) {
      console.error('💥 Upload error:', error);
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(errorData.detail || errorData.message || `HTTP ${error.response.status}: Upload failed`);
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
  }

  /**
   * Upload book cover via backend API
   * @param {File} file - The file to upload
   * @param {number} bookId - Book ID
   * @returns {Promise<Object>} Upload result
   */
  async uploadBookCover(file, bookId) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post(`/images/upload-book-cover/${bookId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Book cover upload error:', error);
      if (error.response) {
        throw new Error(error.response.data.detail || 'Upload failed');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
  }

  /**
   * Upload user profile image via backend API
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadUserProfile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/users/me/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Profile image upload error:', error);
      if (error.response) {
        throw new Error(error.response.data.detail || 'Upload failed');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
  }

  /**
   * Upload user cover image via backend API
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadUserCover(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/users/me/upload-cover-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Cover image upload error:', error);
      if (error.response) {
        throw new Error(error.response.data.detail || 'Upload failed');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
  }

  /**
   * Delete book cover via backend API
   * @param {number} bookId - Book ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteBookCover(bookId) {
    try {
      const response = await apiClient.delete(`/images/book-cover/${bookId}`);
      return response.data;
    } catch (error) {
      console.error('Book cover delete error:', error);
      if (error.response) {
        throw new Error(error.response.data.detail || 'Delete failed');
      } else {
        throw new Error(`Delete failed: ${error.message}`);
      }
    }
  }

  /**
   * Delete user profile image via backend API
   * @returns {Promise<Object>} Delete result
   */
  async deleteUserProfile() {
    try {
      const response = await apiClient.delete('/users/me/profile-image');
      return response.data;
    } catch (error) {
      console.error('Profile image delete error:', error);
      if (error.response) {
        throw new Error(error.response.data.detail || 'Delete failed');
      } else {
        throw new Error(`Delete failed: ${error.message}`);
      }
    }
  }

  /**
   * Delete user cover image via backend API
   * @returns {Promise<Object>} Delete result
   */
  async deleteUserCover() {
    try {
      const response = await apiClient.delete('/users/me/cover-image');
      return response.data;
    } catch (error) {
      console.error('Cover image delete error:', error);
      if (error.response) {
        throw new Error(error.response.data.detail || 'Delete failed');
      } else {
        throw new Error(`Delete failed: ${error.message}`);
      }
    }
  }

  /**
   * Get optimized URL for Supabase image
   * Supabase URLs are already optimized, so we just return the URL
   * @param {string} url - Supabase public URL
   * @param {Object} options - Transformation options (not used with Supabase)
   * @returns {string} Image URL
   */
  getOptimizedUrl(url, options = {}) {
    if (!url) {
      return '';
    }

    // Supabase Storage URLs are already public and optimized
    // Just return the URL as-is
    return url;
  }

  /**
   * Get optimized book cover URL
   * @param {string} url - Supabase public URL
   * @param {string} size - Size preset (ignored for Supabase)
   * @returns {string} Image URL
   */
  getBookCoverUrl(url, size = 'medium') {
    return this.getOptimizedUrl(url);
  }

  /**
   * Get optimized user profile URL
   * @param {string} url - Supabase public URL
   * @param {string} size - Size preset (ignored for Supabase)
   * @returns {string} Image URL
   */
  getUserProfileUrl(url, size = 'medium') {
    return this.getOptimizedUrl(url);
  }

  /**
   * Get optimized user cover URL
   * @param {string} url - Supabase public URL
   * @param {string} size - Size preset (ignored for Supabase)
   * @returns {string} Image URL
   */
  getUserCoverUrl(url, size = 'medium') {
    return this.getOptimizedUrl(url);
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateFile(file, options = {}) {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'] } = options;

    if (!file) {
      return { isValid: false, errors: ['No file selected'] };
    }

    const errors = [];

    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.');
    }

    if (file.size > maxSize) {
      errors.push('File size too large. Please select an image smaller than 5MB.');
    }

    return { 
      isValid: errors.length === 0, 
      errors,
      valid: errors.length === 0, // Legacy support
      error: errors.length > 0 ? errors[0] : null // Legacy support
    };
  }
}

// Export singleton instance
const storageService = new StorageService();

// Export convenient methods
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

export default storageService;
