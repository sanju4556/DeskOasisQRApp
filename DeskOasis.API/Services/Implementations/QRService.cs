using DeskOasis.API.Data;
using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using QRCoder;

namespace DeskOasis.API.Services.Implementations;

public class QRService(AppDbContext db, IConfiguration cfg) : IQRService
{
    public async Task<PlantInfoResponse?> GetPlantInfoAsync(int plantId, int locationId)
    {
        var s = await db.LocationPlantStocks
            .Include(x => x.Plant)
            .Include(x => x.Location)
            .FirstOrDefaultAsync(x => x.PlantId == plantId && x.LocationId == locationId);

        if (s is null) return null;

        return new PlantInfoResponse
        {
            PlantId          = s.Plant.PlantId,
            Name             = s.Plant.Name,
            Category         = s.Plant.Category,
            Description      = s.Plant.Description,
            ImageUrl         = s.Plant.ImageUrl,
            Price            = s.Plant.BasePrice,
            PotType          = s.Plant.PotType,
            MaintenanceLevel = s.Plant.MaintenanceLevel,
            LocationId       = s.Location.LocationId,
            LocationName     = s.Location.Name,
            StockAvailable   = s.QuantityAvailable,
            IsAvailable      = s.QuantityAvailable > 0
        };
    }

    public byte[] GenerateQRCodePng(int plantId, int locationId)
    {
        var baseUrl = cfg["FrontendBaseUrl"] ?? "https://deskoasis.in";
        var url     = $"{baseUrl}/buy?plantId={plantId}&locationId={locationId}";

        using var gen  = new QRCodeGenerator();
        var data       = gen.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
        using var code = new PngByteQRCode(data);
        return code.GetGraphic(10);
    }
}
