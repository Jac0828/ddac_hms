-- ============================================
-- Seed Script 002: Room Types and Amenities
-- ============================================
-- Creates 10 room types and various amenities
-- PostgreSQL 17 compatible

-- Insert Room Types (10)
INSERT INTO "RoomTypes" ("Name", "Description", "BasePricePerNight", "MaxCapacity", "Size", "CreatedAt")
VALUES 
    ('Classic Single', 'Cozy single room perfect for solo travelers. Features a comfortable single bed and essential amenities.', 89.99, 1, '20 sqm', CURRENT_TIMESTAMP),
    ('Classic Double', 'Spacious double room with a queen-size bed. Ideal for couples or business travelers.', 129.99, 2, '28 sqm', CURRENT_TIMESTAMP),
    ('Deluxe King', 'Elegant room with a king-size bed and premium furnishings. Includes a sitting area.', 179.99, 2, '35 sqm', CURRENT_TIMESTAMP),
    ('Deluxe Twin', 'Comfortable twin room with two single beds. Perfect for friends or family traveling together.', 169.99, 2, '32 sqm', CURRENT_TIMESTAMP),
    ('Premier Suite', 'Luxurious suite with separate living area and bedroom. Features premium amenities and city views.', 299.99, 3, '55 sqm', CURRENT_TIMESTAMP),
    ('Family Room', 'Spacious family room with multiple beds. Accommodates up to 4 guests comfortably.', 229.99, 4, '45 sqm', CURRENT_TIMESTAMP),
    ('Executive Suite', 'Premium suite designed for business travelers. Includes a work desk and meeting area.', 349.99, 2, '60 sqm', CURRENT_TIMESTAMP),
    ('Presidential Suite', 'Ultra-luxurious suite with panoramic views, separate dining area, and premium services.', 599.99, 4, '120 sqm', CURRENT_TIMESTAMP),
    ('Ocean View Deluxe', 'Deluxe room with stunning ocean views. Features a private balcony.', 219.99, 2, '38 sqm', CURRENT_TIMESTAMP),
    ('Garden View Classic', 'Classic room overlooking the hotel gardens. Peaceful and serene atmosphere.', 149.99, 2, '30 sqm', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Insert Amenities
INSERT INTO "Amenities" ("Name", "Description", "Icon", "CreatedAt")
VALUES 
    ('Free WiFi', 'High-speed wireless internet access throughout the room', 'wifi', CURRENT_TIMESTAMP),
    ('Flat Screen TV', '42-inch LED TV with cable channels', 'tv', CURRENT_TIMESTAMP),
    ('Air Conditioning', 'Climate control system for optimal comfort', 'ac', CURRENT_TIMESTAMP),
    ('Mini Bar', 'Stocked mini bar with beverages and snacks', 'minibar', CURRENT_TIMESTAMP),
    ('Safe', 'In-room safe for valuables', 'safe', CURRENT_TIMESTAMP),
    ('Balcony', 'Private balcony with seating area', 'balcony', CURRENT_TIMESTAMP),
    ('Room Service', '24-hour room service available', 'room-service', CURRENT_TIMESTAMP),
    ('Coffee Maker', 'In-room coffee and tea making facilities', 'coffee', CURRENT_TIMESTAMP),
    ('Hair Dryer', 'Professional hair dryer provided', 'hair-dryer', CURRENT_TIMESTAMP),
    ('Work Desk', 'Ergonomic work desk with charging ports', 'desk', CURRENT_TIMESTAMP),
    ('Sitting Area', 'Comfortable seating area separate from bedroom', 'sofa', CURRENT_TIMESTAMP),
    ('Ocean View', 'Panoramic views of the ocean', 'ocean', CURRENT_TIMESTAMP),
    ('Garden View', 'Scenic views of hotel gardens', 'garden', CURRENT_TIMESTAMP),
    ('City View', 'Stunning views of the city skyline', 'city', CURRENT_TIMESTAMP),
    ('Jacuzzi', 'Private jacuzzi in suite', 'jacuzzi', CURRENT_TIMESTAMP),
    ('Kitchenette', 'Fully equipped kitchenette with appliances', 'kitchen', CURRENT_TIMESTAMP),
    ('Dining Area', 'Separate dining area for meals', 'dining', CURRENT_TIMESTAMP),
    ('Living Room', 'Spacious living room area', 'living-room', CURRENT_TIMESTAMP),
    ('Premium Bedding', 'Luxury linens and premium mattress', 'bed', CURRENT_TIMESTAMP),
    ('Bathrobe & Slippers', 'Complimentary bathrobe and slippers', 'robe', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

