#!/bin/bash

echo "=========================================="
echo "HMS AWS Deployment - Complete Setup"
echo "=========================================="
echo ""

# Add Python bin paths
export PATH="$HOME/.local/bin:$HOME/Library/Python/3.13/bin:$PATH"

# Step 1: Check AWS CLI
echo "Step 1: Checking AWS CLI..."
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    brew install awscli
fi

echo "✅ AWS CLI: $(aws --version 2>&1 | head -1)"
echo ""

# Step 2: Check AWS Configuration
echo "Step 2: Checking AWS Configuration..."
if ! aws sts get-caller-identity --region us-east-1 &>/dev/null; then
    echo "⚠️  AWS CLI not configured"
    echo ""
    echo "Please run: aws configure"
    echo ""
    echo "You'll need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region: us-east-1"
    echo "  - Default output format: json"
    echo ""
    echo "After configuring, run this script again."
    exit 1
fi

echo "✅ AWS CLI configured"
echo "   Account: $(aws sts get-caller-identity --query Account --output text)"
echo "   Region: us-east-1"
echo ""

# Step 3: Check EB CLI
echo "Step 3: Checking EB CLI..."
if ! command -v eb &> /dev/null; then
    echo "Installing EB CLI..."
    pip3 install --user awsebcli
    export PATH="$HOME/.local/bin:$HOME/Library/Python/3.13/bin:$PATH"
fi

if ! command -v eb &> /dev/null; then
    echo "❌ EB CLI not found. Please install manually:"
    echo "   pip3 install --user awsebcli"
    echo "   export PATH=\"\$HOME/.local/bin:\$HOME/Library/Python/3.13/bin:\$PATH\""
    exit 1
fi

echo "✅ EB CLI: $(eb --version 2>&1 | head -1)"
echo ""

# Step 4: Check .NET SDK
echo "Step 4: Checking .NET SDK..."
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK not found"
    exit 1
fi
echo "✅ .NET SDK: $(dotnet --version)"
echo ""

# Step 5: Ready to deploy
echo "=========================================="
echo "All Prerequisites Ready!"
echo "=========================================="
echo ""
echo "Ready to deploy. Proceeding with deployment..."
echo ""
sleep 2

# Run deployment script
cd "$(dirname "$0")"
./deploy-to-aws.sh

