using DeskOasis.API.Data;
using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DeskOasis.API.Services.Implementations;

public class DashboardService(AppDbContext db) : IDashboardService
{
    private const int DeadStockDays = 7;

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

    public async Task<LocationHealthDashboardDto> GetLocationHealthAsync()
    {
        var nowUtc = DateTime.UtcNow;
        var deadStockCutoff = nowUtc.AddDays(-DeadStockDays);

        var stockRows = await db.LocationPlantStocks
            .Include(s => s.Location)
            .Include(s => s.Plant)
            .Where(s => s.Location.Status == "Active")
            .Select(s => new
            {
                s.LocationId,
                LocationName = s.Location.Name,
                s.PlantId,
                PlantName = s.Plant.Name,
                s.QuantityAvailable,
                s.RefillThreshold
            })
            .OrderBy(x => x.LocationName)
            .ThenBy(x => x.PlantName)
            .ToListAsync();

        var salesAgg = await db.Orders
            .Where(o => o.Status == "Completed")
            .GroupBy(o => new { o.LocationId, o.PlantId })
            .Select(g => new
            {
                g.Key.LocationId,
                g.Key.PlantId,
                LastSoldAtUtc = g.Max(x => x.CreatedAt),
                SoldLast7Days = g.Count(x => x.CreatedAt >= deadStockCutoff)
            })
            .ToListAsync();

        var salesMap = salesAgg.ToDictionary(
            x => (x.LocationId, x.PlantId),
            x => new { x.LastSoldAtUtc, x.SoldLast7Days });

        var locationGroups = stockRows.GroupBy(x => new { x.LocationId, x.LocationName }).ToList();
        var locationCards = new List<LocationHealthCardDto>(locationGroups.Count);

        foreach (var group in locationGroups)
        {
            var plants = new List<LocationPlantLiveDto>();

            foreach (var row in group)
            {
                salesMap.TryGetValue((row.LocationId, row.PlantId), out var sales);
                var lastSoldAt = sales?.LastSoldAtUtc;
                var soldLast7Days = sales?.SoldLast7Days ?? 0;
                var daysSinceSale = lastSoldAt.HasValue ? (int)(nowUtc - lastSoldAt.Value).TotalDays : (int?)null;

                var (status, color, note) = EvaluateStatus(row.QuantityAvailable, soldLast7Days);

                plants.Add(new LocationPlantLiveDto
                {
                    PlantId = row.PlantId,
                    PlantName = row.PlantName,
                    QuantityAvailable = row.QuantityAvailable,
                    RefillThreshold = row.RefillThreshold,
                    SoldLast7Days = soldLast7Days,
                    LastSoldAtUtc = lastSoldAt,
                    DaysSinceLastSale = daysSinceSale,
                    Status = status,
                    AlertColor = color,
                    StatusNote = note
                });
            }

            locationCards.Add(new LocationHealthCardDto
            {
                LocationId = group.Key.LocationId,
                LocationName = group.Key.LocationName,
                TotalPlants = plants.Count,
                TotalUnits = plants.Sum(p => p.QuantityAvailable),
                HealthyCount = plants.Count(p => p.Status == "Healthy"),
                LowCount = plants.Count(p => p.Status == "Low"),
                CriticalCount = plants.Count(p => p.Status == "Critical"),
                DeadStockCount = plants.Count(p => p.Status == "DeadStock"),
                Plants = plants
            });
        }

        var allPlants = locationCards.SelectMany(x => x.Plants).ToList();

        return new LocationHealthDashboardDto
        {
            GeneratedAtUtc = nowUtc,
            TotalLocations = locationCards.Count,
            TotalPlants = allPlants.Count,
            HealthyCount = allPlants.Count(p => p.Status == "Healthy"),
            LowCount = allPlants.Count(p => p.Status == "Low"),
            CriticalCount = allPlants.Count(p => p.Status == "Critical"),
            DeadStockCount = allPlants.Count(p => p.Status == "DeadStock"),
            Locations = locationCards
        };
    }

    private static (string status, string color, string note) EvaluateStatus(int qty, int soldLast7Days)
    {
        if (qty <= 1)
            return ("Critical", "Red", "Urgent refill required (<= 1 unit left).");

        if (soldLast7Days == 0)
            return ("DeadStock", "Orange", "No sales in the last 7 days.");

        if (qty == 2)
            return ("Low", "Yellow", "Low inventory (2 units left).");

        return ("Healthy", "Green", "Normal movement and healthy stock.");
    }
}
