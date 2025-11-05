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

    public DbSet<Room> Rooms { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<ServiceRequest> ServiceRequests { get; set; }
    public DbSet<Newsletter> Newsletters { get; set; }
    public DbSet<NewsComment> NewsComments { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }
    public DbSet<QueryTicket> QueryTickets { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure relationships
        builder.Entity<Booking>()
            .HasOne(b => b.User)
            .WithMany(u => u.Bookings)
            .HasForeignKey(b => b.UserId)
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

        builder.Entity<Payment>()
            .HasOne(p => p.User)
            .WithMany(u => u.Payments)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Restrict);

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
    }
}

