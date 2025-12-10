import os
import psycopg2
import random

# Get database URL from environment variable or use default
DATABASE_URL = os.environ.get('DATABASE_URL', "postgresql://postgres:admin1234@hotelmanagementsystem.cq7oeyco0q9s.us-east-1.rds.amazonaws.com:5432/postgres")

TARGET_USER_ID = '1f934ca5-fae0-48d3-ab21-83c5b6540ad4' # Maria Garcia (housekeeping1@hms.com)

def apply_seed():
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # 1. Get some Room IDs
        cur.execute('SELECT "Id" FROM "Rooms" LIMIT 10')
        room_ids = [row[0] for row in cur.fetchall()]
        
        if not room_ids:
            print("No rooms found to assign tasks to.")
            return

        # 2. Get some Booking IDs for Service Requests
        cur.execute('SELECT "Id", "UserId" FROM "Bookings" WHERE "Status" = 1 LIMIT 10') # Confirmed bookings
        bookings = cur.fetchall() # [(id, userId), ...]
        
        if not bookings:
            print("No confirmed bookings found for service requests.")
            # Fallback: Create dummy service requests without bookings if nullable (model says BookingId is int, not nullable?)
            # Model: public int BookingId { get; set; } -> Required.
            # So we need bookings.
            return

        print(f"Seeding data for user {TARGET_USER_ID}...")

        # --- HOUSEKEEPING TASKS ---
        # Status: Pending=0, InProgress=1, Completed=2
        
        # 2 Pending Tasks assigned to Maria
        for i in range(2):
            rid = random.choice(room_ids)
            cur.execute("""
                INSERT INTO "HousekeepingTasks" ("RoomId", "AssignedStaffId", "Status", "Notes", "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, 0, 'Daily cleaning', NOW(), NOW())
            """, (rid, TARGET_USER_ID))

        # 1 In Progress Task assigned to Maria
        rid = random.choice(room_ids)
        cur.execute("""
            INSERT INTO "HousekeepingTasks" ("RoomId", "AssignedStaffId", "Status", "Notes", "CreatedAt", "UpdatedAt")
            VALUES (%s, %s, 1, 'Deep cleaning in progress', NOW(), NOW())
        """, (rid, TARGET_USER_ID))

        # 2 Completed Tasks assigned to Maria
        for i in range(2):
            rid = random.choice(room_ids)
            cur.execute("""
                INSERT INTO "HousekeepingTasks" ("RoomId", "AssignedStaffId", "Status", "Notes", "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, 2, 'Towel change', NOW() - INTERVAL '2 hours', NOW())
            """, (rid, TARGET_USER_ID))
            
        # 3 Unassigned Pending Tasks
        for i in range(3):
            rid = random.choice(room_ids)
            cur.execute("""
                INSERT INTO "HousekeepingTasks" ("RoomId", "AssignedStaffId", "Status", "Notes", "CreatedAt", "UpdatedAt")
                VALUES (%s, NULL, 0, 'Checkroom inspection', NOW(), NOW())
            """, (rid,))


        # --- SERVICE REQUESTS ---
        # Type: RoomService=0, Housekeeping=1, Maintenance=2, Laundry=3, ...
        # Status: Pending=0, InProgress=1, Completed=2
        
        # 2 Pending Requests assigned to Maria (Type Housekeeping=1)
        for i in range(2):
            bid, uid = random.choice(bookings)
            cur.execute("""
                INSERT INTO "ServiceRequests" ("BookingId", "UserId", "ServiceType", "Description", "Status", "AssignedToUserId", "RequestedAt", "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, 1, 'Extra pillows requested', 0, %s, NOW(), NOW(), NOW())
            """, (bid, uid, TARGET_USER_ID))

        # 1 In Progress Request assigned to Maria
        bid, uid = random.choice(bookings)
        cur.execute("""
            INSERT INTO "ServiceRequests" ("BookingId", "UserId", "ServiceType", "Description", "Status", "AssignedToUserId", "RequestedAt", "CreatedAt", "UpdatedAt")
            VALUES (%s, %s, 1, 'Spill cleanup', 1, %s, NOW(), NOW(), NOW())
        """, (bid, uid, TARGET_USER_ID))
        
        # 2 Unassigned Pending Requests (Type Laundry=3)
        for i in range(2):
            bid, uid = random.choice(bookings)
            cur.execute("""
                INSERT INTO "ServiceRequests" ("BookingId", "UserId", "ServiceType", "Description", "Status", "AssignedToUserId", "RequestedAt", "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, 3, 'Pick up laundry', 0, NULL, NOW(), NOW(), NOW())
            """, (bid, uid))

        conn.commit()
        print("Seeding completed successfully!")
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error applying seed: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    apply_seed()





