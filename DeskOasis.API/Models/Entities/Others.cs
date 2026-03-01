using System.ComponentModel.DataAnnotations;

namespace DeskOasis.API.Models.Entities;

public class RefillLog
{
    [Key]
    public int Id { get; set; }
    public int LocationId { get; set; }
    public int PlantId { get; set; }
    public int QuantityAdded { get; set; }

    [MaxLength(100)]
    public string AddedBy { get; set; } = "Admin";

    [MaxLength(300)]
    public string? Notes { get; set; }

    public DateTime Date { get; set; } = DateTime.UtcNow;

    public virtual Plant Plant { get; set; } = null!;
    public virtual Location Location { get; set; } = null!;
}

public class AdminUser
{
    [Key]
    public int UserId { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Role { get; set; } = "Admin";

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
}
