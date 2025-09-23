# Timezone Configuration for Bangladesh and Render Deployment

This project now uses timezone-aware datetime operations to ensure consistency between local development in Bangladesh (UTC+6) and production deployment on Render (UTC).

## Bangladesh Timezone Context:

- **Bangladesh Standard Time (BST)**: UTC+6
- **Local Development**: Likely running in Bangladesh timezone
- **Render Production**: Runs in UTC timezone
- **Database Storage**: Always UTC for consistency
- **Frontend Display**: Can show Bangladesh time to users

## Key Changes Made:

1. **Created `timezone_utils.py`** - Centralized timezone handling
   - All datetime operations now use UTC timezone for database storage
   - Bangladesh-specific functions for local time display
   - Consistent `utc_now()` function replaces `datetime.now()` and `datetime.utcnow()`
   - Helper functions for UTC ↔ Bangladesh timezone conversion

2. **Updated all backend files** to use timezone-aware datetime:
   - `models.py` - Database model timestamps (stored in UTC)
   - `auth.py` - JWT token expiration (UTC-based)
   - `routers/users.py` - User update timestamps (stored in UTC)
   - `routers/admin.py` - Admin operation timestamps (stored in UTC)
   - `migrate_images_to_cloudinary.py` - Migration timing

3. **Environment Configuration**:
   - `TIMEZONE=UTC` - Database storage timezone
   - `DISPLAY_TIMEZONE=Asia/Dhaka` - For frontend display
   - `BANGLADESH_OFFSET=+06:00` - Quick reference
   - All timestamps stored in UTC in database
   - Consistent behavior between Bangladesh development and Render deployment

## For Render Deployment:

Set these environment variables in your Render service:
```
TIMEZONE=UTC
DISPLAY_TIMEZONE=Asia/Dhaka
BANGLADESH_OFFSET=+06:00
CLOUDINARY_CLOUD_NAME=dlsciizta
CLOUDINARY_API_KEY=884462184599787
CLOUDINARY_API_SECRET=grhqP7_cIKG8yiv6t3_RJRjhvMs
DATABASE_URL=<your-render-postgres-url>
SECRET_KEY=<your-production-secret-key>
```

## Benefits:

- ✅ No more timezone discrepancies between Bangladesh (UTC+6) and Render (UTC)
- ✅ JWT tokens expire consistently regardless of server timezone
- ✅ Database timestamps are always in UTC
- ✅ Easy to convert to Bangladesh time for display in frontend
- ✅ Compliant with international deployment best practices
- ✅ Users see familiar Bangladesh times in the UI

## Bangladesh-Specific Usage Examples:

```python
from timezone_utils import (
    utc_now, 
    bangladesh_now, 
    utc_to_bangladesh, 
    format_datetime_for_bangladesh,
    get_timezone_info
)

# Get current times
utc_time = utc_now()                    # For database storage
bangladesh_time = bangladesh_now()      # For display

# Convert UTC to Bangladesh time for frontend
utc_timestamp = utc_now()
bangladesh_display = utc_to_bangladesh(utc_timestamp)

# Format for Bangladesh users
formatted = format_datetime_for_bangladesh(utc_timestamp)
# Output: "2025-09-23 10:47:37 BST" (if UTC was 04:47:37)

# Get comprehensive timezone info
timezone_info = get_timezone_info()
print(timezone_info)
# {
#     "utc_time": "2025-09-23 04:47:37+00:00",
#     "bangladesh_time": "2025-09-23 10:47:37+06:00",
#     "offset": "+06:00",
#     "timezone_name": "Bangladesh Standard Time (BST)",
#     ...
# }
```

## Frontend Integration:

In your React frontend, you can receive UTC timestamps from the API and convert them to Bangladesh time for display:

```javascript
// In your frontend (React)
const formatToBangladeshTime = (utcTimestamp) => {
  const date = new Date(utcTimestamp);
  return date.toLocaleString('en-BD', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

The timezone issue is now fully resolved for Bangladesh users! 🇧🇩 🎉