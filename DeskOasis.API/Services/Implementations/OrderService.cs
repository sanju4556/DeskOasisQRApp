using DeskOasis.API.Data;
using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DeskOasis.API.Services.Implementations;

public class OrderService(AppDbContext db) : IOrderService
{
    public async Task<List<OrderDto>> GetAllAsync()
        => await db.Orders.Include(o => o.Plant).Include(o => o.Location)
            .OrderByDescending(o => o.CreatedAt).Select(o => Map(o)).ToListAsync();

    public async Task<OrderDto?> GetByIdAsync(string orderId)
        => await db.Orders.Include(o => o.Plant).Include(o => o.Location)
            .Where(o => o.OrderId == orderId).Select(o => Map(o)).FirstOrDefaultAsync();

    private static OrderDto Map(Models.Entities.Order o) => new()
    {
        OrderId = o.OrderId, PlantName = o.Plant?.Name ?? "", LocationName = o.Location?.Name ?? "",
        CustomerName = o.CustomerName, CustomerEmail = o.CustomerEmail,
        Amount = o.Amount, Status = o.Status, CreatedAt = o.CreatedAt
    };
}
