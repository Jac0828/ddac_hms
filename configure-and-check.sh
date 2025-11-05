#!/bin/bash

echo "=========================================="
echo "HMS Deployment - Configure & Check"
echo "=========================================="
echo ""

export PATH="$HOME/.local/bin:$HOME/Library/Python/3.13/bin:$PATH"

# Check AWS CLI
if ! aws sts get-caller-identity --region us-east-1 >/dev/null 2>&1; then
    echo "⚠️  AWS CLI not configured"
    echo ""
    echo "Please configure AWS CLI first:"
    echo "  aws configure"
    echo ""
    echo "You'll need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region: us-east-1"
    echo "  - Default output format: json"
    echo ""
    echo "Get credentials from:"
    echo "  AWS Console → IAM → Users → Security credentials"
    echo ""
    exit 1
fi

echo "✅ AWS CLI configured"
echo "   Account: $(aws sts get-caller-identity --query Account --output text)"
echo "   Region: us-east-1"
echo ""

# Run health check
echo "Running deployment health check..."
echo ""
cd "$(dirname "$0")"
./check-deployment.sh

