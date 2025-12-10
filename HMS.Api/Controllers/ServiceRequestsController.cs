using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using HMS.Domain.Models;
using HMS.Domain.Enums;
using HMS.Domain.Extensions;
using HMS.Infrastructure.Data;
using HMS.Api.DTOs;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServiceRequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ServiceRequestsController> _logger;

    public ServiceRequestsController(ApplicationDbContext context, ILogger<ServiceRequestsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ServiceRequestDto>>> GetServiceRequests()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isRoomAttendant = User.IsInRole("RoomAttendant") || User.IsInRole("Housekeeping");
            var isManager = User.IsInRole("Manager");
            var isAdmin = User.IsInRole("Admin");
            var isReceptionist = User.IsInRole("Receptionist");

            var query = _context.ServiceRequests
                .Where(sr => !sr.IsDeleted)
                .Include(sr => sr.Booking)
                    .ThenInclude(b => b.Room)
                        .ThenInclude(r => r.RoomType)
                .Include(sr => sr.User)
                .Include(sr => sr.AssignedToUser)
                .AsQueryable();

            if (isAdmin || isManager || isReceptionist)
            {
                // Admin, Manager, and Receptionist can see all requests
            }
            else if (isRoomAttendant)
            {
                // RoomAttendants/Housekeeping can see:
                // 1. Requests assigned to them
                // 2. Unassigned requests (so they can pick them up)
                query = query.Where(sr => sr.AssignedToUserId == userId || sr.AssignedToUserId == null);
            }
            else
            {
                query = query.Where(sr => sr.UserId == userId);
            }

            var result = await query
                .AsNoTracking()
                .OrderByDescending(sr => sr.RequestedAt)
                .Select(sr => new ServiceRequestDto
                {
                    Id = sr.Id,
                    BookingId = sr.BookingId,
                    UserId = sr.UserId,
                    AssignedToUserId = sr.AssignedToUserId,
                    ServiceType = sr.ServiceType.ToString(),
                    Description = sr.Description,
                    Status = sr.Status.ToString(),
                    RequestedAt = sr.RequestedAt,
                    CompletedAt = sr.CompletedAt,
                    Notes = sr.Notes,
                    CreatedAt = sr.CreatedAt,
                    UpdatedAt = sr.UpdatedAt,
                    Booking = sr.Booking != null ? new BookingInfoDto
                    {
                        Id = sr.Booking.Id,
                        CheckInDate = sr.Booking.CheckInDate,
                        CheckOutDate = sr.Booking.CheckOutDate,
                        Status = sr.Booking.Status.ToString(),
                        RoomNumber = sr.Booking.Room != null ? sr.Booking.Room.RoomNumber : null,
                        RoomType = sr.Booking.Room != null && sr.Booking.Room.RoomType != null ? sr.Booking.Room.RoomType.Name : null
                    } : null,
                    User = sr.User != null ? new UserInfoDto
                    {
                        Id = sr.User.Id,
                        Email = sr.User.Email ?? string.Empty,
                        FirstName = sr.User.FirstName,
                        LastName = sr.User.LastName,
                        PhoneNumber = sr.User.PhoneNumber
                    } : null,
                    AssignedToUser = sr.AssignedToUser != null ? new UserInfoDto
                    {
                        Id = sr.AssignedToUser.Id,
                        Email = sr.AssignedToUser.Email ?? string.Empty,
                        FirstName = sr.AssignedToUser.FirstName,
                        LastName = sr.AssignedToUser.LastName,
                        PhoneNumber = sr.AssignedToUser.PhoneNumber
                    } : null
                })
                .ToListAsync();

            _logger.LogInformation("Retrieved {Count} service requests for user {UserId}", result.Count, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetServiceRequests for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
            return StatusCode(500, new { message = "An error occurred while retrieving service requests", error = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Customer,Manager,Receptionist,Admin")]
    public async Task<ActionResult<ServiceRequestDto>> CreateServiceRequest(CreateServiceRequestDto model)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Validate required fields
            if (model.BookingId <= 0)
            {
                return BadRequest(new { message = "BookingId is required and must be greater than 0" });
            }

            if (string.IsNullOrWhiteSpace(model.Description))
            {
                return BadRequest(new { message = "Description is required" });
            }

            // Verify booking exists and user has access to it
            var booking = await _context.Bookings
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.Id == model.BookingId);

            if (booking == null)
            {
                return NotFound(new { message = "Booking not found" });
            }

            // Check if user is Customer - they can only create requests for their own bookings
            var isCustomer = User.IsInRole("Customer");
            if (isCustomer && booking.UserId != userId)
            {
                return StatusCode(403, new { message = "You can only create service requests for your own bookings" });
            }

            // Validate service type
            if (string.IsNullOrWhiteSpace(model.ServiceType))
            {
                return BadRequest(new { message = "ServiceType is required" });
            }

            var serviceRequest = new ServiceRequest
            {
                BookingId = model.BookingId,
                UserId = userId,
                ServiceType = model.ServiceType.ToServiceType(),
                Description = model.Description.Trim(),
                Status = ServiceRequestStatus.Pending,
                RequestedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.ServiceRequests.Add(serviceRequest);
            await _context.SaveChangesAsync();

            // Reload with navigation properties and map to DTO
            var createdRequest = await _context.ServiceRequests
                .Include(sr => sr.Booking)
                    .ThenInclude(b => b.Room)
                        .ThenInclude(r => r.RoomType)
                .Include(sr => sr.User)
                .Include(sr => sr.AssignedToUser)
                .AsNoTracking()
                .Where(sr => sr.Id == serviceRequest.Id)
                .Select(sr => new ServiceRequestDto
                {
                    Id = sr.Id,
                    BookingId = sr.BookingId,
                    UserId = sr.UserId,
                    AssignedToUserId = sr.AssignedToUserId,
                    ServiceType = sr.ServiceType.ToString(),
                    Description = sr.Description,
                    Status = sr.Status.ToString(),
                    RequestedAt = sr.RequestedAt,
                    CompletedAt = sr.CompletedAt,
                    Notes = sr.Notes,
                    CreatedAt = sr.CreatedAt,
                    UpdatedAt = sr.UpdatedAt,
                    Booking = sr.Booking != null ? new BookingInfoDto
                    {
                        Id = sr.Booking.Id,
                        CheckInDate = sr.Booking.CheckInDate,
                        CheckOutDate = sr.Booking.CheckOutDate,
                        Status = sr.Booking.Status.ToString(),
                        RoomNumber = sr.Booking.Room != null ? sr.Booking.Room.RoomNumber : null,
                        RoomType = sr.Booking.Room != null && sr.Booking.Room.RoomType != null ? sr.Booking.Room.RoomType.Name : null
                    } : null,
                    User = sr.User != null ? new UserInfoDto
                    {
                        Id = sr.User.Id,
                        Email = sr.User.Email ?? string.Empty,
                        FirstName = sr.User.FirstName,
                        LastName = sr.User.LastName,
                        PhoneNumber = sr.User.PhoneNumber
                    } : null,
                    AssignedToUser = sr.AssignedToUser != null ? new UserInfoDto
                    {
                        Id = sr.AssignedToUser.Id,
                        Email = sr.AssignedToUser.Email ?? string.Empty,
                        FirstName = sr.AssignedToUser.FirstName,
                        LastName = sr.AssignedToUser.LastName,
                        PhoneNumber = sr.AssignedToUser.PhoneNumber
                    } : null
                })
                .FirstOrDefaultAsync();

            _logger.LogInformation("Created service request {RequestId} for booking {BookingId} by user {UserId}", 
                serviceRequest.Id, model.BookingId, userId);

            return CreatedAtAction(nameof(GetServiceRequest), new { id = serviceRequest.Id }, createdRequest);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating service request for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
            return StatusCode(500, new { message = "An error occurred while creating service request", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ServiceRequestDto>> GetServiceRequest(int id)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isManager = User.IsInRole("Manager");
            var isAdmin = User.IsInRole("Admin");
            var isRoomAttendant = User.IsInRole("RoomAttendant") || User.IsInRole("Housekeeping");

            // First check if user has access
            var originalRequest = await _context.ServiceRequests
                .Where(sr => sr.Id == id && !sr.IsDeleted)
                .Select(sr => new { sr.UserId })
                .FirstOrDefaultAsync();

            if (originalRequest == null)
            {
                return NotFound(new { message = "Service request not found" });
            }

            if (!isManager && !isAdmin && !isRoomAttendant && originalRequest.UserId != userId)
            {
                return Forbid();
            }

            var serviceRequest = await _context.ServiceRequests
                .Include(sr => sr.Booking)
                    .ThenInclude(b => b.Room)
                        .ThenInclude(r => r.RoomType)
                .Include(sr => sr.User)
                .Include(sr => sr.AssignedToUser)
                .Where(sr => sr.Id == id && !sr.IsDeleted)
                .AsNoTracking()
                .Select(sr => new ServiceRequestDto
                {
                    Id = sr.Id,
                    BookingId = sr.BookingId,
                    UserId = sr.UserId,
                    AssignedToUserId = sr.AssignedToUserId,
                    ServiceType = sr.ServiceType.ToString(),
                    Description = sr.Description,
                    Status = sr.Status.ToString(),
                    RequestedAt = sr.RequestedAt,
                    CompletedAt = sr.CompletedAt,
                    Notes = sr.Notes,
                    CreatedAt = sr.CreatedAt,
                    UpdatedAt = sr.UpdatedAt,
                    Booking = sr.Booking != null ? new BookingInfoDto
                    {
                        Id = sr.Booking.Id,
                        CheckInDate = sr.Booking.CheckInDate,
                        CheckOutDate = sr.Booking.CheckOutDate,
                        Status = sr.Booking.Status.ToString(),
                        RoomNumber = sr.Booking.Room != null ? sr.Booking.Room.RoomNumber : null,
                        RoomType = sr.Booking.Room != null && sr.Booking.Room.RoomType != null ? sr.Booking.Room.RoomType.Name : null
                    } : null,
                    User = sr.User != null ? new UserInfoDto
                    {
                        Id = sr.User.Id,
                        Email = sr.User.Email ?? string.Empty,
                        FirstName = sr.User.FirstName,
                        LastName = sr.User.LastName,
                        PhoneNumber = sr.User.PhoneNumber
                    } : null,
                    AssignedToUser = sr.AssignedToUser != null ? new UserInfoDto
                    {
                        Id = sr.AssignedToUser.Id,
                        Email = sr.AssignedToUser.Email ?? string.Empty,
                        FirstName = sr.AssignedToUser.FirstName,
                        LastName = sr.AssignedToUser.LastName,
                        PhoneNumber = sr.AssignedToUser.PhoneNumber
                    } : null
                })
                .FirstOrDefaultAsync();

            if (serviceRequest == null)
            {
                return NotFound(new { message = "Service request not found" });
            }

            return Ok(serviceRequest);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving service request {RequestId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the service request", error = ex.Message });
        }
    }

    [HttpPut("{id}/assign")]
    [Authorize(Roles = "Manager,Receptionist,Admin")]
    public async Task<IActionResult> AssignServiceRequest(int id, AssignServiceRequestModel model)
    {
        var serviceRequest = await _context.ServiceRequests.FindAsync(id);
        if (serviceRequest == null)
        {
            return NotFound();
        }

        serviceRequest.AssignedToUserId = model.AssignedToUserId;
        serviceRequest.Status = ServiceRequestStatus.InProgress;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "RoomAttendant,Housekeeping,Manager,Admin,Receptionist,Customer")]
    public async Task<IActionResult> UpdateServiceRequestStatus(int id, UpdateServiceRequestStatusDto model)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isReceptionist = User.IsInRole("Receptionist");
            var isManager = User.IsInRole("Manager");
            var isAdmin = User.IsInRole("Admin");
            var isCustomer = User.IsInRole("Customer");
            var isRoomAttendant = User.IsInRole("RoomAttendant") || User.IsInRole("Housekeeping");

            var serviceRequest = await _context.ServiceRequests
                .FirstOrDefaultAsync(sr => sr.Id == id && !sr.IsDeleted);

            if (serviceRequest == null)
            {
                return NotFound(new { message = "Service request not found" });
            }

            // Receptionist, Manager, and Admin can update any request - check first
            if (isReceptionist || isManager || isAdmin)
            {
                // These roles can update any request, proceed
            }
            // Customers can only cancel their own requests
            else if (isCustomer && serviceRequest.UserId != userId)
            {
                _logger.LogWarning("Customer {UserId} attempted to update request {RequestId} that doesn't belong to them", userId, id);
                return Forbid();
            }
            // RoomAttendants/Housekeeping can only update assigned requests or unassigned ones
            else if (isRoomAttendant)
            {
                if (serviceRequest.AssignedToUserId != null && serviceRequest.AssignedToUserId != userId)
                {
                    _logger.LogWarning("RoomAttendant/Housekeeping {UserId} attempted to update request {RequestId} assigned to {AssignedUserId}", 
                        userId, id, serviceRequest.AssignedToUserId);
                    return Forbid();
                }
                // Can update if unassigned or assigned to them
            }
            else
            {
                _logger.LogWarning("User {UserId} with unknown role attempted to update request {RequestId}", userId, id);
                return Forbid();
            }

            var newStatus = model.Status.ToServiceRequestStatus();
            serviceRequest.Status = newStatus;
            serviceRequest.UpdatedAt = DateTime.UtcNow;

            if (newStatus == ServiceRequestStatus.Completed)
            {
                serviceRequest.CompletedAt = DateTime.UtcNow;
            }

            if (!string.IsNullOrEmpty(model.Notes))
            {
                serviceRequest.Notes = model.Notes;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated service request {RequestId} status to {Status} by user {UserId}", 
                id, newStatus, userId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating service request {RequestId} status", id);
            return StatusCode(500, new { message = "An error occurred while updating the service request status", error = ex.Message });
        }
    }

    [HttpPut("{id}/complete")]
    [Authorize(Roles = "RoomAttendant,Housekeeping,Manager,Admin")]
    public async Task<IActionResult> CompleteServiceRequest(int id, CompleteServiceRequestModel model)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var serviceRequest = await _context.ServiceRequests
                .FirstOrDefaultAsync(sr => sr.Id == id && !sr.IsDeleted);

            if (serviceRequest == null)
            {
                return NotFound(new { message = "Service request not found" });
            }

            if (User.IsInRole("RoomAttendant") || User.IsInRole("Housekeeping"))
            {
                if (serviceRequest.AssignedToUserId != userId)
                {
                    return Forbid();
                }
            }

            serviceRequest.Status = ServiceRequestStatus.Completed;
            serviceRequest.CompletedAt = DateTime.UtcNow;
            serviceRequest.Notes = model.Notes;
            serviceRequest.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Completed service request {RequestId} by user {UserId}", id, userId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing service request {RequestId}", id);
            return StatusCode(500, new { message = "An error occurred while completing the service request", error = ex.Message });
        }
    }
}


public class AssignServiceRequestModel
{
    public string AssignedToUserId { get; set; } = string.Empty;
}

public class CompleteServiceRequestModel
{
    public string? Notes { get; set; }
}

