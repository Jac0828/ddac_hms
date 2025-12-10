-- ============================================
-- Seed Script 004: Bookings and Payments (100 bookings)
-- ============================================
-- Creates 100 sample bookings with payment records
-- PostgreSQL 17 compatible

-- First, create some guest users for bookings
INSERT INTO "AspNetUsers" (
    "Id", "UserName", "NormalizedUserName", "Email", "NormalizedEmail",
    "EmailConfirmed", "PasswordHash", "SecurityStamp", "ConcurrencyStamp",
    "PhoneNumber", "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnabled",
    "AccessFailedCount", "FirstName", "LastName", "CreatedAt", "IsActive"
)
SELECT 
    'guest-' || generate_series::text,
    'guest' || generate_series || '@example.com',
    UPPER('guest' || generate_series || '@example.com'),
    'guest' || generate_series || '@example.com',
    UPPER('guest' || generate_series || '@example.com'),
    TRUE,
    'AQAAAAIAAYagAAAAEExampleHash' || generate_series::text,
    gen_random_uuid()::text,
    gen_random_uuid()::text,
    '+1-555-' || LPAD((1000 + generate_series)::text, 4, '0'),
    TRUE,
    FALSE,
    FALSE,
    0,
    'Guest' || generate_series::text,
    'User' || generate_series::text,
    CURRENT_TIMESTAMP - (random() * 365 || ' days')::interval,
    TRUE
FROM generate_series(1, 50)
ON CONFLICT ("Id") DO NOTHING;

-- Assign Guest role to guest users
INSERT INTO "AspNetUserRoles" ("UserId", "RoleId")
SELECT 'guest-' || generate_series::text, 'role-guest-001'
FROM generate_series(1, 50)
ON CONFLICT DO NOTHING;

-- Generate 100 bookings with realistic dates
WITH booking_dates AS (
    SELECT 
        CURRENT_DATE - (random() * 90 || ' days')::interval + (random() * 30 || ' days')::interval AS check_in_date,
        generate_series AS booking_num
    FROM generate_series(1, 100)
)
INSERT INTO "Bookings" (
    "UserId", "RoomId", "CheckInDate", "CheckOutDate", "TotalPrice",
    "PaymentStatus", "NumberOfGuests", "Status", "SpecialRequests",
    "CreatedAt", "UpdatedAt"
)
SELECT 
    'guest-' || (1 + floor(random() * 50))::text,
    (SELECT "Id" FROM "Rooms" ORDER BY random() LIMIT 1),
    bd.check_in_date,
    bd.check_in_date + (1 + floor(random() * 7) || ' days')::interval,
    (SELECT "PricePerNight" FROM "Rooms" ORDER BY random() LIMIT 1) * (1 + floor(random() * 7)),
    CASE floor(random() * 3)
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Paid'
        ELSE 'Refunded'
    END,
    1 + floor(random() * 4),
    CASE floor(random() * 5)
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Confirmed'
        WHEN 2 THEN 'CheckedIn'
        WHEN 3 THEN 'CheckedOut'
        ELSE 'Cancelled'
    END,
    CASE WHEN random() > 0.7 THEN 
        CASE floor(random() * 5)
            WHEN 0 THEN 'Late check-in requested'
            WHEN 1 THEN 'Early check-in if possible'
            WHEN 2 THEN 'Extra towels needed'
            WHEN 3 THEN 'Quiet room preferred'
            ELSE 'Celebrating anniversary'
        END
    ELSE NULL
    END,
    CURRENT_TIMESTAMP - (random() * 120 || ' days')::interval,
    CASE WHEN random() > 0.5 THEN CURRENT_TIMESTAMP - (random() * 120 || ' days')::interval ELSE NULL END
FROM booking_dates bd
ON CONFLICT DO NOTHING;

-- Create payment records for bookings
INSERT INTO "Payments" (
    "BookingId", "Amount", "PaymentMethod", "TransactionDate",
    "Status", "TransactionId", "CreatedAt"
)
SELECT 
    b."Id",
    b."TotalPrice",
    CASE floor(random() * 4)
        WHEN 0 THEN 'CreditCard'
        WHEN 1 THEN 'DebitCard'
        WHEN 2 THEN 'Cash'
        ELSE 'BankTransfer'
    END,
    b."CreatedAt" + (random() * 2 || ' hours')::interval,
    CASE 
        WHEN b."PaymentStatus" = 'Paid' THEN 'Completed'
        WHEN b."PaymentStatus" = 'Refunded' THEN 'Refunded'
        WHEN random() > 0.8 THEN 'Failed'
        ELSE 'Pending'
    END,
    'TXN-' || LPAD(b."Id"::text, 8, '0') || '-' || floor(random() * 10000)::text,
    b."CreatedAt" + (random() * 2 || ' hours')::interval
FROM "Bookings" b
WHERE b."PaymentStatus" IN ('Paid', 'Refunded', 'Pending')
ON CONFLICT DO NOTHING;

-- Add additional partial payments for some bookings
INSERT INTO "Payments" (
    "BookingId", "Amount", "PaymentMethod", "TransactionDate",
    "Status", "TransactionId", "CreatedAt"
)
SELECT 
    b."Id",
    b."TotalPrice" * 0.5,
    'CreditCard',
    b."CreatedAt" + (random() * 24 || ' hours')::interval,
    'Completed',
    'TXN-PARTIAL-' || LPAD(b."Id"::text, 8, '0'),
    b."CreatedAt" + (random() * 24 || ' hours')::interval
FROM "Bookings" b
WHERE b."PaymentStatus" = 'Paid' AND random() > 0.7
LIMIT 15
ON CONFLICT DO NOTHING;

