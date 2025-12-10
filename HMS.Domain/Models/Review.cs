using HMS.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace HMS.Domain.Models;

public class Review : IAuditable, ISoftDelete
{
    public int Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    public int? BookingId { get; set; } // Optional: link to booking
    
    [Required]
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int Rating { get; set; }
    
    [StringLength(1000)]
    public string? Comment { get; set; }
    
    public bool IsApproved { get; set; } = true; // Admin can approve/reject reviews
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
    
    // Navigation properties
    public virtual AppUser? User { get; set; }
    public virtual Booking? Booking { get; set; }
}

