-- ============================================
-- Database Verification Script
-- ============================================
-- Verifies all tables have been created and seeded correctly
-- PostgreSQL 17 compatible

\echo '========================================'
\echo 'Database Verification Report'
\echo '========================================'
\echo ''

-- Check table counts
\echo '--- Table Record Counts ---'
SELECT 'AspNetRoles' AS table_name, COUNT(*) AS record_count FROM "AspNetRoles"
UNION ALL
SELECT 'AspNetUsers', COUNT(*) FROM "AspNetUsers"
UNION ALL
SELECT 'AspNetUserRoles', COUNT(*) FROM "AspNetUserRoles"
UNION ALL
SELECT 'RoomTypes', COUNT(*) FROM "RoomTypes"
UNION ALL
SELECT 'Amenities', COUNT(*) FROM "Amenities"
UNION ALL
SELECT 'Rooms', COUNT(*) FROM "Rooms"
UNION ALL
SELECT 'RoomAmenities', COUNT(*) FROM "RoomAmenities"
UNION ALL
SELECT 'Bookings', COUNT(*) FROM "Bookings"
UNION ALL
SELECT 'Payments', COUNT(*) FROM "Payments"
UNION ALL
SELECT 'HousekeepingTasks', COUNT(*) FROM "HousekeepingTasks"
UNION ALL
SELECT 'ServiceRequests', COUNT(*) FROM "ServiceRequests"
UNION ALL
SELECT 'StaffSchedules', COUNT(*) FROM "StaffSchedules"
UNION ALL
SELECT 'ActivityLogs', COUNT(*) FROM "ActivityLogs"
UNION ALL
SELECT 'Newsletters', COUNT(*) FROM "Newsletters"
UNION ALL
SELECT 'NewsComments', COUNT(*) FROM "NewsComments"
UNION ALL
SELECT 'QueryTickets', COUNT(*) FROM "QueryTickets"
ORDER BY table_name;

\echo ''
\echo '--- Expected Counts ---'
\echo 'AspNetRoles: 4'
\echo 'AspNetUsers: 70+ (20 staff + 50 guests)'
\echo 'RoomTypes: 10'
\echo 'Amenities: 20'
\echo 'Rooms: 50'
\echo 'Bookings: 100'
\echo 'Payments: 100+'
\echo 'HousekeepingTasks: 100+'
\echo 'ServiceRequests: 80'
\echo 'StaffSchedules: 360+'
\echo 'ActivityLogs: 500'
\echo ''

-- Check room status distribution
\echo '--- Room Status Distribution ---'
SELECT "Status", COUNT(*) AS count
FROM "Rooms"
GROUP BY "Status"
ORDER BY count DESC;

\echo ''
\echo '--- Booking Status Distribution ---'
SELECT "Status", COUNT(*) AS count
FROM "Bookings"
GROUP BY "Status"
ORDER BY count DESC;

\echo ''
\echo '--- Payment Status Distribution ---'
SELECT "Status", COUNT(*) AS count
FROM "Payments"
GROUP BY "Status"
ORDER BY count DESC;

\echo ''
\echo '--- User Role Distribution ---'
SELECT r."Name" AS role_name, COUNT(ur."UserId") AS user_count
FROM "AspNetRoles" r
LEFT JOIN "AspNetUserRoles" ur ON r."Id" = ur."RoleId"
GROUP BY r."Name"
ORDER BY user_count DESC;

\echo ''
\echo '--- Room Type Distribution ---'
SELECT rt."Name" AS room_type, COUNT(r."Id") AS room_count
FROM "RoomTypes" rt
LEFT JOIN "Rooms" r ON rt."Id" = r."RoomTypeId"
GROUP BY rt."Name"
ORDER BY room_count DESC;

\echo ''
\echo '========================================'
\echo 'Verification Complete!'
\echo '========================================'

