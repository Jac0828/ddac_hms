import os
import psycopg2
from psycopg2 import sql

# Database connection parameters
DB_HOST = "hotelmanagementsystem.cq7oeyco0q9s.us-east-1.rds.amazonaws.com"
DB_PORT = "5432"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "admin1234"

def apply_migration():
    try:
        print(f"Connecting to {DB_HOST}...")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()
        
        print("Successfully connected.")
        
        # Check if column exists first
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='AspNetUsers' AND column_name='ProfilePictureUrl';
        """)
        
        if cur.fetchone():
            print("Column 'ProfilePictureUrl' already exists. Skipping.")
        else:
            print("Applying migration 006...")
            
            # Read migration file
            with open("database/migrations/006_add_profile_picture_url.sql", "r") as f:
                migration_sql = f.read()
                
            # Execute
            cur.execute(migration_sql)
            conn.commit()
            print("Migration 006 applied successfully!")
            
    except Exception as e:
        print(f"Error: {e}")
        
    finally:
        if 'conn' in locals() and conn:
            conn.close()
            print("Connection closed.")

if __name__ == "__main__":
    apply_migration()





