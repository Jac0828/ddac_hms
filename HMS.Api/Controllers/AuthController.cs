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
using HMS.Api.Services;
using HMS.Infrastructure.Services;

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
    private readonly Services.IEmailSender _emailSender;
    private readonly IAuditLogService _auditLogService;

    public AuthController(
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        ApplicationDbContext context,
        Services.IEmailSender emailSender,
        IAuditLogService auditLogService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _context = context;
        _emailSender = emailSender;
        _auditLogService = auditLogService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterModel model)
    {
        // Log received data for debugging
        Console.WriteLine($"[Register] Received registration request for: {model.Email}");
        Console.WriteLine($"[Register] FirstName: {model.FirstName}, LastName: {model.LastName}");
        Console.WriteLine($"[Register] PhoneNumber: {model.PhoneNumber}, Gender: {model.Gender}, DateOfBirth: {model.DateOfBirth}");
        
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            var errorDetails = ModelState.SelectMany(x => x.Value.Errors.Select(err => $"{x.Key}: {err.ErrorMessage}")).ToList();
            Console.WriteLine($"[Register] Model validation failed. Errors: {string.Join(", ", errors)}");
            Console.WriteLine($"[Register] Detailed errors: {string.Join(", ", errorDetails)}");
            return BadRequest(new { message = "Validation failed", errors = errors, details = errorDetails });
        }

        // Check if user already exists
        var existingUser = await _userManager.FindByEmailAsync(model.Email);
        if (existingUser != null)
        {
            Console.WriteLine($"[Register] Email already exists: {model.Email}");
            return BadRequest(new { 
                message = "This email address is already registered. Please use a different email or try logging in.",
                code = "EMAIL_EXISTS"
            });
        }

        // Parse DateOfBirth from string if provided
        DateTime? dateOfBirth = null;
        if (!string.IsNullOrEmpty(model.DateOfBirth))
        {
            if (DateTime.TryParse(model.DateOfBirth, out var parsedDate))
            {
                // Ensure date is UTC to fix Npgsql issue
                dateOfBirth = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
            }
            // If parsing fails, we'll just leave it as null (optional field)
        }

        var user = new AppUser
        {
            UserName = model.Email,
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName,
            PhoneNumber = model.PhoneNumber,
            Gender = model.Gender,
            DateOfBirth = dateOfBirth,
            CreatedAt = DateTime.UtcNow,
            EmailConfirmed = false // New users need to verify email
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded)
        {
            // Convert Identity errors to user-friendly messages
            var friendlyErrors = new List<string>();
            foreach (var error in result.Errors)
            {
                string friendlyMessage = error.Code switch
                {
                    "DuplicateUserName" or "DuplicateEmail" => "This email address is already registered. Please use a different email or try logging in.",
                    "PasswordRequiresDigit" => "Password must contain at least one digit (0-9).",
                    "PasswordRequiresLower" => "Password must contain at least one lowercase letter (a-z).",
                    "PasswordRequiresUpper" => "Password must contain at least one uppercase letter (A-Z).",
                    "PasswordRequiresNonAlphanumeric" => "Password must contain at least one special character.",
                    "PasswordTooShort" => "Password must be at least 6 characters long.",
                    _ => error.Description // Use default description for other errors
                };
                friendlyErrors.Add(friendlyMessage);
            }
            
            var errorMessages = result.Errors.Select(e => e.Description).ToList();
            Console.WriteLine($"[Register] User creation failed. Errors: {string.Join(", ", errorMessages)}");
            Console.WriteLine($"[Register] Friendly errors: {string.Join(", ", friendlyErrors)}");
            
            // Return the first friendly error as the main message, and all errors in the errors array
            return BadRequest(new { 
                message = friendlyErrors.FirstOrDefault() ?? "Failed to create user. Please check your input and try again.",
                errors = friendlyErrors,
                code = result.Errors.FirstOrDefault()?.Code ?? "UNKNOWN_ERROR"
            });
        }
        
        Console.WriteLine($"[Register] User created successfully: {user.Id}");

        // Assign Customer role by default
        await _userManager.AddToRoleAsync(user, "Customer");

        try 
        {
            await _auditLogService.LogActionAsync(user.Id, "Register", "User", null, "User registered account");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to log audit: {ex.Message}");
        }

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

        try 
        {
            await _auditLogService.LogActionAsync(user.Id, "Login", "User", null, "User logged in");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to log audit: {ex.Message}");
        }

        bool isCustomer = roles.Contains("Customer");

        return Ok(new
        {
            token = token,
            id = user.Id,
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            phoneNumber = user.PhoneNumber,
            roles = roles,
            points = isCustomer ? user.Points : 0,
            membershipTier = (isCustomer && user.EmailConfirmed) ? user.MembershipTier : null, // Only verified customers can be members
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

            bool isCustomer = roles.Contains("Customer");

            return Ok(new
            {
                token = token,
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                phoneNumber = user.PhoneNumber,
                roles = roles,
                points = isCustomer ? user.Points : 0,
                membershipTier = (isCustomer && user.EmailConfirmed) ? user.MembershipTier : null, // Only verified customers can be members
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
        Console.WriteLine($"[UpdateProfile] Received update request");
        Console.WriteLine($"[UpdateProfile] FirstName: {model.FirstName}, LastName: {model.LastName}");
        Console.WriteLine($"[UpdateProfile] Email: {model.Email}, PhoneNumber: {model.PhoneNumber}");
        
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            Console.WriteLine($"[UpdateProfile] Model validation failed. Errors: {string.Join(", ", errors)}");
            return BadRequest(ModelState);
        }

        // Get user ID from JWT claims
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
        {
            Console.WriteLine("[UpdateProfile] Invalid token - no user ID found");
            return Unauthorized(new { message = "Invalid token" });
        }

        var user = await _userManager.FindByIdAsync(userIdClaim.Value);
        if (user == null)
        {
            Console.WriteLine($"[UpdateProfile] User not found: {userIdClaim.Value}");
            return Unauthorized(new { message = "User not found" });
        }

        if (!user.IsActive)
        {
            Console.WriteLine($"[UpdateProfile] Account is inactive: {userIdClaim.Value}");
            return Unauthorized(new { message = "Account is inactive" });
        }

        Console.WriteLine($"[UpdateProfile] Updating user {user.Id}. Old PhoneNumber: {user.PhoneNumber}");
        
        user.FirstName = model.FirstName;
        user.LastName = model.LastName;
        user.PhoneNumber = model.PhoneNumber; // Can be null or empty string
        
        if (!string.IsNullOrEmpty(model.ProfilePictureUrl))
        {
            user.ProfilePictureUrl = model.ProfilePictureUrl;
        }
        
        Console.WriteLine($"[UpdateProfile] New PhoneNumber: {user.PhoneNumber}");
        
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
            Console.WriteLine($"[UpdateProfile] Update failed. Errors: {errors}");
            return BadRequest(new { message = $"Failed to update profile: {errors}" });
        }

        Console.WriteLine($"[UpdateProfile] User updated successfully. PhoneNumber saved as: {user.PhoneNumber ?? "null"}");

        var roles = await _userManager.GetRolesAsync(user);
        var token = GenerateJwtToken(user, roles);
        
        bool isCustomer = roles.Contains("Customer");

        var response = new { 
            message = "Profile updated successfully",
            token = token,
            user = new {
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                phoneNumber = user.PhoneNumber ?? string.Empty, // Ensure it's not null
                profilePictureUrl = user.ProfilePictureUrl,
                roles = roles,
                points = isCustomer ? user.Points : 0,
                membershipTier = (isCustomer && user.EmailConfirmed) ? user.MembershipTier : null,
                emailConfirmed = user.EmailConfirmed
            }
        };
        
        Console.WriteLine($"[UpdateProfile] Returning response. PhoneNumber: {response.user.phoneNumber}");
        
        return Ok(response);
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
        
        try
        {
            Console.WriteLine($"[SendVerificationEmail] Attempting to send email to {user.Email}");
            
            // Send email with code using SMTP service
            await _emailSender.SendEmailAsync(
                user.Email!, 
                "Verify your email for HMS", 
                $"Your verification code is: <b>{code}</b>. It expires in 15 minutes."
            );
            
            Console.WriteLine($"[SendVerificationEmail] Email sent successfully to {user.Email}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SendVerificationEmail] Failed to send email: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[SendVerificationEmail] Inner Exception: {ex.InnerException.Message}");
            }
            
            // In development, we can still return the code for testing even if email fails
            if (_configuration["ASPNETCORE_ENVIRONMENT"] == "Development")
            {
                return Ok(new { 
                    message = "Failed to send email (check backend logs), but here is the code for testing.",
                    verificationCode = code 
                });
            }
            return StatusCode(500, new { message = "Failed to send verification email. Please try again later." });
        }
        
        try 
        {
            await _auditLogService.LogActionAsync(user.Id, "Request Verification", "User", null, "User requested email verification");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to log audit: {ex.Message}");
        }

        // In Development, always return the code to help testing if email is delayed/spam
        if (_configuration["ASPNETCORE_ENVIRONMENT"] == "Development")
        {
            return Ok(new { 
                message = "Verification code sent to your email (Dev: Code included below)",
                verificationCode = code
            });
        }

        return Ok(new { 
            message = "Verification code sent to your email"
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

        try 
        {
            await _auditLogService.LogActionAsync(user.Id, "Verify Email", "User", null, "User verified email");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to log audit: {ex.Message}");
        }

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

        bool isCustomer = roles.Contains("Customer");

        return Ok(new
        {
            message = "Email verified successfully",
            token = newToken,
            id = user.Id,
            emailConfirmed = true,
            membershipTier = (isCustomer) ? user.MembershipTier : null
        });
    }
}

public class UpdateProfileModel
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? ProfilePictureUrl { get; set; }
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
