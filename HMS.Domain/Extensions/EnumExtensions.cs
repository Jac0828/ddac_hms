using HMS.Domain.Enums;

namespace HMS.Domain.Extensions;

/// <summary>
/// Extension methods for enum conversions
/// </summary>
public static class EnumExtensions
{
    public static string ToStringValue(this RoomStatus status)
    {
        return status switch
        {
            RoomStatus.Available => "Available",
            RoomStatus.Booked => "Booked",
            RoomStatus.Occupied => "Occupied",
            RoomStatus.Cleaning => "Cleaning",
            RoomStatus.Maintenance => "Maintenance",
            RoomStatus.OutOfOrder => "OutOfOrder",
            _ => status.ToString()
        };
    }

    public static RoomStatus ToRoomStatus(this string status)
    {
        return status switch
        {
            "Available" => RoomStatus.Available,
            "Booked" => RoomStatus.Booked,
            "Occupied" => RoomStatus.Occupied,
            "Cleaning" => RoomStatus.Cleaning,
            "Maintenance" => RoomStatus.Maintenance,
            "OutOfOrder" => RoomStatus.OutOfOrder,
            _ => Enum.TryParse<RoomStatus>(status, true, out var result) ? result : RoomStatus.Available
        };
    }

    public static string ToStringValue(this BookingStatus status)
    {
        return status switch
        {
            BookingStatus.Pending => "Pending",
            BookingStatus.Confirmed => "Confirmed",
            BookingStatus.CheckedIn => "CheckedIn",
            BookingStatus.CheckedOut => "CheckedOut",
            BookingStatus.Cancelled => "Cancelled",
            BookingStatus.NoShow => "NoShow",
            _ => status.ToString()
        };
    }

    public static BookingStatus ToBookingStatus(this string status)
    {
        return status switch
        {
            "Pending" => BookingStatus.Pending,
            "Confirmed" => BookingStatus.Confirmed,
            "CheckedIn" => BookingStatus.CheckedIn,
            "CheckedOut" => BookingStatus.CheckedOut,
            "Cancelled" => BookingStatus.Cancelled,
            "NoShow" => BookingStatus.NoShow,
            _ => Enum.TryParse<BookingStatus>(status, true, out var result) ? result : BookingStatus.Pending
        };
    }

    public static string ToStringValue(this PaymentStatus status)
    {
        return status switch
        {
            PaymentStatus.Pending => "Pending",
            PaymentStatus.Paid => "Paid",
            PaymentStatus.Refunded => "Refunded",
            PaymentStatus.Failed => "Failed",
            PaymentStatus.PartiallyRefunded => "PartiallyRefunded",
            _ => status.ToString()
        };
    }

    public static PaymentStatus ToPaymentStatus(this string status)
    {
        return status switch
        {
            "Pending" => PaymentStatus.Pending,
            "Paid" => PaymentStatus.Paid,
            "Refunded" => PaymentStatus.Refunded,
            "Failed" => PaymentStatus.Failed,
            "PartiallyRefunded" => PaymentStatus.PartiallyRefunded,
            _ => Enum.TryParse<PaymentStatus>(status, true, out var result) ? result : PaymentStatus.Pending
        };
    }

    public static string ToStringValue(this PaymentMethod method)
    {
        return method switch
        {
            PaymentMethod.CreditCard => "CreditCard",
            PaymentMethod.DebitCard => "DebitCard",
            PaymentMethod.Cash => "Cash",
            PaymentMethod.BankTransfer => "BankTransfer",
            PaymentMethod.PayPal => "PayPal",
            PaymentMethod.Other => "Other",
            _ => method.ToString()
        };
    }

    public static PaymentMethod ToPaymentMethod(this string method)
    {
        return method switch
        {
            "CreditCard" => PaymentMethod.CreditCard,
            "DebitCard" => PaymentMethod.DebitCard,
            "Cash" => PaymentMethod.Cash,
            "BankTransfer" => PaymentMethod.BankTransfer,
            "PayPal" => PaymentMethod.PayPal,
            "Other" => PaymentMethod.Other,
            _ => Enum.TryParse<PaymentMethod>(method, true, out var result) ? result : PaymentMethod.CreditCard
        };
    }

    public static string ToStringValue(this ServiceRequestStatus status)
    {
        return status switch
        {
            ServiceRequestStatus.Pending => "Pending",
            ServiceRequestStatus.InProgress => "InProgress",
            ServiceRequestStatus.Completed => "Completed",
            ServiceRequestStatus.Cancelled => "Cancelled",
            _ => status.ToString()
        };
    }

    public static ServiceRequestStatus ToServiceRequestStatus(this string status)
    {
        return status switch
        {
            "Pending" => ServiceRequestStatus.Pending,
            "InProgress" => ServiceRequestStatus.InProgress,
            "Completed" => ServiceRequestStatus.Completed,
            "Cancelled" => ServiceRequestStatus.Cancelled,
            _ => Enum.TryParse<ServiceRequestStatus>(status, true, out var result) ? result : ServiceRequestStatus.Pending
        };
    }

    public static string ToStringValue(this ServiceType type)
    {
        return type switch
        {
            ServiceType.RoomService => "RoomService",
            ServiceType.Housekeeping => "Housekeeping",
            ServiceType.Maintenance => "Maintenance",
            ServiceType.Laundry => "Laundry",
            ServiceType.Concierge => "Concierge",
            ServiceType.Other => "Other",
            _ => type.ToString()
        };
    }

    public static ServiceType ToServiceType(this string type)
    {
        return type switch
        {
            "RoomService" => ServiceType.RoomService,
            "Housekeeping" => ServiceType.Housekeeping,
            "Maintenance" => ServiceType.Maintenance,
            "Laundry" => ServiceType.Laundry,
            "Concierge" => ServiceType.Concierge,
            "Other" => ServiceType.Other,
            _ => Enum.TryParse<ServiceType>(type, true, out var result) ? result : ServiceType.Other
        };
    }

    public static string ToStringValue(this HousekeepingTaskStatus status)
    {
        return status switch
        {
            HousekeepingTaskStatus.Pending => "Pending",
            HousekeepingTaskStatus.InProgress => "InProgress",
            HousekeepingTaskStatus.Completed => "Completed",
            HousekeepingTaskStatus.Cancelled => "Cancelled",
            _ => status.ToString()
        };
    }

    public static HousekeepingTaskStatus ToHousekeepingTaskStatus(this string status)
    {
        return status switch
        {
            "Pending" => HousekeepingTaskStatus.Pending,
            "InProgress" => HousekeepingTaskStatus.InProgress,
            "Completed" => HousekeepingTaskStatus.Completed,
            "Cancelled" => HousekeepingTaskStatus.Cancelled,
            _ => Enum.TryParse<HousekeepingTaskStatus>(status, true, out var result) ? result : HousekeepingTaskStatus.Pending
        };
    }
}

