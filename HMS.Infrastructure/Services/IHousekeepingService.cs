using HMS.Domain.Models;

namespace HMS.Infrastructure.Services;

public interface IHousekeepingService
{
    Task<IEnumerable<HousekeepingTask>> GetAllTasksAsync();
    Task<IEnumerable<HousekeepingTask>> GetStaffTasksAsync(string staffId);
    Task<HousekeepingTask?> GetTaskByIdAsync(int id);
    Task<HousekeepingTask> CreateTaskAsync(HousekeepingTask task);
    Task<HousekeepingTask> UpdateTaskAsync(HousekeepingTask task);
    Task<bool> UpdateTaskStatusAsync(int taskId, string status, string? notes = null);
    Task<bool> AssignTaskAsync(int taskId, string staffId);
    Task<bool> DeleteTaskAsync(int id);
}

