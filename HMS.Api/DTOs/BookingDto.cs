namespace HMS.Api.DTOs;

public class BookingDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public UserDto? User { get; set; } // Nested user details
    public int RoomId { get; set; }
    public RoomDto? Room { get; set; } // Nested room details
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public decimal TotalPrice { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int NumberOfGuests { get; set; }
    public string? SpecialRequests { get; set; }
    public DateTime? ActualCheckInDate { get; set; }
    public DateTime? ActualCheckOutDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBookingDto
{
    public int RoomId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public string? SpecialRequests { get; set; }
}

public class UpdateBookingDto
{
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public string? SpecialRequests { get; set; }
}

public class UpdateBookingStatusDto
{
    public string Status { get; set; } = string.Empty;
}
