namespace Winston.Core;

public class TripUser
{
    public Guid Id { get; set; }
    public Trip? Trip { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public decimal PersonalCost { get; set; } = 0.00M;
}