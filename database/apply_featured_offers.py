import psycopg2
import os

# Connection details from appsettings.Development.json
DB_HOST = "hotelmanagementsystem.cq7oeyco0q9s.us-east-1.rds.amazonaws.com"
DB_PORT = "5432"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "admin1234"

MIGRATION_FILE = "database/migrations/004_add_featured_offers_to_settings.sql"

def apply_migration():
    try:
        print(f"Connecting to database at {DB_HOST}:{DB_PORT}...")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            sslmode='require' 
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Checking if column exists...")
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'HotelSettings' AND column_name = 'FeaturedOffersJson';")
        if cur.fetchone():
            print("Column 'FeaturedOffersJson' already exists. Skipping migration.")
        else:
            print(f"Applying migration from {MIGRATION_FILE}...")
            with open(MIGRATION_FILE, 'r') as f:
                sql = f.read()
                cur.execute(sql)
            print("Migration applied successfully!")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    apply_migration()
