using DeskOasis.API.Data;
using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Models.Entities;
using DeskOasis.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DeskOasis.API.Services.Implementations;

public class PlantService(AppDbContext db) : IPlantService
{
    public async Task<List<PlantDto>> GetAllAsync(bool includeInactive = false)
    {
        var q = db.Plants.AsQueryable();
        if (!includeInactive) q = q.Where(p => p.IsActive);
        return await q.OrderBy(p => p.Name).Select(p => Map(p)).ToListAsync();
    }

    public async Task<PlantDto?> GetByIdAsync(int id)
        => await db.Plants.Where(p => p.PlantId == id).Select(p => Map(p)).FirstOrDefaultAsync();

    public async Task<PlantDto> CreateAsync(CreatePlantRequest r)
    {
        var p = new Plant
        {
            Name = r.Name, Category = r.Category, Description = r.Description,
            BasePrice = r.BasePrice, PotType = r.PotType,
            MaintenanceLevel = r.MaintenanceLevel, ImageUrl = r.ImageUrl
        };
        db.Plants.Add(p);
        await db.SaveChangesAsync();
        return Map(p);
    }

    public async Task<PlantDto?> UpdateAsync(int id, UpdatePlantRequest r)
    {
        var p = await db.Plants.FindAsync(id);
        if (p is null) return null;
        p.Name = r.Name; p.Category = r.Category; p.Description = r.Description;
        p.BasePrice = r.BasePrice; p.PotType = r.PotType;
        p.MaintenanceLevel = r.MaintenanceLevel; p.ImageUrl = r.ImageUrl;
        p.IsActive = r.IsActive; p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Map(p);
    }

    public async Task<bool> ToggleActiveAsync(int id)
    {
        var p = await db.Plants.FindAsync(id);
        if (p is null) return false;
        p.IsActive = !p.IsActive; p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    private static PlantDto Map(Plant p) => new()
    {
        PlantId = p.PlantId, Name = p.Name, Category = p.Category,
        Description = p.Description, BasePrice = p.BasePrice, PotType = p.PotType,
        MaintenanceLevel = p.MaintenanceLevel, IsActive = p.IsActive,
        ImageUrl = p.ImageUrl, CreatedAt = p.CreatedAt, UpdatedAt = p.UpdatedAt
    };
}
