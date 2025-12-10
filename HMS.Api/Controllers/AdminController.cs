using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HMS.Domain.Models;
using HMS.Infrastructure.Data;
using HMS.Api.Services;
using System.Linq;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ApplicationDbContext _context;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ApplicationDbContext context,
        IEmailSender emailSender,
        ILogger<AdminController> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _emailSender = emailSender;
        _logger = logger;
    }

    /// <summary>
    /// Get all users with their roles
    /// </summary>
    [HttpGet("users")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers()
    {
        try
        {
            // Get all users (no filtering - includes both active and inactive)
            var users = await _userManager.Users
                .OrderBy(u => u.CreatedAt)
                .ToListAsync();
            
            // Log user count for verification
            var totalCount = users.Count;
            var activeCount = users.Count(u => u.IsActive);
            var inactiveCount = users.Count(u => !u.IsActive);
            
            // Get all user-role mappings in a single query to avoid N+1 and concurrency issues
            // IdentityDbContext provides UserRoles and Roles DbSets
            var userIds = users.Select(u => u.Id).ToList();
            
            var userRoles = await _context.UserRoles
                .Where(ur => userIds.Contains(ur.UserId))
                .Join(_context.Roles,
                    ur => ur.RoleId,
                    r => r.Id,
                    (ur, r) => new { ur.UserId, RoleName = r.Name ?? string.Empty })
                .ToListAsync();
            
            // Group roles by user ID
            var rolesByUserId = userRoles
                .GroupBy(ur => ur.UserId)
                .ToDictionary(g => g.Key, g => g.Select(ur => ur.RoleName).Where(r => !string.IsNullOrEmpty(r)).ToList());
            
            var userDtos = users.Select(user => new AdminUserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Gender = user.Gender,
                DateOfBirth = user.DateOfBirth,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                EmailConfirmed = user.EmailConfirmed,
                CreatedAt = user.CreatedAt,
                Roles = rolesByUserId.TryGetValue(user.Id, out var roles) ? roles : new List<string>(),
                MembershipTier = user.MembershipTier
            }).ToList();
            
            // Log counts for debugging
            Console.WriteLine($"[GetUsers] Total users: {totalCount}, Active: {activeCount}, Inactive: {inactiveCount}, Returned DTOs: {userDtos.Count}");

            return Ok(userDtos);
        }
        catch (Exception ex)
        {
            // Log the exception for debugging
            Console.WriteLine($"Error in GetUsers: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "An error occurred while retrieving users", error = ex.Message });
        }
    }

    /// <summary>
    /// Get a specific user by ID
    /// </summary>
    [HttpGet("users/{id}")]
    public async Task<ActionResult<AdminUserDto>> GetUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var userDto = new AdminUserDto
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Gender = user.Gender,
            DateOfBirth = user.DateOfBirth,
            PhoneNumber = user.PhoneNumber,
            IsActive = user.IsActive,
            EmailConfirmed = user.EmailConfirmed,
            CreatedAt = user.CreatedAt,
            Roles = roles.ToList(),
            MembershipTier = user.MembershipTier
        };

        return Ok(userDto);
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost("users")]
    public async Task<ActionResult<AdminUserDto>> CreateUser([FromBody] CreateUserModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Check if user already exists
        var existingUser = await _userManager.FindByEmailAsync(model.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "User with this email already exists" });
        }

        // Validate role exists
        if (!string.IsNullOrEmpty(model.Role) && !await _roleManager.RoleExistsAsync(model.Role))
        {
            return BadRequest(new { message = $"Role '{model.Role}' does not exist" });
        }

        // Determine role and generate default password if not provided
        var roleToAssign = !string.IsNullOrEmpty(model.Role) ? model.Role : "Customer";
        // Generate default password: {Role}@123 if not provided
        // This password will be hashed and stored in database by ASP.NET Core Identity
        var password = string.IsNullOrEmpty(model.Password) ? $"{roleToAssign}@123" : model.Password;

        _logger.LogInformation("Creating user {Email} with role {Role}. Password will be: {Password} (will be hashed in database)", 
            model.Email, roleToAssign, string.IsNullOrEmpty(model.Password) ? "default generated" : "custom provided");

        var user = new AppUser
        {
            UserName = model.Email,
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName,
            Gender = model.Gender,
            DateOfBirth = model.DateOfBirth,
            PhoneNumber = model.PhoneNumber,
            IsActive = model.IsActive,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        // Create user with password - Identity will hash the password before storing in database
        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            _logger.LogError("Failed to create user {Email}. Errors: {Errors}", 
                model.Email, string.Join(", ", result.Errors.Select(e => e.Description)));
            return BadRequest(new { message = "Failed to create user", errors = result.Errors });
        }

        _logger.LogInformation("User {Email} created successfully with ID {UserId}. Password has been hashed and stored in database.", 
            user.Email, user.Id);

        // Assign role if specified
        if (!string.IsNullOrEmpty(model.Role))
        {
            await _userManager.AddToRoleAsync(user, model.Role);
            _logger.LogInformation("Role {Role} assigned to user {Email}", model.Role, user.Email);
        }
        else
        {
            // Default to Customer role if no role specified
            await _userManager.AddToRoleAsync(user, "Customer");
            _logger.LogInformation("Default role Customer assigned to user {Email}", user.Email);
        }

        // Send welcome email with password (especially for staff accounts)
        // IMPORTANT: The password sent in email is the plain text password that was used to create the account
        // This password can be used to login - Identity will hash it and compare with the stored hash
        try
        {
            var emailSubject = "Welcome to HMS - Your Account Credentials";
            var emailBody = $@"
                <html>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h2 style='color: #2c3e50;'>Welcome to Hotel Management System</h2>
                        <p>Dear {user.FirstName} {user.LastName},</p>
                        <p>Your account has been successfully created with the following details:</p>
                        <div style='background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                            <p><strong>Email:</strong> {user.Email}</p>
                            <p><strong>Password:</strong> <code style='background-color: #fff; padding: 2px 6px; border-radius: 3px;'>{password}</code></p>
                            <p><strong>Role:</strong> {roleToAssign}</p>
                        </div>
                        <p style='color: #e74c3c;'><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
                        <p>You can now log in to the system using the credentials above.</p>
                        <p>Best regards,<br>HMS Administration Team</p>
                    </div>
                </body>
                </html>";

            await _emailSender.SendEmailAsync(user.Email!, emailSubject, emailBody);
            _logger.LogInformation("Welcome email sent to {Email} for new user {UserId}. Password in email: {Password}", 
                user.Email, user.Id, password);
        }
        catch (Exception ex)
        {
            // Log error but don't fail user creation if email fails
            _logger.LogError(ex, "Failed to send welcome email to {Email}. User was created successfully with password: {Password}", 
                user.Email, password);
            // Continue - user creation was successful even if email failed
        }

        var roles = await _userManager.GetRolesAsync(user);
        var userDto = new AdminUserDto
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Gender = user.Gender,
            DateOfBirth = user.DateOfBirth,
            PhoneNumber = user.PhoneNumber,
            IsActive = user.IsActive,
            EmailConfirmed = user.EmailConfirmed,
            CreatedAt = user.CreatedAt,
            Roles = roles.ToList(),
            MembershipTier = user.MembershipTier
        };

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, userDto);
    }

    /// <summary>
    /// Update an existing user
    /// </summary>
    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        // Update basic properties
        user.FirstName = model.FirstName;
        user.LastName = model.LastName;
        user.Gender = model.Gender;
        user.DateOfBirth = model.DateOfBirth;
        user.PhoneNumber = model.PhoneNumber;
        user.IsActive = model.IsActive;

        // Update Membership Tier (Admin override)
        if (!string.IsNullOrEmpty(model.MembershipTier))
        {
            user.MembershipTier = model.MembershipTier;
        }

        // Update email if changed
        if (!string.IsNullOrEmpty(model.Email) && model.Email != user.Email)
        {
            var emailExists = await _userManager.FindByEmailAsync(model.Email);
            if (emailExists != null)
            {
                return BadRequest(new { message = "Email already in use" });
            }
            user.Email = model.Email;
            user.UserName = model.Email;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Failed to update user", errors = result.Errors });
        }

        // Update password if provided
        if (!string.IsNullOrEmpty(model.Password))
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var passwordResult = await _userManager.ResetPasswordAsync(user, token, model.Password);
            if (!passwordResult.Succeeded)
            {
                return BadRequest(new { message = "Failed to update password", errors = passwordResult.Errors });
            }
        }

        // Update role if changed
        if (!string.IsNullOrEmpty(model.Role))
        {
            // Validate role exists
            if (!await _roleManager.RoleExistsAsync(model.Role))
            {
                return BadRequest(new { message = $"Role '{model.Role}' does not exist" });
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            if (!currentRoles.Contains(model.Role))
            {
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                await _userManager.AddToRoleAsync(user, model.Role);
            }
        }

        return Ok(new { message = "User updated successfully" });
    }

    /// <summary>
    /// Delete a user and all related data
    /// </summary>
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        // Prevent deleting self
        var currentUserId = _userManager.GetUserId(User);
        if (currentUserId == id)
        {
            return BadRequest(new { message = "You cannot delete your own account" });
        }

        // Use execution strategy for transaction retries
        var strategy = _context.Database.CreateExecutionStrategy();

        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Manually cascade delete related entities that might have restrictive constraints
                    // Or entities where we want specific handling

                    // 1. Bookings and related Payments/ServiceRequests
                    var userBookings = await _context.Bookings.Where(b => b.UserId == user.Id).ToListAsync();
                    foreach (var booking in userBookings)
                    {
                        var payments = await _context.Payments.Where(p => p.BookingId == booking.Id).ToListAsync();
                        _context.Payments.RemoveRange(payments);
                        
                        var serviceRequests = await _context.ServiceRequests.Where(sr => sr.BookingId == booking.Id).ToListAsync();
                        _context.ServiceRequests.RemoveRange(serviceRequests);
                    }
                    _context.Bookings.RemoveRange(userBookings);

                    // 2. Delete service requests created by user
                    var userServiceRequests = await _context.ServiceRequests.Where(sr => sr.UserId == user.Id).ToListAsync();
                    _context.ServiceRequests.RemoveRange(userServiceRequests);

                    // 3. Update service requests assigned to user (set to null)
                    var assignedServiceRequests = await _context.ServiceRequests.Where(sr => sr.AssignedToUserId == user.Id).ToListAsync();
                    foreach (var sr in assignedServiceRequests)
                    {
                        sr.AssignedToUserId = null;
                    }

                    // 4. Update housekeeping tasks assigned to user (set to null)
                    var housekeepingTasks = await _context.HousekeepingTasks.Where(ht => ht.AssignedStaffId == user.Id).ToListAsync();
                    foreach (var task in housekeepingTasks)
                    {
                        task.AssignedStaffId = null;
                    }

                    // 5. Delete activity logs for user
                    var activityLogs = await _context.ActivityLogs.Where(al => al.UserId == user.Id).ToListAsync();
                    _context.ActivityLogs.RemoveRange(activityLogs);

                    // 6. Delete news comments by user
                    var newsComments = await _context.NewsComments.Where(nc => nc.UserId == user.Id).ToListAsync();
                    _context.NewsComments.RemoveRange(newsComments);

                    // 7. Delete newsletters created by user (since CreatedByUserId is required)
                    var newsletters = await _context.Newsletters.Where(n => n.CreatedByUserId == user.Id).ToListAsync();
                    _context.Newsletters.RemoveRange(newsletters);

                    // 8. Delete staff duty rosters
                    var dutyRosters = await _context.StaffDutyRosters.Where(sdr => sdr.StaffId == user.Id).ToListAsync();
                    _context.StaffDutyRosters.RemoveRange(dutyRosters);

                    // 9. Update query tickets assigned to user
                    var assignedTickets = await _context.QueryTickets.Where(qt => qt.AssignedToUserId == user.Id).ToListAsync();
                    foreach (var ticket in assignedTickets)
                    {
                        ticket.AssignedToUserId = null;
                    }

                    // 10. Delete query tickets created by user
                    var userTickets = await _context.QueryTickets.Where(qt => qt.UserId == user.Id).ToListAsync();
                    _context.QueryTickets.RemoveRange(userTickets);

                    // Save all changes before deleting user
                    await _context.SaveChangesAsync();

                    // 11. Finally, delete the user
                    var result = await _userManager.DeleteAsync(user);
                    if (!result.Succeeded)
                    {
                        var errorMessages = string.Join(", ", result.Errors.Select(e => e.Description));
                        throw new InvalidOperationException($"Failed to delete user: {errorMessages}");
                    }

                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });

            return Ok(new { message = "User and all related data have been deleted successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting user: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return BadRequest(new { message = $"Failed to delete user: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get hotel settings
    /// </summary>
    [HttpGet("settings")]
    [AllowAnonymous] // Allow customers to read settings
    public async Task<ActionResult<HotelSetting>> GetSettings()
    {
        var settings = await _context.HotelSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            return Ok(new HotelSetting());
        }
        return Ok(settings);
    }

    /// <summary>
    /// Update hotel settings
    /// </summary>
    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] HotelSetting model)
    {
        var settings = await _context.HotelSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new HotelSetting();
            _context.HotelSettings.Add(settings);
        }

        settings.HotelName = model.HotelName;
        settings.WelcomeDescription = model.WelcomeDescription;
        settings.Email = model.Email;
        settings.Phone = model.Phone;
        settings.Address = model.Address;
        settings.CheckInTime = model.CheckInTime;
        settings.CheckOutTime = model.CheckOutTime;
        settings.TaxRate = model.TaxRate;
        settings.Currency = model.Currency;
        settings.FacebookUrl = model.FacebookUrl;
        settings.InstagramUrl = model.InstagramUrl;
        settings.TwitterUrl = model.TwitterUrl;
        
        settings.MemberDiscount = model.MemberDiscount;
        settings.SilverDiscount = model.SilverDiscount;
        settings.GoldDiscount = model.GoldDiscount;
        settings.PlatinumDiscount = model.PlatinumDiscount;
        settings.MembershipBenefitsJson = model.MembershipBenefitsJson;
        
        // Home Page Settings
        settings.HomeBannerImagesJson = model.HomeBannerImagesJson;
        settings.FeaturedOffersJson = model.FeaturedOffersJson;
        settings.PromotionTitle = model.PromotionTitle;
        settings.PromotionDescription = model.PromotionDescription;
        settings.PromotionImageUrl = model.PromotionImageUrl;
        settings.AboutTitle = model.AboutTitle;
        settings.AboutDescription = model.AboutDescription;
        settings.AboutImageUrl = model.AboutImageUrl;

        await _context.SaveChangesAsync();

        return Ok(settings);
    }
}

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public bool EmailConfirmed { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Roles { get; set; } = new();
    public string? MembershipTier { get; set; }
}

public class CreateUserModel
{
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; } // Optional - if not provided, will generate default password
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "Customer";
    public bool IsActive { get; set; } = true;
}

public class UpdateUserModel
{
    public string? Email { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Password { get; set; }
    public string? Role { get; set; }
    public bool IsActive { get; set; }
    public string? MembershipTier { get; set; }
}
