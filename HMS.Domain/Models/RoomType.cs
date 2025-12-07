using HMS.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace HMS.Domain.Models;

public class RoomType : IAuditable, ISoftDelete
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty; // e.g., "Single", "Double", "Suite"
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    [Range(0.01, 10000, ErrorMessage = "Base price must be between 0.01 and 10000")]
    public decimal BasePricePerNight { get; set; }
    
    [Range(1, 10, ErrorMessage = "Max capacity must be between 1 and 10")]
    public int MaxCapacity { get; set; }
    
    [StringLength(20)]
    public string? Size { get; set; } // e.g., "25 sqm", "35 sqm"
    
    // New fields for images and amenities
    public List<string> ImageUrls { get; set; } = new List<string>();
    public List<string> Amenities { get; set; } = new List<string>();
    
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
    public virtual ICollection<Room> Rooms { get; set; } = new List<Room>();
}
