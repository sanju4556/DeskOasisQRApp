using DeskOasis.API.Data;
using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Models.Entities;
using DeskOasis.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DeskOasis.API.Services.Implementations;

public class StockService(AppDbContext db) : IStockService
{
    public async Task<List<StockDto>> GetAllAsync(string? filter = null)
    {
        var q = db.LocationPlantStocks.Include(s => s.Plant).Include(s => s.Location).AsQueryable();
        q = filter switch
        {
            "low" => q.Where(s => s.QuantityAvailable > 0 && s.QuantityAvailable <= s.RefillThreshold),
            "out" => q.Where(s => s.QuantityAvailable == 0),
            _     => q
        };
        return await q.OrderBy(s => s.Location.Name).ThenBy(s => s.Plant.Name).Select(s => Map(s)).ToListAsync();
    }

    public async Task<StockDto?> GetByLocationAndPlantAsync(int locationId, int plantId)
        => await db.LocationPlantStocks.Include(s => s.Plant).Include(s => s.Location)
            .Where(s => s.LocationId == locationId && s.PlantId == plantId)
            .Select(s => Map(s)).FirstOrDefaultAsync();

    public async Task<StockDto> UpsertAsync(UpsertStockRequest r)
    {
        var s = await db.LocationPlantStocks.FirstOrDefaultAsync(x => x.LocationId == r.LocationId && x.PlantId == r.PlantId);
        if (s is null) { s = new LocationPlantStock { LocationId = r.LocationId, PlantId = r.PlantId }; db.LocationPlantStocks.Add(s); }
        s.QuantityAvailable = r.QuantityAvailable; s.RefillThreshold = r.RefillThreshold; s.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await db.Entry(s).Reference(x => x.Plant).LoadAsync();
        await db.Entry(s).Reference(x => x.Location).LoadAsync();
        return Map(s);
    }

    public async Task<StockDto?> RefillAsync(RefillRequest r, string adminName)
    {
        var s = await db.LocationPlantStocks.Include(x => x.Plant).Include(x => x.Location)
            .FirstOrDefaultAsync(x => x.LocationId == r.LocationId && x.PlantId == r.PlantId);
        if (s is null) return null;
        s.QuantityAvailable += r.QuantityToAdd; s.LastRefilledDate = DateTime.UtcNow; s.UpdatedAt = DateTime.UtcNow;
        db.RefillLogs.Add(new RefillLog { LocationId = r.LocationId, PlantId = r.PlantId, QuantityAdded = r.QuantityToAdd, AddedBy = adminName, Notes = r.Notes });
        await db.SaveChangesAsync();
        return Map(s);
    }

    private static string Status(LocationPlantStock s) =>
        s.QuantityAvailable == 0 ? "OutOfStock" : s.QuantityAvailable <= s.RefillThreshold ? "Low" : "InStock";

    private static StockDto Map(LocationPlantStock s) => new()
    {
        Id = s.Id, LocationId = s.LocationId, LocationName = s.Location?.Name ?? "",
        PlantId = s.PlantId, PlantName = s.Plant?.Name ?? "", PlantImageUrl = s.Plant?.ImageUrl,
        QuantityAvailable = s.QuantityAvailable, RefillThreshold = s.RefillThreshold,
        LastRefilledDate = s.LastRefilledDate, StockStatus = Status(s)
    };
}
