using DeskOasis.API.Data;
using DeskOasis.API.Services.Implementations;
using DeskOasis.API.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

namespace DeskOasis.API.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration cfg)
    {
        services.AddDbContext<AppDbContext>(opt =>
            opt.UseSqlServer(cfg.GetConnectionString("DefaultConnection"),
                sql => sql.EnableRetryOnFailure(3)));
        return services;
    }

    public static IServiceCollection AddJwtAuth(this IServiceCollection services, IConfiguration cfg)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(opt =>
            {
                opt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!)),
                    ValidateIssuer           = true,
                    ValidIssuer              = cfg["Jwt:Issuer"],
                    ValidateAudience         = true,
                    ValidAudience            = cfg["Jwt:Audience"],
                    ClockSkew                = TimeSpan.Zero
                };
            });
        services.AddAuthorization();
        return services;
    }

    public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration cfg)
    {
        var origins = cfg.GetSection("AllowedOrigins").Get<string[]>() ?? [];
        services.AddCors(opt =>
            opt.AddPolicy("WebPolicy", policy =>
                policy.WithOrigins(origins)
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials()));
        return services;
    }

    public static IServiceCollection AddAppServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService,      AuthService>();
        services.AddScoped<IPlantService,     PlantService>();
        services.AddScoped<ILocationService,  LocationService>();
        services.AddScoped<IStockService,     StockService>();
        services.AddScoped<IOrderService,     OrderService>();
        services.AddScoped<IPaymentService,   PaymentService>();
        services.AddScoped<IQRService,        QRService>();
        services.AddScoped<IDashboardService, DashboardService>();
        return services;
    }

    public static IServiceCollection AddSwagger(this IServiceCollection services)
    {
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title       = "DeskOasis API",
                Version     = "v1",
                Description = "Smart QR-Based Corporate Plant Selling System"
            });
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name         = "Authorization",
                Type         = SecuritySchemeType.ApiKey,
                Scheme       = "Bearer",
                BearerFormat = "JWT",
                In           = ParameterLocation.Header,
                Description  = "Enter: Bearer {token}"
            });
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {{
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }});
        });
        return services;
    }

    // Auto-migrate + seed on startup
    public static async Task InitializeDatabaseAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        await DbSeeder.SeedAsync(db);
    }
}
