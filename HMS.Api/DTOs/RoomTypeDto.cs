namespace HMS.Api.DTOs;

public class RoomTypeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePricePerNight { get; set; }
    public int MaxCapacity { get; set; }
    public string? Size { get; set; }
    public List<string> ImageUrls { get; set; } = new List<string>();
    public List<string> Amenities { get; set; } = new List<string>();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateRoomTypeDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePricePerNight { get; set; }
    public int MaxCapacity { get; set; }
    public string? Size { get; set; }
    public List<string>? ImageUrls { get; set; }
    public List<string>? Amenities { get; set; }
}

public class UpdateRoomTypeDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePricePerNight { get; set; }
    public int MaxCapacity { get; set; }
    public string? Size { get; set; }
    public List<string>? ImageUrls { get; set; }
    public List<string>? Amenities { get; set; }
}
