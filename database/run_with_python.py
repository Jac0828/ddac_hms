#!/usr/bin/env python3
"""
Python script to run SQL migrations and seeds against PostgreSQL database
Works when psql is not available
"""
import sys
import os

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("ERROR: psycopg2 not installed. Installing...")
    os.system("pip3 install psycopg2-binary")
    import psycopg2
    from psycopg2 import sql

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'postgres',
    'user': 'postgres',
    'password': 'admin1234'
}

def run_sql_file(conn, filepath, description):
    """Execute SQL file"""
    print(f"\n{'='*50}")
    print(f"Running: {description}")
    print(f"File: {filepath}")
    print(f"{'='*50}")
    
    if not os.path.exists(filepath):
        print(f"ERROR: File not found: {filepath}")
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        with conn.cursor() as cur:
            cur.execute(sql_content)
        conn.commit()
        print(f"✓ Success: {description}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        conn.rollback()
        return False

def test_connection():
    """Test database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            version = cur.fetchone()[0]
            print(f"✓ Connected to database")
            print(f"  PostgreSQL version: {version.split(',')[0]}")
        return conn
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        print("\nPlease check:")
        print("  1. SSH tunnel is running (localhost:5433 → RDS)")
        print("  2. Database credentials are correct")
        print("  3. RDS security group allows connections")
        return None

def main():
    """Main execution"""
    print("\n" + "="*50)
    print("Hotel Management System - Database Setup")
    print("="*50 + "\n")
    
    # Test connection
    print("Testing database connection...")
    conn = test_connection()
    if not conn:
        sys.exit(1)
    
    # Get script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define files to run in order
    files_to_run = [
        # Migrations
        ("migrations/001_create_identity_tables.sql", "Identity Tables Migration"),
        ("migrations/002_create_core_tables.sql", "Core Tables Migration"),
        # Seeds
        ("seeds/001_seed_roles_and_users.sql", "Seed Roles and Users"),
        ("seeds/002_seed_room_types_and_amenities.sql", "Seed Room Types and Amenities"),
        ("seeds/003_seed_rooms.sql", "Seed Rooms"),
        ("seeds/004_seed_bookings_and_payments.sql", "Seed Bookings and Payments"),
        ("seeds/005_seed_housekeeping_and_services.sql", "Seed Housekeeping and Services"),
        ("seeds/006_seed_staff_schedules.sql", "Seed Staff Schedules"),
        ("seeds/007_seed_activity_logs.sql", "Seed Activity Logs"),
    ]
    
    # Run migrations and seeds
    success_count = 0
    for rel_path, description in files_to_run:
        filepath = os.path.join(script_dir, rel_path)
        if run_sql_file(conn, filepath, description):
            success_count += 1
        else:
            print(f"\n⚠ Warning: Failed to run {description}")
            response = input("Continue anyway? (y/n): ")
            if response.lower() != 'y':
                break
    
    # Verification
    print(f"\n{'='*50}")
    print("Verification")
    print(f"{'='*50}")
    try:
        with conn.cursor() as cur:
            tables = [
                "AspNetUsers", "AspNetRoles", "RoomTypes", "Amenities", 
                "Rooms", "Bookings", "Payments", "HousekeepingTasks",
                "ServiceRequests", "StaffSchedules", "ActivityLogs"
            ]
            for table in tables:
                try:
                    cur.execute(f'SELECT COUNT(*) FROM "{table}";')
                    count = cur.fetchone()[0]
                    print(f"  {table}: {count} records")
                except Exception as e:
                    print(f"  {table}: Error - {e}")
    except Exception as e:
        print(f"Verification error: {e}")
    
    conn.close()
    
    print(f"\n{'='*50}")
    print(f"✓ Completed: {success_count}/{len(files_to_run)} scripts executed")
    print(f"{'='*50}\n")

if __name__ == "__main__":
    main()

