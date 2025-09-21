# Cloudinary Integration Guide

This guide shows how to use the new Cloudinary image service throughout your application.

## Setup

1. **Environment Variables**: Add these to your `.env` file:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   VITE_CLOUDINARY_API_KEY=your_api_key_here
   VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here
   ```

2. **Cloudinary Dashboard Setup**:
   - Create an upload preset in your Cloudinary dashboard
   - Set it to "unsigned" for client-side uploads
   - Configure transformations and restrictions as needed

## Components

### 1. ImageUpload Component

Use this for uploading new images:

```jsx
import ImageUpload from '../components/ImageUpload';

function BookForm() {
  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    // Update your form state with result.publicId
    setBookData(prev => ({
      ...prev,
      cover_public_id: result.publicId
    }));
  };

  return (
    <ImageUpload
      onUploadSuccess={handleUploadSuccess}
      folder="book-covers" // Optional: organize uploads in folders
      placeholder="Upload book cover"
      maxSize={5 * 1024 * 1024} // 5MB
      allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
      transformations={{
        width: 300,
        height: 400,
        crop: 'fill'
      }}
    />
  );
}
```

### 2. OptimizedImage Component

Use this for displaying images with automatic optimization:

```jsx
import OptimizedImage from '../components/OptimizedImage';

// Book cover
<OptimizedImage
  publicId={book.cover_public_id}
  alt={book.title}
  type="bookCover"
  size="default" // or "small", "thumbnail"
  className="w-full h-full object-cover"
  placeholderText="Book Cover"
/>

// Profile image
<OptimizedImage
  publicId={user.profile_image_public_id}
  alt={user.name}
  type="profileImage"
  size="small"
  className="w-10 h-10 rounded-full"
  placeholderText={user.name?.charAt(0)}
/>

// Custom transformations
<OptimizedImage
  publicId={image.public_id}
  alt="Custom image"
  transformations={{
    width: 600,
    height: 400,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  }}
  className="w-full h-auto"
/>
```

## Direct Service Usage

```jsx
import cloudinaryService from '../services/cloudinary';

// Upload image
const uploadResult = await cloudinaryService.uploadImage(file, {
  folder: 'user-avatars',
  transformation: {
    width: 200,
    height: 200,
    crop: 'fill'
  }
});

if (uploadResult.success) {
  console.log('Public ID:', uploadResult.publicId);
  console.log('Secure URL:', uploadResult.secureUrl);
}

// Generate optimized URLs
const bookCoverUrl = cloudinaryService.getBookCoverUrl(publicId, 'small');
const profileUrl = cloudinaryService.getProfileImageUrl(publicId, 'thumbnail');

// Custom transformation
const customUrl = cloudinaryService.getOptimizedUrl(publicId, {
  width: 800,
  height: 600,
  crop: 'limit',
  quality: 'auto',
  format: 'webp'
});

// Validate file before upload
const validation = cloudinaryService.validateFile(file, {
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/jpeg', 'image/png']
});

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

## Database Schema Updates

Update your database models to include Cloudinary public IDs:

```sql
-- Books table
ALTER TABLE books ADD COLUMN cover_public_id VARCHAR(255);

-- Users table  
ALTER TABLE users ADD COLUMN profile_image_public_id VARCHAR(255);
```

## API Updates

Update your API endpoints to handle public IDs:

```python
# FastAPI example
class BookCreate(BaseModel):
    title: str
    author: str
    cover_public_id: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile_image_public_id: Optional[str] = None
```

## Migration Strategy

1. **Gradual Migration**: Keep existing URL fields alongside new public_id fields
2. **Fallback Logic**: Use public_id if available, fallback to URL
3. **Data Migration**: Script to upload existing images to Cloudinary

```jsx
// Example fallback in components
<OptimizedImage
  publicId={book.cover_public_id || book.cover} // Try public_id first, fallback to URL
  alt={book.title}
  type="bookCover"
/>
```

## Benefits

1. **Automatic Optimization**: Images are automatically optimized for web delivery
2. **Responsive Images**: Different sizes for different screen sizes
3. **Format Optimization**: Automatic WebP/AVIF delivery when supported
4. **CDN Delivery**: Global CDN for fast image loading
5. **Bandwidth Savings**: Reduced file sizes and faster loading
6. **Consistent API**: Same component interface for all image types

## Performance Tips

1. Use appropriate image sizes (thumbnail, small, default)
2. Let Cloudinary handle format optimization (format: 'auto')
3. Use quality: 'auto' for automatic quality optimization
4. Implement lazy loading for better performance
5. Use folders to organize uploads (book-covers, user-avatars, etc.)

## Security

1. Use unsigned upload presets for client-side uploads
2. Set up transformation restrictions in Cloudinary dashboard
3. Implement file size and type validation
4. Consider server-side uploads for sensitive operations