using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Linq;
using System.ComponentModel.DataAnnotations;
using HMS.Domain.Models;
using HMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Google.Apis.Auth; // Kept for potential future use, but not used here now
using System.Net.Http;
using System.Net.Http.Json;

namespace HMS.Api.Controllers;

public class RegisterModel
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Password is required")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
    [RegularExpression(@"^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$", ErrorMessage = "Password must contain at least one digit, one lowercase and one uppercase letter.")]
    public string Password { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "First name is required")]
    public string FirstName { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Last name is required")]
    public string LastName { get; set; } = string.Empty;
    
    public string? PhoneNumber { get; set; }
    public string? Gender { get; set; }
    public string? DateOfBirth { get; set; } // Accept as string, parse manually
}

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;

    public AuthController(
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new AppUser
        {
            UserName = model.Email,
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        // Assign Customer role by default
        await _userManager.AddToRoleAsync(user, "Customer");

        return Ok(new { message = "User registered successfully" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
            return Unauthorized(new { message = "Invalid email or password" });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account is inactive" });

        var roles = await _userManager.GetRolesAsync(user);
        var token = GenerateJwtToken(user, roles);

            return Ok(new
            {
                token = token,
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                phoneNumber = user.PhoneNumber,
                roles = roles,
                points = user.Points,
                membershipTier = user.EmailConfirmed ? user.MembershipTier : null, // Only verified users can be members
                emailConfirmed = user.EmailConfirmed
            });
        }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginModel model)
    {
        try
        {
            // Validate Access Token by calling Google UserInfo Endpoint
            using var httpClient = new HttpClient();
            var userInfoResponse = await httpClient.GetAsync($"https://www.googleapis.com/oauth2/v3/userinfo?access_token={model.AccessToken}");
            
            if (!userInfoResponse.IsSuccessStatusCode)
                return Unauthorized(new { message = "Invalid Google Token" });

            var userInfo = await userInfoResponse.Content.ReadFromJsonAsync<GoogleUserInfo>();
            if (userInfo == null || string.IsNullOrEmpty(userInfo.Email))
                return Unauthorized(new { message = "Could not retrieve user info from Google" });

            var user = await _userManager.FindByEmailAsync(userInfo.Email);
            if (user == null)
            {
                // Register new user
                user = new AppUser
                {
                    UserName = userInfo.Email,
                    Email = userInfo.Email,
                    FirstName = userInfo.Given_Name ?? "Google",
                    LastName = userInfo.Family_Name ?? "User",
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user);
                if (!result.Succeeded)
                    return BadRequest(result.Errors);

                await _userManager.AddToRoleAsync(user, "Customer");
            }

            if (!user.IsActive)
                return Unauthorized(new { message = "Account is inactive" });

            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwtToken(user, roles);

            return Ok(new
            {
                token = token,
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                phoneNumber = user.PhoneNumber,
                roles = roles,
                points = user.Points,
                membershipTier = user.EmailConfirmed ? user.MembershipTier : null, // Only verified users can be members
                emailConfirmed = user.EmailConfirmed
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Google Login Failed: {ex.Message}" });
        }
    }

    private string GenerateJwtToken(AppUser user, IList<string> roles)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);
        var expirationMinutes = int.Parse(jwtSettings["ExpirationInMinutes"]!);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Get user ID from JWT claims
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
            return Unauthorized(new { message = "Invalid token" });

        var user = await _userManager.FindByIdAsync(userIdClaim.Value);
        if (user == null)
            return Unauthorized(new { message = "User not found" });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account is inactive" });

        var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new { message = $"Failed to change password: {errors}" });
        }

        return Ok(new { message = "Password changed successfully" });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Get user ID from JWT claims
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
            return Unauthorized(new { message = "Invalid token" });

        var user = await _userManager.FindByIdAsync(userIdClaim.Value);
        if (user == null)
            return Unauthorized(new { message = "User not found" });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account is inactive" });

        user.FirstName = model.FirstName;
        user.LastName = model.LastName;
        user.PhoneNumber = model.PhoneNumber;
        
        // Only update email if it's different and not empty
        if (!string.IsNullOrEmpty(model.Email) && user.Email != model.Email)
        {
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null && existingUser.Id != user.Id)
            {
                return BadRequest(new { message = "Email already in use" });
            }
            
            user.Email = model.Email;
            user.UserName = model.Email;
            // Don't automatically confirm email when user changes it - they need to verify again
            user.EmailConfirmed = false;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new { message = $"Failed to update profile: {errors}" });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = GenerateJwtToken(user, roles);

        return Ok(new { 
            message = "Profile updated successfully",
            token = token,
            user = new {
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                phoneNumber = user.PhoneNumber,
                roles = roles,
                points = user.Points,
                membershipTier = user.EmailConfirmed ? user.MembershipTier : null,
                emailConfirmed = user.EmailConfirmed
            }
        });
    }

    [HttpPost("send-verification-email")]
    [Authorize]
    public async Task<IActionResult> SendVerificationEmail()
    {
        // Get user ID from JWT claims
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
            return Unauthorized(new { message = "Invalid token" });

        var user = await _userManager.FindByIdAsync(userIdClaim.Value);
        if (user == null)
            return Unauthorized(new { message = "User not found" });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account is inactive" });

        if (user.EmailConfirmed)
            return BadRequest(new { message = "Email already verified" });

        // Invalidate old unused codes for this user
        var oldCodes = await _context.EmailVerificationCodes
            .Where(c => c.UserId == user.Id && !c.IsUsed && c.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();
        foreach (var oldCode in oldCodes)
        {
            oldCode.IsUsed = true;
        }

        // Generate 6-digit verification code
        var random = new Random();
        var code = random.Next(100000, 999999).ToString();
        
        var verificationCode = new EmailVerificationCode
        {
            UserId = user.Id,
            Code = code,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15),
            IsUsed = false
        };
        
        _context.EmailVerificationCodes.Add(verificationCode);
        await _context.SaveChangesAsync();
        
        // TODO: Send email with code (in production)
        // For development, return the code (remove in production)
        return Ok(new { 
            message = "Verification code sent to your email",
            verificationCode = code // Remove this in production
        });
    }

    [HttpPost("verify-email")]
    [Authorize]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailModel model)
    {
        // Get user ID from JWT claims
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
            return Unauthorized(new { message = "Invalid token" });

        var user = await _userManager.FindByIdAsync(userIdClaim.Value);
        if (user == null)
            return Unauthorized(new { message = "User not found" });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account is inactive" });

        // Verify that the userId in the request matches the authenticated user
        if (user.Id != model.UserId)
            return Forbid();

        if (user.EmailConfirmed)
            return BadRequest(new { message = "Email already verified" });

        // Find valid verification code
        var verificationCode = await _context.EmailVerificationCodes
            .Where(c => c.UserId == user.Id 
                && c.Code == model.Code 
                && !c.IsUsed 
                && c.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (verificationCode == null)
            return BadRequest(new { message = "Invalid or expired verification code" });

        // Mark code as used
        verificationCode.IsUsed = true;
        
        // Confirm email
        user.EmailConfirmed = true;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { message = "Failed to verify email", errors = result.Errors });

        await _context.SaveChangesAsync();

        // Update membership tier if user has points (only verified users can be members)
        if (user.Points > 0 && string.IsNullOrEmpty(user.MembershipTier))
        {
            if (user.Points >= 10000) user.MembershipTier = "Platinum";
            else if (user.Points >= 5000) user.MembershipTier = "Gold";
            else if (user.Points >= 1000) user.MembershipTier = "Silver";
            else user.MembershipTier = "Member";
            await _userManager.UpdateAsync(user);
        }

        var roles = await _userManager.GetRolesAsync(user);
        var newToken = GenerateJwtToken(user, roles);

        return Ok(new
        {
            message = "Email verified successfully",
            token = newToken,
            id = user.Id,
            emailConfirmed = true,
            membershipTier = user.MembershipTier
        });
    }
}

public class UpdateProfileModel
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

public class ChangePasswordModel
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}


public class LoginModel
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class GoogleLoginModel
{
    public string AccessToken { get; set; } = string.Empty;
}

public class GoogleUserInfo
{
    public string Sub { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Given_Name { get; set; } = string.Empty;
    public string Family_Name { get; set; } = string.Empty;
    public string Picture { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool Email_Verified { get; set; }
}

public class VerifyEmailModel
{
    public string UserId { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty; // 6-digit verification code
}
