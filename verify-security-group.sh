#!/bin/bash

echo "=========================================="
echo "AWS RDS Security Group Verification"
echo "=========================================="
echo ""

MY_IP=$(curl -s https://checkip.amazonaws.com | tr -d '\n')
CIDR="${MY_IP}/32"

echo "Your Current IP: $MY_IP"
echo "CIDR Block: $CIDR"
echo ""

echo "=========================================="
echo "Security Group Configuration"
echo "=========================================="
echo ""
echo "Security Group ID: sg-00c99757cb867e4b0"
echo "Security Group Name: rds-hms-dev-sg"
echo ""
echo "Required Inbound Rule:"
echo "  Type: PostgreSQL (or Custom TCP)"
echo "  Protocol: TCP"
echo "  Port: 5432"
echo "  Source: $CIDR"
echo "  Description: HMS Dev - Current Machine"
echo ""

echo "=========================================="
echo "AWS Console Link"
echo "=========================================="
echo ""
echo "Direct link to security group:"
echo "https://console.aws.amazon.com/ec2/home?region=us-east-1#SecurityGroups:securityGroupId=sg-00c99757cb867e4b0"
echo ""

echo "=========================================="
echo "Quick Test"
echo "=========================================="
echo ""

if command -v nc &> /dev/null; then
    echo "Testing connection to RDS endpoint..."
    if timeout 5 nc -zv hotelmanagementsystem.cfvcmi6jlpxm.us-east-1.rds.amazonaws.com 5432 2>&1 | grep -q "succeeded"; then
        echo "✅ Connection successful! Security group is configured correctly."
    else
        echo "❌ Connection failed. Add the security group rule above."
    fi
else
    echo "⚠️  nc (netcat) not found. Install with: brew install netcat"
fi

echo ""
echo "After adding the rule, wait 30 seconds, then run:"
echo "  dotnet ef database update --project ./HMS.Infrastructure --startup-project ./HMS.Api"

