using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using HMS.Domain.Models;
using HMS.Infrastructure.Data;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NewslettersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NewslettersController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<object>>> GetNewsletters()
    {
        var newsletters = await _context.Newsletters
            .Where(n => n.IsPublished)
            .Include(n => n.CreatedByUser)
            .OrderByDescending(n => n.PublishedAt)
            .Select(n => new
            {
                n.Id,
                n.Title,
                n.Content,
                n.ImageUrl,
                CreatedBy = new { n.CreatedByUser.FirstName, n.CreatedByUser.LastName },
                n.PublishedAt,
                CommentCount = n.Comments.Count(c => !c.IsDeleted)
            })
            .ToListAsync();

        return Ok(newsletters);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetNewsletter(int id)
    {
        var newsletter = await _context.Newsletters
            .Include(n => n.CreatedByUser)
            .Include(n => n.Comments.Where(c => !c.IsDeleted))
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (newsletter == null || (!newsletter.IsPublished && !User.IsInRole("Manager")))
        {
            return NotFound();
        }

        return Ok(new
        {
            newsletter.Id,
            newsletter.Title,
            newsletter.Content,
            newsletter.ImageUrl,
            CreatedBy = new { newsletter.CreatedByUser.FirstName, newsletter.CreatedByUser.LastName },
            newsletter.PublishedAt,
            Comments = newsletter.Comments.Select(c => new
            {
                c.Id,
                c.Content,
                User = new { c.User.FirstName, c.User.LastName },
                c.CreatedAt
            })
        });
    }

    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<Newsletter>> CreateNewsletter(CreateNewsletterModel model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var newsletter = new Newsletter
        {
            Title = model.Title,
            Content = model.Content,
            ImageUrl = model.ImageUrl,
            CreatedByUserId = userId!,
            IsPublished = model.IsPublished,
            CreatedAt = DateTime.UtcNow,
            PublishedAt = model.IsPublished ? DateTime.UtcNow : null
        };

        _context.Newsletters.Add(newsletter);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetNewsletter), new { id = newsletter.Id }, newsletter);
    }

    [HttpPost("{id}/comments")]
    [Authorize]
    public async Task<ActionResult<NewsComment>> AddComment(int id, CreateCommentModel model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var comment = new NewsComment
        {
            NewsletterId = id,
            UserId = userId!,
            Content = model.Content,
            CreatedAt = DateTime.UtcNow
        };

        _context.NewsComments.Add(comment);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetComment), new { id = comment.Id }, comment);
    }

    [HttpDelete("comments/{id}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> DeleteComment(int id)
    {
        var comment = await _context.NewsComments.FindAsync(id);
        if (comment == null)
        {
            return NotFound();
        }

        comment.IsDeleted = true;
        comment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("comments/{id}")]
    public async Task<ActionResult<NewsComment>> GetComment(int id)
    {
        var comment = await _context.NewsComments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (comment == null || comment.IsDeleted)
        {
            return NotFound();
        }

        return comment;
    }
}

public class CreateNewsletterModel
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsPublished { get; set; }
}

public class CreateCommentModel
{
    public string Content { get; set; } = string.Empty;
}

