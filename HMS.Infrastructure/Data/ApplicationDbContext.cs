using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using HMS.Domain.Models;

namespace HMS.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<AppUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<RoomType> RoomTypes { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<HousekeepingTask> HousekeepingTasks { get; set; }
    public DbSet<ServiceRequest> ServiceRequests { get; set; }
    public DbSet<Newsletter> Newsletters { get; set; }
    public DbSet<NewsComment> NewsComments { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }
    public DbSet<QueryTicket> QueryTickets { get; set; }
    public DbSet<StaffDutyRoster> StaffDutyRosters { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<EmailVerificationCode> EmailVerificationCodes { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure relationships
        builder.Entity<Booking>()
            .HasOne(b => b.User)
            .WithMany(u => u.Bookings)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure RoomType relationship
        builder.Entity<Room>()
            .HasOne(r => r.RoomType)
            .WithMany(rt => rt.Rooms)
            .HasForeignKey(r => r.RoomTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Booking>()
            .HasOne(b => b.Room)
            .WithMany(r => r.Bookings)
            .HasForeignKey(b => b.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Payment>()
            .HasOne(p => p.Booking)
            .WithMany(b => b.Payments)
            .HasForeignKey(p => p.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<HousekeepingTask>()
            .HasOne(ht => ht.Room)
            .WithMany(r => r.HousekeepingTasks)
            .HasForeignKey(ht => ht.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<HousekeepingTask>()
            .HasOne(ht => ht.AssignedStaff)
            .WithMany(u => u.AssignedHousekeepingTasks)
            .HasForeignKey(ht => ht.AssignedStaffId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<ServiceRequest>()
            .HasOne(sr => sr.Booking)
            .WithMany(b => b.ServiceRequests)
            .HasForeignKey(sr => sr.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ServiceRequest>()
            .HasOne(sr => sr.User)
            .WithMany(u => u.ServiceRequests)
            .HasForeignKey(sr => sr.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ServiceRequest>()
            .HasOne(sr => sr.AssignedToUser)
            .WithMany()
            .HasForeignKey(sr => sr.AssignedToUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Newsletter>()
            .HasOne(n => n.CreatedByUser)
            .WithMany()
            .HasForeignKey(n => n.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<NewsComment>()
            .HasOne(nc => nc.Newsletter)
            .WithMany(n => n.Comments)
            .HasForeignKey(nc => nc.NewsletterId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<NewsComment>()
            .HasOne(nc => nc.User)
            .WithMany(u => u.NewsComments)
            .HasForeignKey(nc => nc.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ActivityLog>()
            .HasOne(al => al.User)
            .WithMany(u => u.ActivityLogs)
            .HasForeignKey(al => al.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<QueryTicket>()
            .HasOne(qt => qt.User)
            .WithMany()
            .HasForeignKey(qt => qt.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<QueryTicket>()
            .HasOne(qt => qt.AssignedToUser)
            .WithMany()
            .HasForeignKey(qt => qt.AssignedToUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<StaffDutyRoster>()
            .HasOne(sdr => sdr.Staff)
            .WithMany()
            .HasForeignKey(sdr => sdr.StaffId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Review>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Review>()
            .HasOne(r => r.Booking)
            .WithMany()
            .HasForeignKey(r => r.BookingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<EmailVerificationCode>()
            .HasOne(evc => evc.User)
            .WithMany()
            .HasForeignKey(evc => evc.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<EmailVerificationCode>()
            .HasIndex(evc => new { evc.UserId, evc.Code, evc.IsUsed });

        // Configure enum conversions
        builder.Entity<Room>()
            .Property(r => r.Status)
            .HasConversion<int>();

        builder.Entity<Booking>()
            .Property(b => b.Status)
            .HasConversion<int>();

        builder.Entity<Booking>()
            .Property(b => b.PaymentStatus)
            .HasConversion<int>();

        builder.Entity<Payment>()
            .Property(p => p.Status)
            .HasConversion<int>();

        builder.Entity<Payment>()
            .Property(p => p.PaymentMethod)
            .HasConversion<int>();

        builder.Entity<ServiceRequest>()
            .Property(sr => sr.Status)
            .HasConversion<int>();

        builder.Entity<ServiceRequest>()
            .Property(sr => sr.ServiceType)
            .HasConversion<int>();

        builder.Entity<HousekeepingTask>()
            .Property(ht => ht.Status)
            .HasConversion<int>();

        // Add database indexes for performance optimization
        builder.Entity<Room>()
            .HasIndex(r => r.RoomNumber)
            .IsUnique();

        builder.Entity<Room>()
            .HasIndex(r => r.Status);

        builder.Entity<Room>()
            .HasIndex(r => r.RoomTypeId);

        // Temporarily disabled until migration is applied
        // builder.Entity<Room>()
        //     .HasIndex(r => r.IsDeleted);

        builder.Entity<Booking>()
            .HasIndex(b => b.UserId);

        builder.Entity<Booking>()
            .HasIndex(b => b.RoomId);

        builder.Entity<Booking>()
            .HasIndex(b => new { b.CheckInDate, b.CheckOutDate });

        builder.Entity<Booking>()
            .HasIndex(b => b.Status);

        // builder.Entity<Booking>()
        //     .HasIndex(b => b.IsDeleted);

        builder.Entity<Payment>()
            .HasIndex(p => p.BookingId);

        builder.Entity<Payment>()
            .HasIndex(p => p.TransactionId)
            .IsUnique()
            .HasFilter("\"TransactionId\" IS NOT NULL");

        // builder.Entity<Payment>()
        //     .HasIndex(p => p.IsDeleted);

        builder.Entity<HousekeepingTask>()
            .HasIndex(ht => ht.AssignedStaffId);

        builder.Entity<HousekeepingTask>()
            .HasIndex(ht => ht.Status);

        builder.Entity<HousekeepingTask>()
            .HasIndex(ht => ht.RoomId);

        // builder.Entity<HousekeepingTask>()
        //     .HasIndex(ht => ht.IsDeleted);

        builder.Entity<ServiceRequest>()
            .HasIndex(sr => sr.BookingId);

        builder.Entity<ServiceRequest>()
            .HasIndex(sr => sr.UserId);

        builder.Entity<ServiceRequest>()
            .HasIndex(sr => sr.Status);

        // builder.Entity<ServiceRequest>()
        //     .HasIndex(sr => sr.IsDeleted);

        builder.Entity<StaffDutyRoster>()
            .HasIndex(sdr => new { sdr.StaffId, sdr.Date });

        // builder.Entity<RoomType>()
        //     .HasIndex(rt => rt.IsDeleted);

        // Configure soft delete query filter
        // Temporarily disabled until migration is applied
        // builder.Entity<Room>().HasQueryFilter(r => !r.IsDeleted);
        // builder.Entity<Booking>().HasQueryFilter(b => !b.IsDeleted);
        // builder.Entity<Payment>().HasQueryFilter(p => !p.IsDeleted);
        // builder.Entity<ServiceRequest>().HasQueryFilter(sr => !sr.IsDeleted);
        // builder.Entity<HousekeepingTask>().HasQueryFilter(ht => !ht.IsDeleted);
        // builder.Entity<RoomType>().HasQueryFilter(rt => !rt.IsDeleted);
    }
}

