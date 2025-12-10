using HMS.Api.Services;
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
    private readonly IAuditLogService _auditLogService;
    private readonly IEmailSender _emailSender;

    public BookingsController(
        IBookingService bookingService, 
        IRoomService roomService, 
        IEmailSender emailSender,
        IAuditLogService auditLogService)
    {
        _bookingService = bookingService;
        _roomService = roomService;
        _emailSender = emailSender;
        _auditLogService = auditLogService;
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
            CheckInDate = DateTime.SpecifyKind(dto.CheckInDate, DateTimeKind.Utc),
            CheckOutDate = DateTime.SpecifyKind(dto.CheckOutDate, DateTimeKind.Utc),
            NumberOfGuests = dto.NumberOfGuests,
            SpecialRequests = dto.SpecialRequests
        };

        try
        {
            var created = await _bookingService.CreateBookingAsync(booking);
            
            try 
            {
                await _auditLogService.LogActionAsync(userId!, "Created Booking", "Booking", created.Id, $"Booking #{created.Id} created");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to log audit: {ex.Message}");
            }

            return CreatedAtAction(nameof(GetBooking), new { id = created.Id }, await MapToDtoAsync(created));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating booking: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                return StatusCode(500, new { message = $"Internal Server Error: {ex.Message}. Inner: {ex.InnerException.Message}" });
            }
            return StatusCode(500, new { message = $"Internal Server Error: {ex.Message}" });
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

            if (roles.Contains("Manager") || roles.Contains("Receptionist") || roles.Contains("Admin"))
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

        // Recalculate total price with member discount
        try
        {
            booking.TotalPrice = await _bookingService.CalculateTotalPriceAsync(booking.RoomId, dto.CheckInDate, dto.CheckOutDate, booking.UserId);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        await _bookingService.UpdateBookingAsync(booking);
        return NoContent();
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<IActionResult> UpdateBookingStatus(int id, [FromBody] UpdateBookingStatusDto dto)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null)
            return NotFound();

        if (Enum.TryParse<BookingStatus>(dto.Status, true, out var newStatus))
        {
            var oldStatus = booking.Status;
            booking.Status = newStatus;
            booking.UpdatedAt = DateTime.UtcNow;

            // Sync Room Status if needed
            var room = await _roomService.GetRoomByIdAsync(booking.RoomId);
            if (room != null)
            {
                if (newStatus == BookingStatus.CheckedIn)
                {
                    room.Status = RoomStatus.Occupied;
                    await _roomService.UpdateRoomAsync(room);
                }
                else if (newStatus == BookingStatus.CheckedOut)
                {
                    room.Status = RoomStatus.Available;
                    await _roomService.UpdateRoomAsync(room);
                }
            }

            await _bookingService.UpdateBookingAsync(booking);

            // Send Confirmation Email if status changes to Confirmed
            if (newStatus == BookingStatus.Confirmed && oldStatus != BookingStatus.Confirmed && booking.User?.Email != null)
            {
                try
                {
                    var emailSubject = $"Booking Confirmed - {booking.Room?.RoomType?.Name ?? "Room"} #{booking.Room?.RoomNumber}";
                    var emailBody = $@"
                        <div style='font-family: ""Playfair Display"", serif; color: #2C2C2C; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;'>
                            <div style='text-align: center; border-bottom: 2px solid #C9A961; padding-bottom: 20px; margin-bottom: 20px;'>
                                <h1 style='color: #C9A961; margin: 0;'>HMS Luxury Hotel</h1>
                                <p style='margin: 5px 0 0; color: #8B6F47;'>Booking Confirmation</p>
                            </div>
                            
                            <p>Dear <strong>{booking.User.FirstName} {booking.User.LastName}</strong>,</p>
                            <p>We are delighted to confirm your reservation at HMS Luxury Hotel. Below are the details of your upcoming stay:</p>
                            
                            <div style='background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                                <table style='width: 100%; border-collapse: collapse;'>
                                    <tr>
                                        <td style='padding: 8px 0; color: #666;'>Confirmation Number:</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: bold;'>#{booking.Id}</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px 0; color: #666;'>Room:</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: bold;'>{booking.Room?.RoomType?.Name ?? "Deluxe"} - Room {booking.Room?.RoomNumber}</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px 0; color: #666;'>Check-in:</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: bold;'>{booking.CheckInDate:dd MMM yyyy} (from 3:00 PM)</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px 0; color: #666;'>Check-out:</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: bold;'>{booking.CheckOutDate:dd MMM yyyy} (by 11:00 AM)</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 8px 0; color: #666;'>Guests:</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: bold;'>{booking.NumberOfGuests}</td>
                                    </tr>
                                    <tr style='border-top: 1px solid #e0e0e0;'>
                                        <td style='padding: 15px 0 0; color: #2C2C2C; font-size: 1.1em;'>Total Price:</td>
                                        <td style='padding: 15px 0 0; text-align: right; font-weight: bold; font-size: 1.2em; color: #C9A961;'>${booking.TotalPrice:F2}</td>
                                    </tr>
                                </table>
                            </div>

                            <p>We look forward to welcoming you. If you have any special requests or need to modify your reservation, please contact us.</p>
                            
                            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 0.9em;'>
                                <p>&copy; {DateTime.Now.Year} HMS Luxury Hotel. All rights reserved.</p>
                                <p>123 Luxury Avenue, Paradise City</p>
                            </div>
                        </div>";

                    await _emailSender.SendEmailAsync(booking.User.Email, emailSubject, emailBody);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to send confirmation email: {ex.Message}");
                    // Don't fail the request if email fails, just log it
                }
            }

            return Ok(await MapToDtoAsync(booking));
        }
        return BadRequest(new { message = "Invalid status value" });
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

        try 
        {
            await _auditLogService.LogActionAsync(userId!, "Cancelled Booking", "Booking", id, $"Booking #{id} cancelled");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to log audit: {ex.Message}");
        }

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
        booking.ActualCheckInDate = DateTime.UtcNow;
        booking.UpdatedAt = DateTime.UtcNow;

        // Update room status
        var room = await _roomService.GetRoomByIdAsync(booking.RoomId);
        if (room != null)
        {
            room.Status = RoomStatus.Occupied;
            await _roomService.UpdateRoomAsync(room);
        }

        await _bookingService.UpdateBookingAsync(booking);

        try 
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _auditLogService.LogActionAsync(userId!, "Checked In Guest", "Booking", id, $"Checked in booking #{id}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to log audit: {ex.Message}");
        }

        return Ok(await MapToDtoAsync(booking));
    }

    [HttpPost("{id}/checkout")]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<ActionResult<BookingDto>> Checkout(int id)
    {
        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(id);
            if (booking == null) return NotFound();

            // Manually perform checkout logic here since _bookingService.CheckoutBookingAsync might not support ActualCheckOutDate update if it's encapsulated
            // Or better, I should update the service, but since I don't have easy access to Service implementation right now (it's in Infrastructure/Services/BookingService.cs usually),
            // I will do it here if the service returns the entity, or fetch -> update -> save.
            
            // Let's check if CheckoutBookingAsync updates the status. 
            // The previous code was: var booking = await _bookingService.CheckoutBookingAsync(id);
            
            // Instead, I will do it manually to ensure fields are set.
            
            if (booking.Status != BookingStatus.CheckedIn)
                return BadRequest(new { message = "Booking is not currently checked in" });

            booking.Status = BookingStatus.CheckedOut;
            booking.ActualCheckOutDate = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;
            
            await _bookingService.UpdateBookingAsync(booking);
            
            // Update room status
            var room = await _roomService.GetRoomByIdAsync(booking.RoomId);
            if (room != null)
            {
                room.Status = RoomStatus.Available;
                await _roomService.UpdateRoomAsync(room);
            }
            
            try 
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                await _auditLogService.LogActionAsync(userId!, "Checked Out Guest", "Booking", id, $"Checked out booking #{id}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to log audit: {ex.Message}");
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
        
        var userDto = booking.User != null ? new UserDto
        {
            Id = booking.User.Id,
            Email = booking.User.Email!,
            FirstName = booking.User.FirstName,
            LastName = booking.User.LastName,
            PhoneNumber = booking.User.PhoneNumber
        } : null;

        var roomDto = booking.Room != null ? new RoomDto
        {
            Id = booking.Room.Id,
            RoomNumber = booking.Room.RoomNumber,
            RoomType = booking.Room.RoomType?.Name ?? "",
            PricePerNight = booking.Room.PricePerNight,
            Capacity = booking.Room.Capacity,
            HasWifi = booking.Room.HasWifi,
            HasTV = booking.Room.HasTV,
            HasAirConditioning = booking.Room.HasAirConditioning,
            HasBalcony = booking.Room.HasBalcony
        } : null;

        return Task.FromResult(new BookingDto
        {
            Id = booking.Id,
            UserId = booking.UserId,
            User = userDto,
            RoomId = booking.RoomId,
            Room = roomDto,
            CheckInDate = booking.CheckInDate,
            CheckOutDate = booking.CheckOutDate,
            TotalPrice = booking.TotalPrice,
            PaymentStatus = booking.PaymentStatus.ToStringValue(),
            Status = booking.Status.ToStringValue(),
            NumberOfGuests = booking.NumberOfGuests,
            SpecialRequests = booking.SpecialRequests,
            ActualCheckInDate = booking.ActualCheckInDate,
            ActualCheckOutDate = booking.ActualCheckOutDate,
            CreatedAt = booking.CreatedAt
        });
    }
}
