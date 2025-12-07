using HMS.Domain.Enums;
using HMS.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace HMS.Domain.Models;

public class Payment : IAuditable, ISoftDelete
{
    public int Id { get; set; }
    
    public int BookingId { get; set; }
    
    [Range(0.01, 100000, ErrorMessage = "Amount must be between 0.01 and 100000")]
    public decimal Amount { get; set; }
    
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.CreditCard;
    
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    
    [StringLength(100)]
    public string? TransactionId { get; set; }
    
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
    public virtual Booking Booking { get; set; } = null!;
}

