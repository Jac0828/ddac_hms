# Hotel Management System - Database Setup

This directory contains all SQL migrations, seed scripts, and documentation for the Hotel Management System database.

## 📁 Directory Structure

```
database/
├── migrations/          # SQL migration files
│   ├── 001_create_identity_tables.sql
│   └── 002_create_core_tables.sql
├── seeds/              # Seed data scripts
│   ├── 001_seed_roles_and_users.sql
│   ├── 002_seed_room_types_and_amenities.sql
│   ├── 003_seed_rooms.sql
│   ├── 004_seed_bookings_and_payments.sql
│   ├── 005_seed_housekeeping_and_services.sql
│   ├── 006_seed_staff_schedules.sql
│   └── 007_seed_activity_logs.sql
├── run_all.sh          # Master script to run everything
├── run_all_migrations.sh
├── verify_database.sql # Verification queries
├── ERD.md              # Entity Relationship Diagram
├── DBeaver_Connection_Guide.md
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites

1. **SSH Tunnel** running from localhost:5433 to your RDS database
2. **PostgreSQL Client** (`psql`) installed
3. **Database Credentials**:
   - Host: `localhost`
   - Port: `5433`
   - Database: `postgres`
   - Username: `postgres`
   - Password: `admin1234`

### Run Everything Automatically

```bash
cd database
./run_all.sh
```

This script will:
1. ✅ Test database connection
2. ✅ Run all migrations
3. ✅ Run all seed scripts
4. ✅ Verify data with counts

### Manual Execution

If you prefer to run scripts manually:

```bash
# Set password
export PGPASSWORD="admin1234"

# Run migrations
psql -h localhost -p 5433 -U postgres -d postgres -f migrations/001_create_identity_tables.sql
psql -h localhost -p 5433 -U postgres -d postgres -f migrations/002_create_core_tables.sql

# Run seeds
psql -h localhost -p 5433 -U postgres -d postgres -f seeds/001_seed_roles_and_users.sql
psql -h localhost -p 5433 -U postgres -d postgres -f seeds/002_seed_room_types_and_amenities.sql
psql -h localhost -p 5433 -U postgres -d postgres -f seeds/003_seed_rooms.sql
psql -h localhost -p 5433 -U postgres -d postgres -f seeds/004_seed_bookings_and_payments.sql
psql -h localhost -p 5433 -U postgres -d postgres -f seeds/005_seed_housekeeping_and_services.sql
psql -h localhost -p 5433 -U postgres -d postgres -f seeds/006_seed_staff_schedules.sql
psql -h localhost -p 5433 -U postgres -d postgres -f seeds/007_seed_activity_logs.sql

# Verify
psql -h localhost -p 5433 -U postgres -d postgres -f verify_database.sql
```

## 📊 Database Schema

### Tables Created

#### Identity Tables (ASP.NET Core Identity)
- `AspNetUsers` - User accounts with custom fields
- `AspNetRoles` - User roles (Admin, Manager, Housekeeping, Guest)
- `AspNetUserRoles` - User-role assignments
- `AspNetRoleClaims`, `AspNetUserClaims`, `AspNetUserLogins`, `AspNetUserTokens`

#### Core Tables
- `RoomTypes` - Room type definitions (10 types)
- `Amenities` - Available amenities (20 amenities)
- `Rooms` - Hotel rooms (50 rooms)
- `RoomAmenities` - Many-to-many relationship
- `Bookings` - Guest reservations (100 bookings)
- `Payments` - Payment transactions (100+ payments)
- `HousekeepingTasks` - Cleaning tasks (100+ tasks)
- `ServiceRequests` - Guest service requests (80 requests)
- `StaffSchedules` - Staff work schedules (360+ entries)
- `ActivityLogs` - System audit logs (500 logs)
- `Newsletters` - Hotel newsletters
- `NewsComments` - Newsletter comments
- `QueryTickets` - Support tickets

## 📈 Seed Data Summary

After running all seeds, you'll have:

- **4 Roles**: Admin, Manager, Housekeeping, Guest
- **70+ Users**: 
  - 2 Admins
  - 3 Managers
  - 10 Housekeeping staff
  - 5 Receptionists
  - 50 Guest accounts
- **10 Room Types**: From Classic Single to Presidential Suite
- **20 Amenities**: WiFi, TV, AC, Balcony, etc.
- **50 Rooms**: Mixed availability (Available, Booked, Cleaning, Maintenance)
- **100 Bookings**: Various statuses and dates
- **100+ Payments**: Multiple payment methods and statuses
- **100+ Housekeeping Tasks**: Assigned to staff
- **80 Service Requests**: Room service, maintenance, etc.
- **360+ Staff Schedules**: Next 30 days of schedules
- **500 Activity Logs**: System audit trail

## 🔍 Verification

Run the verification script to check all data:

```bash
psql -h localhost -p 5433 -U postgres -d postgres -f verify_database.sql
```

Or use the interactive verification:

```sql
-- Quick count check
SELECT 'AspNetUsers' AS table_name, COUNT(*) FROM "AspNetUsers"
UNION ALL SELECT 'Rooms', COUNT(*) FROM "Rooms"
UNION ALL SELECT 'Bookings', COUNT(*) FROM "Bookings"
UNION ALL SELECT 'Payments', COUNT(*) FROM "Payments";
```

## 📖 Documentation

- **[ERD.md](ERD.md)** - Entity Relationship Diagram with Mermaid syntax
- **[DBeaver_Connection_Guide.md](DBeaver_Connection_Guide.md)** - Step-by-step DBeaver connection instructions
- **[verify_database.sql](verify_database.sql)** - Comprehensive verification queries

## 🔧 Troubleshooting

### Connection Issues

**Error: Connection refused**
- Ensure SSH tunnel is running: `ssh -L 5433:rds-endpoint:5432 user@bastion`
- Check tunnel is forwarding to correct port

**Error: Authentication failed**
- Verify credentials match RDS database settings
- Check username/password are correct

**Error: SSL required**
- Add SSL mode to connection: `?SSL Mode=Require`

### Migration Issues

**Error: Table already exists**
- Tables use `CREATE TABLE IF NOT EXISTS` - safe to re-run
- Use `DROP TABLE IF EXISTS` if you need to reset

**Error: Foreign key constraint**
- Ensure migrations run in order (001 → 002)
- Check seed scripts run after migrations

### Seed Issues

**Error: Duplicate key**
- Seeds use `ON CONFLICT DO NOTHING` - safe to re-run
- Some data may already exist from previous runs

## 🗄️ Database Connection Details

```
Host: localhost (via SSH tunnel)
Port: 5433
Database: postgres
Username: postgres
Password: admin1234
SSL Mode: Require (if connecting directly to RDS)
```

## 📝 Notes

- All SQL scripts are PostgreSQL 17 compatible
- Scripts use `IF NOT EXISTS` and `ON CONFLICT DO NOTHING` for idempotency
- Foreign keys use appropriate `ON DELETE` behaviors:
  - `RESTRICT`: Prevents deletion (Bookings, Payments)
  - `SET NULL`: Allows deletion, sets FK to NULL (AssignedStaffId)
  - `CASCADE`: Deletes related records (NewsComments)
- All tables include indexes on foreign keys and frequently queried columns
- Timestamps use `TIMESTAMP WITH TIME ZONE` for proper timezone handling

## 🔐 Security Notes

- Never commit database passwords to version control
- Use environment variables for sensitive credentials
- Regularly rotate database passwords
- Use SSH key authentication for bastion access
- Enable SSL/TLS for database connections

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the ERD diagram for schema understanding
3. Verify connection using DBeaver guide
4. Check database logs for detailed error messages

