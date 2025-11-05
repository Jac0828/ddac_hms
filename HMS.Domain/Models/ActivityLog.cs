namespace HMS.Domain.Models;

public class ActivityLog
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // e.g., "Created Booking", "Updated Room Status", "Deleted Comment"
    public string EntityType { get; set; } = string.Empty; // e.g., "Booking", "Room", "User"
    public int? EntityId { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual AppUser User { get; set; } = null!;
}

