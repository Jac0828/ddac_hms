using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HMS.Domain.Models;
using HMS.Infrastructure.Data;
using System.Linq;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    // Note: Some endpoints allow Manager access - see individual endpoint attributes
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ApplicationDbContext _context;

    public AdminController(
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
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
                CreatedAt = user.CreatedAt,
                Roles = rolesByUserId.TryGetValue(user.Id, out var roles) ? roles : new List<string>()
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
            CreatedAt = user.CreatedAt,
            Roles = roles.ToList()
        };

        return Ok(userDto);
    }

    /// <summary>
    /// Get staff list (Receptionist and Housekeeping) - Available for Manager and Admin
    /// </summary>
    [HttpGet("staff")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetStaff()
    {
        try
        {
            // Get users with Receptionist or Housekeeping roles
            var receptionistRole = await _roleManager.FindByNameAsync("Receptionist");
            var housekeepingRole = await _roleManager.FindByNameAsync("Housekeeping");
            
            if (receptionistRole == null && housekeepingRole == null)
            {
                return Ok(new List<AdminUserDto>());
            }

            var roleIds = new List<string>();
            if (receptionistRole != null) roleIds.Add(receptionistRole.Id);
            if (housekeepingRole != null) roleIds.Add(housekeepingRole.Id);

            // Get user IDs with these roles
            var userIds = await _context.UserRoles
                .Where(ur => roleIds.Contains(ur.RoleId))
                .Select(ur => ur.UserId)
                .Distinct()
                .ToListAsync();

            // Get users
            var users = await _userManager.Users
                .Where(u => userIds.Contains(u.Id) && u.IsActive)
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .ToListAsync();

            // Get roles for these users
            var userRoles = await _context.UserRoles
                .Where(ur => userIds.Contains(ur.UserId))
                .Join(_context.Roles,
                    ur => ur.RoleId,
                    r => r.Id,
                    (ur, r) => new { ur.UserId, RoleName = r.Name ?? string.Empty })
                .ToListAsync();

            var rolesByUserId = userRoles
                .GroupBy(ur => ur.UserId)
                .ToDictionary(g => g.Key, g => g.Select(ur => ur.RoleName).Where(r => !string.IsNullOrEmpty(r)).ToList());

            var staffDtos = users.Select(user => new AdminUserDto
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Gender = user.Gender,
                DateOfBirth = user.DateOfBirth,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                Roles = rolesByUserId.TryGetValue(user.Id, out var roles) ? roles : new List<string>()
            }).ToList();

            return Ok(staffDtos);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetStaff: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "An error occurred while retrieving staff", error = ex.Message });
        }
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

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Failed to create user", errors = result.Errors });
        }

        // Assign role if specified
        if (!string.IsNullOrEmpty(model.Role))
        {
            await _userManager.AddToRoleAsync(user, model.Role);
        }
        else
        {
            // Default to Customer role if no role specified
            await _userManager.AddToRoleAsync(user, "Customer");
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
            CreatedAt = user.CreatedAt,
            Roles = roles.ToList()
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

        // Update email if changed
        if (!string.IsNullOrEmpty(model.Email) && model.Email != user.Email)
        {
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null && existingUser.Id != user.Id)
            {
                return BadRequest(new { message = "Email is already in use by another user" });
            }

            user.Email = model.Email;
            user.UserName = model.Email;
        }

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(new { message = "Failed to update user", errors = updateResult.Errors });
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

        // Update role if specified
        if (!string.IsNullOrEmpty(model.Role))
        {
            if (!await _roleManager.RoleExistsAsync(model.Role))
            {
                return BadRequest(new { message = $"Role '{model.Role}' does not exist" });
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, model.Role);
        }

        return NoContent();
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

        // Prevent deleting yourself
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (user.Id == currentUserId)
        {
            return BadRequest(new { message = "You cannot delete your own account" });
        }

        var strategy = _context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync<IActionResult>(async () =>
        {
            try
            {
                // 1. Delete user's bookings and their payments
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

                return Ok(new { message = "User and all related data have been deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting user: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return BadRequest(new { message = $"Failed to delete user: {ex.Message}" });
            }
        });
    }

    /// <summary>
    /// Get all database tables data
    /// </summary>
    [HttpGet("database")]
    public async Task<ActionResult<DatabaseDataDto>> GetDatabaseData()
    {
        var data = new DatabaseDataDto
        {
            // ... existing implementation ...
            Users = await _userManager.Users.Select(u => new {
                u.Id, u.Email, u.FirstName, u.LastName, u.Gender, u.DateOfBirth, u.PhoneNumber, u.IsActive, u.CreatedAt
            }).ToListAsync(),
            RoomTypes = await _context.RoomTypes.ToListAsync(),
            Rooms = await _context.Rooms.Include(r => r.RoomType).Select(r => new {
                r.Id, r.RoomNumber, RoomType = r.RoomType != null ? r.RoomType.Name : "", r.PricePerNight, r.Status, r.Capacity, r.Description, r.HasBalcony, r.HasWifi, r.HasTV, r.HasAirConditioning, r.CreatedAt
            }).ToListAsync(),
            Bookings = await _context.Bookings.Include(b => b.User).Include(b => b.Room).Select(b => new {
                b.Id, UserEmail = b.User != null ? b.User.Email : "", RoomNumber = b.Room != null ? b.Room.RoomNumber : "", b.CheckInDate, b.CheckOutDate, b.TotalPrice, b.PaymentStatus, b.Status, b.NumberOfGuests, b.SpecialRequests, b.CreatedAt
            }).ToListAsync(),
            Payments = await _context.Payments.Include(p => p.Booking).Select(p => new {
                p.Id, BookingId = p.Booking != null ? p.Booking.Id : 0, p.Amount, p.PaymentMethod, p.TransactionDate, p.Status, p.TransactionId, p.CreatedAt
            }).ToListAsync(),
            ServiceRequests = await _context.ServiceRequests.Include(sr => sr.User).Include(sr => sr.Booking).Select(sr => new {
                sr.Id, BookingId = sr.Booking != null ? sr.Booking.Id : 0, UserEmail = sr.User != null ? sr.User.Email : "", sr.ServiceType, sr.Description, sr.Status, sr.RequestedAt, sr.CompletedAt, sr.Notes
            }).ToListAsync(),
            HousekeepingTasks = await _context.HousekeepingTasks.Include(ht => ht.Room).Include(ht => ht.AssignedStaff).Select(ht => new {
                ht.Id, RoomNumber = ht.Room != null ? ht.Room.RoomNumber : "", AssignedStaffEmail = ht.AssignedStaff != null ? ht.AssignedStaff.Email : "", ht.Status, ht.Notes, ht.CreatedAt, ht.UpdatedAt
            }).ToListAsync(),
            ActivityLogs = await _context.ActivityLogs.Include(al => al.User).Select(al => new {
                al.Id, UserEmail = al.User != null ? al.User.Email : "", al.Action, al.EntityType, al.EntityId, Details = al.Details ?? "", al.CreatedAt
            }).ToListAsync(),
            QueryTickets = await _context.QueryTickets.Include(qt => qt.User).Select(qt => new {
                qt.Id, UserEmail = qt.User != null ? qt.User.Email : "", qt.Subject, qt.Description, qt.Status, qt.Response, qt.CreatedAt, qt.ResolvedAt
            }).ToListAsync()
        };
        return Ok(data);
    }
}

public class DatabaseDataDto
{
    public object Users { get; set; } = new();
    public object RoomTypes { get; set; } = new();
    public object Rooms { get; set; } = new();
    public object Bookings { get; set; } = new();
    public object Payments { get; set; } = new();
    public object ServiceRequests { get; set; } = new();
    public object HousekeepingTasks { get; set; } = new();
    public object ActivityLogs { get; set; } = new();
    public object QueryTickets { get; set; } = new();
}

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Roles { get; set; } = new();
}

public class CreateUserModel
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
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
}
