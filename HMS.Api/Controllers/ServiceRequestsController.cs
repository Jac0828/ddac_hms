using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using HMS.Domain.Models;
using HMS.Infrastructure.Data;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServiceRequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ServiceRequestsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ServiceRequest>>> GetServiceRequests()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isRoomAttendant = User.IsInRole("RoomAttendant");
        var isManager = User.IsInRole("Manager");

        var query = _context.ServiceRequests
            .Include(sr => sr.Booking)
            .Include(sr => sr.User)
            .Include(sr => sr.AssignedToUser)
            .AsQueryable();

        if (!isManager && !isRoomAttendant)
        {
            query = query.Where(sr => sr.UserId == userId);
        }
        else if (isRoomAttendant)
        {
            query = query.Where(sr => sr.AssignedToUserId == userId || sr.AssignedToUserId == null);
        }

        return await query.ToListAsync();
    }

    [HttpPost]
    [Authorize(Roles = "Customer,Manager,Receptionist")]
    public async Task<ActionResult<ServiceRequest>> CreateServiceRequest(CreateServiceRequestModel model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var serviceRequest = new ServiceRequest
        {
            BookingId = model.BookingId,
            UserId = userId!,
            ServiceType = model.ServiceType,
            Description = model.Description,
            Status = "Pending",
            RequestedAt = DateTime.UtcNow
        };

        _context.ServiceRequests.Add(serviceRequest);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetServiceRequest), new { id = serviceRequest.Id }, serviceRequest);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ServiceRequest>> GetServiceRequest(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isManager = User.IsInRole("Manager");
        var isRoomAttendant = User.IsInRole("RoomAttendant");

        var serviceRequest = await _context.ServiceRequests
            .Include(sr => sr.Booking)
            .Include(sr => sr.User)
            .FirstOrDefaultAsync(sr => sr.Id == id);

        if (serviceRequest == null)
        {
            return NotFound();
        }

        if (!isManager && !isRoomAttendant && serviceRequest.UserId != userId)
        {
            return Forbid();
        }

        return serviceRequest;
    }

    [HttpPut("{id}/assign")]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<IActionResult> AssignServiceRequest(int id, AssignServiceRequestModel model)
    {
        var serviceRequest = await _context.ServiceRequests.FindAsync(id);
        if (serviceRequest == null)
        {
            return NotFound();
        }

        serviceRequest.AssignedToUserId = model.AssignedToUserId;
        serviceRequest.Status = "InProgress";
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("{id}/complete")]
    [Authorize(Roles = "RoomAttendant,Manager")]
    public async Task<IActionResult> CompleteServiceRequest(int id, CompleteServiceRequestModel model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var serviceRequest = await _context.ServiceRequests.FindAsync(id);

        if (serviceRequest == null)
        {
            return NotFound();
        }

        if (User.IsInRole("RoomAttendant") && serviceRequest.AssignedToUserId != userId)
        {
            return Forbid();
        }

        serviceRequest.Status = "Completed";
        serviceRequest.CompletedAt = DateTime.UtcNow;
        serviceRequest.Notes = model.Notes;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateServiceRequestModel
{
    public int BookingId { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class AssignServiceRequestModel
{
    public string AssignedToUserId { get; set; } = string.Empty;
}

public class CompleteServiceRequestModel
{
    public string? Notes { get; set; }
}

