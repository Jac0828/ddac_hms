namespace HMS.Domain.Models;

public class Newsletter
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty; // Manager who created it
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsPublished { get; set; } = false;
    public DateTime? PublishedAt { get; set; }

    // Navigation properties
    public virtual AppUser CreatedByUser { get; set; } = null!;
    public virtual ICollection<NewsComment> Comments { get; set; } = new List<NewsComment>();
}

