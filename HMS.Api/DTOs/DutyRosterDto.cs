namespace HMS.Api.DTOs;

public class DutyRosterDto
{
    public int Id { get; set; }
    public string StaffId { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
    public string StaffEmail { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Shift { get; set; } = string.Empty;
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateDutyRosterDto
{
    public string StaffId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Shift { get; set; } = string.Empty;
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string? Notes { get; set; }
}

public class UpdateDutyRosterDto
{
    public string StaffId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Shift { get; set; } = string.Empty;
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string? Notes { get; set; }
}

