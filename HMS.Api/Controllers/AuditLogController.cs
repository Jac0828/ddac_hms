using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HMS.Api.DTOs;
using HMS.Domain.Models;
using HMS.Infrastructure.Data;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AuditLogController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuditLogController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetAuditLogs(
        [FromQuery] string? userId = null,
        [FromQuery] string? action = null,
        [FromQuery] string? entityType = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _context.ActivityLogs
            .Include(al => al.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(userId))
            query = query.Where(al => al.UserId == userId);

        if (!string.IsNullOrEmpty(action))
            query = query.Where(al => al.Action.Contains(action));

        if (!string.IsNullOrEmpty(entityType))
            query = query.Where(al => al.EntityType == entityType);

        if (startDate.HasValue)
            query = query.Where(al => al.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(al => al.CreatedAt <= endDate.Value);

        var totalCount = await query.CountAsync();
        var logs = await query
            .OrderByDescending(al => al.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = logs.Select(al => MapToDto(al));
        
        return Ok(new
        {
            data = dtos,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AuditLogDto>> GetAuditLog(int id)
    {
        var log = await _context.ActivityLogs
            .Include(al => al.User)
            .FirstOrDefaultAsync(al => al.Id == id);

        if (log == null)
            return NotFound();

        return Ok(MapToDto(log));
    }

    private static AuditLogDto MapToDto(ActivityLog al)
    {
        return new AuditLogDto
        {
            Id = al.Id,
            UserId = al.UserId,
            UserName = al.User != null ? $"{al.User.FirstName} {al.User.LastName}" : "",
            UserEmail = al.User?.Email ?? "",
            Action = al.Action,
            EntityType = al.EntityType,
            EntityId = al.EntityId,
            Details = al.Details,
            CreatedAt = al.CreatedAt
        };
    }
}

