using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Npgsql;
using HMS.Domain.Models;
using HMS.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// ForwardedHeaders for reverse proxy (e.g., Elastic Beanstalk)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor |
                                ForwardedHeaders.XForwardedProto |
                                ForwardedHeaders.XForwardedHost;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// DEBUG: Check connection string
var connectionString = builder.Configuration.GetConnectionString("Default");
Console.WriteLine("=== DEBUG: Connection String ===");
Console.WriteLine($"Connection String: {connectionString}");
Console.WriteLine($"Is Null: {connectionString == null}");
if (connectionString != null)
{
    Console.WriteLine($"Contains '127.0.0.1': {connectionString.Contains("127.0.0.1")}");
    Console.WriteLine($"Contains 'localhost': {connectionString.Contains("localhost")}");
    Console.WriteLine($"Contains '5432': {connectionString.Contains("5432")}");
    Console.WriteLine($"Contains 'rds.amazonaws.com': {connectionString.Contains("rds.amazonaws.com")}");
}
Console.WriteLine("================================");

// Configure Entity Framework with PostgreSQL
// Connection string from environment variable: ConnectionStrings__Default
// Falls back to appsettings.json if not set
var dbConnectionString = builder.Configuration.GetConnectionString("Default");
Console.WriteLine($"=== Using Connection String for DbContext ===");
Console.WriteLine($"Connection String: {dbConnectionString}");
Console.WriteLine($"==============================================");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(dbConnectionString, npgsqlOptions =>
    {
        npgsqlOptions.CommandTimeout(30); // 30 second timeout
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);
    }));

// Register Services
builder.Services.AddScoped<HMS.Infrastructure.Services.IUserService, HMS.Infrastructure.Services.UserService>();
builder.Services.AddScoped<HMS.Infrastructure.Services.IRoomService, HMS.Infrastructure.Services.RoomService>();
builder.Services.AddScoped<HMS.Infrastructure.Services.IBookingService, HMS.Infrastructure.Services.BookingService>();
builder.Services.AddScoped<HMS.Infrastructure.Services.IHousekeepingService, HMS.Infrastructure.Services.HousekeepingService>();
builder.Services.AddScoped<HMS.Infrastructure.Services.IPaymentService, HMS.Infrastructure.Services.PaymentService>();

// Configure Identity
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;

    // User settings
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
});

// Configure Swagger/OpenAPI (enabled in Production)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "HMS API",
        Version = "v1",
        Description = "Hotel Management System API"
    });

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure CORS policy "AppCors"
// Allowed origins from env var: CORS__AllowedOrigins (comma-separated)
// Defaults to localhost:5173 and localhost:3000 if empty
var allowedOrigins = builder.Configuration["CORS__AllowedOrigins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
if (allowedOrigins == null || allowedOrigins.Length == 0)
{
    allowedOrigins = new[] { "http://localhost:5173", "http://localhost:3000" };
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AppCors", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .WithExposedHeaders("Content-Length", "Content-Type", "Authorization");
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
// Use forwarded headers for reverse proxy
app.UseForwardedHeaders();

// Enable Swagger in Production (not only Development)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "HMS API V1");
    c.RoutePrefix = "swagger";
});

app.UseHttpsRedirection();

app.UseCors("AppCors");

app.UseAuthentication();
app.UseAuthorization();

// Health check endpoint
app.MapGet("/healthz", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .WithName("HealthCheck")
   .AllowAnonymous();

// Database connection test endpoint
app.MapGet("/api/test-db", async (ApplicationDbContext context) =>
{
    try
    {
        var canConnect = await context.Database.CanConnectAsync();
        if (canConnect)
        {
            var roomCount = await context.Rooms.CountAsync();
            var userCount = await context.Users.CountAsync();
            var connectionString = context.Database.GetConnectionString();
            var maskedConnection = connectionString != null 
                ? MaskConnectionString(connectionString)
                : "Not available";
            
            return Results.Ok(new
            {
                status = "connected",
                timestamp = DateTime.UtcNow,
                statistics = new
                {
                    rooms = roomCount,
                    users = userCount
                },
                connection = maskedConnection,
                database = context.Database.GetDbConnection().Database
            });
        }
        else
        {
            return Results.Problem("Cannot connect to database", statusCode: 503);
        }
    }
    catch (Exception ex)
    {
        return Results.Problem(
            $"Database connection failed: {ex.Message}",
            statusCode: 503
        );
    }
})
.WithName("TestDatabase")
.AllowAnonymous();

static string MaskConnectionString(string connectionString)
{
    // Mask password in connection string for security
    return System.Text.RegularExpressions.Regex.Replace(
        connectionString,
        @"Password=([^;]+)",
        "Password=***"
    );
}

// Root redirect to Swagger
app.MapGet("/", () => Results.Redirect("/swagger"))
   .WithName("Root")
   .AllowAnonymous();

app.MapControllers();

// Auto-migrate on startup (controlled by env var RUN_MIGRATIONS, default: true)
var runMigrations = builder.Configuration.GetValue<bool>("RUN_MIGRATIONS", true);
if (runMigrations)
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<Program>>();
        
        try
        {
            logger.LogInformation("Starting database migration...");
            var context = services.GetRequiredService<ApplicationDbContext>();
            
            // Check if database can connect
            if (!context.Database.CanConnect())
            {
                logger.LogWarning("Cannot connect to database. Skipping migrations.");
                return;
            }
            
            // Check if AspNetRoles table exists (indicates tables were created manually)
            var tablesExist = false;
            try
            {
                context.Database.ExecuteSqlRaw("SELECT 1 FROM \"AspNetRoles\" LIMIT 1;");
                tablesExist = true;
                logger.LogInformation("Database tables already exist (created manually or via SQL).");
            }
            catch
            {
                tablesExist = false;
            }
            
            // Check if migrations history table exists
            var migrationsHistoryExists = false;
            try
            {
                context.Database.ExecuteSqlRaw("SELECT 1 FROM \"__EFMigrationsHistory\" LIMIT 1;");
                migrationsHistoryExists = true;
            }
            catch
            {
                migrationsHistoryExists = false;
            }
            
            if (tablesExist && !migrationsHistoryExists)
            {
                // Tables exist but migrations haven't been recorded
                // Get all available migrations and mark them as applied
                var allMigrations = context.Database.GetMigrations().ToList();
                if (allMigrations.Any())
                {
                    logger.LogInformation($"Tables exist but migrations not recorded. Marking {allMigrations.Count} migration(s) as applied...");
                    // Create migrations history table manually
                    context.Database.ExecuteSqlRaw(@"
                        CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                            ""MigrationId"" character varying(150) NOT NULL,
                            ""ProductVersion"" character varying(32) NOT NULL,
                            CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
                        );
                    ");
                    // Mark all migrations as applied
                    foreach (var migration in allMigrations)
                    {
                        // Use parameterized query to prevent SQL injection
                        var migrationIdParam = new Npgsql.NpgsqlParameter("@migrationId", migration);
                        var productVersionParam = new Npgsql.NpgsqlParameter("@productVersion", "7.0.0");
                        context.Database.ExecuteSqlRaw(@"
                            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                            VALUES (@migrationId, @productVersion)
                            ON CONFLICT (""MigrationId"") DO NOTHING;
                        ", migrationIdParam, productVersionParam);
                    }
                    logger.LogInformation("Migrations marked as applied successfully.");
                }
            }
            else
            {
                // Normal migration flow
                var pendingMigrations = context.Database.GetPendingMigrations().ToList();
                if (pendingMigrations.Any())
                {
                    logger.LogInformation($"Applying {pendingMigrations.Count} pending migration(s)...");
                    context.Database.Migrate();
                    logger.LogInformation("Database migration completed successfully.");
                }
                else
                {
                    logger.LogInformation("No pending migrations. Database is up to date.");
                }
            }
            
            // Seed database (will skip if data already exists)
            logger.LogInformation("Seeding database...");
            await HMS.Api.Data.SeedData.SeedRolesAndUsers(services);
            logger.LogInformation("Database seeding completed.");
        }
        catch (Exception ex)
        {
            // Check if it's a "table already exists" error - that's OK if tables were created manually
            if (ex.Message.Contains("already exists") || ex.InnerException?.Message.Contains("already exists") == true)
            {
                logger.LogWarning("Some tables already exist. Attempting to mark migrations as applied...");
                try
                {
                    var context = services.GetRequiredService<ApplicationDbContext>();
                    var allMigrations = context.Database.GetMigrations().ToList();
                    if (allMigrations.Any())
                    {
                        // Try to create migrations history and mark migrations as applied
                        context.Database.ExecuteSqlRaw(@"
                            CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                                ""MigrationId"" character varying(150) NOT NULL,
                                ""ProductVersion"" character varying(32) NOT NULL,
                                CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
                            );
                        ");
                        foreach (var migration in allMigrations)
                        {
                            // Use parameterized query to prevent SQL injection
                            var migrationIdParam = new Npgsql.NpgsqlParameter("@migrationId", migration);
                            var productVersionParam = new Npgsql.NpgsqlParameter("@productVersion", "7.0.0");
                            context.Database.ExecuteSqlRaw(@"
                                INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                                VALUES (@migrationId, @productVersion)
                                ON CONFLICT (""MigrationId"") DO NOTHING;
                            ", migrationIdParam, productVersionParam);
                        }
                        logger.LogInformation("Migrations marked as applied. Continuing...");
                    }
                }
                catch (Exception markEx)
                {
                    logger.LogWarning(markEx, "Could not mark migrations as applied, but continuing...");
                }
                
                // Still try to seed
                try
                {
                    await HMS.Api.Data.SeedData.SeedRolesAndUsers(services);
                    logger.LogInformation("Database seeding completed.");
                }
                catch (Exception seedEx)
                {
                    logger.LogWarning(seedEx, "Seeding had some issues but continuing...");
                }
            }
            else
            {
                logger.LogError(ex, "An error occurred while migrating or seeding the database.");
                // Don't throw - allow app to start even if migration fails
            }
        }
    }
}
else
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("Database migration skipped (RUN_MIGRATIONS=false).");
}

await app.RunAsync();
