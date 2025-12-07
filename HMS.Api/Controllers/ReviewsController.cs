using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using HMS.Domain.Models;
using HMS.Infrastructure.Data;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReviewsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetReviews([FromQuery] bool approvedOnly = true)
    {
        try
        {
            var query = _context.Reviews
                .Include(r => r.User)
                .AsQueryable();

            if (approvedOnly)
            {
                query = query.Where(r => r.IsApproved && !r.IsDeleted);
            }
            else
            {
                query = query.Where(r => !r.IsDeleted);
            }

            var reviews = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    id = r.Id,
                    userId = r.UserId,
                    userName = r.User != null ? $"{r.User.FirstName} {r.User.LastName}" : "Anonymous",
                    bookingId = r.BookingId,
                    rating = r.Rating,
                    comment = r.Comment,
                    isApproved = r.IsApproved,
                    createdAt = r.CreatedAt
                })
                .AsNoTracking()
                .ToListAsync();

            return Ok(reviews);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error retrieving reviews: {ex.Message}" });
        }
    }

    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetReviewStats()
    {
        try
        {
            var reviews = await _context.Reviews
                .Where(r => r.IsApproved && !r.IsDeleted)
                .AsNoTracking()
                .ToListAsync();

            if (reviews.Count == 0)
            {
                return Ok(new
                {
                    averageRating = 0.0,
                    totalReviews = 0,
                    ratingDistribution = new Dictionary<int, int>
                    {
                        { 1, 0 },
                        { 2, 0 },
                        { 3, 0 },
                        { 4, 0 },
                        { 5, 0 }
                    }
                });
            }

            var averageRating = reviews.Average(r => r.Rating);
            var ratingDistribution = reviews
                .GroupBy(r => r.Rating)
                .ToDictionary(g => g.Key, g => g.Count());

            // Fill in missing ratings
            for (int i = 1; i <= 5; i++)
            {
                if (!ratingDistribution.ContainsKey(i))
                {
                    ratingDistribution[i] = 0;
                }
            }

            return Ok(new
            {
                averageRating = Math.Round(averageRating, 1),
                totalReviews = reviews.Count,
                ratingDistribution
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error retrieving review stats: {ex.Message}" });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<Review>> CreateReview([FromBody] CreateReviewModel model)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var review = new Review
            {
                UserId = userId,
                BookingId = model.BookingId,
                Rating = model.Rating,
                Comment = model.Comment,
                IsApproved = true, // Auto-approve for now
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = review.Id,
                userId = review.UserId,
                rating = review.Rating,
                comment = review.Comment,
                createdAt = review.CreatedAt
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error creating review: {ex.Message}" });
        }
    }
}

public class CreateReviewModel
{
    public int? BookingId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

