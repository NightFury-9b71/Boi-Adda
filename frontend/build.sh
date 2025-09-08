#!/bin/bash

# Production build script for Render deployment
# This script ensures the correct API URL is used in production

echo "🚀 Building Boi Adda Frontend for Production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set production environment variable
echo "🌐 Setting production API URL..."
export VITE_API_BASE_URL="https://boi-adda-backend.onrender.com"
echo "   API URL: $VITE_API_BASE_URL"

# Build the project
echo "🔨 Building project..."
VITE_API_BASE_URL="$VITE_API_BASE_URL" npm run build

# Verify build
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Built files are in the 'dist' directory"
    echo "📊 Build size:"
    du -sh dist/
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi
