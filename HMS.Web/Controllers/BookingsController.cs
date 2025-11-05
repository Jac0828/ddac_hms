using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HMS.Web.Services;

namespace HMS.Web.Controllers;

[Authorize]
public class BookingsController : Controller
{
    private readonly ApiService _apiService;

    public BookingsController(ApiService apiService)
    {
        _apiService = apiService;
    }

    public async Task<IActionResult> Index()
    {
        var bookings = await _apiService.GetAsync<List<Booking>>("api/bookings");
        return View(bookings ?? new List<Booking>());
    }

    public async Task<IActionResult> Details(int id)
    {
        var booking = await _apiService.GetAsync<Booking>($"api/bookings/{id}");
        if (booking == null)
        {
            return NotFound();
        }
        return View(booking);
    }

    [HttpGet]
    public async Task<IActionResult> Create(int roomId, DateTime? checkIn, DateTime? checkOut)
    {
        var room = await _apiService.GetAsync<Room>($"api/rooms/{roomId}");
        if (room == null)
        {
            return NotFound();
        }

        ViewBag.Room = room;
        ViewBag.CheckIn = checkIn ?? DateTime.Today;
        ViewBag.CheckOut = checkOut ?? DateTime.Today.AddDays(1);

        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CreateBookingModel model)
    {
        if (!ModelState.IsValid)
        {
            var room = await _apiService.GetAsync<Room>($"api/rooms/{model.RoomId}");
            ViewBag.Room = room;
            return View(model);
        }

        var result = await _apiService.PostAsync<Booking>("api/bookings", model);
        if (result != null)
        {
            return RedirectToAction(nameof(Details), new { id = result.Id });
        }

        ModelState.AddModelError(string.Empty, "Failed to create booking.");
        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Cancel(int id)
    {
        var result = await _apiService.DeleteAsync($"api/bookings/{id}");
        if (result)
        {
            return RedirectToAction(nameof(Index));
        }
        return NotFound();
    }
}

public class Booking
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? SpecialRequests { get; set; }
    public Room? Room { get; set; }
}

public class CreateBookingModel
{
    public int RoomId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public string? SpecialRequests { get; set; }
}

