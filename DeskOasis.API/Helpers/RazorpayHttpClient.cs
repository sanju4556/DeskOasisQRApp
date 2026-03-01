using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace DeskOasis.API.Helpers;

/// <summary>
/// Thin, net8.0-native Razorpay client using HttpClient + System.Text.Json.
/// Replaces the official Razorpay NuGet SDK which only targets .NET Framework.
/// Docs: https://razorpay.com/docs/api/orders/
/// </summary>
public sealed class RazorpayHttpClient
{
    private readonly HttpClient _http;
    private readonly string     _keySecret;

    private static readonly JsonSerializerOptions _json = new()
    {
        PropertyNamingPolicy        = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition      = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true
    };

    public RazorpayHttpClient(string keyId, string keySecret)
    {
        _keySecret = keySecret;

        // Basic-auth: keyId as username, keySecret as password
        var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{keyId}:{keySecret}"));

        _http = new HttpClient { BaseAddress = new Uri("https://api.razorpay.com/v1/") };
        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", credentials);
        _http.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));
    }

    /// <summary>
    /// POST /v1/orders — creates a Razorpay order.
    /// Returns the Razorpay order ID (e.g. "order_AbCdEfGhIjKlMn").
    /// </summary>
    public async Task<RazorpayOrderResult> CreateOrderAsync(
        int    amountPaise,
        string currency = "INR",
        string? receipt = null)
    {
        var body = new
        {
            amount          = amountPaise,
            currency        = currency,
            receipt         = receipt ?? $"rcpt_{DateTime.UtcNow:yyyyMMddHHmmss}",
            payment_capture = 1
        };

        var json    = JsonSerializer.Serialize(body, _json);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _http.PostAsync("orders", content);
        var raw      = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException(
                $"Razorpay order creation failed ({(int)response.StatusCode}): {raw}");

        var result = JsonSerializer.Deserialize<RazorpayOrderResult>(raw, _json)
            ?? throw new InvalidOperationException("Empty response from Razorpay.");

        return result;
    }

    /// <summary>
    /// Verifies the Razorpay payment signature.
    /// Razorpay signs: HMAC-SHA256( "{order_id}|{payment_id}", KeySecret )
    /// </summary>
    public bool VerifySignature(string razorpayOrderId, string razorpayPaymentId, string signature)
    {
        var key     = Encoding.UTF8.GetBytes(_keySecret);
        var payload = Encoding.UTF8.GetBytes($"{razorpayOrderId}|{razorpayPaymentId}");

        using var hmac     = new HMACSHA256(key);
        var       computed = BitConverter.ToString(hmac.ComputeHash(payload))
                                         .Replace("-", "")
                                         .ToLowerInvariant();

        return string.Equals(computed, signature, StringComparison.OrdinalIgnoreCase);
    }
}

/// <summary>Razorpay order creation response (snake_case fields from API).</summary>
public sealed class RazorpayOrderResult
{
    [JsonPropertyName("id")]       public string Id       { get; set; } = string.Empty;
    [JsonPropertyName("amount")]   public int    Amount   { get; set; }
    [JsonPropertyName("currency")] public string Currency { get; set; } = "INR";
    [JsonPropertyName("receipt")] public string? Receipt  { get; set; }
    [JsonPropertyName("status")]  public string  Status   { get; set; } = string.Empty;
}
