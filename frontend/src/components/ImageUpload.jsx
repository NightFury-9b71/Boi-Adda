import { useState, useRef, useCallback } from 'react';
import { Upload, X, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import cloudinaryService from '../services/cloudinary';

const ImageUpload = ({
  onUploadSuccess,
  onUploadError,
  folder = '',
  maxSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className = '',
  placeholder = 'Click to upload or drag and drop',
  showPreview = true,
  transformations = {},
  required = false,
  disabled = false,
  value = null, // For controlled component
}) => {
  const [uploadState, setUploadState] = useState({
    uploading: false,
    preview: value || null,
    progress: 0,
    error: null,
    success: false,
  });

  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFileSelect = useCallback(async (file) => {
    if (!file || disabled) return;

    console.log('📁 File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file
    const validation = cloudinaryService.validateFile(file, {
      maxSize,
      allowedTypes,
    });

    console.log('🔍 Validation result:', validation);

    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      console.error('❌ Validation failed:', errorMessage);
      setUploadState(prev => ({
        ...prev,
        error: errorMessage,
        success: false,
      }));
      onUploadError?.(errorMessage);
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    console.log('🖼️ Preview URL created:', previewUrl);
    setUploadState(prev => ({
      ...prev,
      preview: previewUrl,
      uploading: true,
      error: null,
      success: false,
      progress: 0,
    }));

    try {
      // Upload to Cloudinary
      const uploadOptions = {
        folder,
        transformation: transformations,
      };

      console.log('☁️ Starting Cloudinary upload with options:', uploadOptions);
      const result = await cloudinaryService.uploadImage(file, uploadOptions);
      console.log('📤 Upload result:', result);

      if (result.success) {
        setUploadState(prev => ({
          ...prev,
          uploading: false,
          success: true,
          progress: 100,
          error: null,
        }));

        // Call success callback
        onUploadSuccess?.({
          publicId: result.publicId,
          secureUrl: result.secureUrl,
          url: result.url,
          width: result.width,
          height: result.height,
          format: result.format,
          originalFile: file,
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        error: error.message || 'Upload failed',
        success: false,
        progress: 0,
      }));
      onUploadError?.(error.message || 'Upload failed');
    }
  }, [folder, maxSize, allowedTypes, transformations, disabled, onUploadSuccess, onUploadError]);

  // Handle file input change
  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Clear upload
  const handleClear = () => {
    if (uploadState.preview && uploadState.preview.startsWith('blob:')) {
      URL.revokeObjectURL(uploadState.preview);
    }
    setUploadState({
      uploading: false,
      preview: null,
      progress: 0,
      error: null,
      success: false,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Click to upload
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${dragActive 
            ? 'border-green-400 bg-green-50' 
            : uploadState.error 
              ? 'border-red-300 bg-red-50' 
              : uploadState.success 
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Upload Content */}
        {!uploadState.preview ? (
          <div className="space-y-3">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
              uploadState.error 
                ? 'bg-red-100' 
                : uploadState.success 
                  ? 'bg-green-100' 
                  : 'bg-gray-100'
            }`}>
              {uploadState.error ? (
                <AlertCircle className="h-6 w-6 text-red-600" />
              ) : uploadState.success ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <Upload className="h-6 w-6 text-gray-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{placeholder}</p>
              <p className="text-xs text-gray-500 mt-1">
                {allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to {formatFileSize(maxSize)}
              </p>
            </div>
          </div>
        ) : showPreview ? (
          <div className="relative">
            <img
              src={uploadState.preview}
              alt="Preview"
              className="max-h-48 mx-auto rounded-lg shadow-sm"
            />
            {!uploadState.uploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <ImageIcon className="h-12 w-12 text-green-600 mx-auto" />
            <p className="text-sm font-medium text-green-900">Image uploaded successfully!</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Upload different image
            </button>
          </div>
        )}

        {/* Upload Progress */}
        {uploadState.uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
              {uploadState.progress > 0 && (
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadState.error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{uploadState.error}</p>
        </div>
      )}

      {/* Success Message */}
      {uploadState.success && !uploadState.error && (
        <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">Image uploaded successfully!</p>
        </div>
      )}

      {/* File Info */}
      {uploadState.preview && !uploadState.uploading && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
          <p>Ready to upload • Click to change image</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;