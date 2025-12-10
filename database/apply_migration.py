import os
import psycopg2
from urllib.parse import urlparse

# RDS Connection String from appsettings.json (or derived)
# Host=hotelmanagementsystem.cq7oeyco0q9s.us-east-1.rds.amazonaws.com;Port=5432;Database=postgres;Username=postgres;Password=admin1234;SSL Mode=Require;Trust Server Certificate=true
DB_HOST = "hotelmanagementsystem.cq7oeyco0q9s.us-east-1.rds.amazonaws.com"
DB_PORT = "5432"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "admin1234"

def apply_sql(file_path):
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
        
        with open(file_path, 'r') as f:
            sql = f.read()
            print(f"Applying {file_path}...")
            cur.execute(sql)
            conn.commit()
            print("Success!")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    apply_sql("database/migrations/003_add_membership_fields.sql")

