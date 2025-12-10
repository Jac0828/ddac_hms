-- ============================================
-- Seed Script 006: Staff Schedules
-- ============================================
-- Creates staff schedules for the next 30 days
-- PostgreSQL 17 compatible

-- Generate schedules for housekeeping staff
INSERT INTO "StaffSchedules" (
    "StaffId", "WorkDate", "StartTime", "EndTime", "ShiftType", "Notes", "CreatedAt"
)
SELECT 
    u."Id",
    CURRENT_DATE + (s.day_offset || ' days')::interval,
    CASE s.shift
        WHEN 0 THEN '08:00:00'::time
        WHEN 1 THEN '14:00:00'::time
        ELSE '20:00:00'::time
    END,
    CASE s.shift
        WHEN 0 THEN '16:00:00'::time
        WHEN 1 THEN '22:00:00'::time
        ELSE '23:59:59'::time  -- Night shift ends at end of day, next day handled separately
    END,
    CASE s.shift
        WHEN 0 THEN 'Morning'
        WHEN 1 THEN 'Afternoon'
        ELSE 'Night'
    END,
    CASE WHEN random() > 0.8 THEN
        CASE floor(random() * 3)
            WHEN 0 THEN 'Floor 1-3 assignment'
            WHEN 1 THEN 'Floor 4-6 assignment'
            ELSE 'Special cleaning tasks'
        END
    ELSE NULL
    END,
    CURRENT_TIMESTAMP
FROM "AspNetUsers" u
CROSS JOIN (
    SELECT generate_series AS day_offset, floor(random() * 3) AS shift
    FROM generate_series(0, 29)
) s
WHERE u."Id" LIKE 'user-housekeeping-%'
  AND random() > 0.3  -- Not all staff work every day
LIMIT 200
ON CONFLICT DO NOTHING;

-- Generate schedules for reception staff
INSERT INTO "StaffSchedules" (
    "StaffId", "WorkDate", "StartTime", "EndTime", "ShiftType", "Notes", "CreatedAt"
)
SELECT 
    u."Id",
    CURRENT_DATE + (s.day_offset || ' days')::interval,
    CASE s.shift
        WHEN 0 THEN '07:00:00'::time
        WHEN 1 THEN '15:00:00'::time
        ELSE '23:00:00'::time
    END,
    CASE s.shift
        WHEN 0 THEN '15:00:00'::time
        WHEN 1 THEN '23:00:00'::time
        ELSE '07:00:00'::time
    END,
    CASE s.shift
        WHEN 0 THEN 'Morning'
        WHEN 1 THEN 'Afternoon'
        ELSE 'Night'
    END,
    CASE WHEN random() > 0.7 THEN 'Front desk duty' ELSE NULL END,
    CURRENT_TIMESTAMP
FROM "AspNetUsers" u
CROSS JOIN (
    SELECT generate_series AS day_offset, floor(random() * 3) AS shift
    FROM generate_series(0, 29)
) s
WHERE u."Id" LIKE 'user-reception-%'
  AND random() > 0.4
LIMIT 100
ON CONFLICT DO NOTHING;

-- Generate schedules for managers (fewer shifts, more flexible)
INSERT INTO "StaffSchedules" (
    "StaffId", "WorkDate", "StartTime", "EndTime", "ShiftType", "Notes", "CreatedAt"
)
SELECT 
    u."Id",
    CURRENT_DATE + (s.day_offset || ' days')::interval,
    '09:00:00'::time,
    '17:00:00'::time,
    'FullDay',
    CASE WHEN random() > 0.6 THEN 'Management duties' ELSE NULL END,
    CURRENT_TIMESTAMP
FROM "AspNetUsers" u
CROSS JOIN (
    SELECT generate_series AS day_offset
    FROM generate_series(0, 29)
) s
WHERE u."Id" LIKE 'user-manager-%'
  AND random() > 0.6  -- Managers work weekdays mostly
LIMIT 60
ON CONFLICT DO NOTHING;

