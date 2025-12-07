namespace HMS.Api.DTOs;

public class HousekeepingTaskDto
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string? AssignedStaffId { get; set; }
    public string? AssignedStaffName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateHousekeepingTaskDto
{
    public int RoomId { get; set; }
    public string? AssignedStaffId { get; set; }
    public string? Notes { get; set; }
}

public class UpdateHousekeepingTaskDto
{
    public string? AssignedStaffId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
