using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeskOasis.API.Models.Entities;

public class Plant
{
    [Key]
    public int PlantId { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Category { get; set; } = "Indoor";

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(300)]
    public string? ImageUrl { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal BasePrice { get; set; }

    [MaxLength(100)]
    public string? PotType { get; set; }

    [MaxLength(20)]
    public string MaintenanceLevel { get; set; } = "Low";

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
