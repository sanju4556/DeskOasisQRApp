using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeskOasis.API.Models.Entities;

public class Payment
{
    [Key]
    public int PaymentId { get; set; }

    [MaxLength(20)]
    public string OrderId { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? RazorpayOrderId { get; set; }

    [MaxLength(100)]
    public string? RazorpayPaymentId { get; set; }

    [MaxLength(500)]
    public string? RazorpaySignature { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Amount { get; set; }

    [MaxLength(30)]
    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Order Order { get; set; } = null!;
}
