/**
 * Cloudinary service for handling image uploads and optimization
 * Integrates with backend API for proper naming conventions
 */

import axios from 'axios';
import apiClient from '../api/apiClient';

// Configuration from environment variables
const cloudConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
};

// Validate configuration
if (!cloudConfig.cloudName || !cloudConfig.uploadPreset) {
  console.error('Missing Cloudinary configuration. Please check your environment variables.');
}

class CloudinaryService {
  constructor() {
    this.cloudName = cloudConfig.cloudName;
    this.uploadPreset = cloudConfig.uploadPreset;
    this.apiKey = cloudConfig.apiKey;
    this.apiBaseUrl = cloudConfig.apiBaseUrl;
  }

  /**
   * Upload image file (alias for uploadFile for compatibility)
   * @param {File} file - The file to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadImage(file, options = {}) {
    console.log('🔧 CloudinaryService.uploadImage called with:', {
      fileName: file?.name,
      fileSize: file?.size,
      options,
      cloudName: this.cloudName,
      uploadPreset: this.uploadPreset
    });

    try {
      const result = await this.uploadFile(file, options);
      console.log('✅ Upload successful:', result);
      return {
        success: true,
        publicId: result.publicId,
        secureUrl: result.url,
        url: result.url,
        width: result.width,
        height: result.height,
        format: result.format,
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
   * Upload file directly to Cloudinary (for frontend-only uploads)
   * @param {File} file - The file to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, options = {}) {
    console.log('📤 Starting uploadFile with:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      options,
      cloudName: this.cloudName,
      uploadPreset: this.uploadPreset
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

    if (!this.cloudName || !this.uploadPreset) {
      throw new Error('Missing Cloudinary configuration. Please check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET environment variables.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    
    // Add custom public_id if provided
    if (options.publicId) {
      formData.append('public_id', options.publicId);
    }
    
    // Add folder if provided
    if (options.folder) {
      formData.append('folder', options.folder);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
    console.log('🌐 Uploading to:', uploadUrl);

    try {
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('✅ Upload successful:', response.data);
      
      return {
        publicId: response.data.public_id,
        url: response.data.secure_url,
        width: response.data.width,
        height: response.data.height,
        format: response.data.format,
        bytes: response.data.bytes,
      };
    } catch (error) {
      console.error('💥 Cloudinary upload error:', error);
      if (error.response) {
        // Axios error with response
        const errorData = error.response.data;
        throw new Error(errorData.error?.message || `HTTP ${error.response.status}: Upload failed`);
      } else {
        // Network or other error
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
  }

  /**
   * Upload book cover via backend API (recommended)
   * @param {File} file - The file to upload
   * @param {number} bookId - Book ID
   * @returns {Promise<Object>} Upload result
   */
  async uploadBookCover(file, bookId) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post(`/books/upload-cover/${bookId}`, formData, {
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
      const response = await apiClient.delete(`/books/cover/${bookId}`);
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
   * Generate optimized URL for Cloudinary image
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Transformation options
   * @returns {string} Optimized URL
   */
  getOptimizedUrl(publicId, options = {}) {
    if (!publicId || !this.cloudName) {
      return '';
    }

    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto',
      format = 'auto',
      gravity = 'auto',
    } = options;

    let transformation = `q_${quality},f_${format}`;
    
    if (width && height) {
      transformation += `,w_${width},h_${height},c_${crop},g_${gravity}`;
    } else if (width) {
      transformation += `,w_${width}`;
    } else if (height) {
      transformation += `,h_${height}`;
    }

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformation}/${publicId}`;
  }

  /**
   * Get optimized book cover URL
   * @param {string} publicId - Cloudinary public ID
   * @param {string} size - Size preset ('thumbnail', 'medium', 'large')
   * @returns {string} Optimized URL
   */
  getBookCoverUrl(publicId, size = 'medium') {
    const sizeOptions = {
      thumbnail: { width: 100, height: 150 },
      small: { width: 200, height: 300 },
      medium: { width: 400, height: 600 },
      large: { width: 800, height: 1200 },
    };

    return this.getOptimizedUrl(publicId, {
      ...sizeOptions[size] || sizeOptions.medium,
      crop: 'fill',
      gravity: 'auto',
    });
  }

  /**
   * Get optimized user profile URL
   * @param {string} publicId - Cloudinary public ID
   * @param {string} size - Size preset ('thumbnail', 'small', 'medium', 'large')
   * @returns {string} Optimized URL
   */
  getUserProfileUrl(publicId, size = 'medium') {
    const sizeOptions = {
      thumbnail: { width: 40, height: 40 },
      small: { width: 80, height: 80 },
      medium: { width: 150, height: 150 },
      large: { width: 300, height: 300 },
    };

    return this.getOptimizedUrl(publicId, {
      ...sizeOptions[size] || sizeOptions.medium,
      crop: 'fill',
      gravity: 'face',
    });
  }

  /**
   * Get optimized user cover URL
   * @param {string} publicId - Cloudinary public ID
   * @param {string} size - Size preset ('small', 'medium', 'large')
   * @returns {string} Optimized URL
   */
  getUserCoverUrl(publicId, size = 'medium') {
    const sizeOptions = {
      small: { width: 600, height: 300 },
      medium: { width: 1200, height: 600 },
      large: { width: 1800, height: 900 },
    };

    return this.getOptimizedUrl(publicId, {
      ...sizeOptions[size] || sizeOptions.medium,
      crop: 'fill',
      gravity: 'auto',
    });
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
const cloudinaryService = new CloudinaryService();

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
} = cloudinaryService;

export default cloudinaryService;