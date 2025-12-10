using Microsoft.EntityFrameworkCore;
using HMS.Domain.Models;
using HMS.Domain.Enums;
using HMS.Domain.Extensions;
using HMS.Infrastructure.Data;

namespace HMS.Infrastructure.Services;

public class BookingService : IBookingService
{
    private readonly ApplicationDbContext _context;
    private readonly IRoomService _roomService;

    public BookingService(ApplicationDbContext context, IRoomService roomService)
    {
        _context = context;
        _roomService = roomService;
    }

    public async Task<IEnumerable<Booking>> GetAllBookingsAsync()
    {
        return await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Room)
                .ThenInclude(r => r.RoomType)
            .OrderByDescending(b => b.CreatedAt)
            .AsNoTracking() // Read-only query, no need to track changes
            .ToListAsync();
    }

    public async Task<IEnumerable<Booking>> GetUserBookingsAsync(string userId)
    {
        return await _context.Bookings
            .Include(b => b.Room)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    public async Task<Booking?> GetBookingByIdAsync(int id)
    {
        return await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Room)
            .Include(b => b.Payments)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<Booking> CreateBookingAsync(Booking booking)
    {
        // Validate room availability
        if (!await IsRoomAvailableAsync(booking.RoomId, booking.CheckInDate, booking.CheckOutDate))
        {
            throw new InvalidOperationException("Room is not available for the selected dates.");
        }

        // Calculate total price with member discount
        booking.TotalPrice = await CalculateTotalPriceAsync(booking.RoomId, booking.CheckInDate, booking.CheckOutDate, booking.UserId);
        booking.Status = BookingStatus.Pending;
        booking.PaymentStatus = PaymentStatus.Pending;
        booking.CreatedAt = DateTime.UtcNow;

        await _context.Bookings.AddAsync(booking);
        await _context.SaveChangesAsync();

        // Mark room as Booked
        await _roomService.UpdateRoomStatusAsync(booking.RoomId, RoomStatus.Booked.ToStringValue());

        return booking;
    }

    public async Task<Booking> UpdateBookingAsync(Booking booking)
    {
        booking.UpdatedAt = DateTime.UtcNow;
        _context.Bookings.Update(booking);
        await _context.SaveChangesAsync();
        return booking;
    }

    public async Task<bool> CancelBookingAsync(int id)
    {
        var booking = await GetBookingByIdAsync(id);
        if (booking == null) return false;

        booking.Status = BookingStatus.Cancelled;
        booking.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Check if room can be marked as Available
        var hasOtherBookings = await _context.Bookings
            .AnyAsync(b => b.RoomId == booking.RoomId &&
                          b.Id != id &&
                          b.Status != BookingStatus.Cancelled &&
                          b.Status != BookingStatus.CheckedOut);

        if (!hasOtherBookings)
        {
            await _roomService.UpdateRoomStatusAsync(booking.RoomId, RoomStatus.Available.ToStringValue());
        }

        return true;
    }

    public async Task<Booking> CheckoutBookingAsync(int id)
    {
        var booking = await GetBookingByIdAsync(id);
        if (booking == null)
            throw new InvalidOperationException("Booking not found.");

        booking.Status = BookingStatus.CheckedOut;
        booking.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Mark room as Available
        await _roomService.UpdateRoomStatusAsync(booking.RoomId, RoomStatus.Available.ToStringValue());

        return booking;
    }

    public async Task<bool> HasBookingOverlapAsync(int roomId, DateTime checkIn, DateTime checkOut, int? excludeBookingId = null)
    {
        var query = _context.Bookings
            .Where(b => b.RoomId == roomId &&
                       b.Status != BookingStatus.Cancelled &&
                       b.Status != BookingStatus.CheckedOut &&
                       ((b.CheckInDate <= checkIn && b.CheckOutDate > checkIn) ||
                        (b.CheckInDate < checkOut && b.CheckOutDate >= checkOut) ||
                        (b.CheckInDate >= checkIn && b.CheckOutDate <= checkOut)));

        if (excludeBookingId.HasValue)
        {
            query = query.Where(b => b.Id != excludeBookingId.Value);
        }

        return await query.AnyAsync();
    }

    public async Task<decimal> CalculateTotalPriceAsync(int roomId, DateTime checkIn, DateTime checkOut, string? userId = null)
    {
        var room = await _roomService.GetRoomByIdAsync(roomId);
        if (room == null)
            throw new InvalidOperationException("Room not found.");

        var nights = (checkOut - checkIn).Days;
        if (nights <= 0)
            throw new InvalidOperationException("Check-out date must be after check-in date.");

        var basePrice = room.PricePerNight * nights;

        // Apply member discount if user is provided and has membership tier
        if (!string.IsNullOrEmpty(userId))
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null && !string.IsNullOrEmpty(user.MembershipTier) && user.EmailConfirmed)
            {
                var discountMultiplier = GetMemberDiscountMultiplier(user.MembershipTier);
                basePrice = basePrice * discountMultiplier;
            }
        }

        return Math.Round(basePrice, 2);
    }

    private static decimal GetMemberDiscountMultiplier(string membershipTier)
    {
        // Convert discount percentage to multiplier
        // Default discounts: Member 10%, Silver 15%, Gold 20%, Platinum 25%
        return membershipTier.ToLower() switch
        {
            "platinum" => 0.75m,  // 25% discount
            "gold" => 0.80m,      // 20% discount
            "silver" => 0.85m,    // 15% discount
            "member" => 0.90m,    // 10% discount
            _ => 1.0m             // No discount for unknown tiers
        };
    }

    private async Task<bool> IsRoomAvailableAsync(int roomId, DateTime checkIn, DateTime checkOut)
    {
        return await _roomService.IsRoomAvailableAsync(roomId, checkIn, checkOut);
    }
}

