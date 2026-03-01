using DeskOasis.API.Data;
using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Models.Entities;
using DeskOasis.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DeskOasis.API.Services.Implementations;

public class LocationService(AppDbContext db) : ILocationService
{
    public async Task<List<LocationDto>> GetAllAsync()
        => await db.Locations.OrderBy(l => l.Name).Select(l => Map(l)).ToListAsync();

    public async Task<LocationDto?> GetByIdAsync(int id)
        => await db.Locations.Where(l => l.LocationId == id).Select(l => Map(l)).FirstOrDefaultAsync();

    public async Task<LocationDto> CreateAsync(CreateLocationRequest r)
    {
        var l = new Location { Name = r.Name, Address = r.Address, ContactPerson = r.ContactPerson, MobileNumber = r.MobileNumber };
        db.Locations.Add(l);
        await db.SaveChangesAsync();
        return Map(l);
    }

    public async Task<LocationDto?> UpdateAsync(int id, UpdateLocationRequest r)
    {
        var l = await db.Locations.FindAsync(id);
        if (l is null) return null;
        l.Name = r.Name; l.Address = r.Address; l.ContactPerson = r.ContactPerson;
        l.MobileNumber = r.MobileNumber; l.Status = r.Status; l.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Map(l);
    }

    private static LocationDto Map(Location l) => new()
    {
        LocationId = l.LocationId, Name = l.Name, Address = l.Address,
        ContactPerson = l.ContactPerson, MobileNumber = l.MobileNumber,
        Status = l.Status, CreatedAt = l.CreatedAt
    };
}
