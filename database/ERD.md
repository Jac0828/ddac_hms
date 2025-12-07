# Hotel Management System - Entity Relationship Diagram (ERD)

## Database Schema Overview

This document describes the Entity Relationship Diagram for the Hotel Management System database.

## Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    AspNetUsers ||--o{ AspNetUserRoles : has
    AspNetRoles ||--o{ AspNetUserRoles : assigned_to
    AspNetUsers ||--o{ Bookings : makes
    AspNetUsers ||--o{ ServiceRequests : requests
    AspNetUsers ||--o{ HousekeepingTasks : assigned_to
    AspNetUsers ||--o{ StaffSchedules : works
    AspNetUsers ||--o{ ActivityLogs : performs
    AspNetUsers ||--o{ Newsletters : creates
    AspNetUsers ||--o{ NewsComments : writes
    AspNetUsers ||--o{ QueryTickets : submits
    
    RoomTypes ||--o{ Rooms : categorizes
    Rooms ||--o{ Bookings : booked_in
    Rooms ||--o{ HousekeepingTasks : requires
    Rooms ||--o{ RoomAmenities : has
    Amenities ||--o{ RoomAmenities : included_in
    
    Bookings ||--o{ Payments : paid_by
    Bookings ||--o{ ServiceRequests : generates
    
    AspNetUsers {
        text Id PK
        varchar UserName
        varchar Email
        varchar FirstName
        varchar LastName
        timestamp CreatedAt
        boolean IsActive
    }
    
    AspNetRoles {
        text Id PK
        varchar Name
        varchar NormalizedName
    }
    
    RoomTypes {
        int Id PK
        varchar Name UK
        text Description
        decimal BasePricePerNight
        int MaxCapacity
        varchar Size
    }
    
    Rooms {
        int Id PK
        varchar RoomNumber UK
        int RoomTypeId FK
        decimal PricePerNight
        varchar Status
        text Description
        int Capacity
        boolean HasBalcony
        boolean HasWifi
        boolean HasTV
        boolean HasAirConditioning
    }
    
    Amenities {
        int Id PK
        varchar Name UK
        text Description
        varchar Icon
    }
    
    RoomAmenities {
        int RoomId PK,FK
        int AmenityId PK,FK
    }
    
    Bookings {
        int Id PK
        text UserId FK
        int RoomId FK
        timestamp CheckInDate
        timestamp CheckOutDate
        decimal TotalPrice
        varchar PaymentStatus
        int NumberOfGuests
        varchar Status
        text SpecialRequests
    }
    
    Payments {
        int Id PK
        int BookingId FK
        decimal Amount
        varchar PaymentMethod
        timestamp TransactionDate
        varchar Status
        varchar TransactionId
    }
    
    HousekeepingTasks {
        int Id PK
        int RoomId FK
        text AssignedStaffId FK
        varchar Status
        text Notes
    }
    
    ServiceRequests {
        int Id PK
        int BookingId FK
        text UserId FK
        varchar ServiceType
        text Description
        varchar Status
        text AssignedToUserId FK
        timestamp RequestedAt
        timestamp CompletedAt
    }
    
    StaffSchedules {
        int Id PK
        text StaffId FK
        date WorkDate
        time StartTime
        time EndTime
        varchar ShiftType
        text Notes
    }
    
    ActivityLogs {
        int Id PK
        text UserId FK
        varchar Action
        varchar EntityType
        int EntityId
        text Details
        timestamp CreatedAt
    }
    
    Newsletters {
        int Id PK
        varchar Title
        text Content
        varchar ImageUrl
        text CreatedByUserId FK
        boolean IsPublished
        timestamp PublishedAt
    }
    
    NewsComments {
        int Id PK
        int NewsletterId FK
        text UserId FK
        text Content
        boolean IsDeleted
    }
    
    QueryTickets {
        int Id PK
        text UserId FK
        varchar Subject
        text Description
        varchar Status
        text AssignedToUserId FK
        text Response
    }
```

## Table Relationships

### Core Relationships

1. **Users & Roles** (Many-to-Many)
   - `AspNetUsers` ↔ `AspNetUserRoles` ↔ `AspNetRoles`
   - Users can have multiple roles (Admin, Manager, Housekeeping, Guest)

2. **Rooms & Room Types** (Many-to-One)
   - `Rooms` → `RoomTypes`
   - Each room belongs to one room type
   - Each room type can have multiple rooms

3. **Rooms & Amenities** (Many-to-Many)
   - `Rooms` ↔ `RoomAmenities` ↔ `Amenities`
   - Rooms can have multiple amenities
   - Amenities can be associated with multiple rooms

4. **Bookings & Users** (Many-to-One)
   - `Bookings` → `AspNetUsers`
   - Each booking belongs to one user (guest)
   - Users can have multiple bookings

5. **Bookings & Rooms** (Many-to-One)
   - `Bookings` → `Rooms`
   - Each booking is for one room
   - Rooms can have multiple bookings (over time)

6. **Payments & Bookings** (Many-to-One)
   - `Payments` → `Bookings`
   - Each payment is associated with one booking
   - Bookings can have multiple payments (partial payments, refunds)

7. **Housekeeping Tasks & Rooms** (Many-to-One)
   - `HousekeepingTasks` → `Rooms`
   - Each task is for one room
   - Rooms can have multiple tasks

8. **Housekeeping Tasks & Staff** (Many-to-One, Optional)
   - `HousekeepingTasks` → `AspNetUsers` (AssignedStaffId)
   - Tasks can be assigned to staff members
   - Staff can have multiple assigned tasks

9. **Service Requests & Bookings** (Many-to-One)
   - `ServiceRequests` → `Bookings`
   - Each service request is associated with one booking
   - Bookings can generate multiple service requests

10. **Service Requests & Users** (Many-to-One)
    - `ServiceRequests` → `AspNetUsers` (UserId - requester)
    - `ServiceRequests` → `AspNetUsers` (AssignedToUserId - assigned staff)

11. **Staff Schedules & Users** (Many-to-One)
    - `StaffSchedules` → `AspNetUsers`
    - Each schedule entry is for one staff member
    - Staff can have multiple schedule entries

## Key Constraints

- **Foreign Key Constraints**: All foreign keys are properly defined with appropriate ON DELETE behaviors
  - `RESTRICT`: Prevents deletion if related records exist (Bookings, Payments)
  - `SET NULL`: Allows deletion, sets foreign key to NULL (AssignedStaffId)
  - `CASCADE`: Deletes related records (NewsComments when Newsletter deleted)

- **Check Constraints**:
  - `Bookings`: CheckOutDate > CheckInDate
  - `Bookings`: NumberOfGuests > 0
  - `Payments`: Amount > 0
  - `StaffSchedules`: EndTime > StartTime

- **Unique Constraints**:
  - `Rooms.RoomNumber`: Unique room numbers
  - `RoomTypes.Name`: Unique room type names
  - `Amenities.Name`: Unique amenity names

## Indexes

All foreign keys and frequently queried columns have indexes for optimal performance:
- User lookups (Email, UserName)
- Room queries (RoomNumber, Status, RoomTypeId)
- Booking queries (UserId, RoomId, CheckInDate, CheckOutDate, Status)
- Payment queries (BookingId, Status)
- Housekeeping queries (RoomId, AssignedStaffId, Status)
- Service request queries (BookingId, UserId, Status)

