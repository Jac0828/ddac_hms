using Microsoft.EntityFrameworkCore;
using HMS.Domain.Models;
using HMS.Domain.Enums;
using HMS.Domain.Extensions;
using HMS.Infrastructure.Data;

namespace HMS.Infrastructure.Services;

public class HousekeepingService : IHousekeepingService
{
    private readonly ApplicationDbContext _context;

    public HousekeepingService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<HousekeepingTask>> GetAllTasksAsync()
    {
        return await _context.HousekeepingTasks
            .Include(ht => ht.Room)
            .Include(ht => ht.AssignedStaff)
            .OrderByDescending(ht => ht.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<HousekeepingTask>> GetStaffTasksAsync(string staffId)
    {
        return await _context.HousekeepingTasks
            .Include(ht => ht.Room)
            .Where(ht => ht.AssignedStaffId == staffId)
            .OrderByDescending(ht => ht.CreatedAt)
            .ToListAsync();
    }

    public async Task<HousekeepingTask?> GetTaskByIdAsync(int id)
    {
        return await _context.HousekeepingTasks
            .Include(ht => ht.Room)
            .Include(ht => ht.AssignedStaff)
            .FirstOrDefaultAsync(ht => ht.Id == id);
    }

    public async Task<HousekeepingTask> CreateTaskAsync(HousekeepingTask task)
    {
        task.Status = HousekeepingTaskStatus.Pending;
        task.CreatedAt = DateTime.UtcNow;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.HousekeepingTasks.AddAsync(task);
        await _context.SaveChangesAsync();

        // Update room status to Cleaning if task is created
        if (task.RoomId > 0)
        {
            var room = await _context.Rooms.FindAsync(task.RoomId);
            if (room != null && room.Status == RoomStatus.Available)
            {
                room.Status = RoomStatus.Cleaning;
                room.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        return task;
    }

    public async Task<HousekeepingTask> UpdateTaskAsync(HousekeepingTask task)
    {
        task.UpdatedAt = DateTime.UtcNow;
        _context.HousekeepingTasks.Update(task);
        await _context.SaveChangesAsync();

        // Update room status based on task status
        if (task.Status == HousekeepingTaskStatus.Completed)
        {
            var room = await _context.Rooms.FindAsync(task.RoomId);
            if (room != null)
            {
                // Check if there are other pending tasks for this room
                var hasPendingTasks = await _context.HousekeepingTasks
                    .AnyAsync(ht => ht.RoomId == task.RoomId &&
                                   ht.Id != task.Id &&
                                   ht.Status != HousekeepingTaskStatus.Completed);

                if (!hasPendingTasks && room.Status == RoomStatus.Cleaning)
                {
                    room.Status = RoomStatus.Available;
                    room.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }
        }

        return task;
    }

    public async Task<bool> UpdateTaskStatusAsync(int taskId, string status, string? notes = null)
    {
        var task = await GetTaskByIdAsync(taskId);
        if (task == null) return false;

        task.Status = status.ToHousekeepingTaskStatus();
        task.UpdatedAt = DateTime.UtcNow;
        if (!string.IsNullOrEmpty(notes))
        {
            task.Notes = notes;
        }

        await _context.SaveChangesAsync();

        // Update room status if task completed
        if (task.Status == HousekeepingTaskStatus.Completed)
        {
            var room = await _context.Rooms.FindAsync(task.RoomId);
            if (room != null)
            {
                var hasPendingTasks = await _context.HousekeepingTasks
                    .AnyAsync(ht => ht.RoomId == task.RoomId &&
                                   ht.Id != taskId &&
                                   ht.Status != HousekeepingTaskStatus.Completed);

                if (!hasPendingTasks && room.Status == RoomStatus.Cleaning)
                {
                    room.Status = RoomStatus.Available;
                    room.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }
        }

        return true;
    }

    public async Task<bool> AssignTaskAsync(int taskId, string staffId)
    {
        var task = await GetTaskByIdAsync(taskId);
        if (task == null) return false;

        task.AssignedStaffId = staffId;
        task.Status = HousekeepingTaskStatus.InProgress;
        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteTaskAsync(int id)
    {
        var task = await GetTaskByIdAsync(id);
        if (task == null) return false;

        _context.HousekeepingTasks.Remove(task);
        await _context.SaveChangesAsync();
        return true;
    }
}

