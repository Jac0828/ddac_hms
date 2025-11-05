#!/bin/bash

set -euo pipefail

echo "=========================================="
echo "Preparing Backend Deployment Package"
echo "=========================================="
echo ""

API_DIR="./HMS.Api"
OUTPUT_ZIP="hms-api-deploy.zip"

# Check if .NET SDK is available
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK not found. Please install .NET 8 SDK."
    exit 1
fi

echo "✅ .NET SDK found: $(dotnet --version)"
echo ""

# Navigate to API directory
if [ ! -d "$API_DIR" ]; then
    echo "❌ API directory not found: $API_DIR"
    exit 1
fi

cd "$API_DIR"

echo "== Cleaning previous builds =="
rm -rf publish
rm -f "$OUTPUT_ZIP"
echo "✅ Cleaned"
echo ""

echo "== Restoring NuGet packages =="
dotnet restore
echo "✅ Packages restored"
echo ""

echo "== Publishing API (Release configuration) =="
dotnet publish -c Release -o publish
echo "✅ API published"
echo ""

echo "== Creating deployment zip =="
cd publish
zip -r "../$OUTPUT_ZIP" . > /dev/null
cd ..
echo "✅ Deployment package created: $OUTPUT_ZIP"
echo ""

# Show zip file size
ZIP_SIZE=$(du -h "$OUTPUT_ZIP" | cut -f1)
echo "📦 Package size: $ZIP_SIZE"
echo ""

echo "=========================================="
echo "✅ Deployment package ready!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Go to AWS Console → Elastic Beanstalk"
echo "2. Select your environment"
echo "3. Click 'Upload and deploy'"
echo "4. Upload: $(pwd)/$OUTPUT_ZIP"
echo ""

