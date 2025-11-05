namespace HMS.Domain.Models;

public class NewsComment
{
    public int Id { get; set; }
    public int NewsletterId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;

    // Navigation properties
    public virtual Newsletter Newsletter { get; set; } = null!;
    public virtual AppUser User { get; set; } = null!;
}

