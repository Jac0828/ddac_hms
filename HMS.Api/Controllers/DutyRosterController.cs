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
        try
        {
            var rosters = await _context.StaffDutyRosters
                .Include(sdr => sdr.Staff)
                .OrderBy(sdr => sdr.Date)
                .ThenBy(sdr => sdr.Shift)
                .ToListAsync();

            // Map to DTOs with error handling for each item
            var dtos = new List<DutyRosterDto>();
            foreach (var roster in rosters)
            {
                try
                {
                    dtos.Add(MapToDto(roster));
                }
                catch (Exception mapEx)
                {
                    Console.WriteLine($"Error mapping roster Id {roster.Id}: {mapEx.Message}");
                    // Skip this roster entry if mapping fails
                }
            }
            
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetAllRosters: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "An error occurred while retrieving rosters", error = ex.Message });
        }
    }

    [HttpGet("staff/{staffId}")]
    public async Task<ActionResult<IEnumerable<DutyRosterDto>>> GetStaffRoster(string staffId)
    {
        try
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

            // Map to DTOs with error handling for each item
            var dtos = new List<DutyRosterDto>();
            foreach (var roster in rosters)
            {
                try
                {
                    dtos.Add(MapToDto(roster));
                }
                catch (Exception mapEx)
                {
                    Console.WriteLine($"Error mapping roster Id {roster.Id}: {mapEx.Message}");
                    // Skip this roster entry if mapping fails
                }
            }
            
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetStaffRoster: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "An error occurred while retrieving staff roster", error = ex.Message });
        }
    }

    [HttpGet("date/{date}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<ActionResult<IEnumerable<DutyRosterDto>>> GetRosterByDate(string date)
    {
        try
        {
            // Parse date string (format: yyyy-MM-dd)
            if (!DateTime.TryParse(date, out var parsedDate))
            {
                return BadRequest(new { message = "Invalid date format. Expected yyyy-MM-dd" });
            }

            // Ensure DateTime is UTC for PostgreSQL compatibility
            if (parsedDate.Kind == DateTimeKind.Unspecified)
            {
                parsedDate = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
            }
            else if (parsedDate.Kind == DateTimeKind.Local)
            {
                parsedDate = parsedDate.ToUniversalTime();
            }

            // Ensure date range comparison for UTC/Local compatibility
            var startDate = parsedDate.Date;
            var endDate = startDate.AddDays(1);
            
            // Ensure both dates are UTC for PostgreSQL query
            if (startDate.Kind != DateTimeKind.Utc)
            {
                startDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
            }
            if (endDate.Kind != DateTimeKind.Utc)
            {
                endDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);
            }

            var rosters = await _context.StaffDutyRosters
                .Include(sdr => sdr.Staff)
                .Where(sdr => sdr.Date >= startDate && sdr.Date < endDate)
                .OrderBy(sdr => sdr.Shift)
                .ToListAsync();

            // Map to DTOs with error handling for each item
            var dtos = new List<DutyRosterDto>();
            foreach (var roster in rosters)
            {
                try
                {
                    dtos.Add(MapToDto(roster));
                }
                catch (Exception mapEx)
                {
                    Console.WriteLine($"Error mapping roster Id {roster.Id}: {mapEx.Message}");
                    // Skip this roster entry if mapping fails
                }
            }
            
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetRosterByDate: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "An error occurred while retrieving roster", error = ex.Message });
        }
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
                .ToListAsync();

            // Get user-role mappings
            var userRoles = await _context.UserRoles
                .Where(ur => userIds.Contains(ur.UserId) && roleIds.Contains(ur.RoleId))
                .Join(_context.Roles,
                    ur => ur.RoleId,
                    r => r.Id,
                    (ur, r) => new { ur.UserId, RoleName = r.Name })
                .ToListAsync();

            var rolesByUserId = userRoles
                .GroupBy(x => x.UserId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.RoleName).ToList());

            // Map to StaffDto with roles
            var staffDtos = users.Select(u => new StaffDto
            {
                Id = u.Id,
                Email = u.Email ?? "",
                FirstName = u.FirstName,
                LastName = u.LastName,
                PhoneNumber = u.PhoneNumber,
                Roles = rolesByUserId.TryGetValue(u.Id, out var roles) ? roles.Where(r => r != null).Select(r => r!).ToList() : new List<string>()
            }).ToList();

            return Ok(staffDtos);
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
        try
        {
            // Validate required fields
            if (string.IsNullOrEmpty(dto.StaffId))
                return BadRequest(new { message = "StaffId is required" });
            
            if (string.IsNullOrEmpty(dto.Shift))
                return BadRequest(new { message = "Shift is required" });

            // Validate StaffId exists
            var staffExists = await _context.Users.AnyAsync(u => u.Id == dto.StaffId && u.IsActive);
            if (!staffExists)
                return BadRequest(new { message = "Invalid StaffId. Staff member not found or inactive." });

            // Parse date from string if provided, otherwise use Date property
            DateTime date;
            if (!string.IsNullOrEmpty(dto.DateString))
            {
                if (!DateTime.TryParse(dto.DateString, out date))
                    return BadRequest(new { message = "Invalid date format. Expected yyyy-MM-dd" });
            }
            else
            {
                date = dto.Date;
            }
            
            // Ensure DateTime is UTC for PostgreSQL compatibility
            if (date.Kind == DateTimeKind.Unspecified)
            {
                date = DateTime.SpecifyKind(date, DateTimeKind.Utc);
            }
            else if (date.Kind == DateTimeKind.Local)
            {
                date = date.ToUniversalTime();
            }
            
            date = date.Date; // Ensure Date is set to start of day (remove time component)

            // Parse TimeSpan from string if provided
            TimeSpan? startTime = dto.StartTime;
            if (!string.IsNullOrEmpty(dto.StartTimeString))
            {
                if (TimeSpan.TryParse(dto.StartTimeString, out var parsedStartTime))
                    startTime = parsedStartTime;
            }

            TimeSpan? endTime = dto.EndTime;
            if (!string.IsNullOrEmpty(dto.EndTimeString))
            {
                if (TimeSpan.TryParse(dto.EndTimeString, out var parsedEndTime))
                    endTime = parsedEndTime;
            }

            var roster = new StaffDutyRoster
            {
                StaffId = dto.StaffId,
                Date = date,
                Shift = dto.Shift,
                StartTime = startTime,
                EndTime = endTime,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.StaffDutyRosters.Add(roster);
            await _context.SaveChangesAsync();

            await _context.Entry(roster).Reference(r => r.Staff).LoadAsync();
            return CreatedAtAction(nameof(GetStaffRoster), new { staffId = roster.StaffId }, MapToDto(roster));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in CreateRoster: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "An error occurred while creating roster", error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> UpdateRoster(int id, [FromBody] UpdateDutyRosterDto dto)
    {
        try
        {
            var roster = await _context.StaffDutyRosters.FindAsync(id);
            if (roster == null)
                return NotFound();

            // Parse date from string if provided, otherwise use Date property
            DateTime date;
            if (!string.IsNullOrEmpty(dto.DateString))
            {
                if (!DateTime.TryParse(dto.DateString, out date))
                    return BadRequest(new { message = "Invalid date format. Expected yyyy-MM-dd" });
            }
            else
            {
                date = dto.Date;
            }
            
            // Ensure DateTime is UTC for PostgreSQL compatibility
            if (date.Kind == DateTimeKind.Unspecified)
            {
                date = DateTime.SpecifyKind(date, DateTimeKind.Utc);
            }
            else if (date.Kind == DateTimeKind.Local)
            {
                date = date.ToUniversalTime();
            }
            
            date = date.Date; // Ensure Date is set to start of day

            // Parse TimeSpan from string if provided
            TimeSpan? startTime = dto.StartTime;
            if (!string.IsNullOrEmpty(dto.StartTimeString))
            {
                if (TimeSpan.TryParse(dto.StartTimeString, out var parsedStartTime))
                    startTime = parsedStartTime;
            }

            TimeSpan? endTime = dto.EndTime;
            if (!string.IsNullOrEmpty(dto.EndTimeString))
            {
                if (TimeSpan.TryParse(dto.EndTimeString, out var parsedEndTime))
                    endTime = parsedEndTime;
            }

            roster.StaffId = dto.StaffId;
            roster.Date = date;
            roster.Shift = dto.Shift;
            roster.StartTime = startTime;
            roster.EndTime = endTime;
            roster.Notes = dto.Notes;
            roster.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in UpdateRoster: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "An error occurred while updating roster", error = ex.Message });
        }
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
        if (r == null)
        {
            throw new ArgumentNullException(nameof(r));
        }

        try
        {
            // Safely handle Staff navigation property
            string staffName = "";
            string staffEmail = "";
            
            if (r.Staff != null)
            {
                staffName = $"{r.Staff.FirstName ?? ""} {r.Staff.LastName ?? ""}".Trim();
                staffEmail = r.Staff.Email ?? "";
            }

            // Ensure Date is valid (not MinValue or MaxValue) and has proper Kind
            DateTime date = r.Date;
            if (date == DateTime.MinValue || date == DateTime.MaxValue || date.Year < 1900 || date.Year > 2100)
            {
                date = DateTime.UtcNow.Date;
            }
            else if (date.Kind == DateTimeKind.Unspecified)
            {
                date = DateTime.SpecifyKind(date, DateTimeKind.Utc);
            }
            else if (date.Kind == DateTimeKind.Local)
            {
                date = date.ToUniversalTime();
            }

            // Ensure CreatedAt is valid and has proper Kind
            DateTime createdAt = r.CreatedAt;
            if (createdAt == DateTime.MinValue || createdAt == DateTime.MaxValue || createdAt.Year < 1900 || createdAt.Year > 2100)
            {
                createdAt = DateTime.UtcNow;
            }
            else if (createdAt.Kind == DateTimeKind.Unspecified)
            {
                createdAt = DateTime.SpecifyKind(createdAt, DateTimeKind.Utc);
            }
            else if (createdAt.Kind == DateTimeKind.Local)
            {
                createdAt = createdAt.ToUniversalTime();
            }

            // Ensure UpdatedAt is valid if not null and has proper Kind
            DateTime? updatedAt = r.UpdatedAt;
            if (updatedAt.HasValue)
            {
                var ut = updatedAt.Value;
                if (ut == DateTime.MinValue || ut == DateTime.MaxValue || ut.Year < 1900 || ut.Year > 2100)
                {
                    updatedAt = null;
                }
                else if (ut.Kind == DateTimeKind.Unspecified)
                {
                    updatedAt = DateTime.SpecifyKind(ut, DateTimeKind.Utc);
                }
                else if (ut.Kind == DateTimeKind.Local)
                {
                    updatedAt = ut.ToUniversalTime();
                }
            }

            return new DutyRosterDto
            {
                Id = r.Id,
                StaffId = r.StaffId ?? string.Empty,
                StaffName = staffName,
                StaffEmail = staffEmail,
                Date = date,
                Shift = r.Shift ?? string.Empty,
                StartTime = r.StartTime,
                EndTime = r.EndTime,
                Notes = r.Notes,
                CreatedAt = createdAt,
                UpdatedAt = r.UpdatedAt
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in MapToDto for roster Id {r.Id}: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            // Re-throw to be caught by calling method
            throw new InvalidOperationException($"Failed to map StaffDutyRoster (Id: {r.Id}) to DTO: {ex.Message}", ex);
        }
    }
}

