import os
import psycopg2

# Get database URL from environment variable or use default
DATABASE_URL = os.environ.get('DATABASE_URL', "postgresql://postgres:admin1234@hotelmanagementsystem.cq7oeyco0q9s.us-east-1.rds.amazonaws.com:5432/postgres")

def find_housekeepers():
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Find users with 'Housekeeping' role or name Maria Garcia
        query = """
        SELECT u."Id", u."Email", u."FirstName", u."LastName"
        FROM "AspNetUsers" u
        WHERE u."FirstName" = 'Maria' OR u."Email" LIKE '%housekeeping%'
        """
        
        cur.execute(query)
        rows = cur.fetchall()
        
        print("Found Housekeepers:")
        for row in rows:
            print(f"ID: {row[0]}, Email: {row[1]}, Name: {row[2]} {row[3]}")
            
    except Exception as e:
        print(f"Error finding housekeepers: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    find_housekeepers()





