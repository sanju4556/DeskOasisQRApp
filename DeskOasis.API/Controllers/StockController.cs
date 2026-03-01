using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DeskOasis.API.Controllers;

[ApiController]
[Route("api/stock")]
[Authorize]
public class StockController(IStockService stockService) : ControllerBase
{
    /// <summary>filter: all | low | out</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? filter)
        => Ok(await stockService.GetAllAsync(filter));

    [HttpGet("location/{locationId:int}/plant/{plantId:int}")]
    public async Task<IActionResult> GetByLocationAndPlant(int locationId, int plantId)
    {
        var result = await stockService.GetByLocationAndPlantAsync(locationId, plantId);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("upsert")]
    public async Task<IActionResult> Upsert([FromBody] UpsertStockRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        return Ok(await stockService.UpsertAsync(request));
    }

    [HttpPost("refill")]
    public async Task<IActionResult> Refill([FromBody] RefillRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var adminName = User.FindFirstValue(ClaimTypes.Name) ?? "Admin";
        var result    = await stockService.RefillAsync(request, adminName);
        return result is null ? NotFound() : Ok(result);
    }
}
