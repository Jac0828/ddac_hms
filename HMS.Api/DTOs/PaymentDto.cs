namespace HMS.Api.DTOs;

public class PaymentDto
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string BookingRoomNumber { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime TransactionDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
}

public class CreatePaymentDto
{
    public int BookingId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
}
