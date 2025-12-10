#!/usr/bin/env python3
"""
Create test users with known passwords for login testing
Uses ASP.NET Core Identity password hashing
"""
import psycopg2
import hashlib
import base64
import os

# Database connection
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'postgres',
    'user': 'postgres',
    'password': 'admin1234'
}

def create_aspnet_password_hash(password):
    """
    Create ASP.NET Core Identity password hash
    Format: base64(algorithm + salt + hash)
    Algorithm: PBKDF2 with HMAC-SHA256, 10000 iterations
    """
    import hashlib
    import hmac
    import base64
    
    # Generate salt
    salt = os.urandom(16)
    
    # PBKDF2 with 10000 iterations
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 10000, 32)
    
    # Format: 0x01 (algorithm) + salt + hash
    hash_bytes = b'\x01' + salt + key
    
    # Base64 encode
    return base64.b64encode(hash_bytes).decode('utf-8')

def create_test_user(conn, email, first_name, last_name, password, role_name):
    """Create a test user with known password"""
    cur = conn.cursor()
    
    try:
        # Check if user exists
        cur.execute('SELECT "Id" FROM "AspNetUsers" WHERE "Email" = %s;', (email,))
        existing = cur.fetchone()
        
        if existing:
            user_id = existing[0]
            print(f"  User {email} already exists, updating password...")
            # Update password
            password_hash = create_aspnet_password_hash(password)
            cur.execute(
                'UPDATE "AspNetUsers" SET "PasswordHash" = %s WHERE "Id" = %s;',
                (password_hash, user_id)
            )
        else:
            # Create new user
            user_id = f'test-{email.replace("@", "-").replace(".", "-")}'
            password_hash = create_aspnet_password_hash(password)
            
            cur.execute('''
                INSERT INTO "AspNetUsers" (
                    "Id", "UserName", "NormalizedUserName", "Email", "NormalizedEmail",
                    "EmailConfirmed", "PasswordHash", "SecurityStamp", "ConcurrencyStamp",
                    "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnabled",
                    "AccessFailedCount", "FirstName", "LastName", "CreatedAt", "IsActive"
                ) VALUES (
                    %s, %s, UPPER(%s), %s, UPPER(%s),
                    TRUE, %s, gen_random_uuid()::text, gen_random_uuid()::text,
                    FALSE, FALSE, FALSE,
                    0, %s, %s, CURRENT_TIMESTAMP, TRUE
                );
            ''', (user_id, email, email, email, email, password_hash, first_name, last_name))
            print(f"  Created user: {email}")
        
        # Assign role
        cur.execute('SELECT "Id" FROM "AspNetRoles" WHERE "Name" = %s;', (role_name,))
        role = cur.fetchone()
        
        if role:
            role_id = role[0]
            cur.execute('''
                INSERT INTO "AspNetUserRoles" ("UserId", "RoleId")
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING;
            ''', (user_id, role_id))
            print(f"    Assigned role: {role_name}")
        else:
            print(f"    Warning: Role '{role_name}' not found")
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"    Error: {e}")
        conn.rollback()
        return False
    finally:
        cur.close()

def main():
    print("=" * 60)
    print("Creating Test Users with Known Passwords")
    print("=" * 60)
    print()
    
    conn = psycopg2.connect(**DB_CONFIG)
    
    # Test users to create
    test_users = [
        # Admin
        ("test-admin@hotel.com", "Test", "Admin", "Admin123!", "Admin"),
        # Manager
        ("test-manager@hotel.com", "Test", "Manager", "Manager123!", "Manager"),
        # Housekeeping
        ("test-housekeeping@hotel.com", "Test", "Housekeeping", "Housekeeping123!", "Housekeeping"),
        # Guest
        ("test-guest@hotel.com", "Test", "Guest", "Guest123!", "Guest"),
    ]
    
    print("Creating test users...\n")
    for email, first, last, password, role in test_users:
        print(f"Creating: {email} ({role})")
        if create_test_user(conn, email, first, last, password, role):
            print(f"  ✓ Success - Password: {password}\n")
        else:
            print(f"  ✗ Failed\n")
    
    print("=" * 60)
    print("Test Users Created!")
    print("=" * 60)
    print("\nYou can now login with:")
    print("  Admin: test-admin@hotel.com / Admin123!")
    print("  Manager: test-manager@hotel.com / Manager123!")
    print("  Housekeeping: test-housekeeping@hotel.com / Housekeeping123!")
    print("  Guest: test-guest@hotel.com / Guest123!")
    print()
    
    conn.close()

if __name__ == "__main__":
    main()

