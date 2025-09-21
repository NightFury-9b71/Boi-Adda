import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import cloudinaryService from '../services/cloudinary';

const OptimizedImage = ({
  publicId,
  alt = '',
  size = 'default',
  type = 'general', // 'bookCover', 'userProfile', 'userCover', 'profileImage', 'general'
  transformations = {},
  fallbackSrc = null,
  className = '',
  placeholder = true,
  placeholderText = 'No Image',
  onLoad = null,
  onError = null,
  ...props
}) => {
  const [imageState, setImageState] = useState({
    loading: true,
    error: false,
    loaded: false,
  });

  // Generate optimized URL based on type and size
  const getImageUrl = () => {
    if (!publicId) return fallbackSrc || '';

    switch (type) {
      case 'bookCover':
        return cloudinaryService.getBookCoverUrl(publicId, size);
      case 'profileImage':
        return cloudinaryService.getUserProfileUrl(publicId, size);
      case 'userProfile':
        return cloudinaryService.getUserProfileUrl(publicId, size);
      case 'userCover':
        return cloudinaryService.getUserCoverUrl(publicId, size);
      default:
        return cloudinaryService.getOptimizedUrl(publicId, transformations);
    }
  };

  const imageUrl = getImageUrl();

  // Handle image load
  const handleLoad = (e) => {
    setImageState({
      loading: false,
      error: false,
      loaded: true,
    });
    onLoad?.(e);
  };

  // Handle image error
  const handleError = (e) => {
    setImageState({
      loading: false,
      error: true,
      loaded: false,
    });
    onError?.(e);
  };

  // Show placeholder if no image or error
  if (!imageUrl || imageState.error) {
    if (!placeholder) return null;

    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        {...props}
      >
        <div className="text-center">
          <ImageIcon className="h-6 w-6 mx-auto mb-1" />
          <p className="text-xs">{placeholderText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading placeholder */}
      {imageState.loading && placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="text-center text-gray-400">
            <ImageIcon className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs">Loading...</p>
          </div>
        </div>
      )}

      {/* Main image */}
      <img
        src={imageUrl}
        alt={alt}
        className={`${imageState.loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;