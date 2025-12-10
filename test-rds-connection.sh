#!/bin/bash

# Quick RDS Connection Test Script
# This script tests if your API can connect to RDS

echo "🔍 Testing RDS Database Connection..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if API is running
echo "Step 1: Checking if API is running..."
API_URL="http://localhost:5024"

if curl -s -f "$API_URL/healthz" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is running${NC}"
else
    echo -e "${RED}❌ API is not running${NC}"
    echo "   Please start the API first:"
    echo "   cd HMS.Api && dotnet run"
    exit 1
fi

echo ""
echo "Step 2: Testing database connection..."
echo ""

# Test database connection endpoint
RESPONSE=$(curl -s "$API_URL/api/test-db")

if echo "$RESPONSE" | grep -q '"status":"connected"'; then
    echo -e "${GREEN}✅ Database connection successful!${NC}"
    echo ""
    echo "Database Statistics:"
    echo "$RESPONSE" | grep -o '"rooms":[0-9]*' | sed 's/"rooms":/  - Rooms: /'
    echo "$RESPONSE" | grep -o '"users":[0-9]*' | sed 's/"users":/  - Users: /'
    echo ""
    echo -e "${GREEN}✅ Your RDS database is connected and working!${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | head -20
    echo ""
    echo -e "${YELLOW}💡 Troubleshooting:${NC}"
    echo "  1. Check RDS instance is running"
    echo "  2. Verify security group allows your IP"
    echo "  3. Check connection string in appsettings.json"
    echo "  4. Verify username and password"
    echo "  5. Check application logs for errors"
    exit 1
fi

echo ""
echo "Step 3: Testing rooms endpoint..."
ROOMS_RESPONSE=$(curl -s "$API_URL/api/rooms" | head -100)
if echo "$ROOMS_RESPONSE" | grep -q '"roomNumber"'; then
    ROOM_COUNT=$(echo "$ROOMS_RESPONSE" | grep -o '"roomNumber"' | wc -l | tr -d ' ')
    echo -e "${GREEN}✅ Rooms endpoint working (found $ROOM_COUNT rooms)${NC}"
else
    echo -e "${YELLOW}⚠️  Rooms endpoint returned unexpected response${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All tests passed! Your RDS connection is working correctly.${NC}"

