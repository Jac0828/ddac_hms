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
            .Where(p => p.BookingId == bookingId)
            .OrderByDescending(p => p.TransactionDate)
            .ToListAsync();
    }

    public async Task<Payment?> GetPaymentByIdAsync(int id)
    {
        return await _context.Payments
            .Include(p => p.Booking)
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
            var totalPaid = await _context.Payments
                .Where(p => p.BookingId == payment.BookingId && p.Status == PaymentStatus.Paid)
                .SumAsync(p => p.Amount);

            if (totalPaid >= booking.TotalPrice)
            {
                booking.PaymentStatus = PaymentStatus.Paid;
            }
            else if (totalPaid > 0)
            {
                booking.PaymentStatus = PaymentStatus.Pending; // Partial payment
            }

            await _context.SaveChangesAsync();
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
            var totalPaid = await _context.Payments
                .Where(p => p.BookingId == payment.BookingId && p.Status == PaymentStatus.Paid)
                .SumAsync(p => p.Amount);

            if (totalPaid >= booking.TotalPrice)
            {
                booking.PaymentStatus = PaymentStatus.Paid;
            }
            else if (totalPaid > 0)
            {
                booking.PaymentStatus = PaymentStatus.Pending;
            }
            else
            {
                booking.PaymentStatus = PaymentStatus.Pending;
            }

            await _context.SaveChangesAsync();
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
}

