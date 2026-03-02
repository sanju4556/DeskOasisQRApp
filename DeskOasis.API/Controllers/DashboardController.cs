using DeskOasis.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskOasis.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    /// <summary>Get live dashboard statistics</summary>
    [HttpGet]
    public async Task<IActionResult> Get()
        => Ok(await dashboardService.GetStatsAsync());

    /// <summary>Get location-wise plant health cards with stock and sale movement signals</summary>
    [HttpGet("location-health")]
    public async Task<IActionResult> GetLocationHealth()
        => Ok(await dashboardService.GetLocationHealthAsync());
}
