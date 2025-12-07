namespace HMS.Domain.Models;

public class EmailVerificationCode
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty; // 6-digit code
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(15); // Code expires in 15 minutes
    public bool IsUsed { get; set; } = false;
    
    // Navigation property
    public virtual AppUser User { get; set; } = null!;
}

