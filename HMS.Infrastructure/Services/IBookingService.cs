using HMS.Domain.Models;

namespace HMS.Infrastructure.Services;

public interface IBookingService
{
    Task<IEnumerable<Booking>> GetAllBookingsAsync();
    Task<IEnumerable<Booking>> GetUserBookingsAsync(string userId);
    Task<Booking?> GetBookingByIdAsync(int id);
    Task<Booking> CreateBookingAsync(Booking booking);
    Task<Booking> UpdateBookingAsync(Booking booking);
    Task<bool> CancelBookingAsync(int id);
    Task<Booking> CheckoutBookingAsync(int id);
    Task<bool> HasBookingOverlapAsync(int roomId, DateTime checkIn, DateTime checkOut, int? excludeBookingId = null);
    Task<decimal> CalculateTotalPriceAsync(int roomId, DateTime checkIn, DateTime checkOut, string? userId = null);
}

