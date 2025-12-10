using HMS.Domain.Models;

namespace HMS.Infrastructure.Services;

public interface IPaymentService
{
    Task<IEnumerable<Payment>> GetAllPaymentsAsync();
    Task<IEnumerable<Payment>> GetBookingPaymentsAsync(int bookingId);
    Task<Payment?> GetPaymentByIdAsync(int id);
    Task<Payment> RecordPaymentAsync(Payment payment);
    Task<Payment> UpdatePaymentAsync(Payment payment);
    Task<decimal> GetTotalRevenueAsync(DateTime? startDate = null, DateTime? endDate = null);
}

