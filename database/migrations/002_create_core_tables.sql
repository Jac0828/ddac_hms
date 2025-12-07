-- ============================================
-- Migration 002: Create Core Hotel Management Tables
-- ============================================
-- PostgreSQL 17 compatible

-- Create RoomTypes table
CREATE TABLE IF NOT EXISTS "RoomTypes" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL UNIQUE,
    "Description" TEXT,
    "BasePricePerNight" DECIMAL(10, 2) NOT NULL,
    "MaxCapacity" INTEGER NOT NULL DEFAULT 2,
    "Size" VARCHAR(50), -- e.g., "25 sqm", "35 sqm"
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE
);

-- Create Amenities table
CREATE TABLE IF NOT EXISTS "Amenities" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL UNIQUE,
    "Description" TEXT,
    "Icon" VARCHAR(50), -- Icon identifier for UI
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Rooms table
CREATE TABLE IF NOT EXISTS "Rooms" (
    "Id" SERIAL PRIMARY KEY,
    "RoomNumber" VARCHAR(20) NOT NULL UNIQUE,
    "RoomTypeId" INTEGER NOT NULL,
    "PricePerNight" DECIMAL(10, 2) NOT NULL,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Available', -- Available, Booked, Cleaning, Maintenance
    "Description" TEXT,
    "Capacity" INTEGER NOT NULL DEFAULT 2,
    "HasBalcony" BOOLEAN NOT NULL DEFAULT FALSE,
    "HasWifi" BOOLEAN NOT NULL DEFAULT TRUE,
    "HasTV" BOOLEAN NOT NULL DEFAULT TRUE,
    "HasAirConditioning" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    CONSTRAINT "FK_Rooms_RoomTypes_RoomTypeId" 
        FOREIGN KEY ("RoomTypeId") REFERENCES "RoomTypes"("Id") ON DELETE RESTRICT
);

-- Create RoomAmenities junction table (Many-to-Many)
CREATE TABLE IF NOT EXISTS "RoomAmenities" (
    "RoomId" INTEGER NOT NULL,
    "AmenityId" INTEGER NOT NULL,
    CONSTRAINT "PK_RoomAmenities" PRIMARY KEY ("RoomId", "AmenityId"),
    CONSTRAINT "FK_RoomAmenities_Rooms_RoomId" 
        FOREIGN KEY ("RoomId") REFERENCES "Rooms"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_RoomAmenities_Amenities_AmenityId" 
        FOREIGN KEY ("AmenityId") REFERENCES "Amenities"("Id") ON DELETE CASCADE
);

-- Create Bookings table
CREATE TABLE IF NOT EXISTS "Bookings" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" TEXT NOT NULL,
    "RoomId" INTEGER NOT NULL,
    "CheckInDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "CheckOutDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "TotalPrice" DECIMAL(10, 2) NOT NULL,
    "PaymentStatus" VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Paid, Refunded
    "NumberOfGuests" INTEGER NOT NULL DEFAULT 1,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Confirmed, CheckedIn, CheckedOut, Cancelled
    "SpecialRequests" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    CONSTRAINT "FK_Bookings_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Bookings_Rooms_RoomId" 
        FOREIGN KEY ("RoomId") REFERENCES "Rooms"("Id") ON DELETE RESTRICT,
    CONSTRAINT "CK_Bookings_CheckOutAfterCheckIn" 
        CHECK ("CheckOutDate" > "CheckInDate"),
    CONSTRAINT "CK_Bookings_PositiveGuests" 
        CHECK ("NumberOfGuests" > 0)
);

-- Create Payments table
CREATE TABLE IF NOT EXISTS "Payments" (
    "Id" SERIAL PRIMARY KEY,
    "BookingId" INTEGER NOT NULL,
    "Amount" DECIMAL(10, 2) NOT NULL,
    "PaymentMethod" VARCHAR(50) NOT NULL, -- CreditCard, DebitCard, Cash, BankTransfer
    "TransactionDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Completed, Failed, Refunded
    "TransactionId" VARCHAR(255),
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Payments_Bookings_BookingId" 
        FOREIGN KEY ("BookingId") REFERENCES "Bookings"("Id") ON DELETE RESTRICT,
    CONSTRAINT "CK_Payments_PositiveAmount" 
        CHECK ("Amount" > 0)
);

-- Create HousekeepingTasks table
CREATE TABLE IF NOT EXISTS "HousekeepingTasks" (
    "Id" SERIAL PRIMARY KEY,
    "RoomId" INTEGER NOT NULL,
    "AssignedStaffId" TEXT, -- Nullable - can be unassigned
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, InProgress, Completed
    "Notes" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_HousekeepingTasks_Rooms_RoomId" 
        FOREIGN KEY ("RoomId") REFERENCES "Rooms"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_HousekeepingTasks_AspNetUsers_AssignedStaffId" 
        FOREIGN KEY ("AssignedStaffId") REFERENCES "AspNetUsers"("Id") ON DELETE SET NULL
);

-- Create ServiceRequests table
CREATE TABLE IF NOT EXISTS "ServiceRequests" (
    "Id" SERIAL PRIMARY KEY,
    "BookingId" INTEGER NOT NULL,
    "UserId" TEXT NOT NULL,
    "ServiceType" VARCHAR(100) NOT NULL, -- RoomService, Housekeeping, Maintenance, Laundry, etc.
    "Description" TEXT NOT NULL,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, InProgress, Completed, Cancelled
    "AssignedToUserId" TEXT, -- RoomAttendant or other staff
    "RequestedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CompletedAt" TIMESTAMP WITH TIME ZONE,
    "Notes" TEXT,
    CONSTRAINT "FK_ServiceRequests_Bookings_BookingId" 
        FOREIGN KEY ("BookingId") REFERENCES "Bookings"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_ServiceRequests_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_ServiceRequests_AspNetUsers_AssignedToUserId" 
        FOREIGN KEY ("AssignedToUserId") REFERENCES "AspNetUsers"("Id") ON DELETE SET NULL
);

-- Create StaffSchedules table
CREATE TABLE IF NOT EXISTS "StaffSchedules" (
    "Id" SERIAL PRIMARY KEY,
    "StaffId" TEXT NOT NULL,
    "WorkDate" DATE NOT NULL,
    "StartTime" TIME NOT NULL,
    "EndTime" TIME NOT NULL,
    "ShiftType" VARCHAR(50), -- Morning, Afternoon, Night, FullDay
    "Notes" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    CONSTRAINT "FK_StaffSchedules_AspNetUsers_StaffId" 
        FOREIGN KEY ("StaffId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_StaffSchedules_EndAfterStart" 
        CHECK ("EndTime" > "StartTime")
);

-- Create ActivityLogs table
CREATE TABLE IF NOT EXISTS "ActivityLogs" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" TEXT NOT NULL,
    "Action" VARCHAR(255) NOT NULL, -- e.g., "Created Booking", "Updated Room Status"
    "EntityType" VARCHAR(100) NOT NULL, -- e.g., "Booking", "Room", "User"
    "EntityId" INTEGER,
    "Details" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_ActivityLogs_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE RESTRICT
);

-- Create Newsletters table
CREATE TABLE IF NOT EXISTS "Newsletters" (
    "Id" SERIAL PRIMARY KEY,
    "Title" VARCHAR(255) NOT NULL,
    "Content" TEXT NOT NULL,
    "ImageUrl" VARCHAR(500),
    "CreatedByUserId" TEXT NOT NULL, -- Manager who created it
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    "IsPublished" BOOLEAN NOT NULL DEFAULT FALSE,
    "PublishedAt" TIMESTAMP WITH TIME ZONE,
    CONSTRAINT "FK_Newsletters_AspNetUsers_CreatedByUserId" 
        FOREIGN KEY ("CreatedByUserId") REFERENCES "AspNetUsers"("Id") ON DELETE RESTRICT
);

-- Create NewsComments table
CREATE TABLE IF NOT EXISTS "NewsComments" (
    "Id" SERIAL PRIMARY KEY,
    "NewsletterId" INTEGER NOT NULL,
    "UserId" TEXT NOT NULL,
    "Content" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "FK_NewsComments_Newsletters_NewsletterId" 
        FOREIGN KEY ("NewsletterId") REFERENCES "Newsletters"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_NewsComments_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE RESTRICT
);

-- Create QueryTickets table
CREATE TABLE IF NOT EXISTS "QueryTickets" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" TEXT NOT NULL,
    "Subject" VARCHAR(255) NOT NULL,
    "Description" TEXT NOT NULL,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Open', -- Open, InProgress, Resolved, Closed
    "AssignedToUserId" TEXT, -- Receptionist or Manager
    "Response" TEXT,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ResolvedAt" TIMESTAMP WITH TIME ZONE,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    CONSTRAINT "FK_QueryTickets_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_QueryTickets_AspNetUsers_AssignedToUserId" 
        FOREIGN KEY ("AssignedToUserId") REFERENCES "AspNetUsers"("Id") ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "IX_Rooms_RoomTypeId" ON "Rooms"("RoomTypeId");
CREATE INDEX IF NOT EXISTS "IX_Rooms_RoomNumber" ON "Rooms"("RoomNumber");
CREATE INDEX IF NOT EXISTS "IX_Rooms_Status" ON "Rooms"("Status");
CREATE INDEX IF NOT EXISTS "IX_RoomAmenities_RoomId" ON "RoomAmenities"("RoomId");
CREATE INDEX IF NOT EXISTS "IX_RoomAmenities_AmenityId" ON "RoomAmenities"("AmenityId");
CREATE INDEX IF NOT EXISTS "IX_Bookings_UserId" ON "Bookings"("UserId");
CREATE INDEX IF NOT EXISTS "IX_Bookings_RoomId" ON "Bookings"("RoomId");
CREATE INDEX IF NOT EXISTS "IX_Bookings_CheckInDate" ON "Bookings"("CheckInDate");
CREATE INDEX IF NOT EXISTS "IX_Bookings_CheckOutDate" ON "Bookings"("CheckOutDate");
CREATE INDEX IF NOT EXISTS "IX_Bookings_Status" ON "Bookings"("Status");
CREATE INDEX IF NOT EXISTS "IX_Payments_BookingId" ON "Payments"("BookingId");
CREATE INDEX IF NOT EXISTS "IX_Payments_Status" ON "Payments"("Status");
CREATE INDEX IF NOT EXISTS "IX_HousekeepingTasks_RoomId" ON "HousekeepingTasks"("RoomId");
CREATE INDEX IF NOT EXISTS "IX_HousekeepingTasks_AssignedStaffId" ON "HousekeepingTasks"("AssignedStaffId");
CREATE INDEX IF NOT EXISTS "IX_HousekeepingTasks_Status" ON "HousekeepingTasks"("Status");
CREATE INDEX IF NOT EXISTS "IX_ServiceRequests_BookingId" ON "ServiceRequests"("BookingId");
CREATE INDEX IF NOT EXISTS "IX_ServiceRequests_UserId" ON "ServiceRequests"("UserId");
CREATE INDEX IF NOT EXISTS "IX_ServiceRequests_AssignedToUserId" ON "ServiceRequests"("AssignedToUserId");
CREATE INDEX IF NOT EXISTS "IX_ServiceRequests_Status" ON "ServiceRequests"("Status");
CREATE INDEX IF NOT EXISTS "IX_StaffSchedules_StaffId" ON "StaffSchedules"("StaffId");
CREATE INDEX IF NOT EXISTS "IX_StaffSchedules_WorkDate" ON "StaffSchedules"("WorkDate");
CREATE INDEX IF NOT EXISTS "IX_ActivityLogs_UserId" ON "ActivityLogs"("UserId");
CREATE INDEX IF NOT EXISTS "IX_ActivityLogs_EntityType" ON "ActivityLogs"("EntityType");
CREATE INDEX IF NOT EXISTS "IX_Newsletters_CreatedByUserId" ON "Newsletters"("CreatedByUserId");
CREATE INDEX IF NOT EXISTS "IX_NewsComments_NewsletterId" ON "NewsComments"("NewsletterId");
CREATE INDEX IF NOT EXISTS "IX_NewsComments_UserId" ON "NewsComments"("UserId");
CREATE INDEX IF NOT EXISTS "IX_QueryTickets_UserId" ON "QueryTickets"("UserId");
CREATE INDEX IF NOT EXISTS "IX_QueryTickets_AssignedToUserId" ON "QueryTickets"("AssignedToUserId");
CREATE INDEX IF NOT EXISTS "IX_QueryTickets_Status" ON "QueryTickets"("Status");

-- Add comments
COMMENT ON TABLE "RoomTypes" IS 'Types of rooms available (Single, Double, Suite, etc.)';
COMMENT ON TABLE "Amenities" IS 'Available amenities that can be associated with rooms';
COMMENT ON TABLE "Rooms" IS 'Hotel rooms with details and status';
COMMENT ON TABLE "Bookings" IS 'Guest room reservations';
COMMENT ON TABLE "Payments" IS 'Payment transactions for bookings';
COMMENT ON TABLE "HousekeepingTasks" IS 'Housekeeping tasks assigned to staff';
COMMENT ON TABLE "ServiceRequests" IS 'Guest service requests';
COMMENT ON TABLE "StaffSchedules" IS 'Staff work schedules';
COMMENT ON TABLE "ActivityLogs" IS 'System activity audit log';
COMMENT ON TABLE "Newsletters" IS 'Hotel newsletters/news posts';
COMMENT ON TABLE "NewsComments" IS 'Comments on newsletters';
COMMENT ON TABLE "QueryTickets" IS 'Guest query/support tickets';

