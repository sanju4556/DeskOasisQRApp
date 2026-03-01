using DeskOasis.API.Data;
using DeskOasis.API.Models.DTOs;
using DeskOasis.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DeskOasis.API.Services.Implementations;

public class AuthService(AppDbContext db, IConfiguration cfg) : IAuthService
{
    public async Task<LoginResponse?> LoginAsync(LoginRequest req)
    {
        var normalizedEmail = req.Email.Trim().ToLower();
        var user = await db.AdminUsers
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail && u.IsActive);

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return null;

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var expiry = DateTime.UtcNow.AddHours(int.Parse(cfg["Jwt:ExpiryHours"] ?? "24"));
        return new LoginResponse
        {
            Token     = BuildToken(user, expiry),
            Name      = user.Name,
            Role      = user.Role,
            ExpiresAt = expiry
        };
    }

    private string BuildToken(Models.Entities.AdminUser user, DateTime expiry)
    {
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email,          user.Email),
            new Claim(ClaimTypes.Name,           user.Name),
            new Claim(ClaimTypes.Role,           user.Role)
        };
        var token = new JwtSecurityToken(
            issuer:             cfg["Jwt:Issuer"],
            audience:           cfg["Jwt:Audience"],
            claims:             claims,
            expires:            expiry,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
