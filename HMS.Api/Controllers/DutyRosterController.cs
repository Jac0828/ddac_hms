using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using HMS.Api.DTOs;
using HMS.Domain.Models;
using HMS.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DutyRosterController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly RoleManager<IdentityRole> _roleManager;

    public DutyRosterController(ApplicationDbContext context, RoleManager<IdentityRole> roleManager)
    {
        _context = context;
        _roleManager = roleManager;
    }

    [HttpGet]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<ActionResult<IEnumerable<DutyRosterDto>>> GetAllRosters()
    {
        var rosters = await _context.StaffDutyRosters
            .Include(sdr => sdr.Staff)
            .OrderBy(sdr => sdr.Date)
            .ThenBy(sdr => sdr.Shift)
            .ToListAsync();

        var dtos = rosters.Select(r => MapToDto(r));
        return Ok(dtos);
    }

    [HttpGet("staff/{staffId}")]
    public async Task<ActionResult<IEnumerable<DutyRosterDto>>> GetStaffRoster(string staffId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        // Staff can only see their own roster, Manager/Admin can see all
        if (!roles.Contains("Manager") && !roles.Contains("Admin") && staffId != currentUserId)
            return Forbid();

        var rosters = await _context.StaffDutyRosters
            .Include(sdr => sdr.Staff)
            .Where(sdr => sdr.StaffId == staffId)
            .OrderBy(sdr => sdr.Date)
            .ThenBy(sdr => sdr.Shift)
            .ToListAsync();

        var dtos = rosters.Select(r => MapToDto(r));
        return Ok(dtos);
    }

    [HttpGet("date/{date}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<ActionResult<IEnumerable<DutyRosterDto>>> GetRosterByDate(DateTime date)
    {
        var rosters = await _context.StaffDutyRosters
            .Include(sdr => sdr.Staff)
            .Where(sdr => sdr.Date.Date == date.Date)
            .OrderBy(sdr => sdr.Shift)
            .ToListAsync();

        var dtos = rosters.Select(r => MapToDto(r));
        return Ok(dtos);
    }

    /// <summary>
    /// Get staff list (Receptionist and Housekeeping) for duty roster management
    /// </summary>
    [HttpGet("staff")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<ActionResult<IEnumerable<StaffDto>>> GetStaff()
    {
        try
        {
            // Get users with Receptionist or Housekeeping roles
            var receptionistRole = await _roleManager.FindByNameAsync("Receptionist");
            var housekeepingRole = await _roleManager.FindByNameAsync("Housekeeping");
            
            if (receptionistRole == null && housekeepingRole == null)
            {
                return Ok(new List<StaffDto>());
            }

            var roleIds = new List<string>();
            if (receptionistRole != null) roleIds.Add(receptionistRole.Id);
            if (housekeepingRole != null) roleIds.Add(housekeepingRole.Id);

            // Get user IDs with these roles
            var userIds = await _context.UserRoles
                .Where(ur => roleIds.Contains(ur.RoleId))
                .Select(ur => ur.UserId)
                .Distinct()
                .ToListAsync();

            // Get users
            var users = await _context.Users
                .Where(u => userIds.Contains(u.Id) && u.IsActive)
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .Select(u => new StaffDto
                {
                    Id = u.Id,
                    Email = u.Email ?? "",
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    PhoneNumber = u.PhoneNumber
                })
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetStaff: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "An error occurred while retrieving staff", error = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<ActionResult<DutyRosterDto>> CreateRoster([FromBody] CreateDutyRosterDto dto)
    {
        var roster = new StaffDutyRoster
        {
            StaffId = dto.StaffId,
            Date = dto.Date,
            Shift = dto.Shift,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.StaffDutyRosters.Add(roster);
        await _context.SaveChangesAsync();

        await _context.Entry(roster).Reference(r => r.Staff).LoadAsync();
        return CreatedAtAction(nameof(GetStaffRoster), new { staffId = roster.StaffId }, MapToDto(roster));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> UpdateRoster(int id, [FromBody] UpdateDutyRosterDto dto)
    {
        var roster = await _context.StaffDutyRosters.FindAsync(id);
        if (roster == null)
            return NotFound();

        roster.StaffId = dto.StaffId;
        roster.Date = dto.Date;
        roster.Shift = dto.Shift;
        roster.StartTime = dto.StartTime;
        roster.EndTime = dto.EndTime;
        roster.Notes = dto.Notes;
        roster.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> DeleteRoster(int id)
    {
        var roster = await _context.StaffDutyRosters.FindAsync(id);
        if (roster == null)
            return NotFound();

        _context.StaffDutyRosters.Remove(roster);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static DutyRosterDto MapToDto(StaffDutyRoster r)
    {
        return new DutyRosterDto
        {
            Id = r.Id,
            StaffId = r.StaffId,
            StaffName = r.Staff != null ? $"{r.Staff.FirstName} {r.Staff.LastName}" : "",
            StaffEmail = r.Staff?.Email ?? "",
            Date = r.Date,
            Shift = r.Shift,
            StartTime = r.StartTime,
            EndTime = r.EndTime,
            Notes = r.Notes,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        };
    }
}

