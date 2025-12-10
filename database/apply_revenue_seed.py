import os
import psycopg2

# Get database URL from environment variable or use default
DATABASE_URL = os.environ.get('DATABASE_URL', "postgresql://postgres:admin1234@hotelmanagementsystem.cq7oeyco0q9s.us-east-1.rds.amazonaws.com:5432/postgres")

def apply_seed():
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Read the seed SQL
        seed_file = 'database/seeds/008_seed_revenue_bookings.sql'
        with open(seed_file, 'r') as f:
            seed_sql = f.read()
            
        print(f"Applying seed: {seed_file}")
        cur.execute(seed_sql)
        
        conn.commit()
        print("Seed applied successfully!")
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error applying seed: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    apply_seed()





