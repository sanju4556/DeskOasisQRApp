using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskOasis.API.Controllers;

[ApiController]
[Route("api/locations")]
public class LocationsController(ILocationService locationService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await locationService.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await locationService.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateLocationRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await locationService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.LocationId }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLocationRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await locationService.UpdateAsync(id, request);
        return result is null ? NotFound() : Ok(result);
    }
}
