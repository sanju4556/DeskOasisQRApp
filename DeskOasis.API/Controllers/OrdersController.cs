using DeskOasis.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskOasis.API.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await orderService.GetAllAsync());

    [HttpGet("{orderId}")]
    public async Task<IActionResult> GetById(string orderId)
    {
        var result = await orderService.GetByIdAsync(orderId);
        return result is null ? NotFound() : Ok(result);
    }
}
