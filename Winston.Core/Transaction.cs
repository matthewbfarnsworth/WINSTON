namespace Winston.Core;

public class Transaction
{
    public Guid Id { get; set; }
    public Guid SenderId { get; set; }
    public User? Sender { get; set; }
    public Guid RecipientId { get; set; }
    public User? Recipient { get; set; }
    public DateOnly Date { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public decimal Cost { get; set; } = 0.00M;
    public bool RecipientDidNotReceive { get; set; } = false;
    public string? Notes { get; set; }
}