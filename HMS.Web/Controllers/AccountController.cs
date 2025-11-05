using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using HMS.Domain.Models;
using HMS.Web.Services;

namespace HMS.Web.Controllers;

public class AccountController : Controller
{
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly ApiService _apiService;

    public AccountController(
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        ApiService apiService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _apiService = apiService;
    }

    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
    {
        ViewData["ReturnUrl"] = returnUrl;

        if (!ModelState.IsValid)
        {
            return View(model);
        }

        // Call API to login and get JWT token
        var loginResponse = await _apiService.PostAsync<LoginResponse>("api/auth/login", new
        {
            email = model.Email,
            password = model.Password
        });

        if (loginResponse != null && !string.IsNullOrEmpty(loginResponse.Token))
        {
            // Store JWT token in session
            HttpContext.Session.SetString("JwtToken", loginResponse.Token);
            HttpContext.Session.SetString("UserEmail", loginResponse.Email ?? "");
            HttpContext.Session.SetString("UserName", $"{loginResponse.FirstName} {loginResponse.LastName}");
            HttpContext.Session.SetString("UserRoles", string.Join(",", loginResponse.Roles ?? new List<string>()));

            // Also sign in with Identity for MVC auth
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user != null)
            {
                await _signInManager.SignInAsync(user, model.RememberMe);
            }

            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }

            return RedirectToAction("Index", "Home");
        }

        ModelState.AddModelError(string.Empty, "Invalid login attempt.");
        return View(model);
    }

    [HttpGet]
    public IActionResult Register()
    {
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(RegisterViewModel model)
    {
        if (!ModelState.IsValid)
        {
            return View(model);
        }

        // Call API to register
        var result = await _apiService.PostAsync<object>("api/auth/register", new
        {
            email = model.Email,
            password = model.Password,
            firstName = model.FirstName,
            lastName = model.LastName
        });

        if (result != null)
        {
            // Auto-login after registration
            var loginResponse = await _apiService.PostAsync<LoginResponse>("api/auth/login", new
            {
                email = model.Email,
                password = model.Password
            });

            if (loginResponse != null && !string.IsNullOrEmpty(loginResponse.Token))
            {
                HttpContext.Session.SetString("JwtToken", loginResponse.Token);
                HttpContext.Session.SetString("UserEmail", loginResponse.Email ?? "");
                HttpContext.Session.SetString("UserName", $"{loginResponse.FirstName} {loginResponse.LastName}");
                HttpContext.Session.SetString("UserRoles", string.Join(",", loginResponse.Roles ?? new List<string>()));

                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user != null)
                {
                    await _signInManager.SignInAsync(user, false);
                }

                return RedirectToAction("Index", "Home");
            }
        }

        ModelState.AddModelError(string.Empty, "Registration failed.");
        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        HttpContext.Session.Clear();
        return RedirectToAction("Index", "Home");
    }

    [HttpGet]
    public IActionResult AccessDenied()
    {
        return View();
    }
}

public class LoginViewModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [DataType(DataType.Password)]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; }
}

public class RegisterViewModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long.", MinimumLength = 6)]
    [DataType(DataType.Password)]
    public string Password { get; set; } = string.Empty;

    [DataType(DataType.Password)]
    [Display(Name = "Confirm password")]
    [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;

    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public List<string>? Roles { get; set; }
}

