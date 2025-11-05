using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using HMS.Domain.Models;
using HMS.Infrastructure.Data;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<AppUser> _userManager;

    public BookingsController(ApplicationDbContext context, UserManager<AppUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetBookings()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        var roles = await _userManager.GetRolesAsync(user!);

        IQueryable<Booking> query;

        if (roles.Contains("Manager") || roles.Contains("Receptionist"))
        {
            query = _context.Bookings.Include(b => b.User).Include(b => b.Room);
        }
        else
        {
            query = _context.Bookings
                .Where(b => b.UserId == userId)
                .Include(b => b.Room);
        }

        var bookings = await query
            .Select(b => new
            {
                b.Id,
                b.CheckInDate,
                b.CheckOutDate,
                b.NumberOfGuests,
                b.TotalAmount,
                b.Status,
                b.SpecialRequests,
                Room = new { b.Room.Id, b.Room.RoomNumber, b.Room.RoomType },
                User = roles.Contains("Manager") || roles.Contains("Receptionist") ? new { b.User.Id, b.User.Email, b.User.FirstName, b.User.LastName } : null
            })
            .ToListAsync();

        return Ok(bookings);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Booking>> GetBooking(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        var roles = await _userManager.GetRolesAsync(user!);

        var booking = await _context.Bookings
            .Include(b => b.Room)
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
        {
            return NotFound();
        }

        if (!roles.Contains("Manager") && !roles.Contains("Receptionist") && booking.UserId != userId)
        {
            return Forbid();
        }

        return booking;
    }

    [HttpPost]
    [Authorize(Roles = "Customer,Manager,Receptionist")]
    public async Task<ActionResult<Booking>> CreateBooking(CreateBookingModel model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Check if room is available
        var isAvailable = !await _context.Bookings.AnyAsync(b =>
            b.RoomId == model.RoomId &&
            b.Status != "Cancelled" &&
            ((model.CheckInDate >= b.CheckInDate && model.CheckInDate < b.CheckOutDate) ||
             (model.CheckOutDate > b.CheckInDate && model.CheckOutDate <= b.CheckOutDate) ||
             (model.CheckInDate <= b.CheckInDate && model.CheckOutDate >= b.CheckOutDate)));

        if (!isAvailable)
        {
            return BadRequest("Room is not available for the selected dates");
        }

        var room = await _context.Rooms.FindAsync(model.RoomId);
        if (room == null)
        {
            return NotFound("Room not found");
        }

        var nights = (model.CheckOutDate - model.CheckInDate).Days;
        var totalAmount = room.PricePerNight * nights;

        var booking = new Booking
        {
            UserId = model.UserId ?? userId!,
            RoomId = model.RoomId,
            CheckInDate = model.CheckInDate,
            CheckOutDate = model.CheckOutDate,
            NumberOfGuests = model.NumberOfGuests,
            TotalAmount = totalAmount,
            Status = "Pending",
            SpecialRequests = model.SpecialRequests,
            CreatedAt = DateTime.UtcNow
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, booking);
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<IActionResult> UpdateBookingStatus(int id, UpdateBookingStatusModel model)
    {
        var booking = await _context.Bookings.FindAsync(id);
        if (booking == null)
        {
            return NotFound();
        }

        booking.Status = model.Status;
        booking.UpdatedAt = DateTime.UtcNow;

        if (model.Status == "CheckedIn")
        {
            var room = await _context.Rooms.FindAsync(booking.RoomId);
            if (room != null)
            {
                room.Status = "Occupied";
            }
        }
        else if (model.Status == "CheckedOut")
        {
            var room = await _context.Rooms.FindAsync(booking.RoomId);
            if (room != null)
            {
                room.Status = "Cleaning";
            }
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Customer,Manager,Receptionist")]
    public async Task<IActionResult> CancelBooking(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        var roles = await _userManager.GetRolesAsync(user!);

        var booking = await _context.Bookings.FindAsync(id);
        if (booking == null)
        {
            return NotFound();
        }

        if (!roles.Contains("Manager") && !roles.Contains("Receptionist") && booking.UserId != userId)
        {
            return Forbid();
        }

        booking.Status = "Cancelled";
        booking.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateBookingModel
{
    public int RoomId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public string? SpecialRequests { get; set; }
    public string? UserId { get; set; } // Optional for Manager/Receptionist to create bookings for others
}

public class UpdateBookingStatusModel
{
    public string Status { get; set; } = string.Empty;
}

