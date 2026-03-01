using DeskOasis.API.Data;
using DeskOasis.API.Extensions;
using DeskOasis.API.Middleware;
using Microsoft.EntityFrameworkCore;
using Serilog;

Log.Logger = new LoggerConfiguration().WriteTo.Console().CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Serilog
    builder.Host.UseSerilog((ctx, lc) => lc
        .ReadFrom.Configuration(ctx.Configuration)
        .WriteTo.Console()
        .WriteTo.File("logs/deskoasis-.log", rollingInterval: RollingInterval.Day));

    // Services
    builder.Services.AddDatabase(builder.Configuration);
    builder.Services.AddJwtAuth(builder.Configuration);
    builder.Services.AddCorsPolicy(builder.Configuration);
    builder.Services.AddAppServices();
    builder.Services.AddSwagger();
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();

    var app = builder.Build();

    // Middleware
    app.UseSerilogRequestLogging();
    app.UseMiddleware<ExceptionMiddleware>();
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "DeskOasis API v1"));
    app.UseCors("WebPolicy");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    // Auto-migrate + seed
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await db.Database.MigrateAsync();

        // Skip seeding when running EF CLI tools
        var isEfToolRunning = AppDomain.CurrentDomain
            .GetAssemblies()
            .Any(a => a.FullName != null &&
                      a.FullName.Contains("EntityFrameworkCore.Design"));

        if (!isEfToolRunning)
        {
            await DbSeeder.SeedAsync(db);
        }
    }

    Log.Information("DeskOasis API started → http://localhost:5000/swagger");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "API failed to start");
}
finally
{
    Log.CloseAndFlush();
}
