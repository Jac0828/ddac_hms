using HMS.Domain.Enums;
using HMS.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace HMS.Domain.Models;

public class Booking : IAuditable, ISoftDelete
{
    public int Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty; // Guest
    
    public int RoomId { get; set; }
    
    [Required]
    public DateTime CheckInDate { get; set; }
    
    [Required]
    public DateTime CheckOutDate { get; set; }
    
    [Range(0.01, 100000, ErrorMessage = "Total price must be between 0.01 and 100000")]
    public decimal TotalPrice { get; set; }
    
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    
    [Range(1, 10, ErrorMessage = "Number of guests must be between 1 and 10")]
    public int NumberOfGuests { get; set; }
    
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    
    [StringLength(500)]
    public string? SpecialRequests { get; set; }
    
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
    public virtual AppUser User { get; set; } = null!;
    public virtual Room Room { get; set; } = null!;
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public virtual ICollection<ServiceRequest> ServiceRequests { get; set; } = new List<ServiceRequest>();
}

