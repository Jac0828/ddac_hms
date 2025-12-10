using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using HMS.Domain.Models;
using HMS.Domain.Enums;
using HMS.Infrastructure.Data;

namespace HMS.Api.Data;

public static class SeedData
{
    public static async Task SeedRolesAndUsers(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Seed Roles
        string[] roles = { "Customer", "Receptionist", "Housekeeping", "Manager", "Admin" };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // Seed Admin (1)
        if (await userManager.FindByEmailAsync("admin@hms.com") == null)
        {
            var admin = new AppUser
            {
                UserName = "admin@hms.com",
                Email = "admin@hms.com",
                FirstName = "Admin",
                LastName = "User",
                PhoneNumber = "+1234567890",
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(admin, "Admin@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
            }
            else
            {
                var loggerFactory = serviceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILoggerFactory>();
                var logger = loggerFactory.CreateLogger("SeedData");
                logger.LogWarning("Failed to create admin user: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        // Seed Manager (1)
        if (await userManager.FindByEmailAsync("manager@hms.com") == null)
        {
            var manager = new AppUser
            {
                UserName = "manager@hms.com",
                Email = "manager@hms.com",
                FirstName = "John",
                LastName = "Manager",
                PhoneNumber = "+1234567891",
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(manager, "Manager@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(manager, "Manager");
            }
        }

        // Seed Receptionists (2)
        var receptionists = new[]
        {
            new { Email = "receptionist1@hms.com", FirstName = "Sarah", LastName = "Receptionist", Phone = "+1234567892" },
            new { Email = "receptionist2@hms.com", FirstName = "Michael", LastName = "Receptionist", Phone = "+1234567893" }
        };

        foreach (var rec in receptionists)
        {
            if (await userManager.FindByEmailAsync(rec.Email) == null)
            {
                var receptionist = new AppUser
                {
                    UserName = rec.Email,
                    Email = rec.Email,
                    FirstName = rec.FirstName,
                    LastName = rec.LastName,
                    PhoneNumber = rec.Phone,
                    EmailConfirmed = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(receptionist, "Receptionist@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(receptionist, "Receptionist");
                }
            }
        }

        // Seed Housekeeping Staff (3)
        var housekeepingStaff = new[]
        {
            new { Email = "housekeeping1@hms.com", FirstName = "Maria", LastName = "Garcia", Phone = "+1234567894" },
            new { Email = "housekeeping2@hms.com", FirstName = "James", LastName = "Wilson", Phone = "+1234567895" },
            new { Email = "housekeeping3@hms.com", FirstName = "Lisa", LastName = "Anderson", Phone = "+1234567896" }
        };

        foreach (var staff in housekeepingStaff)
        {
            if (await userManager.FindByEmailAsync(staff.Email) == null)
            {
                var housekeeper = new AppUser
                {
                    UserName = staff.Email,
                    Email = staff.Email,
                    FirstName = staff.FirstName,
                    LastName = staff.LastName,
                    PhoneNumber = staff.Phone,
                    EmailConfirmed = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(housekeeper, "Housekeeping@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(housekeeper, "Housekeeping");
                }
            }
        }

        // Guest accounts are created through registration, not seeded
        // Customers can register themselves via the registration page

        // Seed RoomTypes (if not already seeded)
        if (!await context.RoomTypes.AnyAsync())
        {
            var roomTypes = new List<RoomType>
            {
                new RoomType 
                { 
                    Name = "Classic Single", 
                    Description = "Standard room with one single bed", 
                    BasePricePerNight = 100, 
                    MaxCapacity = 1, 
                    Size = "20 sqm", 
                    CreatedAt = DateTime.UtcNow 
                },
                new RoomType 
                { 
                    Name = "Classic Double", 
                    Description = "Standard room with one double bed", 
                    BasePricePerNight = 120, 
                    MaxCapacity = 2, 
                    Size = "25 sqm", 
                    CreatedAt = DateTime.UtcNow 
                },
                new RoomType 
                { 
                    Name = "Deluxe King", 
                    Description = "Spacious room with a king-size bed and city views", 
                    BasePricePerNight = 180, 
                    MaxCapacity = 2, 
                    Size = "30 sqm", 
                    CreatedAt = DateTime.UtcNow 
                },
                new RoomType 
                { 
                    Name = "Deluxe Twin", 
                    Description = "Spacious room with two twin beds and city views", 
                    BasePricePerNight = 180, 
                    MaxCapacity = 2, 
                    Size = "30 sqm", 
                    CreatedAt = DateTime.UtcNow 
                },
                new RoomType 
                { 
                    Name = "Premier Suite", 
                    Description = "Luxury suite with separate living area and premium amenities", 
                    BasePricePerNight = 250, 
                    MaxCapacity = 3, 
                    Size = "45 sqm", 
                    CreatedAt = DateTime.UtcNow 
                },
                new RoomType 
                { 
                    Name = "Family Room", 
                    Description = "Large room with multiple beds, ideal for families", 
                    BasePricePerNight = 320, 
                    MaxCapacity = 4, 
                    Size = "50 sqm", 
                    CreatedAt = DateTime.UtcNow 
                },
                new RoomType 
                { 
                    Name = "Executive Suite", 
                    Description = "High-end suite with executive lounge access", 
                    BasePricePerNight = 400, 
                    MaxCapacity = 2, 
                    Size = "60 sqm", 
                    CreatedAt = DateTime.UtcNow 
                },
                new RoomType 
                { 
                    Name = "Presidential Suite", 
                    Description = "Ultimate luxury with multiple rooms, private butler service", 
                    BasePricePerNight = 800, 
                    MaxCapacity = 4, 
                    Size = "100 sqm", 
                    CreatedAt = DateTime.UtcNow 
                },
                new RoomType 
                { 
                    Name = "Ocean View Deluxe", 
                    Description = "Deluxe room with stunning ocean views", 
                    BasePricePerNight = 200, 
                    MaxCapacity = 2, 
                    Size = "35 sqm", 
                    CreatedAt = DateTime.UtcNow 
                },
                new RoomType 
                { 
                    Name = "Garden View Classic", 
                    Description = "Classic room with serene garden views", 
                    BasePricePerNight = 110, 
                    MaxCapacity = 2, 
                    Size = "25 sqm", 
                    CreatedAt = DateTime.UtcNow 
                }
            };
            
            await context.RoomTypes.AddRangeAsync(roomTypes);
            await context.SaveChangesAsync();
        }

        // Seed Rooms (30 luxury rooms)
        // Only clear existing rooms in development environment to prevent data loss in production
        var environment = serviceProvider.GetRequiredService<Microsoft.Extensions.Hosting.IHostEnvironment>();
        var existingRooms = await context.Rooms.ToListAsync();
        if (existingRooms.Any() && environment.IsDevelopment())
        {
            // Delete bookings first (due to foreign key constraint)
            var bookingsWithRooms = await context.Bookings
                .Where(b => existingRooms.Select(r => r.Id).Contains(b.RoomId))
                .ToListAsync();

            if (bookingsWithRooms.Any())
            {
                // Delete payments associated with bookings
                var bookingIds = bookingsWithRooms.Select(b => b.Id).ToList();
                var payments = await context.Payments
                    .Where(p => bookingIds.Contains(p.BookingId))
                    .ToListAsync();
                context.Payments.RemoveRange(payments);

                // Delete service requests associated with bookings
                var serviceRequests = await context.ServiceRequests
                    .Where(sr => bookingIds.Contains(sr.BookingId))
                    .ToListAsync();
                context.ServiceRequests.RemoveRange(serviceRequests);

                // Delete bookings
                context.Bookings.RemoveRange(bookingsWithRooms);
            }
            
            // Delete housekeeping tasks
            var tasksWithRooms = await context.HousekeepingTasks
                .Where(t => existingRooms.Select(r => r.Id).Contains(t.RoomId))
                .ToListAsync();
            context.HousekeepingTasks.RemoveRange(tasksWithRooms);
            
            // Delete rooms
            context.Rooms.RemoveRange(existingRooms);
            await context.SaveChangesAsync();
        }
        else if (existingRooms.Any() && !environment.IsDevelopment())
        {
            // In production, skip seeding rooms if they already exist
            return;
        }
        
        // Now seed fresh rooms
        if (!await context.Rooms.AnyAsync())
        {
            // Get RoomType IDs from database (should exist after seeding RoomTypes)
            var classicDoubleType = await context.RoomTypes.FirstOrDefaultAsync(rt => rt.Name == "Classic Double");
            var deluxeKingType = await context.RoomTypes.FirstOrDefaultAsync(rt => rt.Name == "Deluxe King");
            var premierSuiteType = await context.RoomTypes.FirstOrDefaultAsync(rt => rt.Name == "Premier Suite");
            var executiveSuiteType = await context.RoomTypes.FirstOrDefaultAsync(rt => rt.Name == "Executive Suite");
            var familyRoomType = await context.RoomTypes.FirstOrDefaultAsync(rt => rt.Name == "Family Room");
            var deluxeTwinType = await context.RoomTypes.FirstOrDefaultAsync(rt => rt.Name == "Deluxe Twin");
            
            // Validate RoomTypes exist before creating rooms
            if (classicDoubleType == null || deluxeKingType == null || premierSuiteType == null || 
                executiveSuiteType == null || familyRoomType == null || deluxeTwinType == null)
            {
                var loggerFactory = serviceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILoggerFactory>();
                var logger = loggerFactory.CreateLogger("SeedData");
                logger.LogError("Required RoomTypes not found. Please seed RoomTypes first.");
                return; // Don't create rooms if RoomTypes don't exist
            }
            
            var defaultClassicId = classicDoubleType.Id;
            var defaultDeluxeId = deluxeKingType.Id;
            var defaultPremierId = premierSuiteType.Id;
            var defaultSuiteId = executiveSuiteType.Id;
            var defaultFamilyId = familyRoomType.Id;
            var defaultTwinId = deluxeTwinType.Id;
            
            var rooms = new List<Room>
            {
                // Classic Rooms (Floor 1)
                new Room { RoomNumber = "101", RoomTypeId = defaultClassicId, PricePerNight = 120, Status = RoomStatus.Available, Capacity = 2, Description = "Elegant accommodation with timeless charm and city views", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "102", RoomTypeId = defaultClassicId, PricePerNight = 120, Status = RoomStatus.Available, Capacity = 2, Description = "Classic room featuring traditional elegance and modern amenities", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "103", RoomTypeId = defaultClassicId, PricePerNight = 120, Status = RoomStatus.Booked, Capacity = 2, Description = "Spacious classic room with balcony overlooking the city", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "104", RoomTypeId = defaultClassicId, PricePerNight = 120, Status = RoomStatus.Available, Capacity = 2, Description = "Comfortable classic room with elegant furnishings", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "105", RoomTypeId = defaultClassicId, PricePerNight = 120, Status = RoomStatus.Cleaning, Capacity = 2, Description = "Classic room with modern conveniences", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },

                // Deluxe Rooms (Floor 2)
                new Room { RoomNumber = "201", RoomTypeId = defaultDeluxeId, PricePerNight = 180, Status = RoomStatus.Available, Capacity = 2, Description = "Enhanced comfort with premium amenities and stunning views", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "202", RoomTypeId = defaultDeluxeId, PricePerNight = 180, Status = RoomStatus.Available, Capacity = 2, Description = "Spacious deluxe room with luxury furnishings", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "203", RoomTypeId = defaultDeluxeId, PricePerNight = 180, Status = RoomStatus.Available, Capacity = 2, Description = "Deluxe accommodation with premium amenities", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "204", RoomTypeId = defaultDeluxeId, PricePerNight = 180, Status = RoomStatus.Booked, Capacity = 2, Description = "Elegant deluxe room with city skyline views", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "205", RoomTypeId = defaultDeluxeId, PricePerNight = 180, Status = RoomStatus.Available, Capacity = 2, Description = "Comfortable deluxe room with modern design", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "206", RoomTypeId = defaultDeluxeId, PricePerNight = 180, Status = RoomStatus.Cleaning, Capacity = 2, Description = "Premium deluxe room with enhanced amenities", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },

                // Premier Rooms (Floor 3)
                new Room { RoomNumber = "301", RoomTypeId = defaultPremierId, PricePerNight = 250, Status = RoomStatus.Available, Capacity = 2, Description = "Newly refurbished with modern style and panoramic city views", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "302", RoomTypeId = defaultPremierId, PricePerNight = 250, Status = RoomStatus.Available, Capacity = 2, Description = "Premier room featuring contemporary design and luxury amenities", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "303", RoomTypeId = defaultPremierId, PricePerNight = 250, Status = RoomStatus.Available, Capacity = 2, Description = "Spacious premier room with stunning views", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "304", RoomTypeId = defaultPremierId, PricePerNight = 250, Status = RoomStatus.Booked, Capacity = 2, Description = "Elegant premier accommodation with premium features", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "305", RoomTypeId = defaultPremierId, PricePerNight = 250, Status = RoomStatus.Available, Capacity = 2, Description = "Modern premier room with luxury touches", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "306", RoomTypeId = defaultPremierId, PricePerNight = 250, Status = RoomStatus.Available, Capacity = 2, Description = "Premier room with enhanced comfort and style", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },

                // Suites (Floor 4)
                new Room { RoomNumber = "401", RoomTypeId = defaultSuiteId, PricePerNight = 400, Status = RoomStatus.Available, Capacity = 4, Description = "Spacious accommodation with separate living area and bedroom", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "402", RoomTypeId = defaultSuiteId, PricePerNight = 400, Status = RoomStatus.Available, Capacity = 4, Description = "Luxury suite featuring elegant living space and premium amenities", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "403", RoomTypeId = defaultSuiteId, PricePerNight = 400, Status = RoomStatus.Available, Capacity = 4, Description = "Executive suite with separate living and dining areas", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "404", RoomTypeId = defaultSuiteId, PricePerNight = 400, Status = RoomStatus.Booked, Capacity = 4, Description = "Premium suite with panoramic views and luxury furnishings", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "405", RoomTypeId = defaultSuiteId, PricePerNight = 400, Status = RoomStatus.Available, Capacity = 4, Description = "Spacious suite perfect for families or extended stays", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "406", RoomTypeId = defaultSuiteId, PricePerNight = 400, Status = RoomStatus.Available, Capacity = 4, Description = "Luxury suite with modern design and premium features", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },

                // Family Rooms (Floor 5)
                new Room { RoomNumber = "501", RoomTypeId = defaultFamilyId, PricePerNight = 320, Status = RoomStatus.Available, Capacity = 4, Description = "Spacious comfort accommodating up to 4 persons with family-friendly amenities", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "502", RoomTypeId = defaultFamilyId, PricePerNight = 320, Status = RoomStatus.Available, Capacity = 4, Description = "Family room with separate sleeping areas and modern conveniences", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "503", RoomTypeId = defaultFamilyId, PricePerNight = 320, Status = RoomStatus.Available, Capacity = 4, Description = "Comfortable family accommodation with extra space", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "504", RoomTypeId = defaultFamilyId, PricePerNight = 320, Status = RoomStatus.Booked, Capacity = 4, Description = "Spacious family room perfect for families with children", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "505", RoomTypeId = defaultFamilyId, PricePerNight = 320, Status = RoomStatus.Available, Capacity = 4, Description = "Family-friendly room with enhanced amenities", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },

                // Twin Rooms (Floor 6)
                new Room { RoomNumber = "601", RoomTypeId = defaultTwinId, PricePerNight = 160, Status = RoomStatus.Available, Capacity = 2, Description = "Great for friends or colleagues with two separate beds", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "602", RoomTypeId = defaultTwinId, PricePerNight = 160, Status = RoomStatus.Available, Capacity = 2, Description = "Comfortable twin room with modern amenities", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "603", RoomTypeId = defaultTwinId, PricePerNight = 160, Status = RoomStatus.Available, Capacity = 2, Description = "Twin room featuring two separate beds and city views", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "604", RoomTypeId = defaultTwinId, PricePerNight = 160, Status = RoomStatus.Cleaning, Capacity = 2, Description = "Spacious twin room perfect for business travelers", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "605", RoomTypeId = defaultTwinId, PricePerNight = 160, Status = RoomStatus.Available, Capacity = 2, Description = "Comfortable twin accommodation with premium features", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow }
            };

            await context.Rooms.AddRangeAsync(rooms);
            await context.SaveChangesAsync();
        }

        // Sample bookings are created by registered guests or through front desk
        // No pre-seeded bookings - they will be created when guests register and book

        // Seed Housekeeping Tasks
        if (!await context.HousekeepingTasks.AnyAsync())
        {
            var housekeeping1 = await userManager.FindByEmailAsync("housekeeping1@hms.com");
            var housekeeping2 = await userManager.FindByEmailAsync("housekeeping2@hms.com");
            var housekeeping3 = await userManager.FindByEmailAsync("housekeeping3@hms.com");

            var room104 = await context.Rooms.FirstOrDefaultAsync(r => r.RoomNumber == "104");
            var room203 = await context.Rooms.FirstOrDefaultAsync(r => r.RoomNumber == "203");
            var room103 = await context.Rooms.FirstOrDefaultAsync(r => r.RoomNumber == "103");
            // Note: Room 108 doesn't exist in seed data, using room 105 instead
            var room105 = await context.Rooms.FirstOrDefaultAsync(r => r.RoomNumber == "105");

            var tasks = new List<HousekeepingTask>();

            if (room104 != null && housekeeping1 != null)
            {
                tasks.Add(new HousekeepingTask
                {
                    RoomId = room104.Id,
                    AssignedStaffId = housekeeping1.Id,
                    Status = HousekeepingTaskStatus.InProgress,
                    Notes = "Deep cleaning required",
                    CreatedAt = DateTime.UtcNow.AddHours(-2),
                    UpdatedAt = DateTime.UtcNow.AddHours(-1)
                });
            }

            if (room203 != null && housekeeping2 != null)
            {
                tasks.Add(new HousekeepingTask
                {
                    RoomId = room203.Id,
                    AssignedStaffId = housekeeping2.Id,
                    Status = HousekeepingTaskStatus.Completed,
                    Notes = "Standard cleaning completed",
                    CreatedAt = DateTime.UtcNow.AddHours(-4),
                    UpdatedAt = DateTime.UtcNow.AddHours(-1)
                });
            }

            if (room103 != null && housekeeping3 != null)
            {
                tasks.Add(new HousekeepingTask
                {
                    RoomId = room103.Id,
                    AssignedStaffId = housekeeping3.Id,
                    Status = HousekeepingTaskStatus.Pending,
                    Notes = "Prepare for guest arrival",
                    CreatedAt = DateTime.UtcNow.AddHours(-1),
                    UpdatedAt = DateTime.UtcNow.AddHours(-1)
                });
            }

            if (room105 != null)
            {
                tasks.Add(new HousekeepingTask
                {
                    RoomId = room105.Id,
                    AssignedStaffId = null, // Unassigned
                    Status = HousekeepingTaskStatus.Pending,
                    Notes = "Room needs cleaning after checkout",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            if (tasks.Any())
            {
                await context.HousekeepingTasks.AddRangeAsync(tasks);
                await context.SaveChangesAsync();
            }
        }
    }
}
