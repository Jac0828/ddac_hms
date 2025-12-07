using HMS.Domain.Models;

namespace HMS.Infrastructure.Services;

public interface IUserService
{
    Task<IEnumerable<AppUser>> GetAllUsersAsync();
    Task<AppUser?> GetUserByIdAsync(string id);
    Task<AppUser?> GetUserByEmailAsync(string email);
    Task<AppUser> UpdateUserAsync(AppUser user);
    Task<bool> DeleteUserAsync(string id);
}

