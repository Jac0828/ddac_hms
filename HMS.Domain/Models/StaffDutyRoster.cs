namespace HMS.Domain.Models;

public class StaffDutyRoster
{
    public int Id { get; set; }
    public string StaffId { get; set; } = string.Empty; // Foreign key to AppUser
    public DateTime Date { get; set; }
    public string Shift { get; set; } = string.Empty; // Morning, Afternoon, Night
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual AppUser Staff { get; set; } = null!;
}

