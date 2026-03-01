using DeskOasis.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace DeskOasis.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Plant>              Plants              { get; set; }
    public DbSet<Location>           Locations           { get; set; }
    public DbSet<LocationPlantStock> LocationPlantStocks { get; set; }
    public DbSet<Order>              Orders              { get; set; }
    public DbSet<Payment>            Payments            { get; set; }
    public DbSet<RefillLog>          RefillLogs          { get; set; }
    public DbSet<AdminUser>          AdminUsers          { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        mb.Entity<Plant>(e =>
        {
            e.HasKey(x => x.PlantId);
            e.Property(x => x.BasePrice).HasPrecision(10, 2);
            e.HasIndex(x => x.IsActive);
        });

        mb.Entity<Location>(e =>
        {
            e.HasKey(x => x.LocationId);
            e.HasIndex(x => x.Status);
        });

        mb.Entity<LocationPlantStock>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.LocationId, x.PlantId }).IsUnique();
            e.HasOne(x => x.Plant)
             .WithMany()
             .HasForeignKey(x => x.PlantId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Location)
             .WithMany()
             .HasForeignKey(x => x.LocationId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        mb.Entity<Order>(e =>
        {
            e.HasKey(x => x.OrderId);
            e.Property(x => x.Amount).HasPrecision(10, 2);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.CreatedAt);
            e.HasOne(x => x.Plant).WithMany().HasForeignKey(x => x.PlantId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Location).WithMany().HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.Restrict);
        });

        mb.Entity<Payment>(e =>
        {
            e.HasKey(x => x.PaymentId);
            e.Property(x => x.Amount).HasPrecision(10, 2);
            e.HasIndex(x => x.RazorpayOrderId);
            e.HasOne(x => x.Order).WithMany(o => o.Payments).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<RefillLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Plant).WithMany().HasForeignKey(x => x.PlantId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Location).WithMany().HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.Restrict);
        });

        mb.Entity<AdminUser>(e =>
        {
            e.HasKey(x => x.UserId);
            e.HasIndex(x => x.Email).IsUnique();
        });
    }
}
