using HMS.Domain.Models;

namespace HMS.Infrastructure.Services;

public interface IRoomService
{
    Task<IEnumerable<Room>> GetAllRoomsAsync();
    Task<IEnumerable<Room>> GetAvailableRoomsAsync(DateTime? checkIn = null, DateTime? checkOut = null);
    Task<Room?> GetRoomByIdAsync(int id);
    Task<Room?> GetRoomByNumberAsync(string roomNumber);
    Task<Room> CreateRoomAsync(Room room);
    Task<IEnumerable<Room>> CreateRoomsAsync(IEnumerable<Room> rooms); // New batch create method
    Task<Room> UpdateRoomAsync(Room room);
    Task<bool> UpdateRoomStatusAsync(int roomId, string status);
    Task<bool> DeleteRoomAsync(int id);
    Task<bool> IsRoomAvailableAsync(int roomId, DateTime checkIn, DateTime checkOut);
}
