#!/bin/bash

# Install dependencies
npm install

# Production build with explicit environment variables
# This ensures the correct API URL is used in production
echo "Building frontend for production..."

# Set the production API URL
export VITE_API_BASE_URL="https://boi-adda-backend.onrender.com"
echo "Using API URL: $VITE_API_BASE_URL"

# Build the project with the environment variable
VITE_API_BASE_URL="$VITE_API_BASE_URL" npm run build

echo "Frontend build completed successfully!"
echo "Built files are in the 'dist' directory"
