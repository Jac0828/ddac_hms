using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using HMS.Domain.Models;
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
        string[] roles = { "Customer", "Receptionist", "RoomAttendant", "Manager" };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // Seed Manager User
        if (await userManager.FindByEmailAsync("manager@hms.com") == null)
        {
            var manager = new AppUser
            {
                UserName = "manager@hms.com",
                Email = "manager@hms.com",
                FirstName = "Manager",
                LastName = "User",
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

        // Seed Receptionist User
        if (await userManager.FindByEmailAsync("receptionist@hms.com") == null)
        {
            var receptionist = new AppUser
            {
                UserName = "receptionist@hms.com",
                Email = "receptionist@hms.com",
                FirstName = "Receptionist",
                LastName = "User",
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

        // Seed Room Attendant User
        if (await userManager.FindByEmailAsync("roomattendant@hms.com") == null)
        {
            var attendant = new AppUser
            {
                UserName = "roomattendant@hms.com",
                Email = "roomattendant@hms.com",
                FirstName = "Room",
                LastName = "Attendant",
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(attendant, "Attendant@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(attendant, "RoomAttendant");
            }
        }

        // Seed Customer User
        if (await userManager.FindByEmailAsync("customer@hms.com") == null)
        {
            var customer = new AppUser
            {
                UserName = "customer@hms.com",
                Email = "customer@hms.com",
                FirstName = "Customer",
                LastName = "User",
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(customer, "Customer@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(customer, "Customer");
            }
        }

        // Seed Sample Rooms
        if (!await context.Rooms.AnyAsync())
        {
            var rooms = new List<Room>
            {
                new Room { RoomNumber = "101", RoomType = "Single", PricePerNight = 50, Status = "Available", Capacity = 1, Description = "Cozy single room", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "102", RoomType = "Double", PricePerNight = 80, Status = "Available", Capacity = 2, Description = "Spacious double room", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "201", RoomType = "Suite", PricePerNight = 150, Status = "Available", Capacity = 4, Description = "Luxury suite", HasWifi = true, HasTV = true, HasAirConditioning = true, HasBalcony = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "202", RoomType = "Double", PricePerNight = 80, Status = "Available", Capacity = 2, Description = "Comfortable double room", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow },
                new Room { RoomNumber = "301", RoomType = "Single", PricePerNight = 50, Status = "Available", Capacity = 1, Description = "Standard single room", HasWifi = true, HasTV = true, HasAirConditioning = true, CreatedAt = DateTime.UtcNow }
            };

            await context.Rooms.AddRangeAsync(rooms);
            await context.SaveChangesAsync();
        }
    }
}

