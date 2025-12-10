using System.Threading.Tasks;

namespace HMS.Infrastructure.Services;

public interface IAuditLogService
{
    Task LogActionAsync(string userId, string action, string entityType, int? entityId, string details);
}
