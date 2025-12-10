-- ============================================
-- Seed Script 007: Activity Logs
-- ============================================
-- Creates activity logs for system audit trail
-- PostgreSQL 17 compatible

-- Generate activity logs for various actions
INSERT INTO "ActivityLogs" (
    "UserId", "Action", "EntityType", "EntityId", "Details", "CreatedAt"
)
SELECT 
    u."Id",
    CASE floor(random() * 10)
        WHEN 0 THEN 'Created Booking'
        WHEN 1 THEN 'Updated Room Status'
        WHEN 2 THEN 'Processed Payment'
        WHEN 3 THEN 'Assigned Housekeeping Task'
        WHEN 4 THEN 'Completed Service Request'
        WHEN 5 THEN 'Updated User Profile'
        WHEN 6 THEN 'Cancelled Booking'
        WHEN 7 THEN 'Checked In Guest'
        WHEN 8 THEN 'Checked Out Guest'
        ELSE 'Viewed Report'
    END,
    CASE floor(random() * 5)
        WHEN 0 THEN 'Booking'
        WHEN 1 THEN 'Room'
        WHEN 2 THEN 'Payment'
        WHEN 3 THEN 'User'
        ELSE 'HousekeepingTask'
    END,
    CASE floor(random() * 2)
        WHEN 0 THEN floor(random() * 100)::integer
        ELSE NULL
    END,
    CASE WHEN random() > 0.5 THEN
        'Action performed successfully at ' || CURRENT_TIMESTAMP::text
    ELSE NULL
    END,
    CURRENT_TIMESTAMP - (random() * 90 || ' days')::interval
FROM "AspNetUsers" u
CROSS JOIN generate_series(1, 5)
WHERE u."Id" NOT LIKE 'guest-%'
LIMIT 500
ON CONFLICT DO NOTHING;

