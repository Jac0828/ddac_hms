namespace HMS.Api.DTOs;

public class ServiceRequestDto
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? AssignedToUserId { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Flattened booking information (no circular reference)
    public BookingInfoDto? Booking { get; set; }
    
    // Flattened user information (no circular reference)
    public UserInfoDto? User { get; set; }
    
    // Flattened assigned user information (no circular reference)
    public UserInfoDto? AssignedToUser { get; set; }
}

public class BookingInfoDto
{
    public int Id { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RoomNumber { get; set; }
    public string? RoomType { get; set; }
}

public class UserInfoDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

public class CreateServiceRequestDto
{
    public int BookingId { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class UpdateServiceRequestStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
