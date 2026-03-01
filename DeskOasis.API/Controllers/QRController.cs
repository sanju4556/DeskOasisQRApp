using DeskOasis.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskOasis.API.Controllers;

[ApiController]
[Route("api/qr")]
public class QRController(IQRService qrService) : ControllerBase
{
    /// <summary>Called when customer scans QR — returns plant + stock info (public)</summary>
    [HttpGet("plant-info")]
    public async Task<IActionResult> GetPlantInfo([FromQuery] int plantId, [FromQuery] int locationId)
    {
        var result = await qrService.GetPlantInfoAsync(plantId, locationId);
        return result is null
            ? NotFound(new { message = "Plant or location not found." })
            : Ok(result);
    }

    /// <summary>Download QR code PNG for a plant+location combo (admin only)</summary>
    [HttpGet("generate")]
    [Authorize]
    public IActionResult GenerateQR([FromQuery] int plantId, [FromQuery] int locationId)
    {
        var png = qrService.GenerateQRCodePng(plantId, locationId);
        return File(png, "image/png", $"QR_Plant{plantId}_Loc{locationId}.png");
    }
}
