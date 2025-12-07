using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using HMS.Api.DTOs;
using HMS.Domain.Models;
using HMS.Domain.Enums;
using HMS.Domain.Extensions;
using HMS.Infrastructure.Services;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HousekeepingController : ControllerBase
{
    private readonly IHousekeepingService _housekeepingService;

    public HousekeepingController(IHousekeepingService housekeepingService)
    {
        _housekeepingService = housekeepingService;
    }

    [HttpGet("staff/{staffId}")]
    [Authorize(Roles = "Housekeeping,Manager")]
    public async Task<ActionResult<IEnumerable<HousekeepingTaskDto>>> GetStaffTasks(string staffId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        // Staff can only see their own tasks, Manager can see all
        if (!roles.Contains("Manager") && staffId != currentUserId)
            return Forbid();

        var tasks = await _housekeepingService.GetStaffTasksAsync(staffId);
        var dtos = tasks.Select(t => MapToDto(t));
        return Ok(dtos);
    }

    [HttpGet]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<IEnumerable<HousekeepingTaskDto>>> GetAllTasks()
    {
        var tasks = await _housekeepingService.GetAllTasksAsync();
        var dtos = tasks.Select(t => MapToDto(t));
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HousekeepingTaskDto>> GetTask(int id)
    {
        var task = await _housekeepingService.GetTaskByIdAsync(id);
        if (task == null)
            return NotFound();

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        // Staff can only see their own tasks, Manager can see all
        if (!roles.Contains("Manager") && task.AssignedStaffId != currentUserId)
            return Forbid();

        return Ok(MapToDto(task));
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Housekeeping,Manager")]
    public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] UpdateHousekeepingTaskDto dto)
    {
        var task = await _housekeepingService.GetTaskByIdAsync(id);
        if (task == null)
            return NotFound();

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        // Staff can only update their own tasks, Manager can update all
        if (!roles.Contains("Manager") && task.AssignedStaffId != currentUserId)
            return Forbid();

        var status = dto.Status.ToHousekeepingTaskStatus();
        var result = await _housekeepingService.UpdateTaskStatusAsync(id, status.ToStringValue(), dto.Notes);
        if (!result)
            return NotFound();

        return NoContent();
    }

    [HttpPost]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<ActionResult<HousekeepingTaskDto>> CreateTask([FromBody] CreateHousekeepingTaskDto dto)
    {
        var task = new HousekeepingTask
        {
            RoomId = dto.RoomId,
            AssignedStaffId = dto.AssignedStaffId,
            Notes = dto.Notes,
            Status = HousekeepingTaskStatus.Pending
        };

        var created = await _housekeepingService.CreateTaskAsync(task);
        return CreatedAtAction(nameof(GetTask), new { id = created.Id }, MapToDto(created));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateHousekeepingTaskDto dto)
    {
        var task = await _housekeepingService.GetTaskByIdAsync(id);
        if (task == null)
            return NotFound();

        task.AssignedStaffId = dto.AssignedStaffId;
        task.Status = dto.Status.ToHousekeepingTaskStatus();
        task.Notes = dto.Notes;

        await _housekeepingService.UpdateTaskAsync(task);
        return NoContent();
    }

    private static HousekeepingTaskDto MapToDto(HousekeepingTask task)
    {
        return new HousekeepingTaskDto
        {
            Id = task.Id,
            RoomId = task.RoomId,
            RoomNumber = task.Room?.RoomNumber ?? "",
            AssignedStaffId = task.AssignedStaffId,
            AssignedStaffName = task.AssignedStaff != null 
                ? $"{task.AssignedStaff.FirstName} {task.AssignedStaff.LastName}" 
                : null,
            Status = task.Status.ToStringValue(),
            Notes = task.Notes,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt ?? task.CreatedAt
        };
    }
}

