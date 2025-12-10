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
    [Authorize(Roles = "Customer,Manager,Receptionist")]
    public async Task<ActionResult<PaymentDto>> RecordPayment([FromBody] CreatePaymentDto dto)
    {
        var booking = await _bookingService.GetBookingByIdAsync(dto.BookingId);
        if (booking == null)
            return NotFound("Booking not found");

        var payment = new Payment
        {
            BookingId = dto.BookingId,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod.ToPaymentMethod(),
            Status = PaymentStatus.Paid,
            TransactionId = dto.TransactionId
        };

        var created = await _paymentService.RecordPaymentAsync(payment);
        return CreatedAtAction(nameof(GetPayment), new { id = created.Id }, await MapToDtoAsync(created));
    }

    [HttpGet]
    [Authorize(Roles = "Manager")]
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

        // Only Manager or booking owner can see payments
        if (!roles.Contains("Manager") && booking.UserId != userId)
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
