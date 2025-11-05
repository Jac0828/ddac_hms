namespace HMS.Domain.Models;

public class Payment
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // CreditCard, DebitCard, Cash, BankTransfer
    public string Status { get; set; } = "Pending"; // Pending, Completed, Failed, Refunded
    public string? TransactionId { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Booking Booking { get; set; } = null!;
    public virtual AppUser User { get; set; } = null!;
}

