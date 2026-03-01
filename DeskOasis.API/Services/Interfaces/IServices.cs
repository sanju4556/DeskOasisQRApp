using DeskOasis.API.Models.DTOs;

namespace DeskOasis.API.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
}

public interface IPlantService
{
    Task<List<PlantDto>> GetAllAsync(bool includeInactive = false);
    Task<PlantDto?> GetByIdAsync(int id);
    Task<PlantDto> CreateAsync(CreatePlantRequest request);
    Task<PlantDto?> UpdateAsync(int id, UpdatePlantRequest request);
    Task<bool> ToggleActiveAsync(int id);
}

public interface ILocationService
{
    Task<List<LocationDto>> GetAllAsync();
    Task<LocationDto?> GetByIdAsync(int id);
    Task<LocationDto> CreateAsync(CreateLocationRequest request);
    Task<LocationDto?> UpdateAsync(int id, UpdateLocationRequest request);
}

public interface IStockService
{
    Task<List<StockDto>> GetAllAsync(string? filter = null);
    Task<StockDto?> GetByLocationAndPlantAsync(int locationId, int plantId);
    Task<StockDto> UpsertAsync(UpsertStockRequest request);
    Task<StockDto?> RefillAsync(RefillRequest request, string adminName);
}

public interface IOrderService
{
    Task<List<OrderDto>> GetAllAsync();
    Task<OrderDto?> GetByIdAsync(string orderId);
}

public interface IPaymentService
{
    Task<CreateOrderResponse> CreateRazorpayOrderAsync(CreateOrderRequest request);
    Task<VerifyPaymentResponse> VerifyAndCompleteAsync(VerifyPaymentRequest request);
}

public interface IQRService
{
    Task<PlantInfoResponse?> GetPlantInfoAsync(int plantId, int locationId);
    byte[] GenerateQRCodePng(int plantId, int locationId);
}

public interface IDashboardService
{
    Task<DashboardDto> GetStatsAsync();
}
