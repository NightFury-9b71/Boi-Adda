# Deployment Guide for Render

## Backend Deployment

### 1. Create a new Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `boi-adda-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `python start_server.py`
   - **Instance Type**: `Free`

### 2. Environment Variables (Backend)

Add these environment variables in Render:

```
PYTHON_VERSION=3.11.0
DATABASE_URL=sqlite:///boi_adda.db
FRONTEND_URL=https://boi-add.onrender.com
```

For PostgreSQL (optional):
```
DATABASE_URL=postgresql://username:password@hostname:port/database_name
```

### 3. Backend Features
- Automatic HTTPS
- Auto-deploys on git push
- SQLite database (persistent storage)
- CORS configured for frontend

## Frontend Deployment

### 1. Create a new Static Site on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Static Site"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `boi-adda-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

### 2. Environment Variables (Frontend)

Add these environment variables in Render:

```
```
VITE_API_BASE_URL=https://boi-add-backend.onrender.com
```

Set `VITE_API_BASE_URL` to your backend URL
3. Deploy and test
```

### 3. Frontend Features
- Automatic HTTPS
- CDN distribution
- Auto-deploys on git push
- Optimized builds with Vite
- Custom book icon favicon
- Bengali language support

## Deployment Steps

### Step 1: Deploy Backend First
1. Create backend web service on Render
2. Note the backend URL (e.g., `https://boi-add-backend.onrender.com`)
3. Wait for deployment to complete

### Step 2: Deploy Frontend
1. Create frontend static site on Render
2. Set `VITE_API_BASE_URL` to your backend URL
3. Deploy and test

### Step 3: Update CORS
1. Go back to backend service
2. Add frontend URL to `FRONTEND_URL` environment variable
3. Redeploy backend

## Important Notes

### Free Tier Limitations
- Services sleep after 15 minutes of inactivity
- 750 hours per month limit
- Slower cold starts (30s+ for sleeping services)

### Database Considerations
- SQLite: Simple, file-based, included
- PostgreSQL: More robust, requires setup

### Production Optimizations
- Database connection pooling
- Caching strategies
- Error monitoring
- Logging setup

## Testing Deployment

1. Test backend: `https://boi-add-backend.onrender.com/docs`
2. Test frontend: `https://boi-add.onrender.com`
3. Check browser console for any API connection issues
4. Verify CORS is working correctly

## Troubleshooting

### Common Issues
1. **CORS errors**: Check environment variables and redeploy
2. **Database errors**: Ensure DATABASE_URL is set correctly
3. **Build failures**: Check dependency versions
4. **API connection issues**: Verify VITE_API_BASE_URL

### Logs
- Backend logs: Available in Render dashboard
- Frontend logs: Check browser console
- Build logs: Available during deployment

## Environment Variables Summary

### Backend (.env)
```
DATABASE_URL=sqlite:///boi_adda.db
FRONTEND_URL=https://boi-add.onrender.com
PORT=8000
```

### Frontend (.env)
```
VITE_API_BASE_URL=https://boi-add-backend.onrender.com
```
