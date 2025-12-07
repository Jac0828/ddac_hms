namespace HMS.Api.DTOs;

public class RoomDto
{
    public int Id { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string RoomType { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Capacity { get; set; }
    public bool HasBalcony { get; set; }
    public bool HasWifi { get; set; }
    public bool HasTV { get; set; }
    public bool HasAirConditioning { get; set; }
    
    // Added fields from RoomType for display
    public List<string> ImageUrls { get; set; } = new List<string>();
    public List<string> Amenities { get; set; } = new List<string>();
}

public class CreateRoomDto
{
    public string RoomNumber { get; set; } = string.Empty;
    public int RoomTypeId { get; set; } // Foreign key to RoomTypes table
    public decimal PricePerNight { get; set; }
    public string Status { get; set; } = "Available";
    public string? Description { get; set; }
    public int Capacity { get; set; }
    public bool HasBalcony { get; set; }
    public bool HasWifi { get; set; }
    public bool HasTV { get; set; }
    public bool HasAirConditioning { get; set; }
}

public class BatchCreateRoomsDto
{
    public int RoomTypeId { get; set; }
    public string RoomNumberRange { get; set; } = string.Empty; // e.g., "101-105" or "201,202,205"
    public decimal? PricePerNight { get; set; } // Optional, overrides RoomType default
}

public class UpdateRoomDto
{
    public string RoomNumber { get; set; } = string.Empty;
    public int RoomTypeId { get; set; } // Foreign key to RoomTypes table
    public decimal PricePerNight { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Capacity { get; set; }
    public bool HasBalcony { get; set; }
    public bool HasWifi { get; set; }
    public bool HasTV { get; set; }
    public bool HasAirConditioning { get; set; }
}

public class UpdateRoomStatusDto
{
    public string Status { get; set; } = string.Empty;
}
