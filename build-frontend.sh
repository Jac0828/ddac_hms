#!/bin/bash

set -euo pipefail

# Check if API URL is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <BACKEND_API_URL>"
    echo ""
    echo "Example:"
    echo "  $0 http://hms-ddac-env.us-east-1.elasticbeanstalk.com"
    echo ""
    exit 1
fi

API_URL="$1"
FRONTEND_DIR="./hms-client"

echo "=========================================="
echo "Building Frontend for Production"
echo "=========================================="
echo ""
echo "API URL: $API_URL"
echo ""

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js and npm."
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

cd "$FRONTEND_DIR"

echo "== Installing dependencies =="
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Dependencies already installed"
fi
echo ""

echo "== Creating production environment file =="
echo "REACT_APP_API_BASE_URL=$API_URL" > .env.production
echo "✅ Created .env.production"
echo "   Content: REACT_APP_API_BASE_URL=$API_URL"
echo ""

echo "== Building for production =="
npm run build:prod
echo ""

if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build | cut -f1)
    echo "✅ Build completed successfully!"
    echo "📦 Build size: $BUILD_SIZE"
    echo "📁 Build directory: $(pwd)/build"
    echo ""
    echo "=========================================="
    echo "✅ Frontend build ready!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Go to AWS Console → S3"
    echo "2. Create a bucket (or use existing)"
    echo "3. Upload ALL files from: $(pwd)/build"
    echo "4. Create CloudFront distribution pointing to S3 bucket"
    echo "5. Update backend CORS__AllowedOrigins with CloudFront URL"
    echo ""
else
    echo "❌ Build directory not found. Build may have failed."
    exit 1
fi

