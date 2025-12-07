-- ============================================
-- Seed Script 005: Housekeeping Tasks and Service Requests
-- ============================================
-- Creates housekeeping tasks and service requests
-- PostgreSQL 17 compatible

-- Create housekeeping tasks for rooms
INSERT INTO "HousekeepingTasks" (
    "RoomId", "AssignedStaffId", "Status", "Notes", "CreatedAt", "UpdatedAt"
)
SELECT 
    r."Id",
    CASE WHEN random() > 0.3 THEN 
        (SELECT "Id" FROM "AspNetUsers" 
         WHERE "Id" LIKE 'user-housekeeping-%' 
         ORDER BY random() LIMIT 1)
    ELSE NULL
    END,
    CASE floor(random() * 3)
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'InProgress'
        ELSE 'Completed'
    END,
    CASE floor(random() * 4)
        WHEN 0 THEN 'Standard room cleaning'
        WHEN 1 THEN 'Deep cleaning required'
        WHEN 2 THEN 'Post-checkout service'
        ELSE 'Maintenance check needed'
    END,
    COALESCE(CURRENT_TIMESTAMP - (random() * 7 || ' days')::interval, CURRENT_TIMESTAMP),
    COALESCE(CURRENT_TIMESTAMP - (random() * 7 || ' days')::interval + (random() * 2 || ' hours')::interval, CURRENT_TIMESTAMP)
FROM "Rooms" r
WHERE r."Status" IN ('Cleaning', 'Available', 'Booked')
LIMIT 60
ON CONFLICT DO NOTHING;

-- Create additional housekeeping tasks for booked rooms
INSERT INTO "HousekeepingTasks" (
    "RoomId", "AssignedStaffId", "Status", "Notes", "CreatedAt", "UpdatedAt"
)
SELECT 
    b."RoomId",
    (SELECT "Id" FROM "AspNetUsers" 
     WHERE "Id" LIKE 'user-housekeeping-%' 
     ORDER BY random() LIMIT 1),
    CASE 
        WHEN b."Status" = 'CheckedIn' THEN 'InProgress'
        WHEN b."Status" = 'CheckedOut' THEN 'Pending'
        ELSE 'Pending'
    END,
    CASE 
        WHEN b."Status" = 'CheckedIn' THEN 'Daily housekeeping service'
        WHEN b."Status" = 'CheckedOut' THEN 'Post-checkout cleaning'
        ELSE 'Pre-arrival room preparation'
    END,
    COALESCE(
        CASE 
            WHEN b."Status" = 'CheckedIn' THEN CURRENT_TIMESTAMP - (random() * 2 || ' days')::interval
            WHEN b."Status" = 'CheckedOut' AND b."UpdatedAt" IS NOT NULL THEN b."UpdatedAt"
            ELSE b."CreatedAt"
        END,
        CURRENT_TIMESTAMP
    ),
    COALESCE(
        CASE 
            WHEN b."Status" = 'CheckedIn' THEN CURRENT_TIMESTAMP - (random() * 1 || ' hours')::interval
            ELSE CURRENT_TIMESTAMP - (random() * 7 || ' days')::interval
        END,
        CURRENT_TIMESTAMP
    )
FROM "Bookings" b
WHERE b."Status" IN ('CheckedIn', 'CheckedOut', 'Confirmed')
LIMIT 40
ON CONFLICT DO NOTHING;

-- Create service requests for bookings
INSERT INTO "ServiceRequests" (
    "BookingId", "UserId", "ServiceType", "Description", "Status",
    "AssignedToUserId", "RequestedAt", "CompletedAt", "Notes"
)
SELECT 
    b."Id",
    b."UserId",
    CASE floor(random() * 6)
        WHEN 0 THEN 'RoomService'
        WHEN 1 THEN 'Housekeeping'
        WHEN 2 THEN 'Maintenance'
        WHEN 3 THEN 'Laundry'
        WHEN 4 THEN 'Concierge'
        ELSE 'Other'
    END,
    CASE floor(random() * 6)
        WHEN 0 THEN 'Request for extra towels and toiletries'
        WHEN 1 THEN 'Room temperature adjustment needed'
        WHEN 2 THEN 'TV remote not working, please fix'
        WHEN 3 THEN 'Request for late checkout'
        WHEN 4 THEN 'Need additional pillows'
        ELSE 'Request for room service menu'
    END,
    CASE floor(random() * 4)
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'InProgress'
        WHEN 2 THEN 'Completed'
        ELSE 'Cancelled'
    END,
    CASE WHEN random() > 0.4 THEN
        CASE floor(random() * 2)
            WHEN 0 THEN (SELECT "Id" FROM "AspNetUsers" 
                        WHERE "Id" LIKE 'user-housekeeping-%' 
                        ORDER BY random() LIMIT 1)
            ELSE (SELECT "Id" FROM "AspNetUsers" 
                  WHERE "Id" LIKE 'user-reception-%' 
                  ORDER BY random() LIMIT 1)
        END
    ELSE NULL
    END,
    b."CreatedAt" + (random() * (EXTRACT(EPOCH FROM (b."CheckOutDate" - b."CheckInDate")) || ' seconds')::interval),
    CASE WHEN random() > 0.5 THEN
        b."CreatedAt" + (random() * (EXTRACT(EPOCH FROM (b."CheckOutDate" - b."CheckInDate")) || ' seconds')::interval) + (random() * 4 || ' hours')::interval
    ELSE NULL
    END,
    CASE WHEN random() > 0.6 THEN
        CASE floor(random() * 3)
            WHEN 0 THEN 'Request completed successfully'
            WHEN 1 THEN 'Guest satisfied with service'
            ELSE 'Follow-up required'
        END
    ELSE NULL
    END
FROM "Bookings" b
WHERE b."Status" IN ('CheckedIn', 'Confirmed', 'CheckedOut')
LIMIT 80
ON CONFLICT DO NOTHING;

