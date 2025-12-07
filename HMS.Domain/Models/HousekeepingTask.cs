using HMS.Domain.Enums;
using HMS.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace HMS.Domain.Models;

public class HousekeepingTask : IAuditable, ISoftDelete
{
    public int Id { get; set; }
    
    public int RoomId { get; set; }
    
    public string? AssignedStaffId { get; set; } // Nullable - can be unassigned
    
    public HousekeepingTaskStatus Status { get; set; } = HousekeepingTaskStatus.Pending;
    
    [StringLength(1000)]
    public string? Notes { get; set; }
    
    // IAuditable
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    // ISoftDelete
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }

    // Navigation properties
    public virtual Room Room { get; set; } = null!;
    public virtual AppUser? AssignedStaff { get; set; }
}

