namespace HMS.Domain.Models;

public class QueryTicket
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Open"; // Open, InProgress, Resolved, Closed
    public string? AssignedToUserId { get; set; } // Receptionist or Manager
    public string? Response { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual AppUser User { get; set; } = null!;
    public virtual AppUser? AssignedToUser { get; set; }
}

