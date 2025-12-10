using Microsoft.EntityFrameworkCore;
using HMS.Domain.Models;
using HMS.Domain.Enums;
using HMS.Infrastructure.Data;

namespace HMS.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly ApplicationDbContext _context;

    public PaymentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Payment>> GetAllPaymentsAsync()
    {
        return await _context.Payments
            .Include(p => p.Booking)
                .ThenInclude(b => b.User)
            .Include(p => p.Booking)
                .ThenInclude(b => b.Room)
            .OrderByDescending(p => p.TransactionDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Payment>> GetBookingPaymentsAsync(int bookingId)
    {
        return await _context.Payments
            .Include(p => p.Booking)
                .ThenInclude(b => b.Room)
            .Include(p => p.Booking)
                .ThenInclude(b => b.User)
            .Where(p => p.BookingId == bookingId)
            .OrderByDescending(p => p.TransactionDate)
            .ToListAsync();
    }

    public async Task<Payment?> GetPaymentByIdAsync(int id)
    {
        return await _context.Payments
            .Include(p => p.Booking)
                .ThenInclude(b => b.Room)
            .Include(p => p.Booking)
                .ThenInclude(b => b.User)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Payment> RecordPaymentAsync(Payment payment)
    {
        payment.TransactionDate = DateTime.UtcNow;
        payment.CreatedAt = DateTime.UtcNow;

        await _context.Payments.AddAsync(payment);
        await _context.SaveChangesAsync();

        // Update booking payment status
        var booking = await _context.Bookings.FindAsync(payment.BookingId);
        if (booking != null)
        {
            await UpdateBookingPaymentStatusAsync(booking);
        }

        return payment;
    }

    public async Task<Payment> UpdatePaymentAsync(Payment payment)
    {
        _context.Payments.Update(payment);
        await _context.SaveChangesAsync();

        // Recalculate booking payment status
        var booking = await _context.Bookings.FindAsync(payment.BookingId);
        if (booking != null)
        {
            await UpdateBookingPaymentStatusAsync(booking);
        }

        return payment;
    }

    public async Task<decimal> GetTotalRevenueAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.Payments.Where(p => p.Status == PaymentStatus.Paid);

        if (startDate.HasValue)
        {
            query = query.Where(p => p.TransactionDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(p => p.TransactionDate <= endDate.Value);
        }

        return await query.SumAsync(p => p.Amount);
    }

    /// <summary>
    /// Update booking payment status based on total paid amount
    /// </summary>
    private async Task UpdateBookingPaymentStatusAsync(Booking booking)
    {
        // Calculate total paid amount (only from payments with Paid status)
        var totalPaid = await _context.Payments
            .Where(p => p.BookingId == booking.Id && p.Status == PaymentStatus.Paid && !p.IsDeleted)
            .SumAsync(p => p.Amount);

        // Calculate total refunded amount
        var totalRefunded = await _context.Payments
            .Where(p => p.BookingId == booking.Id && 
                       (p.Status == PaymentStatus.Refunded || p.Status == PaymentStatus.PartiallyRefunded) && 
                       !p.IsDeleted)
            .SumAsync(p => p.Amount);

        // Net paid amount (paid - refunded)
        var netPaid = totalPaid - totalRefunded;

        // Update payment status based on net paid amount
        if (netPaid <= 0)
        {
            // No payment or fully refunded
            booking.PaymentStatus = PaymentStatus.Pending;
        }
        else if (netPaid >= booking.TotalPrice)
        {
            // Fully paid
            booking.PaymentStatus = PaymentStatus.Paid;
        }
        else
        {
            // Partially paid - keep as Pending (or could use PartiallyPaid if enum supports it)
            booking.PaymentStatus = PaymentStatus.Pending;
        }

        booking.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }
}

