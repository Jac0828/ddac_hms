-- ============================================
-- Seed Script 003: Rooms (50 rooms)
-- ============================================
-- Creates 50 rooms with mixed availability and room types
-- PostgreSQL 17 compatible

-- Insert 50 Rooms
INSERT INTO "Rooms" (
    "RoomNumber", "RoomTypeId", "PricePerNight", "Status", "Description", 
    "Capacity", "HasBalcony", "HasWifi", "HasTV", "HasAirConditioning", 
    "CreatedAt"
)
VALUES 
    -- Classic Single (5 rooms)
    ('101', 1, 89.99, 'Available', 'Cozy single room on first floor', 1, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('102', 1, 89.99, 'Available', 'Cozy single room with garden view', 1, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('103', 1, 89.99, 'Booked', 'Cozy single room - currently occupied', 1, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('104', 1, 89.99, 'Cleaning', 'Cozy single room - being cleaned', 1, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('105', 1, 89.99, 'Available', 'Cozy single room near elevator', 1, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    
    -- Classic Double (10 rooms)
    ('201', 2, 129.99, 'Available', 'Spacious double room with queen bed', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('202', 2, 129.99, 'Booked', 'Double room - guest checked in', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('203', 2, 129.99, 'Available', 'Double room with city view', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('204', 2, 129.99, 'Cleaning', 'Double room - post-checkout cleaning', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('205', 2, 129.99, 'Available', 'Double room corner unit', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('206', 2, 129.99, 'Booked', 'Double room - reservation confirmed', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('207', 2, 129.99, 'Available', 'Double room with extra space', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('208', 2, 129.99, 'Maintenance', 'Double room - minor repairs', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('209', 2, 129.99, 'Available', 'Double room quiet location', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('210', 2, 129.99, 'Booked', 'Double room - upcoming reservation', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    
    -- Deluxe King (8 rooms)
    ('301', 3, 179.99, 'Available', 'Elegant king room with premium amenities', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('302', 3, 179.99, 'Booked', 'King room - luxury guest', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('303', 3, 179.99, 'Available', 'King room with sitting area', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('304', 3, 179.99, 'Cleaning', 'King room - deep cleaning', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('305', 3, 179.99, 'Available', 'King room corner suite', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('306', 3, 179.99, 'Booked', 'King room - honeymoon suite', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('307', 3, 179.99, 'Available', 'King room premium location', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('308', 3, 179.99, 'Available', 'King room with balcony', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    
    -- Deluxe Twin (5 rooms)
    ('401', 4, 169.99, 'Available', 'Comfortable twin room for two', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('402', 4, 169.99, 'Booked', 'Twin room - business travelers', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('403', 4, 169.99, 'Available', 'Twin room with extra amenities', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('404', 4, 169.99, 'Cleaning', 'Twin room - post-stay service', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('405', 4, 169.99, 'Available', 'Twin room quiet wing', 2, FALSE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    
    -- Premier Suite (5 rooms)
    ('501', 5, 299.99, 'Available', 'Luxurious suite with separate living area', 3, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('502', 5, 299.99, 'Booked', 'Premier suite - VIP guest', 3, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('503', 5, 299.99, 'Available', 'Premier suite with city views', 3, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('504', 5, 299.99, 'Cleaning', 'Premier suite - full service', 3, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('505', 5, 299.99, 'Available', 'Premier suite corner unit', 3, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    
    -- Family Room (5 rooms)
    ('601', 6, 229.99, 'Available', 'Spacious family room for 4', 4, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('602', 6, 229.99, 'Booked', 'Family room - family of 4', 4, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('603', 6, 229.99, 'Available', 'Family room with extra beds', 4, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('604', 6, 229.99, 'Cleaning', 'Family room - extensive cleaning', 4, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('605', 6, 229.99, 'Available', 'Family room near pool', 4, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    
    -- Executive Suite (4 rooms)
    ('701', 7, 349.99, 'Available', 'Executive suite for business travelers', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('702', 7, 349.99, 'Booked', 'Executive suite - corporate guest', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('703', 7, 349.99, 'Available', 'Executive suite with office space', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('704', 7, 349.99, 'Available', 'Executive suite premium location', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    
    -- Presidential Suite (2 rooms)
    ('801', 8, 599.99, 'Available', 'Ultra-luxurious presidential suite', 4, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('802', 8, 599.99, 'Booked', 'Presidential suite - celebrity guest', 4, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    
    -- Ocean View Deluxe (3 rooms)
    ('901', 9, 219.99, 'Available', 'Deluxe room with ocean views', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('902', 9, 219.99, 'Booked', 'Ocean view room - romantic getaway', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('903', 9, 219.99, 'Available', 'Ocean view room premium balcony', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    
    -- Garden View Classic (3 rooms)
    ('1001', 10, 149.99, 'Available', 'Classic room with garden views', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('1002', 10, 149.99, 'Available', 'Garden view room peaceful location', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('1003', 10, 149.99, 'Booked', 'Garden view room - nature lover', 2, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP)
ON CONFLICT ("RoomNumber") DO NOTHING;

-- Associate Amenities with Rooms
-- Classic Single rooms get basic amenities
INSERT INTO "RoomAmenities" ("RoomId", "AmenityId")
SELECT r."Id", a."Id"
FROM "Rooms" r
CROSS JOIN "Amenities" a
WHERE r."RoomNumber" IN ('101', '102', '103', '104', '105')
  AND a."Name" IN ('Free WiFi', 'Flat Screen TV', 'Air Conditioning', 'Coffee Maker', 'Hair Dryer', 'Work Desk')
ON CONFLICT DO NOTHING;

-- Classic Double rooms get standard amenities
INSERT INTO "RoomAmenities" ("RoomId", "AmenityId")
SELECT r."Id", a."Id"
FROM "Rooms" r
CROSS JOIN "Amenities" a
WHERE r."RoomNumber" IN ('201', '202', '203', '204', '205', '206', '207', '208', '209', '210')
  AND a."Name" IN ('Free WiFi', 'Flat Screen TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Coffee Maker', 'Hair Dryer', 'Work Desk')
ON CONFLICT DO NOTHING;

-- Deluxe King rooms get premium amenities
INSERT INTO "RoomAmenities" ("RoomId", "AmenityId")
SELECT r."Id", a."Id"
FROM "Rooms" r
CROSS JOIN "Amenities" a
WHERE r."RoomNumber" IN ('301', '302', '303', '304', '305', '306', '307', '308')
  AND a."Name" IN ('Free WiFi', 'Flat Screen TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Balcony', 'Room Service', 'Coffee Maker', 'Hair Dryer', 'Work Desk', 'Sitting Area', 'Premium Bedding', 'Bathrobe & Slippers')
ON CONFLICT DO NOTHING;

-- Deluxe Twin rooms get standard amenities
INSERT INTO "RoomAmenities" ("RoomId", "AmenityId")
SELECT r."Id", a."Id"
FROM "Rooms" r
CROSS JOIN "Amenities" a
WHERE r."RoomNumber" IN ('401', '402', '403', '404', '405')
  AND a."Name" IN ('Free WiFi', 'Flat Screen TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Coffee Maker', 'Hair Dryer', 'Work Desk')
ON CONFLICT DO NOTHING;

-- Premier Suite rooms get luxury amenities
INSERT INTO "RoomAmenities" ("RoomId", "AmenityId")
SELECT r."Id", a."Id"
FROM "Rooms" r
CROSS JOIN "Amenities" a
WHERE r."RoomNumber" IN ('501', '502', '503', '504', '505')
  AND a."Name" IN ('Free WiFi', 'Flat Screen TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Balcony', 'Room Service', 'Coffee Maker', 'Hair Dryer', 'Work Desk', 'Sitting Area', 'Dining Area', 'Premium Bedding', 'Bathrobe & Slippers')
ON CONFLICT DO NOTHING;

-- Family Room rooms get family-friendly amenities
INSERT INTO "RoomAmenities" ("RoomId", "AmenityId")
SELECT r."Id", a."Id"
FROM "Rooms" r
CROSS JOIN "Amenities" a
WHERE r."RoomNumber" IN ('601', '602', '603', '604', '605')
  AND a."Name" IN ('Free WiFi', 'Flat Screen TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Balcony', 'Room Service', 'Coffee Maker', 'Hair Dryer', 'Work Desk', 'Sitting Area', 'Living Room')
ON CONFLICT DO NOTHING;

-- Executive Suite rooms get business amenities
INSERT INTO "RoomAmenities" ("RoomId", "AmenityId")
SELECT r."Id", a."Id"
FROM "Rooms" r
CROSS JOIN "Amenities" a
WHERE r."RoomNumber" IN ('701', '702', '703', '704')
  AND a."Name" IN ('Free WiFi', 'Flat Screen TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Balcony', 'Room Service', 'Coffee Maker', 'Hair Dryer', 'Work Desk', 'Sitting Area', 'Dining Area', 'City View', 'Premium Bedding', 'Bathrobe & Slippers')
ON CONFLICT DO NOTHING;

-- Presidential Suite rooms get all amenities
INSERT INTO "RoomAmenities" ("RoomId", "AmenityId")
SELECT r."Id", a."Id"
FROM "Rooms" r
CROSS JOIN "Amenities" a
WHERE r."RoomNumber" IN ('801', '802')
  AND a."Id" BETWEEN 1 AND 20
ON CONFLICT DO NOTHING;

-- Ocean View Deluxe rooms get ocean view amenities
INSERT INTO "RoomAmenities" ("RoomId", "AmenityId")
SELECT r."Id", a."Id"
FROM "Rooms" r
CROSS JOIN "Amenities" a
WHERE r."RoomNumber" IN ('901', '902', '903')
  AND a."Name" IN ('Free WiFi', 'Flat Screen TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Balcony', 'Room Service', 'Coffee Maker', 'Hair Dryer', 'Work Desk', 'Sitting Area', 'Ocean View', 'Premium Bedding', 'Bathrobe & Slippers')
ON CONFLICT DO NOTHING;

-- Garden View Classic rooms get garden view amenities
INSERT INTO "RoomAmenities" ("RoomId", "AmenityId")
SELECT r."Id", a."Id"
FROM "Rooms" r
CROSS JOIN "Amenities" a
WHERE r."RoomNumber" IN ('1001', '1002', '1003')
  AND a."Name" IN ('Free WiFi', 'Flat Screen TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Balcony', 'Room Service', 'Coffee Maker', 'Hair Dryer', 'Work Desk', 'Garden View', 'Premium Bedding')
ON CONFLICT DO NOTHING;

