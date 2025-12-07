using HMS.Domain.Enums;
using HMS.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace HMS.Domain.Models;

public class ServiceRequest : IAuditable, ISoftDelete
{
    public int Id { get; set; }
    
    public int BookingId { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    public ServiceType ServiceType { get; set; } = ServiceType.Other;
    
    [Required]
    [StringLength(500)]
    public string Description { get; set; } = string.Empty;
    
    public ServiceRequestStatus Status { get; set; } = ServiceRequestStatus.Pending;
    
    public string? AssignedToUserId { get; set; } // RoomAttendant or other staff
    
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    
    [StringLength(1000)]
    public string? Notes { get; set; }
    
    // IAuditable
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    // ISoftDelete
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }

    // Navigation properties
    public virtual Booking Booking { get; set; } = null!;
    public virtual AppUser User { get; set; } = null!;
    public virtual AppUser? AssignedToUser { get; set; }
}

