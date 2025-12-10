import os
import psycopg2
from datetime import datetime

# Get database URL from environment variable or use default
DATABASE_URL = os.environ.get('DATABASE_URL', "postgresql://postgres:admin1234@hotelmanagementsystem.cq7oeyco0q9s.us-east-1.rds.amazonaws.com:5432/postgres")

def check_bookings():
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("Checking latest 10 bookings...")
        cur.execute('SELECT "Id", "CreatedAt", "TotalPrice", "Status" FROM "Bookings" ORDER BY "CreatedAt" DESC LIMIT 10;')
        rows = cur.fetchall()
        
        for row in rows:
            print(f"ID: {row[0]}, CreatedAt: {row[1]}, TotalPrice: {row[2]}, Status: {row[3]}")
            
    except Exception as e:
        print(f"Error checking bookings: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_bookings()





