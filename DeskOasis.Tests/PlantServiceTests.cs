using DeskOasis.API.Data;
using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace DeskOasis.Tests;

public class PlantServiceTests
{
    private static AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_ShouldAddPlant_AndReturnDto()
    {
        using var db = CreateInMemoryDb();
        var svc = new PlantService(db);

        var result = await svc.CreateAsync(new CreatePlantRequest
        {
            Name = "Snake Plant",
            Category = "Indoor",
            Description = "Easy care",
            BasePrice = 499m,
            PotType = "Ceramic",
            MaintenanceLevel = "Low",
            ImageUrl = null
        });

        Assert.Equal("Snake Plant", result.Name);
        Assert.Equal(499m, result.BasePrice);
        Assert.True(result.IsActive);
        Assert.Equal(1, await db.Plants.CountAsync());
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllPlants()
    {
        using var db = CreateInMemoryDb();
        var svc = new PlantService(db);

        await svc.CreateAsync(new CreatePlantRequest { Name = "Plant A", Category = "Indoor", BasePrice = 100m, MaintenanceLevel = "Low" });
        await svc.CreateAsync(new CreatePlantRequest { Name = "Plant B", Category = "Outdoor", BasePrice = 200m, MaintenanceLevel = "Medium" });

        var all = await svc.GetAllAsync();

        Assert.Equal(2, all.Count);
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ShouldReturnNull()
    {
        using var db = CreateInMemoryDb();
        var svc = new PlantService(db);

        var result = await svc.GetByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task ToggleActiveAsync_ShouldFlipStatus()
    {
        using var db = CreateInMemoryDb();
        var svc = new PlantService(db);

        var plant = await svc.CreateAsync(new CreatePlantRequest
        {
            Name = "Toggle Plant",
            Category = "Indoor",
            BasePrice = 99m,
            MaintenanceLevel = "Low"
        });
        Assert.True(plant.IsActive);

        await svc.ToggleActiveAsync(plant.PlantId);
        var updated = await svc.GetByIdAsync(plant.PlantId);

        Assert.False(updated!.IsActive);
    }

    [Fact]
    public async Task UpdateAsync_ShouldPersistChanges()
    {
        using var db = CreateInMemoryDb();
        var svc = new PlantService(db);

        var plant = await svc.CreateAsync(new CreatePlantRequest
        {
            Name = "Old Name",
            Category = "Indoor",
            BasePrice = 100m,
            MaintenanceLevel = "Low"
        });

        var updated = await svc.UpdateAsync(plant.PlantId, new UpdatePlantRequest
        {
            Name = "New Name",
            Category = "Outdoor",
            Description = "Updated desc",
            BasePrice = 299m,
            PotType = "Terracotta",
            MaintenanceLevel = "Medium",
            ImageUrl = null,
            IsActive = true
        });

        Assert.Equal("New Name", updated!.Name);
        Assert.Equal(299m, updated.BasePrice);
    }
}
