namespace Winston.Core;

public class Trip
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public User? Owner { get; set; }
    public string Name { get; set; } = "New Trip";
    public DateOnly Date { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public decimal Total { get; set; } = 0.00M;
    public ICollection<TripUser> TripUsers { get; set; } = new List<TripUser>();
    public string? Notes { get; set; }
    public string? ReceiptImageUrl { get; set; }
}