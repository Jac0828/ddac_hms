using Microsoft.EntityFrameworkCore;
using HMS.Domain.Models;
using HMS.Domain.Enums;
using HMS.Domain.Extensions;
using HMS.Infrastructure.Data;

namespace HMS.Infrastructure.Services;

public class RoomService : IRoomService
{
    private readonly ApplicationDbContext _context;

    public RoomService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Room>> GetAllRoomsAsync()
    {
        return await _context.Rooms
            .Include(r => r.RoomType)
            .OrderBy(r => r.RoomNumber)
            .AsNoTracking() // Read-only query, no need to track changes
            .ToListAsync();
    }

    public async Task<IEnumerable<Room>> GetAvailableRoomsAsync(DateTime? checkIn = null, DateTime? checkOut = null)
    {
        // Ensure UTC dates for PostgreSQL
        if (checkIn.HasValue && checkIn.Value.Kind == DateTimeKind.Unspecified)
            checkIn = DateTime.SpecifyKind(checkIn.Value, DateTimeKind.Utc);
        if (checkOut.HasValue && checkOut.Value.Kind == DateTimeKind.Unspecified)
            checkOut = DateTime.SpecifyKind(checkOut.Value, DateTimeKind.Utc);

        var query = _context.Rooms
            .Include(r => r.RoomType)
            .Where(r => r.Status == RoomStatus.Available);

        if (checkIn.HasValue && checkOut.HasValue)
        {
            // Exclude rooms that have overlapping bookings
            var bookedRoomIds = await _context.Bookings
                .Where(b => b.Status != BookingStatus.Cancelled && b.Status != BookingStatus.CheckedOut &&
                           ((b.CheckInDate <= checkIn && b.CheckOutDate > checkIn) ||
                            (b.CheckInDate < checkOut && b.CheckOutDate >= checkOut) ||
                            (b.CheckInDate >= checkIn && b.CheckOutDate <= checkOut)))
                .Select(b => b.RoomId)
                .Distinct()
                .ToListAsync();

            query = query.Where(r => !bookedRoomIds.Contains(r.Id));
        }

        return await query.OrderBy(r => r.RoomNumber).ToListAsync();
    }

    public async Task<Room?> GetRoomByIdAsync(int id)
    {
        return await _context.Rooms
            .Include(r => r.RoomType)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<Room?> GetRoomByNumberAsync(string roomNumber)
    {
        return await _context.Rooms
            .Include(r => r.RoomType)
            .FirstOrDefaultAsync(r => r.RoomNumber == roomNumber);
    }

    public async Task<Room> CreateRoomAsync(Room room)
    {
        room.CreatedAt = DateTime.UtcNow;
        await _context.Rooms.AddAsync(room);
        await _context.SaveChangesAsync();
        return room;
    }

    public async Task<IEnumerable<Room>> CreateRoomsAsync(IEnumerable<Room> rooms)
    {
        foreach (var room in rooms)
        {
            room.CreatedAt = DateTime.UtcNow;
        }
        await _context.Rooms.AddRangeAsync(rooms);
        await _context.SaveChangesAsync();
        return rooms;
    }

    public async Task<Room> UpdateRoomAsync(Room room)
    {
        room.UpdatedAt = DateTime.UtcNow;
        _context.Rooms.Update(room);
        await _context.SaveChangesAsync();
        return room;
    }

    public async Task<bool> UpdateRoomStatusAsync(int roomId, string status)
    {
        var room = await GetRoomByIdAsync(roomId);
        if (room == null) return false;

        room.Status = status.ToRoomStatus();
        room.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteRoomAsync(int id)
    {
        var room = await GetRoomByIdAsync(id);
        if (room == null) return false;

        // Check if room has active bookings
        var hasActiveBookings = await _context.Bookings
            .AnyAsync(b => b.RoomId == id && 
                          b.Status != BookingStatus.Cancelled && 
                          b.Status != BookingStatus.CheckedOut);

        if (hasActiveBookings)
            return false; // Cannot delete room with active bookings

        _context.Rooms.Remove(room);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> IsRoomAvailableAsync(int roomId, DateTime checkIn, DateTime checkOut)
    {
        var room = await GetRoomByIdAsync(roomId);
        if (room == null || room.Status != RoomStatus.Available)
            return false;

        // Check for overlapping bookings
        var hasOverlap = await _context.Bookings
            .AnyAsync(b => b.RoomId == roomId &&
                          b.Status != BookingStatus.Cancelled &&
                          b.Status != BookingStatus.CheckedOut &&
                          ((b.CheckInDate <= checkIn && b.CheckOutDate > checkIn) ||
                           (b.CheckInDate < checkOut && b.CheckOutDate >= checkOut) ||
                           (b.CheckInDate >= checkIn && b.CheckOutDate <= checkOut)));

        return !hasOverlap;
    }
}
