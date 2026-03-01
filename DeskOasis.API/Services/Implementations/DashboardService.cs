using DeskOasis.API.Data;
using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DeskOasis.API.Services.Implementations;

public class DashboardService(AppDbContext db) : IDashboardService
{
    public async Task<DashboardDto> GetStatsAsync()
    {
        var today = DateTime.UtcNow.Date;

        var todayOrders = await db.Orders
            .Where(o => o.Status == "Completed" && o.CreatedAt >= today).ToListAsync();

        var allCompleted = await db.Orders
            .Where(o => o.Status == "Completed").ToListAsync();

        var revenueByLocation = await db.Orders
            .Where(o => o.Status == "Completed")
            .Include(o => o.Location)
            .GroupBy(o => o.Location.Name)
            .Select(g => new LocationRevDto { LocationName = g.Key, Revenue = g.Sum(o => o.Amount), Orders = g.Count() })
            .OrderByDescending(x => x.Revenue).Take(5).ToListAsync();

        var topPlants = await db.Orders
            .Where(o => o.Status == "Completed")
            .Include(o => o.Plant)
            .GroupBy(o => o.Plant.Name)
            .Select(g => new PlantSalesDto { PlantName = g.Key, Sales = g.Count(), Revenue = g.Sum(o => o.Amount) })
            .OrderByDescending(x => x.Sales).Take(5).ToListAsync();

        var lowStockAlerts = await db.LocationPlantStocks
            .Where(s => s.QuantityAvailable <= s.RefillThreshold)
            .Include(s => s.Plant).Include(s => s.Location)
            .Select(s => new StockAlertDto { PlantName = s.Plant.Name, LocationName = s.Location.Name, Qty = s.QuantityAvailable, Threshold = s.RefillThreshold })
            .ToListAsync();

        var recentOrders = await db.Orders
            .Include(o => o.Plant).Include(o => o.Location)
            .OrderByDescending(o => o.CreatedAt).Take(10)
            .Select(o => new OrderDto
            {
                OrderId = o.OrderId, PlantName = o.Plant.Name, LocationName = o.Location.Name,
                CustomerName = o.CustomerName, Amount = o.Amount, Status = o.Status, CreatedAt = o.CreatedAt
            }).ToListAsync();

        return new DashboardDto
        {
            TodayRevenue      = todayOrders.Sum(o => o.Amount),
            TodayOrders       = todayOrders.Count,
            TotalRevenue      = allCompleted.Sum(o => o.Amount),
            TotalOrders       = allCompleted.Count,
            ActiveLocations   = await db.Locations.CountAsync(l => l.Status == "Active"),
            TotalStock        = await db.LocationPlantStocks.SumAsync(s => s.QuantityAvailable),
            LowStockCount     = lowStockAlerts.Count,
            RevenueByLocation = revenueByLocation,
            TopPlants         = topPlants,
            LowStockAlerts    = lowStockAlerts,
            RecentOrders      = recentOrders
        };
    }
}
