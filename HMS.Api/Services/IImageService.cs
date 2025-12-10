using Microsoft.AspNetCore.Http;

namespace HMS.Api.Services;

public interface IImageService
{
    Task<string> UploadImageAsync(IFormFile file, string folder = "images");
    Task DeleteImageAsync(string imageUrl);
}





