using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using HMS.Api.DTOs;
using HMS.Domain.Models;
using HMS.Domain.Enums;
using HMS.Domain.Extensions;
using HMS.Infrastructure.Services;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IBookingService _bookingService;

    public PaymentsController(IPaymentService paymentService, IBookingService bookingService)
    {
        _paymentService = paymentService;
        _bookingService = bookingService;
    }

    [HttpPost]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<ActionResult<PaymentDto>> RecordPayment([FromBody] CreatePaymentDto dto)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
            var isManager = roles.Contains("Manager");
            var isReceptionist = roles.Contains("Receptionist");

            var booking = await _bookingService.GetBookingByIdAsync(dto.BookingId);
            if (booking == null)
                return NotFound("Booking not found");

            // Only Manager and Receptionist can record payments (for any customer)
            // This allows front desk staff to process payments at the counter

            // Validate amount
            if (dto.Amount <= 0)
            {
                return BadRequest(new { message = "Payment amount must be greater than 0" });
            }

            // Calculate remaining amount
            var existingPayments = await _paymentService.GetBookingPaymentsAsync(dto.BookingId);
            var totalPaid = existingPayments
                .Where(p => p.Status == PaymentStatus.Paid)
                .Sum(p => p.Amount);
            var remaining = booking.TotalPrice - totalPaid;

            // Validate payment amount doesn't exceed remaining
            if (dto.Amount > remaining)
            {
                return BadRequest(new { message = $"Payment amount (${dto.Amount:F2}) exceeds remaining balance (${remaining:F2})" });
            }

            var payment = new Payment
            {
                BookingId = dto.BookingId,
                Amount = dto.Amount,
                PaymentMethod = dto.PaymentMethod.ToPaymentMethod(),
                Status = PaymentStatus.Paid,
                // Convert empty string to null to avoid unique constraint violation
                TransactionId = string.IsNullOrWhiteSpace(dto.TransactionId) ? null : dto.TransactionId.Trim()
            };

            var created = await _paymentService.RecordPaymentAsync(payment);
            
            // Reload payment with navigation properties for DTO mapping
            var paymentWithNav = await _paymentService.GetPaymentByIdAsync(created.Id);
            if (paymentWithNav != null)
            {
                return CreatedAtAction(nameof(GetPayment), new { id = created.Id }, MapToDto(paymentWithNav));
            }
            
            return CreatedAtAction(nameof(GetPayment), new { id = created.Id }, await MapToDtoAsync(created));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in RecordPayment: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "An error occurred while recording payment", error = ex.Message });
        }
    }

    [HttpGet]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<ActionResult<IEnumerable<PaymentDto>>> GetAllPayments()
    {
        var payments = await _paymentService.GetAllPaymentsAsync();
        var dtos = new List<PaymentDto>();
        foreach (var payment in payments)
        {
            dtos.Add(await MapToDtoAsync(payment));
        }
        return Ok(dtos);
    }

    [HttpGet("booking/{bookingId}")]
    public async Task<ActionResult<IEnumerable<PaymentDto>>> GetBookingPayments(int bookingId)
    {
        var booking = await _bookingService.GetBookingByIdAsync(bookingId);
        if (booking == null)
            return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        // Manager, Receptionist, or booking owner can see payments
        if (!roles.Contains("Manager") && !roles.Contains("Receptionist") && booking.UserId != userId)
            return Forbid();

        var payments = await _paymentService.GetBookingPaymentsAsync(bookingId);
        var dtos = payments.Select(p => MapToDto(p));
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PaymentDto>> GetPayment(int id)
    {
        var payment = await _paymentService.GetPaymentByIdAsync(id);
        if (payment == null)
            return NotFound();

        var booking = await _bookingService.GetBookingByIdAsync(payment.BookingId);
        if (booking == null)
            return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        // Only Manager or booking owner can see payment
        if (!roles.Contains("Manager") && booking.UserId != userId)
            return Forbid();

        return Ok(await MapToDtoAsync(payment));
    }

    private async Task<PaymentDto> MapToDtoAsync(Payment payment)
    {
        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(payment.BookingId);
            
            return new PaymentDto
            {
                Id = payment.Id,
                BookingId = payment.BookingId,
                BookingRoomNumber = booking?.Room?.RoomNumber ?? "",
                CustomerEmail = booking?.User?.Email ?? "",
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod.ToStringValue(),
                TransactionDate = payment.TransactionDate,
                Status = payment.Status.ToStringValue(),
                TransactionId = payment.TransactionId
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in MapToDtoAsync: {ex.Message}");
            // Return DTO with available data even if navigation properties fail
            return new PaymentDto
            {
                Id = payment.Id,
                BookingId = payment.BookingId,
                BookingRoomNumber = "",
                CustomerEmail = "",
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod.ToStringValue(),
                TransactionDate = payment.TransactionDate,
                Status = payment.Status.ToStringValue(),
                TransactionId = payment.TransactionId
            };
        }
    }

    private PaymentDto MapToDto(Payment payment)
    {
        return new PaymentDto
        {
            Id = payment.Id,
            BookingId = payment.BookingId,
            BookingRoomNumber = payment.Booking?.Room?.RoomNumber ?? "",
            CustomerEmail = payment.Booking?.User?.Email ?? "",
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod.ToStringValue(),
            TransactionDate = payment.TransactionDate,
            Status = payment.Status.ToStringValue(),
            TransactionId = payment.TransactionId
        };
    }
}
