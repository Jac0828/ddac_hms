#!/bin/bash
# ============================================
# Complete Database Setup Script
# ============================================
# Runs all migrations, seeds, and verification
# PostgreSQL 17 compatible

set -e  # Exit on error

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Database connection details
DB_HOST="localhost"
DB_PORT="5433"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="admin1234"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Hotel Management System - Complete Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found${NC}"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Function to run SQL file
run_sql_file() {
    local file=$1
    local description=$2
    echo -e "${BLUE}Running: $description${NC}"
    echo -e "File: $file"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: Some errors may have occurred (checking if file exists)${NC}"
        if [ ! -f "$file" ]; then
            echo -e "${RED}✗ File not found: $file${NC}"
            exit 1
        fi
        # Try again with error output
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file" || {
            echo -e "${RED}✗ Failed${NC}"
            exit 1
        }
    fi
    echo ""
}

# Test database connection
echo -e "${BLUE}--- Testing Database Connection ---${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected to database${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" | head -3
else
    echo -e "${RED}✗ Cannot connect to database${NC}"
    echo "Please check:"
    echo "  1. SSH tunnel is running (localhost:5433 → RDS)"
    echo "  2. Database credentials are correct"
    echo "  3. RDS security group allows connections"
    exit 1
fi
echo ""

# Run migrations
echo -e "${BLUE}--- Running Migrations ---${NC}"
run_sql_file "migrations/001_create_identity_tables.sql" "Identity Tables Migration"
run_sql_file "migrations/002_create_core_tables.sql" "Core Tables Migration"

# Run seed scripts
echo -e "${BLUE}--- Running Seed Scripts ---${NC}"
run_sql_file "seeds/001_seed_roles_and_users.sql" "Seed Roles and Users"
run_sql_file "seeds/002_seed_room_types_and_amenities.sql" "Seed Room Types and Amenities"
run_sql_file "seeds/003_seed_rooms.sql" "Seed Rooms"
run_sql_file "seeds/004_seed_bookings_and_payments.sql" "Seed Bookings and Payments"
run_sql_file "seeds/005_seed_housekeeping_and_services.sql" "Seed Housekeeping and Services"
run_sql_file "seeds/006_seed_staff_schedules.sql" "Seed Staff Schedules"
run_sql_file "seeds/007_seed_activity_logs.sql" "Seed Activity Logs"

# Run verification
echo -e "${BLUE}--- Running Verification ---${NC}"
echo -e "${BLUE}Database Verification Report:${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "verify_database.sql"

# Unset password
unset PGPASSWORD

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All migrations and seeds completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Connect DBeaver using the guide in DBeaver_Connection_Guide.md"
echo "  2. View ERD diagram in ERD.md"
echo "  3. Run verification queries in verify_database.sql"
echo ""

