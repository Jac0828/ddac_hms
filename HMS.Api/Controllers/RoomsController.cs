using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HMS.Api.DTOs;
using HMS.Domain.Models;
using HMS.Domain.Enums;
using HMS.Domain.Extensions;
using HMS.Infrastructure.Services;
using HMS.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;
    private readonly ApplicationDbContext _context; // Injected for accessing RoomTypes directly

    public RoomsController(IRoomService roomService, ApplicationDbContext context)
    {
        _roomService = roomService;
        _context = context;
    }

    [HttpGet("available")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<RoomDto>>> GetAvailableRooms(
        [FromQuery] DateTime? checkIn,
        [FromQuery] DateTime? checkOut)
    {
        var rooms = await _roomService.GetAvailableRoomsAsync(checkIn, checkOut);
        var dtos = rooms.Select(r => MapToDto(r));
        return Ok(dtos);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<RoomDto>>> GetAllRooms()
    {
        try
        {
            var rooms = await _roomService.GetAllRoomsAsync();
            var dtos = rooms.Select(r => MapToDto(r));
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            // Log the exception for debugging
            Console.WriteLine($"Error in GetAllRooms: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "An error occurred while retrieving rooms", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<RoomDto>> GetRoom(int id)
    {
        var room = await _roomService.GetRoomByIdAsync(id);
        if (room == null)
            return NotFound();

        return Ok(MapToDto(room));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager,Receptionist")]
    public async Task<ActionResult<RoomDto>> CreateRoom([FromBody] CreateRoomDto dto)
    {
        var roomType = await _context.RoomTypes.FindAsync(dto.RoomTypeId);
        if (roomType == null)
            return BadRequest("Invalid Room Type ID");

        var room = new Room
        {
            RoomNumber = dto.RoomNumber,
            RoomTypeId = dto.RoomTypeId,
            PricePerNight = roomType.BasePricePerNight, // Enforce price from Room Type
            Status = dto.Status.ToRoomStatus(),
            Description = dto.Description,
            Capacity = dto.Capacity,
            HasBalcony = dto.HasBalcony,
            HasWifi = dto.HasWifi,
            HasTV = dto.HasTV,
            HasAirConditioning = dto.HasAirConditioning
        };

        var created = await _roomService.CreateRoomAsync(room);
        
        // Ensure RoomType is populated for the response DTO
        created.RoomType = roomType;
        
        return CreatedAtAction(nameof(GetRoom), new { id = created.Id }, MapToDto(created));
    }

    [HttpPost("batch")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<IEnumerable<RoomDto>>> BatchCreateRooms([FromBody] BatchCreateRoomsDto dto)
    {
        var roomType = await _context.RoomTypes.FindAsync(dto.RoomTypeId);
        if (roomType == null)
            return BadRequest("Invalid Room Type ID");

        var roomNumbers = ParseRoomNumberRange(dto.RoomNumberRange);
        if (!roomNumbers.Any())
            return BadRequest("Invalid room number range");

        // Check for existing room numbers
        var existingNumbers = await _context.Rooms
            .Where(r => roomNumbers.Contains(r.RoomNumber))
            .Select(r => r.RoomNumber)
            .ToListAsync();

        if (existingNumbers.Any())
            return BadRequest($"The following room numbers already exist: {string.Join(", ", existingNumbers)}");

        var newRooms = new List<Room>();
        foreach (var roomNumber in roomNumbers)
        {
            newRooms.Add(new Room
            {
                RoomNumber = roomNumber,
                RoomTypeId = dto.RoomTypeId,
                PricePerNight = dto.PricePerNight ?? roomType.BasePricePerNight,
                Status = RoomStatus.Available,
                Description = roomType.Description, // Inherit from RoomType
                Capacity = roomType.MaxCapacity, // Inherit from RoomType
                HasWifi = roomType.Amenities.Contains("WiFi"), // Example logic, ideally Room should not duplicate this
                HasTV = roomType.Amenities.Contains("TV"),
                HasAirConditioning = roomType.Amenities.Contains("AC"),
                HasBalcony = roomType.Amenities.Contains("Balcony"),
                CreatedAt = DateTime.UtcNow
            });
        }

        var createdRooms = await _roomService.CreateRoomsAsync(newRooms);
        
        // Re-fetch to include navigation properties if needed, or just map manually
        // For simplicity, mapping created entities directly (RoomType is null here unless attached)
        // We can manually set RoomType for the DTO response
        foreach (var room in createdRooms)
        {
            room.RoomType = roomType;
        }

        return Ok(createdRooms.Select(r => MapToDto(r)));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager,Receptionist")]
    public async Task<IActionResult> UpdateRoom(int id, [FromBody] UpdateRoomDto dto)
    {
        var room = await _roomService.GetRoomByIdAsync(id);
        if (room == null)
            return NotFound();

        var roomType = await _context.RoomTypes.FindAsync(dto.RoomTypeId);
        if (roomType == null)
            return BadRequest("Invalid Room Type ID");

        room.RoomNumber = dto.RoomNumber;
        room.RoomTypeId = dto.RoomTypeId;
        room.PricePerNight = roomType.BasePricePerNight; // Enforce price from Room Type
        room.Status = dto.Status.ToRoomStatus();
        room.Description = dto.Description;
        room.Capacity = dto.Capacity;
        room.HasBalcony = dto.HasBalcony;
        room.HasWifi = dto.HasWifi;
        room.HasTV = dto.HasTV;
        room.HasAirConditioning = dto.HasAirConditioning;

        await _roomService.UpdateRoomAsync(room);
        return NoContent();
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,Manager,Receptionist")]
    public async Task<IActionResult> UpdateRoomStatus(int id, [FromBody] UpdateRoomStatusDto dto)
    {
        var status = dto.Status.ToRoomStatus();
        var result = await _roomService.UpdateRoomStatusAsync(id, status.ToStringValue());
        if (!result)
            return NotFound();

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> DeleteRoom(int id)
    {
        try
        {
            var result = await _roomService.DeleteRoomAsync(id);
            if (!result)
                return BadRequest(new { message = "Cannot delete room because it has active bookings or is currently occupied." });

            return NoContent();
        }
        catch (DbUpdateException)
        {
            // This catches foreign key constraint violations
            return BadRequest(new { message = "Cannot delete this room because it has associated historical records (bookings, service requests, etc.). Consider setting it to 'Maintenance' status instead." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting room {id}: {ex.Message}");
            return StatusCode(500, new { message = "An error occurred while deleting the room." });
        }
    }

    private static RoomDto MapToDto(Room room)
    {
        return new RoomDto
        {
            Id = room.Id,
            RoomNumber = room.RoomNumber,
            RoomType = room.RoomType?.Name ?? "", // Use RoomType navigation property
            PricePerNight = room.PricePerNight,
            Status = room.Status.ToStringValue(),
            Description = room.Description,
            Capacity = room.Capacity,
            HasBalcony = room.HasBalcony,
            HasWifi = room.HasWifi,
            HasTV = room.HasTV,
            HasAirConditioning = room.HasAirConditioning,
            // Map new fields from RoomType
            ImageUrls = room.RoomType?.ImageUrls ?? new List<string>(),
            Amenities = room.RoomType?.Amenities ?? new List<string>()
        };
    }

    private List<string> ParseRoomNumberRange(string range)
    {
        var result = new List<string>();
        if (string.IsNullOrWhiteSpace(range)) return result;

        var parts = range.Split(',', StringSplitOptions.RemoveEmptyEntries);
        foreach (var part in parts)
        {
            if (part.Contains('-'))
            {
                var bounds = part.Split('-');
                if (bounds.Length == 2 && int.TryParse(bounds[0].Trim(), out int start) && int.TryParse(bounds[1].Trim(), out int end))
                {
                    for (int i = start; i <= end; i++)
                    {
                        result.Add(i.ToString());
                    }
                }
            }
            else
            {
                result.Add(part.Trim());
            }
        }
        return result.Distinct().ToList();
    }
}
