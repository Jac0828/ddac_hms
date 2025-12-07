namespace HMS.Domain.Enums;

/// <summary>
/// Payment status enumeration
/// </summary>
public enum PaymentStatus
{
    Pending = 0,
    Paid = 1,
    Refunded = 2,
    Failed = 3,
    PartiallyRefunded = 4
}

