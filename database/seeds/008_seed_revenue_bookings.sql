-- Seed revenue bookings for the last 7 days
DO $$
DECLARE
    user_exists boolean;
    room_exists boolean;
BEGIN
    -- Check if we have users and rooms
    SELECT EXISTS (SELECT 1 FROM "AspNetUsers") INTO user_exists;
    SELECT EXISTS (SELECT 1 FROM "Rooms") INTO room_exists;

    IF user_exists AND room_exists THEN
        -- Insert bookings for the last 7 days
        INSERT INTO "Bookings" (
            "UserId", "RoomId", "CheckInDate", "CheckOutDate", "TotalPrice",
            "PaymentStatus", "NumberOfGuests", "Status", "SpecialRequests",
            "CreatedAt", "UpdatedAt"
        )
        SELECT
            (SELECT "Id" FROM "AspNetUsers" ORDER BY random() LIMIT 1),
            (SELECT "Id" FROM "Rooms" ORDER BY random() LIMIT 1),
            day_date,
            day_date + INTERVAL '2 days',
            (random() * 200 + 100)::numeric(10,2), -- Price between 100 and 300
            1, -- Paid
            2,
            1, -- Confirmed
            'Revenue Seed Data',
            day_date + (random() * INTERVAL '12 hours'), -- CreatedAt matches the date
            day_date + (random() * INTERVAL '12 hours')
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') AS day_date
        CROSS JOIN generate_series(1, 5); -- 5 bookings per day

        -- Insert associated payments
        INSERT INTO "Payments" (
            "BookingId", "Amount", "PaymentMethod", "TransactionDate",
            "Status", "TransactionId", "CreatedAt"
        )
        SELECT
            b."Id",
            b."TotalPrice",
            0, -- CreditCard
            b."CreatedAt",
            1, -- Paid (assuming PaymentStatus enum is used here)
            'TXN-REV-' || b."Id",
            b."CreatedAt"
        FROM "Bookings" b
        WHERE b."SpecialRequests" = 'Revenue Seed Data'
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
