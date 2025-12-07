using Microsoft.AspNetCore.Identity;

namespace HMS.Domain.Models;

public class AppUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public int Points { get; set; } = 0;
    public string MembershipTier { get; set; } = "Member";

    // Navigation properties
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public virtual ICollection<ServiceRequest> ServiceRequests { get; set; } = new List<ServiceRequest>();
    public virtual ICollection<NewsComment> NewsComments { get; set; } = new List<NewsComment>();
    public virtual ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
    public virtual ICollection<HousekeepingTask> AssignedHousekeepingTasks { get; set; } = new List<HousekeepingTask>();
}
