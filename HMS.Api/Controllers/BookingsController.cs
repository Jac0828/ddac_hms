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
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly IRoomService _roomService;

    public BookingsController(IBookingService bookingService, IRoomService roomService)
    {
        _bookingService = bookingService;
        _roomService = roomService;
    }

    [HttpPost]
    [Authorize(Roles = "Customer,Manager,Receptionist")]
    public async Task<ActionResult<BookingDto>> CreateBooking([FromBody] CreateBookingDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var booking = new Booking
        {
            UserId = userId!,
            RoomId = dto.RoomId,
            CheckInDate = dto.CheckInDate,
            CheckOutDate = dto.CheckOutDate,
            NumberOfGuests = dto.NumberOfGuests,
            SpecialRequests = dto.SpecialRequests
        };

        try
        {
            var created = await _bookingService.CreateBookingAsync(booking);
            return CreatedAtAction(nameof(GetBooking), new { id = created.Id }, await MapToDtoAsync(created));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BookingDto>>> GetBookings()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

            IEnumerable<Booking> bookings;

            if (roles.Contains("Manager") || roles.Contains("Receptionist"))
            {
                bookings = await _bookingService.GetAllBookingsAsync();
            }
            else
            {
                bookings = await _bookingService.GetUserBookingsAsync(userId!);
            }

            // Map all bookings to DTOs in parallel for better performance
            var dtoTasks = bookings.Select(b => MapToDtoAsync(b));
            var dtos = await Task.WhenAll(dtoTasks);

            return Ok(dtos);
        }
        catch (Exception ex)
        {
            // Log the exception for debugging
            Console.WriteLine($"Error in GetBookings: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "An error occurred while retrieving bookings", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BookingDto>> GetBooking(int id)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null)
            return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        if (!roles.Contains("Manager") && !roles.Contains("Receptionist") && booking.UserId != userId)
            return Forbid();

        return Ok(await MapToDtoAsync(booking));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<IActionResult> ModifyBooking(int id, [FromBody] UpdateBookingDto dto)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null)
            return NotFound();

        booking.CheckInDate = dto.CheckInDate;
        booking.CheckOutDate = dto.CheckOutDate;
        booking.NumberOfGuests = dto.NumberOfGuests;
        booking.SpecialRequests = dto.SpecialRequests;

        // Recalculate total price
        try
        {
            booking.TotalPrice = await _bookingService.CalculateTotalPriceAsync(booking.RoomId, dto.CheckInDate, dto.CheckOutDate);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        await _bookingService.UpdateBookingAsync(booking);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> CancelBooking(int id)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null)
            return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        if (!roles.Contains("Manager") && !roles.Contains("Receptionist") && booking.UserId != userId)
            return Forbid();

        var result = await _bookingService.CancelBookingAsync(id);
        if (!result)
            return NotFound();

        return NoContent();
    }

    [HttpPost("{id}/checkin")]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<ActionResult<BookingDto>> CheckIn(int id)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null)
            return NotFound();

        if (booking.Status != BookingStatus.Confirmed && booking.Status != BookingStatus.Pending)
            return BadRequest(new { message = $"Cannot check in booking with status: {booking.Status.ToStringValue()}" });

        booking.Status = BookingStatus.CheckedIn;
        booking.UpdatedAt = DateTime.UtcNow;

        // Update room status
        var room = await _roomService.GetRoomByIdAsync(booking.RoomId);
        if (room != null)
        {
            room.Status = RoomStatus.Occupied;
            await _roomService.UpdateRoomAsync(room);
        }

        await _bookingService.UpdateBookingAsync(booking);
        return Ok(await MapToDtoAsync(booking));
    }

    [HttpPost("{id}/checkout")]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<ActionResult<BookingDto>> Checkout(int id)
    {
        try
        {
            var booking = await _bookingService.CheckoutBookingAsync(id);
            
            // Update room status
            var room = await _roomService.GetRoomByIdAsync(booking.RoomId);
            if (room != null)
            {
                room.Status = RoomStatus.Available;
                await _roomService.UpdateRoomAsync(room);
            }
            
            return Ok(await MapToDtoAsync(booking));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("upcoming-checkins")]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<ActionResult<IEnumerable<BookingDto>>> GetUpcomingCheckIns([FromQuery] int days = 7)
    {
        var startDate = DateTime.Today;
        var endDate = startDate.AddDays(days);

        var bookings = await _bookingService.GetAllBookingsAsync();
        var upcoming = bookings
            .Where(b => b.CheckInDate.Date >= startDate && 
                       b.CheckInDate.Date <= endDate &&
                       (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Pending))
            .OrderBy(b => b.CheckInDate);

        var dtos = new List<BookingDto>();
        foreach (var booking in upcoming)
        {
            dtos.Add(await MapToDtoAsync(booking));
        }

        return Ok(dtos);
    }

    private Task<BookingDto> MapToDtoAsync(Booking booking)
    {
        // Room and User are already loaded via Include() in GetAllBookingsAsync
        // No need for additional database queries - this eliminates N+1 query problem
        return Task.FromResult(new BookingDto
        {
            Id = booking.Id,
            UserId = booking.UserId,
            UserEmail = booking.User?.Email ?? "",
            UserFullName = $"{booking.User?.FirstName} {booking.User?.LastName}",
            RoomId = booking.RoomId,
            RoomNumber = booking.Room?.RoomNumber ?? "",
            RoomType = booking.Room?.RoomType?.Name ?? "",
            CheckInDate = booking.CheckInDate,
            CheckOutDate = booking.CheckOutDate,
            TotalPrice = booking.TotalPrice,
            PaymentStatus = booking.PaymentStatus.ToStringValue(),
            Status = booking.Status.ToStringValue(),
            NumberOfGuests = booking.NumberOfGuests,
            SpecialRequests = booking.SpecialRequests,
            CreatedAt = booking.CreatedAt
        });
    }
}
