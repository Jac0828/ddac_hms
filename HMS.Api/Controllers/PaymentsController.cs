using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using HMS.Domain.Models;
using HMS.Infrastructure.Data;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PaymentsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Payment>>> GetPayments([FromQuery] int? bookingId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isManager = User.IsInRole("Manager");

        var query = _context.Payments
            .Include(p => p.Booking)
            .Include(p => p.User)
            .AsQueryable();

        if (!isManager)
        {
            query = query.Where(p => p.UserId == userId);
        }

        if (bookingId.HasValue)
        {
            query = query.Where(p => p.BookingId == bookingId.Value);
        }

        return await query.ToListAsync();
    }

    [HttpPost]
    [Authorize(Roles = "Customer,Manager,Receptionist")]
    public async Task<ActionResult<Payment>> CreatePayment(CreatePaymentModel model)
    {
        var booking = await _context.Bookings.FindAsync(model.BookingId);
        if (booking == null)
        {
            return NotFound("Booking not found");
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var paymentUserId = model.UserId ?? userId!;

        var payment = new Payment
        {
            BookingId = model.BookingId,
            UserId = paymentUserId,
            Amount = model.Amount,
            PaymentMethod = model.PaymentMethod,
            Status = "Completed",
            TransactionId = model.TransactionId,
            PaymentDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        booking.Status = "Confirmed";
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPayment), new { id = payment.Id }, payment);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Payment>> GetPayment(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isManager = User.IsInRole("Manager");

        var payment = await _context.Payments
            .Include(p => p.Booking)
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null)
        {
            return NotFound();
        }

        if (!isManager && payment.UserId != userId)
        {
            return Forbid();
        }

        return payment;
    }
}

public class CreatePaymentModel
{
    public int BookingId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public string? UserId { get; set; } // Optional for Manager/Receptionist
}

