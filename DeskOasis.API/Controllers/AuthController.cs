using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DeskOasis.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>Admin login — returns JWT token</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await authService.LoginAsync(request);
        if (result is null)
            return Unauthorized(new { success = false, message = "Invalid email or password." });
        return Ok(ApiResponse<LoginResponse>.Ok(result, "Login successful."));
    }
}
