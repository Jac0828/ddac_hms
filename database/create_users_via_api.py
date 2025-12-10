#!/usr/bin/env python3
"""
Create test users via the backend API (proper password hashing)
"""
import requests
import json

API_BASE_URL = "http://localhost:5024/api"

def create_user_via_api(email, password, first_name, last_name):
    """Create user via registration API"""
    url = f"{API_BASE_URL}/auth/register"
    data = {
        "email": email,
        "password": password,
        "firstName": first_name,
        "lastName": last_name
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            print(f"  ✓ Created: {email}")
            return True
        else:
            print(f"  ✗ Failed: {email} - {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"  ✗ Error: {email} - {e}")
        return False

def assign_role_via_admin(email, role):
    """Assign role - this would need admin API endpoint"""
    print(f"  Note: Role '{role}' needs to be assigned via Admin panel")
    return True

def main():
    print("=" * 60)
    print("Creating Test Users via Backend API")
    print("=" * 60)
    print("\nMake sure backend is running on http://localhost:5024\n")
    
    # Test users to create
    test_users = [
        ("test-admin-api@hotel.com", "Admin123!", "Test", "Admin"),
        ("test-manager-api@hotel.com", "Manager123!", "Test", "Manager"),
        ("test-housekeeping-api@hotel.com", "Housekeeping123!", "Test", "Housekeeping"),
        ("test-guest-api@hotel.com", "Guest123!", "Test", "Guest"),
    ]
    
    print("Creating users via API...\n")
    for email, password, first, last in test_users:
        print(f"Creating: {email}")
        create_user_via_api(email, password, first, last)
        print()
    
    print("=" * 60)
    print("Users Created!")
    print("=" * 60)
    print("\nYou can now login with:")
    print("  Admin: test-admin-api@hotel.com / Admin123!")
    print("  Manager: test-manager-api@hotel.com / Manager123!")
    print("  Housekeeping: test-housekeeping-api@hotel.com / Housekeeping123!")
    print("  Guest: test-guest-api@hotel.com / Guest123!")
    print("\nNote: These users will have 'Customer' role by default.")
    print("      Admin users can assign roles via /roles page.")
    print()

if __name__ == "__main__":
    main()

