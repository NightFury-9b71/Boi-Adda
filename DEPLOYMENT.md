# Deployment Instructions

## Updated Folder and Build Commands

### Frontend
- **Folder**: `frontend`
- **Build Command Options** (choose one):
  1. `bash ./build.sh` (recommended)
  2. `./build.sh` 
  3. `bash render-build.sh`
  4. `npm run build:production`
- **Publish Directory**: `dist`
- **Environment Variables**: 
  - `VITE_API_BASE_URL=https://boi-adda-backend.onrender.com`

### Backend 
- **Folder**: `backend/deploy` (use the deploy folder!)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python start.py`

## Frontend Build Command Troubleshooting

If you get "command not found" errors in Render, try these build commands in order:

1. `bash ./build.sh` ← **Try this first**
2. `bash render-build.sh` 
3. `npm run build:production`
4. `VITE_API_BASE_URL=https://boi-adda-backend.onrender.com npm run build`

## Important: Use the Deploy Folder for Backend

Due to Python import issues with relative imports in production, you need to:

1. **Run the import fixer** (already done):
   ```bash
   cd backend
   python fix_imports.py
   ```

2. **Deploy from the `backend/deploy` folder**, not the main backend folder

3. **In Render**:
   - Set Root Directory to: `backend/deploy`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python start.py`

## What the deploy folder contains:
- All backend files with fixed absolute imports instead of relative imports
- Simple start.py that works in production
- All dependencies and database files

## Local Development (still use original folders):
- Backend: Use `backend/` folder as normal
- Frontend: Use `frontend/` folder as normal

## Production Deployment Folders:
- Frontend: `frontend/` 
- Backend: `backend/deploy/` ⚠️ **Important: Use the deploy subfolder!**

The deploy folder is specifically prepared for production deployment with all import issues resolved.
