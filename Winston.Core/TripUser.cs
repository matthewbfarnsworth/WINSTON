using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Winston.Core;

public class TripUser
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public Guid TripId { get; set; }
    [JsonIgnore]
    public Trip? Trip { get; set; }
    public decimal PersonalCost { get; set; } = 0.00M;
    [NotMapped]
    public decimal Split { get; set; }
}