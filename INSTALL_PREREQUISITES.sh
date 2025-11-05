#!/bin/bash

echo "=========================================="
echo "Installing AWS Deployment Prerequisites"
echo "=========================================="
echo ""

# Check Homebrew
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Install from: https://brew.sh"
    exit 1
fi

# Install AWS CLI
echo "Installing AWS CLI..."
if ! command -v aws &> /dev/null; then
    brew install awscli
    echo "✅ AWS CLI installed"
else
    echo "✅ AWS CLI already installed"
fi

# Install EB CLI
echo ""
echo "Installing EB CLI..."
if ! command -v eb &> /dev/null; then
    if command -v pip3 &> /dev/null; then
        pip3 install --user awsebcli
        export PATH="$HOME/.local/bin:$PATH"
        echo "✅ EB CLI installed"
    elif command -v pip &> /dev/null; then
        pip install --user awsebcli
        export PATH="$HOME/.local/bin:$PATH"
        echo "✅ EB CLI installed"
    else
        echo "❌ pip not found. Install Python first."
        exit 1
    fi
else
    echo "✅ EB CLI already installed"
fi

echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Configure AWS CLI:"
echo "   aws configure"
echo ""
echo "2. Verify authentication:"
echo "   aws sts get-caller-identity"
echo ""
echo "3. Run deployment:"
echo "   ./deploy-to-aws.sh"
echo ""

