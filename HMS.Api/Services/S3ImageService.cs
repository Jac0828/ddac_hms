using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;

namespace HMS.Api.Services;

public class S3ImageService : IImageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly IConfiguration _configuration;

    public S3ImageService(IAmazonS3 s3Client, IConfiguration configuration)
    {
        _s3Client = s3Client;
        _configuration = configuration;
    }

    public async Task<string> UploadImageAsync(IFormFile file, string folder = "images")
    {
        var bucketName = _configuration["AWS:BucketName"];
        if (string.IsNullOrEmpty(bucketName))
        {
            throw new Exception("AWS BucketName is not configured.");
        }

        var fileExtension = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{fileExtension}";
        var key = $"{folder}/{fileName}";

        using var stream = file.OpenReadStream();
        var request = new PutObjectRequest
        {
            BucketName = bucketName,
            Key = key,
            InputStream = stream,
            ContentType = file.ContentType
            // CannedACL = S3CannedACL.PublicRead // Removed because bucket does not allow ACLs
        };

        await _s3Client.PutObjectAsync(request);

        // Construct the URL manually or use GetPreSignedURL if private
        // For public read, standard S3 URL format:
        // https://{bucketName}.s3.{region}.amazonaws.com/{key}
        var region = _configuration["AWS:Region"] ?? "us-east-1";
        return $"https://{bucketName}.s3.{region}.amazonaws.com/{key}";
    }

    public async Task DeleteImageAsync(string imageUrl)
    {
        var bucketName = _configuration["AWS:BucketName"];
        if (string.IsNullOrEmpty(bucketName)) return;

        try
        {
            // Extract key from URL
            // URL: https://{bucketName}.s3.{region}.amazonaws.com/{key}
            var uri = new Uri(imageUrl);
            var key = uri.AbsolutePath.TrimStart('/');

            var request = new DeleteObjectRequest
            {
                BucketName = bucketName,
                Key = key
            };

            await _s3Client.DeleteObjectAsync(request);
        }
        catch (Exception ex)
        {
            // Log error but don't throw to avoid breaking flow if image is already gone
            Console.WriteLine($"Error deleting image from S3: {ex.Message}");
        }
    }
}

