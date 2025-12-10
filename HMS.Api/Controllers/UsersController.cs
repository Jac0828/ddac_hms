using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using HMS.Api.DTOs;
using HMS.Api.Services;
using HMS.Domain.Models;
using HMS.Infrastructure.Data;
using HMS.Infrastructure.Services;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ApplicationDbContext _context;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IUserService userService,
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ApplicationDbContext context,
        IEmailSender emailSender,
        ILogger<UsersController> logger)
    {
        _userService = userService;
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _emailSender = emailSender;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers([FromQuery] string? role = null)
    {
        // Use EF Core directly to avoid N+1 query problem and filter efficiently
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrEmpty(role))
        {
            // Filter by role if provided
            var roleId = await _roleManager.Roles
                .Where(r => r.Name == role)
                .Select(r => r.Id)
                .FirstOrDefaultAsync();

            if (roleId != null)
            {
                query = query.Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == roleId));
            }
        }

        // Eagerly load users
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        // Get user IDs for role fetching
        var userIds = users.Select(u => u.Id).ToList();

        // Fetch roles for all these users in one go
        var userRoles = await _context.UserRoles
            .Where(ur => userIds.Contains(ur.UserId))
            .Join(_context.Roles,
                ur => ur.RoleId,
                r => r.Id,
                (ur, r) => new { ur.UserId, RoleName = r.Name })
            .ToListAsync();

        // Group roles by UserId
        var rolesByUserId = userRoles
            .GroupBy(ur => ur.UserId)
            .ToDictionary(g => g.Key, g => g.Select(ur => ur.RoleName).ToList());

        var userDtos = users.Select(user => {
            var roles = rolesByUserId.ContainsKey(user.Id) ? rolesByUserId[user.Id] : new List<string?>();
            return new UserDto
            {
                Id = user.Id,
                FullName = $"{user.FirstName} {user.LastName}",
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email ?? "",
                PhoneNumber = user.PhoneNumber,
                Role = roles.FirstOrDefault() ?? "Customer",
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                ProfilePictureUrl = user.ProfilePictureUrl
            };
        }).ToList();

        return Ok(userDtos);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto dto)
    {
        // Check if user already exists
        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
            return BadRequest(new { message = "User with this email already exists" });

        // Validate role exists
        if (!string.IsNullOrEmpty(dto.Role) && !await _roleManager.RoleExistsAsync(dto.Role))
            return BadRequest(new { message = $"Role '{dto.Role}' does not exist" });

        var nameParts = dto.FullName.Split(' ', 2);
        var firstName = nameParts[0];
        var lastName = nameParts.Length > 1 ? nameParts[1] : "";

        // Determine role and generate default password if not provided
        var roleToAssign = !string.IsNullOrEmpty(dto.Role) ? dto.Role : "Customer";
        // Generate default password: {Role}@123 if not provided
        var password = string.IsNullOrEmpty(dto.Password) ? $"{roleToAssign}@123" : dto.Password;

        var user = new AppUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = dto.PhoneNumber,
            IsActive = true,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new { message = $"Failed to create user: {errors}", errors = result.Errors });
        }

        // Assign role
        await _userManager.AddToRoleAsync(user, roleToAssign);

        // Send welcome email with password (especially for staff accounts)
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
                            <p><strong>Password:</strong> {password}</p>
                            <p><strong>Role:</strong> {roleToAssign}</p>
                        </div>
                        <p style='color: #e74c3c;'><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
                        <p>You can now log in to the system using the credentials above.</p>
                        <p>Best regards,<br>HMS Administration Team</p>
                    </div>
                </body>
                </html>";

            await _emailSender.SendEmailAsync(user.Email!, emailSubject, emailBody);
            _logger.LogInformation("Welcome email sent to {Email} for new user {UserId}", user.Email, user.Id);
        }
        catch (Exception ex)
        {
            // Log error but don't fail user creation if email fails
            _logger.LogError(ex, "Failed to send welcome email to {Email}", user.Email);
            // Continue - user creation was successful even if email failed
        }

        var roles = await _userManager.GetRolesAsync(user);
        var userDto = new UserDto
        {
            Id = user.Id,
            FullName = $"{user.FirstName} {user.LastName}",
            Email = user.Email ?? "",
            PhoneNumber = user.PhoneNumber,
            Role = roles.FirstOrDefault() ?? "Customer",
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        return CreatedAtAction(nameof(GetAllUsers), new { id = user.Id }, userDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null)
            return NotFound();

        user.FirstName = dto.FullName.Split(' ').FirstOrDefault() ?? "";
        user.LastName = string.Join(" ", dto.FullName.Split(' ').Skip(1));
        user.Email = dto.Email;
        user.UserName = dto.Email;
        user.PhoneNumber = dto.PhoneNumber;
        user.IsActive = dto.IsActive;

        // Update role
        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, dto.Role);

        await _userService.UpdateUserAsync(user);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (id == currentUserId)
            return BadRequest("Cannot delete your own account");

        var result = await _userService.DeleteUserAsync(id);
        if (!result)
            return NotFound();

        return NoContent();
    }
}

