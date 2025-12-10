#!/bin/bash
# ============================================
# Master Migration Script
# ============================================
# Runs all migrations and seed scripts in order
# PostgreSQL 17 compatible

set -e  # Exit on error

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
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Hotel Management System - Database Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

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
        echo -e "${RED}✗ Failed${NC}"
        echo "Attempting to show error..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
        exit 1
    fi
    echo ""
}

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

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All migrations and seeds completed!${NC}"
echo -e "${GREEN}========================================${NC}"

# Unset password
unset PGPASSWORD

