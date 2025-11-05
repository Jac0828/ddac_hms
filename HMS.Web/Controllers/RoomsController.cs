using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HMS.Web.Services;

namespace HMS.Web.Controllers;

[Authorize]
public class RoomsController : Controller
{
    private readonly ApiService _apiService;

    public RoomsController(ApiService apiService)
    {
        _apiService = apiService;
    }

    [AllowAnonymous]
    public async Task<IActionResult> Index(string? status, string? roomType)
    {
        var query = $"api/rooms?status={status}&roomType={roomType}";
        var rooms = await _apiService.GetAsync<List<Room>>(query);
        return View(rooms ?? new List<Room>());
    }

    [AllowAnonymous]
    public async Task<IActionResult> Details(int id)
    {
        var room = await _apiService.GetAsync<Room>($"api/rooms/{id}");
        if (room == null)
        {
            return NotFound();
        }
        return View(room);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> CheckAvailability(DateTime? checkIn, DateTime? checkOut)
    {
        if (checkIn.HasValue && checkOut.HasValue)
        {
            var query = $"api/rooms/available?checkIn={checkIn.Value:yyyy-MM-dd}&checkOut={checkOut.Value:yyyy-MM-dd}";
            var rooms = await _apiService.GetAsync<List<Room>>(query);
            ViewBag.CheckIn = checkIn.Value;
            ViewBag.CheckOut = checkOut.Value;
            return View(rooms ?? new List<Room>());
        }

        ViewBag.CheckIn = DateTime.Today;
        ViewBag.CheckOut = DateTime.Today.AddDays(1);
        return View(new List<Room>());
    }
}

public class Room
{
    public int Id { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string RoomType { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public bool HasBalcony { get; set; }
    public bool HasWifi { get; set; }
    public bool HasTV { get; set; }
    public bool HasAirConditioning { get; set; }
}

