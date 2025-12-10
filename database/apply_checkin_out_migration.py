import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Get database URL from environment variable or use default
DATABASE_URL = os.environ.get('DATABASE_URL', "postgresql://postgres:admin1234@hotelmanagementsystem.cq7oeyco0q9s.us-east-1.rds.amazonaws.com:5432/postgres")

def apply_migration():
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Read the migration SQL
        with open('database/migrations/008_add_actual_checkin_out_dates.sql', 'r') as f:
            migration_sql = f.read()
            
        print("Applying migration: 008_add_actual_checkin_out_dates.sql")
        cur.execute(migration_sql)
        
        conn.commit()
        print("Migration applied successfully!")
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error applying migration: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    apply_migration()

