import os
import psycopg2

# RDS Connection String from appsettings.json (or derived)
DB_HOST = "hotelmanagementsystem.cq7oeyco0q9s.us-east-1.rds.amazonaws.com"
DB_PORT = "5432"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "admin1234"

def clear_logs():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            sslmode='require'
        )
        cur = conn.cursor()
        
        print("Clearing ActivityLogs table...")
        cur.execute('DELETE FROM "ActivityLogs";')
        conn.commit()
        print("Successfully cleared ActivityLogs.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    clear_logs()
