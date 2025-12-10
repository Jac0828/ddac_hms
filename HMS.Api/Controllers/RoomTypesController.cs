using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HMS.Api.DTOs;
using HMS.Domain.Models;
using HMS.Infrastructure.Data;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Manager,Admin")]
public class RoomTypesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public RoomTypesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous] // Allow guests to view room types
    public async Task<ActionResult<IEnumerable<RoomTypeDto>>> GetAllRoomTypes()
    {
        var roomTypes = await _context.RoomTypes
            .OrderBy(rt => rt.Name)
            .ToListAsync();
        
        var dtos = roomTypes.Select(rt => MapToDto(rt));
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<RoomTypeDto>> GetRoomType(int id)
    {
        var roomType = await _context.RoomTypes.FindAsync(id);
        if (roomType == null)
            return NotFound();

        return Ok(MapToDto(roomType));
    }

    [HttpPost]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<ActionResult<RoomTypeDto>> CreateRoomType([FromBody] CreateRoomTypeDto dto)
    {
        var roomType = new RoomType
        {
            Name = dto.Name,
            Description = dto.Description,
            BasePricePerNight = dto.BasePricePerNight,
            MaxCapacity = dto.MaxCapacity,
            Size = dto.Size,
            ImageUrls = dto.ImageUrls ?? new List<string>(),
            Amenities = dto.Amenities ?? new List<string>(),
            CreatedAt = DateTime.UtcNow
        };

        _context.RoomTypes.Add(roomType);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetRoomType), new { id = roomType.Id }, MapToDto(roomType));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> UpdateRoomType(int id, [FromBody] UpdateRoomTypeDto dto)
    {
        var roomType = await _context.RoomTypes.FindAsync(id);
        if (roomType == null)
            return NotFound();

        // If price is being updated, sync all rooms of this type
        bool priceChanged = roomType.BasePricePerNight != dto.BasePricePerNight;
        decimal oldPrice = roomType.BasePricePerNight;

        roomType.Name = dto.Name;
        roomType.Description = dto.Description;
        roomType.BasePricePerNight = dto.BasePricePerNight;
        roomType.MaxCapacity = dto.MaxCapacity;
        roomType.Size = dto.Size;
        if (dto.ImageUrls != null) roomType.ImageUrls = dto.ImageUrls;
        if (dto.Amenities != null) roomType.Amenities = dto.Amenities;
        roomType.UpdatedAt = DateTime.UtcNow;

        // Always sync all rooms to ensure price consistency
        // This handles both price changes and correcting any manual overrides
        var rooms = await _context.Rooms
            .Where(r => r.RoomTypeId == id)
            .ToListAsync();
        
        foreach (var room in rooms)
        {
            if (room.PricePerNight != dto.BasePricePerNight)
            {
                room.PricePerNight = dto.BasePricePerNight;
                room.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> DeleteRoomType(int id)
    {
        var roomType = await _context.RoomTypes
            .Include(rt => rt.Rooms)
            .FirstOrDefaultAsync(rt => rt.Id == id);
        
        if (roomType == null)
            return NotFound();

        // Check if any rooms are using this room type
        if (roomType.Rooms.Any())
            return BadRequest(new { message = "Cannot delete room type that has rooms assigned" });

        _context.RoomTypes.Remove(roomType);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static RoomTypeDto MapToDto(RoomType rt)
    {
        return new RoomTypeDto
        {
            Id = rt.Id,
            Name = rt.Name,
            Description = rt.Description,
            BasePricePerNight = rt.BasePricePerNight,
            MaxCapacity = rt.MaxCapacity,
            Size = rt.Size,
            ImageUrls = rt.ImageUrls,
            Amenities = rt.Amenities,
            CreatedAt = rt.CreatedAt,
            UpdatedAt = rt.UpdatedAt
        };
    }
}
