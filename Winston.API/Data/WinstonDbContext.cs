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
        modelBuilder.Entity<TripUser>()
            .HasOne(tripUser => tripUser.User)
            .WithMany()
            .HasForeignKey(tripUser => tripUser.UserId)
            .OnDelete(DeleteBehavior.Restrict);
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
    }
}