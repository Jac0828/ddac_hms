import os
import psycopg2
from datetime import datetime, timedelta

# Get database URL from environment variable or use default
DATABASE_URL = os.environ.get('DATABASE_URL', "postgresql://postgres:admin1234@hotelmanagementsystem.cq7oeyco0q9s.us-east-1.rds.amazonaws.com:5432/postgres")

def check_revenue():
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("Checking bookings for the last 7 days...")
        
        query = """
        SELECT "CreatedAt"::date, COUNT(*), SUM("TotalPrice")
        FROM "Bookings"
        WHERE "CreatedAt" >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY "CreatedAt"::date
        ORDER BY "CreatedAt"::date;
        """
        
        cur.execute(query)
        rows = cur.fetchall()
        
        print(f"{'Date':<15} | {'Count':<5} | {'Total Price'}")
        print("-" * 35)
        for row in rows:
            print(f"{str(row[0]):<15} | {row[1]:<5} | {row[2]}")
            
    except Exception as e:
        print(f"Error checking revenue: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_revenue()

