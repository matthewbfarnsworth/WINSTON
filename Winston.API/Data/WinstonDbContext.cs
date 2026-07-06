using Microsoft.EntityFrameworkCore;
using Winston.Core;

namespace Winston.API.Data;

public class WinstonDbContext : DbContext
{
    public WinstonDbContext(DbContextOptions<WinstonDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Trip> Trips { get; set; }
    public DbSet<TripUser> TripUsers { get; set; }
    public DbSet<Transaction> Transactions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TripUser>()
            .HasKey(tripUser => new { tripUser.TripId, tripUser.UserId });
        modelBuilder.Entity<Trip>()
            .Property(trip => trip.Total)
            .HasPrecision(18, 2);
        modelBuilder.Entity<TripUser>()
            .Property(tripUser => tripUser.PersonalCost)
            .HasPrecision(18, 2);
        modelBuilder.Entity<Transaction>()
            .Property(transaction => transaction.Cost)
            .HasPrecision(18, 2);
        modelBuilder.Entity<Transaction>()
            .HasOne(transaction => transaction.Sender)
            .WithMany()
            .HasForeignKey(transaction => transaction.SenderId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Transaction>()
            .HasOne(transaction => transaction.Recipient)
            .WithMany()
            .HasForeignKey(transaction => transaction.RecipientId)
            .OnDelete(DeleteBehavior.Restrict);
        //TODO remove dummy data
        modelBuilder.Entity<User>().HasData(
            new User { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Name = "User1" },
            new User { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Name = "User2" },
            new User { Id = Guid.Parse("00000000-0000-0000-0000-000000000003"), Name = "User3" }
        );
    }
}