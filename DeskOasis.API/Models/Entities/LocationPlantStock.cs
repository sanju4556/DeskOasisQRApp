using System.ComponentModel.DataAnnotations;

namespace DeskOasis.API.Models.Entities;

public class LocationPlantStock
{
    [Key]
    public int Id { get; set; }

    public int LocationId { get; set; }
    public int PlantId { get; set; }

    public int QuantityAvailable { get; set; } = 0;
    public int RefillThreshold { get; set; } = 3;

    public DateTime? LastRefilledDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual Plant Plant { get; set; } = null!;
    public virtual Location Location { get; set; } = null!;
}
