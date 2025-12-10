#!/bin/bash
# Start backend API

echo "🚀 Starting HMS.Api backend..."
echo ""

cd "$(dirname "$0")/HMS.Api" || exit 1

# Clear any connection string environment variables
unset ConnectionStrings__Default
unset DATABASE_URL

# Check if port 5024 is in use
if lsof -Pi :5024 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 5024 is already in use"
    echo "   Killing existing process..."
    lsof -ti:5024 | xargs kill -9 2>/dev/null
    sleep 2
fi

echo "Starting backend on http://localhost:5024"
echo ""

dotnet run

