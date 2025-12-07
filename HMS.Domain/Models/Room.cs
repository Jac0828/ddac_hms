using HMS.Domain.Enums;
using HMS.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace HMS.Domain.Models;

public class Room : IAuditable, ISoftDelete
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(10)]
    public string RoomNumber { get; set; } = string.Empty;
    
    public int RoomTypeId { get; set; } // Foreign key to RoomTypes table
    public virtual RoomType? RoomType { get; set; } // Navigation property
    
    [Range(0.01, 10000, ErrorMessage = "Price must be between 0.01 and 10000")]
    public decimal PricePerNight { get; set; }
    
    public RoomStatus Status { get; set; } = RoomStatus.Available;
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    [Range(1, 10, ErrorMessage = "Capacity must be between 1 and 10")]
    public int Capacity { get; set; }
    
    public bool HasBalcony { get; set; }
    public bool HasWifi { get; set; }
    public bool HasTV { get; set; }
    public bool HasAirConditioning { get; set; }
    
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
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public virtual ICollection<HousekeepingTask> HousekeepingTasks { get; set; } = new List<HousekeepingTask>();
}

