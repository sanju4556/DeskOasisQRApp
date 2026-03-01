using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskOasis.API.Controllers;

[ApiController]
[Route("api/plants")]
public class PlantsController(IPlantService plantService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
        => Ok(await plantService.GetAllAsync(includeInactive));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await plantService.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreatePlantRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await plantService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.PlantId }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePlantRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await plantService.UpdateAsync(id, request);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPatch("{id:int}/toggle")]
    [Authorize]
    public async Task<IActionResult> Toggle(int id)
    {
        var ok = await plantService.ToggleActiveAsync(id);
        return ok ? Ok(new { message = "Status toggled." }) : NotFound();
    }
}
