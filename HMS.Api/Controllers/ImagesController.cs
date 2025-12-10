using HMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] 
public class ImagesController : ControllerBase
{
    private readonly IImageService _imageService;

    public ImagesController(IImageService imageService)
    {
        _imageService = imageService;
    }

    [HttpPost("upload")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded" });
        }

        // Basic validation
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = "Invalid file type. Only images are allowed." });
        }

        try
        {
            var imageUrl = await _imageService.UploadImageAsync(file, "room-images");
            return Ok(new { url = imageUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Image upload failed: {ex.Message}" });
        }
    }

    [HttpDelete]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> DeleteImage([FromQuery] string url)
    {
        if (string.IsNullOrEmpty(url))
        {
            return BadRequest(new { message = "URL is required" });
        }

        try
        {
            await _imageService.DeleteImageAsync(url);
            return Ok(new { message = "Image deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Image deletion failed: {ex.Message}" });
        }
    }
}





