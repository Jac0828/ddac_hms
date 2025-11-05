namespace HMS.Domain.Models;

public class Room
{
    public int Id { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string RoomType { get; set; } = string.Empty; // e.g., "Single", "Double", "Suite"
    public decimal PricePerNight { get; set; }
    public string Status { get; set; } = "Available"; // Available, Occupied, Maintenance, Cleaning
    public string Description { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public bool HasBalcony { get; set; }
    public bool HasWifi { get; set; }
    public bool HasTV { get; set; }
    public bool HasAirConditioning { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}

