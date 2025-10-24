# Deployment Guide for Render

## Backend Deployment (boi-adda-backend)

### 1. Environment Variables on Render
Add these in your Render service dashboard:

```bash
DATABASE_URL=your_neon_postgresql_connection_string
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SECRET_KEY=your-super-secret-jwt-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=False
ENVIRONMENT=production
```

### 2. Build Command
```bash
pip install -r requirements.txt
```

### 3. Start Command
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

## Frontend Deployment (boi-adda)

### 1. Environment Variables on Render
Add these in your Render service dashboard:

```bash
VITE_API_BASE_URL=https://boi-adda-backend.onrender.com
VITE_CLOUDINARY_API_KEY=your_cloudinary_api_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 2. Build Command
```bash
npm ci && npm run build
```

### 3. Publish Directory
```
dist
```

## Common Issues & Solutions

### 1. CORS Error
✅ **Fixed**: Added production domains to CORS configuration in `backend/main.py`

### 2. Missing Favicon
✅ **Fixed**: Created `frontend/public/favicon.svg`

### 3. Database Connection
- Make sure your Neon database URL is correct
- Check if your database is in sleep mode (Neon free tier)
- Ensure connection string includes all required parameters

### 4. Environment Variables
- Double-check all environment variables are set correctly in Render
- Frontend variables must start with `VITE_`
- Backend variables should match your `.env.example`

## Database Setup (Neon)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project or use existing
3. Copy the connection string from dashboard
4. Format: `postgresql://username:password@host/database?sslmode=require`
5. Add this as `DATABASE_URL` in Render backend environment variables

## Testing Deployment

1. Check backend health: `https://boi-adda-backend.onrender.com/docs`
2. Check frontend: `https://boi-adda.onrender.com`
3. Test API calls from frontend to backend
4. Check browser console for any CORS errors

## Monitoring

- Check Render logs for both services
- Monitor database connections in Neon dashboard
- Use browser dev tools to debug frontend issues
