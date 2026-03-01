using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeskOasis.API.Models.Entities;

public class Order
{
    [Key, MaxLength(20)]
    public string OrderId { get; set; } = string.Empty;

    public int LocationId { get; set; }
    public int PlantId { get; set; }

    [MaxLength(100)]
    public string? CustomerName { get; set; }

    [MaxLength(200)]
    public string? CustomerEmail { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Amount { get; set; }

    [MaxLength(30)]
    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual Plant Plant { get; set; } = null!;
    public virtual Location Location { get; set; } = null!;
    public virtual ICollection<Payment> Payments { get; set; } = [];
}
