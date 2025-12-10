-- ============================================
-- Seed Script 001: Roles and Users
-- ============================================
-- Creates roles and 20 staff accounts with realistic data
-- PostgreSQL 17 compatible

-- Insert Roles
INSERT INTO "AspNetRoles" ("Id", "Name", "NormalizedName", "ConcurrencyStamp")
VALUES 
    ('role-admin-001', 'Admin', 'ADMIN', gen_random_uuid()::text),
    ('role-manager-001', 'Manager', 'MANAGER', gen_random_uuid()::text),
    ('role-reception-001', 'Receptionist', 'RECEPTIONIST', gen_random_uuid()::text),
    ('role-housekeeping-001', 'Housekeeping', 'HOUSEKEEPING', gen_random_uuid()::text),
    ('role-guest-001', 'Guest', 'GUEST', gen_random_uuid()::text)
ON CONFLICT ("Id") DO NOTHING;

-- Insert Admin Users (2)
INSERT INTO "AspNetUsers" (
    "Id", "UserName", "NormalizedUserName", "Email", "NormalizedEmail",
    "EmailConfirmed", "PasswordHash", "SecurityStamp", "ConcurrencyStamp",
    "PhoneNumber", "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnabled",
    "AccessFailedCount", "FirstName", "LastName", "CreatedAt", "IsActive"
)
VALUES 
    ('user-admin-001', 'admin@hotel.com', 'ADMIN@HOTEL.COM', 'admin@hotel.com', 'ADMIN@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash1', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0101', TRUE, FALSE, FALSE, 0, 'John', 'Administrator', CURRENT_TIMESTAMP, TRUE),
    ('user-admin-002', 'sarah.admin@hotel.com', 'SARAH.ADMIN@HOTEL.COM', 'sarah.admin@hotel.com', 'SARAH.ADMIN@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash2', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0102', TRUE, FALSE, FALSE, 0, 'Sarah', 'Mitchell', CURRENT_TIMESTAMP, TRUE)
ON CONFLICT ("Id") DO NOTHING;

-- Insert Manager Users (3)
INSERT INTO "AspNetUsers" (
    "Id", "UserName", "NormalizedUserName", "Email", "NormalizedEmail",
    "EmailConfirmed", "PasswordHash", "SecurityStamp", "ConcurrencyStamp",
    "PhoneNumber", "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnabled",
    "AccessFailedCount", "FirstName", "LastName", "CreatedAt", "IsActive"
)
VALUES 
    ('user-manager-001', 'manager@hotel.com', 'MANAGER@HOTEL.COM', 'manager@hotel.com', 'MANAGER@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash3', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0201', TRUE, FALSE, FALSE, 0, 'Michael', 'Chen', CURRENT_TIMESTAMP, TRUE),
    ('user-manager-002', 'lisa.manager@hotel.com', 'LISA.MANAGER@HOTEL.COM', 'lisa.manager@hotel.com', 'LISA.MANAGER@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash4', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0202', TRUE, FALSE, FALSE, 0, 'Lisa', 'Rodriguez', CURRENT_TIMESTAMP, TRUE),
    ('user-manager-003', 'david.manager@hotel.com', 'DAVID.MANAGER@HOTEL.COM', 'david.manager@hotel.com', 'DAVID.MANAGER@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash5', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0203', TRUE, FALSE, FALSE, 0, 'David', 'Kim', CURRENT_TIMESTAMP, TRUE)
ON CONFLICT ("Id") DO NOTHING;

-- Insert Housekeeping Staff (10)
INSERT INTO "AspNetUsers" (
    "Id", "UserName", "NormalizedUserName", "Email", "NormalizedEmail",
    "EmailConfirmed", "PasswordHash", "SecurityStamp", "ConcurrencyStamp",
    "PhoneNumber", "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnabled",
    "AccessFailedCount", "FirstName", "LastName", "CreatedAt", "IsActive"
)
VALUES 
    ('user-housekeeping-001', 'maria.housekeeping@hotel.com', 'MARIA.HOUSEKEEPING@HOTEL.COM', 'maria.housekeeping@hotel.com', 'MARIA.HOUSEKEEPING@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash6', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0301', TRUE, FALSE, FALSE, 0, 'Maria', 'Garcia', CURRENT_TIMESTAMP, TRUE),
    ('user-housekeeping-002', 'james.housekeeping@hotel.com', 'JAMES.HOUSEKEEPING@HOTEL.COM', 'james.housekeeping@hotel.com', 'JAMES.HOUSEKEEPING@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash7', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0302', TRUE, FALSE, FALSE, 0, 'James', 'Wilson', CURRENT_TIMESTAMP, TRUE),
    ('user-housekeeping-003', 'patricia.housekeeping@hotel.com', 'PATRICIA.HOUSEKEEPING@HOTEL.COM', 'patricia.housekeeping@hotel.com', 'PATRICIA.HOUSEKEEPING@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash8', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0303', TRUE, FALSE, FALSE, 0, 'Patricia', 'Brown', CURRENT_TIMESTAMP, TRUE),
    ('user-housekeeping-004', 'robert.housekeeping@hotel.com', 'ROBERT.HOUSEKEEPING@HOTEL.COM', 'robert.housekeeping@hotel.com', 'ROBERT.HOUSEKEEPING@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash9', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0304', TRUE, FALSE, FALSE, 0, 'Robert', 'Taylor', CURRENT_TIMESTAMP, TRUE),
    ('user-housekeeping-005', 'jennifer.housekeeping@hotel.com', 'JENNIFER.HOUSEKEEPING@HOTEL.COM', 'jennifer.housekeeping@hotel.com', 'JENNIFER.HOUSEKEEPING@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash10', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0305', TRUE, FALSE, FALSE, 0, 'Jennifer', 'Anderson', CURRENT_TIMESTAMP, TRUE),
    ('user-housekeeping-006', 'william.housekeeping@hotel.com', 'WILLIAM.HOUSEKEEPING@HOTEL.COM', 'william.housekeeping@hotel.com', 'WILLIAM.HOUSEKEEPING@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash11', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0306', TRUE, FALSE, FALSE, 0, 'William', 'Thomas', CURRENT_TIMESTAMP, TRUE),
    ('user-housekeeping-007', 'linda.housekeeping@hotel.com', 'LINDA.HOUSEKEEPING@HOTEL.COM', 'linda.housekeeping@hotel.com', 'LINDA.HOUSEKEEPING@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash12', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0307', TRUE, FALSE, FALSE, 0, 'Linda', 'Jackson', CURRENT_TIMESTAMP, TRUE),
    ('user-housekeeping-008', 'richard.housekeeping@hotel.com', 'RICHARD.HOUSEKEEPING@HOTEL.COM', 'richard.housekeeping@hotel.com', 'RICHARD.HOUSEKEEPING@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash13', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0308', TRUE, FALSE, FALSE, 0, 'Richard', 'White', CURRENT_TIMESTAMP, TRUE),
    ('user-housekeeping-009', 'susan.housekeeping@hotel.com', 'SUSAN.HOUSEKEEPING@HOTEL.COM', 'susan.housekeeping@hotel.com', 'SUSAN.HOUSEKEEPING@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash14', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0309', TRUE, FALSE, FALSE, 0, 'Susan', 'Harris', CURRENT_TIMESTAMP, TRUE),
    ('user-housekeeping-010', 'joseph.housekeeping@hotel.com', 'JOSEPH.HOUSEKEEPING@HOTEL.COM', 'joseph.housekeeping@hotel.com', 'JOSEPH.HOUSEKEEPING@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash15', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0310', TRUE, FALSE, FALSE, 0, 'Joseph', 'Martin', CURRENT_TIMESTAMP, TRUE)
ON CONFLICT ("Id") DO NOTHING;

-- Insert Receptionist/Staff Users (5)
INSERT INTO "AspNetUsers" (
    "Id", "UserName", "NormalizedUserName", "Email", "NormalizedEmail",
    "EmailConfirmed", "PasswordHash", "SecurityStamp", "ConcurrencyStamp",
    "PhoneNumber", "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnabled",
    "AccessFailedCount", "FirstName", "LastName", "CreatedAt", "IsActive"
)
VALUES 
    ('user-reception-001', 'emily.reception@hotel.com', 'EMILY.RECEPTION@HOTEL.COM', 'emily.reception@hotel.com', 'EMILY.RECEPTION@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash16', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0401', TRUE, FALSE, FALSE, 0, 'Emily', 'Thompson', CURRENT_TIMESTAMP, TRUE),
    ('user-reception-002', 'chris.reception@hotel.com', 'CHRIS.RECEPTION@HOTEL.COM', 'chris.reception@hotel.com', 'CHRIS.RECEPTION@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash17', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0402', TRUE, FALSE, FALSE, 0, 'Christopher', 'Moore', CURRENT_TIMESTAMP, TRUE),
    ('user-reception-003', 'jessica.reception@hotel.com', 'JESSICA.RECEPTION@HOTEL.COM', 'jessica.reception@hotel.com', 'JESSICA.RECEPTION@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash18', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0403', TRUE, FALSE, FALSE, 0, 'Jessica', 'Clark', CURRENT_TIMESTAMP, TRUE),
    ('user-reception-004', 'daniel.reception@hotel.com', 'DANIEL.RECEPTION@HOTEL.COM', 'daniel.reception@hotel.com', 'DANIEL.RECEPTION@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash19', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0404', TRUE, FALSE, FALSE, 0, 'Daniel', 'Lewis', CURRENT_TIMESTAMP, TRUE),
    ('user-reception-005', 'ashley.reception@hotel.com', 'ASHLEY.RECEPTION@HOTEL.COM', 'ashley.reception@hotel.com', 'ASHLEY.RECEPTION@HOTEL.COM',
     TRUE, 'AQAAAAIAAYagAAAAEExampleHash20', gen_random_uuid()::text, gen_random_uuid()::text,
     '+1-555-0405', TRUE, FALSE, FALSE, 0, 'Ashley', 'Walker', CURRENT_TIMESTAMP, TRUE)
ON CONFLICT ("Id") DO NOTHING;

-- Assign Roles to Users
INSERT INTO "AspNetUserRoles" ("UserId", "RoleId")
VALUES 
    -- Admins
    ('user-admin-001', 'role-admin-001'),
    ('user-admin-002', 'role-admin-001'),
    -- Managers
    ('user-manager-001', 'role-manager-001'),
    ('user-manager-002', 'role-manager-001'),
    ('user-manager-003', 'role-manager-001'),
    -- Housekeeping
    ('user-housekeeping-001', 'role-housekeeping-001'),
    ('user-housekeeping-002', 'role-housekeeping-001'),
    ('user-housekeeping-003', 'role-housekeeping-001'),
    ('user-housekeeping-004', 'role-housekeeping-001'),
    ('user-housekeeping-005', 'role-housekeeping-001'),
    ('user-housekeeping-006', 'role-housekeeping-001'),
    ('user-housekeeping-007', 'role-housekeeping-001'),
    ('user-housekeeping-008', 'role-housekeeping-001'),
    ('user-housekeeping-009', 'role-housekeeping-001'),
    ('user-housekeeping-010', 'role-housekeeping-001'),
    -- Receptionists (assign Receptionist role)
    ('user-reception-001', 'role-reception-001'),
    ('user-reception-002', 'role-reception-001'),
    ('user-reception-003', 'role-reception-001'),
    ('user-reception-004', 'role-reception-001'),
    ('user-reception-005', 'role-reception-001')
ON CONFLICT DO NOTHING;

