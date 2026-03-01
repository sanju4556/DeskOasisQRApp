using DeskOasis.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace DeskOasis.API.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (!await db.Plants.AnyAsync())
        {
            db.Plants.AddRange(
                new Plant { Name = "Snake Plant",   Category = "Air Purifier", BasePrice = 499, PotType = "Ceramic White",  MaintenanceLevel = "Low",    Description = "Thrives in low light. Excellent air purifier." },
                new Plant { Name = "Peace Lily",    Category = "Indoor",       BasePrice = 349, PotType = "Terracotta",     MaintenanceLevel = "Medium", Description = "Elegant white blooms, removes toxins." },
                new Plant { Name = "Areca Palm",    Category = "Desk Plant",   BasePrice = 699, PotType = "Black Matte",    MaintenanceLevel = "Medium", Description = "Natural humidifier for open offices." },
                new Plant { Name = "ZZ Plant",      Category = "Air Purifier", BasePrice = 599, PotType = "Cement Grey",    MaintenanceLevel = "Low",    Description = "Virtually indestructible, tolerates neglect." },
                new Plant { Name = "Pothos Golden", Category = "Desk Plant",   BasePrice = 299, PotType = "Hanging Basket", MaintenanceLevel = "Low",    Description = "Trailing vines that add greenery to any desk." }
            );
            await db.SaveChangesAsync();
        }

        if (!await db.Locations.AnyAsync())
        {
            db.Locations.AddRange(
                new Location { Name = "Infosys Kochi Tower 2",   Address = "Kakkanad, Kochi, Kerala 682030",            ContactPerson = "Rajan Nair",  MobileNumber = "9876543210" },
                new Location { Name = "TCS Trivandrum Campus",   Address = "Technopark Phase 3, Trivandrum 695581",     ContactPerson = "Priya Menon", MobileNumber = "9845671234" },
                new Location { Name = "Wipro Bangalore Block A", Address = "Electronic City Phase 1, Bengaluru 560100", ContactPerson = "Anil Kumar",  MobileNumber = "9712345678" }
            );
            await db.SaveChangesAsync();
        }

        if (!await db.LocationPlantStocks.AnyAsync())
        {
            var plants    = await db.Plants.OrderBy(p => p.PlantId).ToListAsync();
            var locations = await db.Locations.OrderBy(l => l.LocationId).ToListAsync();

            db.LocationPlantStocks.AddRange(
                new LocationPlantStock { LocationId = locations[0].LocationId, PlantId = plants[0].PlantId, QuantityAvailable = 5, RefillThreshold = 3 },
                new LocationPlantStock { LocationId = locations[0].LocationId, PlantId = plants[1].PlantId, QuantityAvailable = 8, RefillThreshold = 3 },
                new LocationPlantStock { LocationId = locations[0].LocationId, PlantId = plants[2].PlantId, QuantityAvailable = 2, RefillThreshold = 2 },
                new LocationPlantStock { LocationId = locations[1].LocationId, PlantId = plants[0].PlantId, QuantityAvailable = 6, RefillThreshold = 3 },
                new LocationPlantStock { LocationId = locations[1].LocationId, PlantId = plants[3].PlantId, QuantityAvailable = 0, RefillThreshold = 2 },
                new LocationPlantStock { LocationId = locations[2].LocationId, PlantId = plants[1].PlantId, QuantityAvailable = 7, RefillThreshold = 3 },
                new LocationPlantStock { LocationId = locations[2].LocationId, PlantId = plants[4].PlantId, QuantityAvailable = 3, RefillThreshold = 3 }
            );
            await db.SaveChangesAsync();
        }

        var admin = await db.AdminUsers
            .FirstOrDefaultAsync(u => u.Email.ToLower() == "admin@deskoasis.in");
        if (admin is null)
        {
            db.AdminUsers.Add(new AdminUser
            {
                Name         = "Super Admin",
                Email        = "admin@deskoasis.in",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role         = "SuperAdmin"
            });
            await db.SaveChangesAsync();
        }
        else if (!admin.IsActive)
        {
            admin.IsActive = true;
            await db.SaveChangesAsync();
        }

        var isDevelopment = string.Equals(
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
            "Development",
            StringComparison.OrdinalIgnoreCase);

        if (isDevelopment && admin is not null && !BCrypt.Net.BCrypt.Verify("Admin@123", admin.PasswordHash))
        {
            admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
            admin.IsActive = true;
            await db.SaveChangesAsync();
        }
    }
}
