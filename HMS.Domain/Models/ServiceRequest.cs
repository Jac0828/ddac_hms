namespace HMS.Domain.Models;

public class ServiceRequest
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty; // RoomService, Housekeeping, Maintenance, Laundry, etc.
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, InProgress, Completed, Cancelled
    public string? AssignedToUserId { get; set; } // RoomAttendant or other staff
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Booking Booking { get; set; } = null!;
    public virtual AppUser User { get; set; } = null!;
    public virtual AppUser? AssignedToUser { get; set; }
}

