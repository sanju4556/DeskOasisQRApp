using DeskOasis.API.Data;
using DeskOasis.API.Helpers;
using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Models.Entities;
using DeskOasis.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DeskOasis.API.Services.Implementations;

public class PaymentService(AppDbContext db, IConfiguration cfg) : IPaymentService
{
    private string? KeyId => cfg["Razorpay:KeyId"];
    private string? KeySecret => cfg["Razorpay:KeySecret"];

    private bool IsMockMode =>
        cfg.GetValue<bool>("Razorpay:MockMode") || !IsRazorpayConfigured();

    private bool IsRazorpayConfigured()
        => !string.IsNullOrWhiteSpace(KeyId)
           && !string.IsNullOrWhiteSpace(KeySecret)
           && !IsPlaceholder(KeyId)
           && !IsPlaceholder(KeySecret);

    private static bool IsPlaceholder(string value)
    {
        var v = value.Trim();
        return v.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase)
               || v.Contains("YOUR_TEST", StringComparison.OrdinalIgnoreCase)
               || v.Contains("CHANGE_THIS", StringComparison.OrdinalIgnoreCase);
    }

    private RazorpayHttpClient CreateClient()
    {
        if (string.IsNullOrWhiteSpace(KeyId) || string.IsNullOrWhiteSpace(KeySecret))
            throw new InvalidOperationException("Razorpay keys are missing.");
        return new RazorpayHttpClient(KeyId, KeySecret);
    }

    public async Task<CreateOrderResponse> CreateRazorpayOrderAsync(CreateOrderRequest req)
    {
        var stock = await db.LocationPlantStocks
            .FirstOrDefaultAsync(s => s.PlantId == req.PlantId && s.LocationId == req.LocationId)
            ?? throw new InvalidOperationException("No stock record found for this plant and location.");

        if (stock.QuantityAvailable <= 0)
            throw new InvalidOperationException("This plant is currently out of stock.");

        var plant = await db.Plants.FindAsync(req.PlantId)
            ?? throw new InvalidOperationException("Plant not found.");

        var currency = cfg["Razorpay:Currency"] ?? "INR";
        var isMockMode = IsMockMode;
        var razorpayOrderId = string.Empty;
        var razorpayKeyId = KeyId ?? "mock_key";

        if (isMockMode)
        {
            razorpayOrderId = $"mock_order_{Guid.NewGuid():N}";
        }
        else
        {
            var amountPaise = (int)(plant.BasePrice * 100);
            var client = CreateClient();
            var rzpOrder = await client.CreateOrderAsync(amountPaise, currency);
            razorpayOrderId = rzpOrder.Id;
        }

        var count = await db.Orders.CountAsync();
        var orderId = $"ORD-{(count + 1):D6}";

        db.Orders.Add(new Order
        {
            OrderId = orderId,
            LocationId = req.LocationId,
            PlantId = req.PlantId,
            CustomerName = req.CustomerName,
            CustomerEmail = req.CustomerEmail,
            Amount = plant.BasePrice,
            Status = "Pending"
        });

        db.Payments.Add(new Payment
        {
            OrderId = orderId,
            RazorpayOrderId = razorpayOrderId,
            Amount = plant.BasePrice,
            Status = "Pending"
        });

        await db.SaveChangesAsync();

        return new CreateOrderResponse
        {
            OrderId = orderId,
            RazorpayOrderId = razorpayOrderId,
            Amount = plant.BasePrice,
            RazorpayKeyId = razorpayKeyId,
            Currency = currency,
            IsMockMode = isMockMode
        };
    }

    public async Task<VerifyPaymentResponse> VerifyAndCompleteAsync(VerifyPaymentRequest req)
    {
        var order = await db.Orders.FindAsync(req.OrderId);
        if (order is null)
            return Fail(req.OrderId, "Order not found.");

        if (order.Status == "Completed")
            return Success(req.OrderId, "Payment already confirmed.");

        var payment = await db.Payments.FirstOrDefaultAsync(p => p.OrderId == req.OrderId);
        if (payment is null)
            return Fail(req.OrderId, "Payment row not found.");

        if (!string.Equals(payment.RazorpayOrderId, req.RazorpayOrderId, StringComparison.Ordinal))
            return Fail(req.OrderId, "Order mismatch.");

        if (!IsMockMode)
        {
            var client = CreateClient();
            if (!client.VerifySignature(req.RazorpayOrderId, req.RazorpayPaymentId, req.RazorpaySignature))
                return Fail(req.OrderId, "Payment signature verification failed.");
        }

        await using var tx = await db.Database.BeginTransactionAsync();
        try
        {
            var stock = await db.LocationPlantStocks
                .FirstOrDefaultAsync(s => s.PlantId == order.PlantId && s.LocationId == order.LocationId);

            if (stock is null || stock.QuantityAvailable <= 0)
            {
                await tx.RollbackAsync();
                return Fail(req.OrderId, "Out of stock. Please contact admin for refund.");
            }

            stock.QuantityAvailable -= 1;
            stock.UpdatedAt = DateTime.UtcNow;

            order.Status = "Completed";
            order.UpdatedAt = DateTime.UtcNow;

            payment.RazorpayPaymentId = req.RazorpayPaymentId;
            payment.RazorpaySignature = req.RazorpaySignature;
            payment.Status = IsMockMode ? "Simulated" : "Captured";

            await db.SaveChangesAsync();
            await tx.CommitAsync();

            return Success(req.OrderId, IsMockMode
                ? "Payment simulated. Stock updated successfully."
                : "Payment confirmed. Enjoy your plant.");
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    private static VerifyPaymentResponse Fail(string orderId, string msg) =>
        new() { Success = false, Message = msg, OrderId = orderId };

    private static VerifyPaymentResponse Success(string orderId, string msg) =>
        new() { Success = true, Message = msg, OrderId = orderId };
}
