using System.ComponentModel.DataAnnotations;

namespace DeskOasis.API.Models.DTOs;

// ── Auth ──────────────────────────────────────────────────────────────────────
public class LoginRequest
{
    [Required, EmailAddress] public string Email    { get; set; } = string.Empty;
    [Required]               public string Password { get; set; } = string.Empty;
}
public class LoginResponse
{
    public string   Token     { get; set; } = string.Empty;
    public string   Name      { get; set; } = string.Empty;
    public string   Role      { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

// ── Plant ─────────────────────────────────────────────────────────────────────
public class CreatePlantRequest
{
    [Required, MaxLength(100)] public string  Name             { get; set; } = string.Empty;
    [Required]                 public string  Category         { get; set; } = "Indoor";
                               public string? Description      { get; set; }
    [Required, Range(1, 999999)] public decimal BasePrice      { get; set; }
                               public string? PotType          { get; set; }
                               public string  MaintenanceLevel { get; set; } = "Low";
                               public string? ImageUrl         { get; set; }
}
public class UpdatePlantRequest : CreatePlantRequest
{
    public bool IsActive { get; set; } = true;
}
public class PlantDto
{
    public int     PlantId          { get; set; }
    public string  Name             { get; set; } = string.Empty;
    public string  Category         { get; set; } = string.Empty;
    public string? Description      { get; set; }
    public decimal BasePrice        { get; set; }
    public string? PotType          { get; set; }
    public string  MaintenanceLevel { get; set; } = string.Empty;
    public bool    IsActive         { get; set; }
    public string? ImageUrl         { get; set; }
    public DateTime CreatedAt       { get; set; }
    public DateTime UpdatedAt       { get; set; }
}

// ── Location ──────────────────────────────────────────────────────────────────
public class CreateLocationRequest
{
    [Required, MaxLength(200)] public string  Name          { get; set; } = string.Empty;
                               public string? Address       { get; set; }
                               public string? ContactPerson { get; set; }
                               public string? MobileNumber  { get; set; }
}
public class UpdateLocationRequest : CreateLocationRequest
{
    public string Status { get; set; } = "Active";
}
public class LocationDto
{
    public int     LocationId    { get; set; }
    public string  Name          { get; set; } = string.Empty;
    public string? Address       { get; set; }
    public string? ContactPerson { get; set; }
    public string? MobileNumber  { get; set; }
    public string  Status        { get; set; } = string.Empty;
    public DateTime CreatedAt    { get; set; }
}

// ── Stock ─────────────────────────────────────────────────────────────────────
public class UpsertStockRequest
{
    [Required]             public int LocationId        { get; set; }
    [Required]             public int PlantId           { get; set; }
    [Range(0, int.MaxValue)] public int QuantityAvailable { get; set; }
    [Range(1, int.MaxValue)] public int RefillThreshold   { get; set; } = 3;
}
public class RefillRequest
{
    [Required]             public int     LocationId    { get; set; }
    [Required]             public int     PlantId       { get; set; }
    [Required, Range(1, int.MaxValue)] public int QuantityToAdd { get; set; }
                           public string? Notes         { get; set; }
}
public class StockDto
{
    public int      Id                { get; set; }
    public int      LocationId        { get; set; }
    public string   LocationName      { get; set; } = string.Empty;
    public int      PlantId           { get; set; }
    public string   PlantName         { get; set; } = string.Empty;
    public string?  PlantImageUrl     { get; set; }
    public int      QuantityAvailable { get; set; }
    public int      RefillThreshold   { get; set; }
    public DateTime? LastRefilledDate { get; set; }
    public string   StockStatus       { get; set; } = string.Empty;
}

// ── Payment ───────────────────────────────────────────────────────────────────
public class CreateOrderRequest
{
    [Required] public int     PlantId       { get; set; }
    [Required] public int     LocationId    { get; set; }
               public string? CustomerName  { get; set; }
    [EmailAddress] public string? CustomerEmail { get; set; }
}
public class CreateOrderResponse
{
    public string  OrderId         { get; set; } = string.Empty;
    public string  RazorpayOrderId { get; set; } = string.Empty;
    public decimal Amount          { get; set; }
    public string  RazorpayKeyId   { get; set; } = string.Empty;
    public string  Currency        { get; set; } = "INR";
    public bool    IsMockMode      { get; set; }
}
public class VerifyPaymentRequest
{
    [Required] public string OrderId           { get; set; } = string.Empty;
    [Required] public string RazorpayOrderId   { get; set; } = string.Empty;
    [Required] public string RazorpayPaymentId { get; set; } = string.Empty;
    [Required] public string RazorpaySignature { get; set; } = string.Empty;
}
public class VerifyPaymentResponse
{
    public bool   Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
}

// ── Order ─────────────────────────────────────────────────────────────────────
public class OrderDto
{
    public string  OrderId       { get; set; } = string.Empty;
    public string  PlantName     { get; set; } = string.Empty;
    public string  LocationName  { get; set; } = string.Empty;
    public string? CustomerName  { get; set; }
    public string? CustomerEmail { get; set; }
    public decimal Amount        { get; set; }
    public string  Status        { get; set; } = string.Empty;
    public DateTime CreatedAt    { get; set; }
}

// ── QR / Customer ─────────────────────────────────────────────────────────────
public class PlantInfoResponse
{
    public int     PlantId          { get; set; }
    public string  Name             { get; set; } = string.Empty;
    public string  Category         { get; set; } = string.Empty;
    public string? Description      { get; set; }
    public string? ImageUrl         { get; set; }
    public decimal Price            { get; set; }
    public string? PotType          { get; set; }
    public string  MaintenanceLevel { get; set; } = string.Empty;
    public int     LocationId       { get; set; }
    public string  LocationName     { get; set; } = string.Empty;
    public int     StockAvailable   { get; set; }
    public bool    IsAvailable      { get; set; }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
public class DashboardDto
{
    public decimal             TodayRevenue      { get; set; }
    public int                 TodayOrders       { get; set; }
    public decimal             TotalRevenue      { get; set; }
    public int                 TotalOrders       { get; set; }
    public int                 ActiveLocations   { get; set; }
    public int                 TotalStock        { get; set; }
    public int                 LowStockCount     { get; set; }
    public List<LocationRevDto> RevenueByLocation { get; set; } = [];
    public List<PlantSalesDto>  TopPlants         { get; set; } = [];
    public List<StockAlertDto>  LowStockAlerts    { get; set; } = [];
    public List<OrderDto>       RecentOrders      { get; set; } = [];
}
public class LocationRevDto  { public string LocationName { get; set; } = string.Empty; public decimal Revenue { get; set; } public int Orders { get; set; } }
public class PlantSalesDto   { public string PlantName    { get; set; } = string.Empty; public int Sales       { get; set; } public decimal Revenue { get; set; } }
public class StockAlertDto   { public string PlantName    { get; set; } = string.Empty; public string LocationName { get; set; } = string.Empty; public int Qty { get; set; } public int Threshold { get; set; } }

// ── Generic wrapper ───────────────────────────────────────────────────────────
public class ApiResponse<T>
{
    public bool   Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T?     Data    { get; set; }
    public static ApiResponse<T> Ok(T data, string msg = "Success")   => new() { Success = true,  Message = msg, Data = data };
    public static ApiResponse<T> Fail(string msg)                      => new() { Success = false, Message = msg };
}
