using Microsoft.EntityFrameworkCore;
using HMS.Infrastructure.Data;

namespace HMS.Api;

/// <summary>
/// Simple script to test database connection
/// Run with: dotnet run --project HMS.Api -- test-db
/// </summary>
public static class TestDatabaseConnection
{
    public static async Task TestConnection(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        try
        {
            Console.WriteLine("🔍 Testing database connection...");
            Console.WriteLine($"Connection String: {context.Database.GetConnectionString()?.Substring(0, Math.Min(50, context.Database.GetConnectionString()?.Length ?? 0))}...");
            
            // Test basic connection
            var canConnect = await context.Database.CanConnectAsync();
            
            if (canConnect)
            {
                Console.WriteLine("✅ Database connection successful!");
                
                // Test query
                var roomCount = await context.Rooms.CountAsync();
                var userCount = await context.Users.CountAsync();
                
                Console.WriteLine($"📊 Database Statistics:");
                Console.WriteLine($"   - Rooms: {roomCount}");
                Console.WriteLine($"   - Users: {userCount}");
                
                // Check if migrations are applied
                var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
                var pendingList = pendingMigrations.ToList();
                
                if (pendingList.Any())
                {
                    Console.WriteLine($"⚠️  Warning: {pendingList.Count} pending migration(s):");
                    foreach (var migration in pendingList)
                    {
                        Console.WriteLine($"      - {migration}");
                    }
                    Console.WriteLine("   Run: dotnet ef database update --project ../HMS.Infrastructure");
                }
                else
                {
                    Console.WriteLine("✅ All migrations are applied");
                }
            }
            else
            {
                Console.WriteLine("❌ Cannot connect to database!");
                Console.WriteLine("   Please check your connection string in appsettings.json");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Database connection failed!");
            Console.WriteLine($"   Error: {ex.Message}");
            Console.WriteLine($"   Details: {ex.InnerException?.Message ?? "N/A"}");
            Console.WriteLine("\n💡 Troubleshooting:");
            Console.WriteLine("   1. Verify RDS endpoint is correct");
            Console.WriteLine("   2. Check security group allows your IP");
            Console.WriteLine("   3. Verify username and password");
            Console.WriteLine("   4. Ensure database exists");
            Console.WriteLine("   5. Check SSL settings");
        }
    }
}

