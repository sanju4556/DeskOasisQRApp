using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DeskOasis.API.Controllers;

[ApiController]
[Route("api/payment")]
public class PaymentController(IPaymentService paymentService) : ControllerBase
{
    /// <summary>Step 1: Customer clicks Pay — creates Razorpay order</summary>
    [HttpPost("create-order")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        try
        {
            var result = await paymentService.CreateRazorpayOrderAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>Step 2: After Razorpay popup succeeds — verify signature and complete order</summary>
    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] VerifyPaymentRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await paymentService.VerifyAndCompleteAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
