# 🌿 DeskOasis — Smart QR-Based Corporate Plant Selling System

Self-checkout plant vending for corporate offices. Each plant has a QR sticker — customers scan, pay via Razorpay/UPI, and take the plant. No staff needed.

## Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Backend   | ASP.NET Core 8 Web API             |
| Database  | SQL Server + EF Core 8 (Code-First)|
| Frontend  | React 18 + Vite                    |
| Payment   | Razorpay (UPI / Cards / NetBanking)|
| Auth      | JWT Bearer                         |
| Logging   | Serilog (Console + Rolling File)   |
| Container | Docker + Docker Compose            |

---

## Project Structure

```
DeskOasis/
├── DeskOasis.sln                    ← Visual Studio solution
├── docker-compose.yml               ← Run everything with one command
├── .github/workflows/ci.yml         ← GitHub Actions CI
│
├── DeskOasis.API/                   ← ASP.NET Core 8 Web API
│   ├── Controllers/                 ← HTTP endpoints (1 file per resource)
│   │   ├── AuthController.cs
│   │   ├── PlantsController.cs
│   │   ├── LocationsController.cs
│   │   ├── StockController.cs
│   │   ├── OrdersController.cs
│   │   ├── PaymentController.cs
│   │   ├── QRController.cs
│   │   └── DashboardController.cs
│   ├── Data/
│   │   ├── AppDbContext.cs          ← EF Core DbContext
│   │   └── DbSeeder.cs             ← Auto-seeds plants, locations, admin user
│   ├── Models/
│   │   ├── Entities/               ← EF Core entity classes
│   │   └── DTOs/                   ← Request / Response models
│   ├── Services/
│   │   ├── Interfaces/             ← Service contracts (IPlantService, etc.)
│   │   └── Implementations/        ← Business logic
│   ├── Extensions/
│   │   └── ServiceExtensions.cs    ← DI / startup extension methods
│   ├── Middleware/
│   │   └── ExceptionMiddleware.cs  ← Global error handler → JSON responses
│   ├── Migrations/                 ← EF Core migrations (auto-generated)
│   ├── Properties/
│   │   └── launchSettings.json
│   ├── appsettings.json            ← Base config (no secrets)
│   ├── appsettings.Development.json← Dev overrides (gitignored in prod)
│   ├── Dockerfile
│   └── Program.cs
│
├── DeskOasis.Tests/                 ← xUnit unit tests
│   ├── PlantServiceTests.cs
│   └── DeskOasis.Tests.csproj
│
├── frontend/                        ← React 18 + Vite
│   ├── src/
│   │   ├── App.jsx                  ← Router + protected routes
│   │   ├── main.jsx
│   │   ├── api/client.js           ← Axios instance + all API methods
│   │   ├── context/AuthContext.jsx  ← JWT auth state
│   │   ├── layouts/AdminLayout.jsx  ← Sidebar + nav
│   │   └── pages/
│   │       ├── admin/              ← Protected admin pages
│   │       │   ├── Dashboard.jsx
│   │       │   ├── Plants.jsx
│   │       │   ├── Locations.jsx
│   │       │   ├── Inventory.jsx
│   │       │   ├── QRManager.jsx
│   │       │   ├── Orders.jsx
│   │       │   └── Refill.jsx
│   │       └── customer/           ← Public QR purchase page
│   │           └── BuyPage.jsx
│   ├── Dockerfile
│   ├── nginx.conf                   ← SPA routing in production
│   ├── package.json
│   └── vite.config.js
│
└── sql/
    └── schema.sql                   ← Reference SQL (EF migrations are authoritative)
```

---

## Quick Start — Docker (Recommended)

```bash
# 1. Clone
git clone https://github.com/your-org/DeskOasis.git
cd DeskOasis

# 2. Set your Razorpay test keys (optional for first run)
export RAZORPAY_KEY_ID=rzp_test_xxxx
export RAZORPAY_KEY_SECRET=xxxx

# 3. Start everything
docker compose up -d

# 4. Open
#    Admin:    http://localhost:5173   (admin@deskoasis.in / Admin@123)
#    API Docs: http://localhost:5000/swagger
#    QR Test:  http://localhost:5173/buy?plantId=1&locationId=1
```

---

## Quick Start — Local Development

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20 LTS](https://nodejs.org)
- SQL Server (local or Docker: `docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=Dev@1234" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest`)

### Step 1 — Configure API

Edit `DeskOasis.API/appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DeskOasis;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": { "Key": "YourSecretKeyAtLeast32CharsLong!!!" },
  "Razorpay": {
    "KeyId": "rzp_test_YOUR_KEY",
    "KeySecret": "YOUR_SECRET"
  }
}
```

### Step 2 — Run Database Migrations

```bash
cd DeskOasis.API
dotnet ef migrations add InitialCreate
dotnet ef database update
```

> **Skip EF CLI?** The API auto-runs `MigrateAsync()` + seeds data on startup. Just run the API and the DB will be created.

### Step 3 — Start API

```bash
cd DeskOasis.API
dotnet run
# API: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

### Step 4 — Start Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend: http://localhost:5173
```

### Step 5 — Login

| Field    | Value               |
|----------|---------------------|
| Email    | admin@deskoasis.in  |
| Password | Admin@123           |

---

## Customer Purchase Flow

1. Admin generates QR → **QR Manager** page
2. QR printed and stuck on plant pot
3. Customer scans QR with phone camera
4. Opens `/buy?plantId=X&locationId=Y` — no app install needed
5. Customer enters name → **Pay with Razorpay**
6. Razorpay popup → UPI / Card / NetBanking
7. API verifies HMAC signature → atomically decrements stock
8. Success screen with Order ID

---

## API Endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/auth/login` | Public | Get JWT token |
| GET | `/api/dashboard` | JWT | Dashboard stats |
| GET | `/api/plants` | Public | List plants |
| POST | `/api/plants` | JWT | Add plant |
| PUT | `/api/plants/{id}` | JWT | Edit plant |
| PATCH | `/api/plants/{id}/toggle` | JWT | Toggle active |
| GET | `/api/locations` | Public | List locations |
| POST | `/api/locations` | JWT | Add location |
| GET | `/api/stock` | JWT | List stock |
| POST | `/api/stock` | JWT | Upsert stock |
| POST | `/api/stock/refill` | JWT | Refill stock |
| GET | `/api/orders` | JWT | List orders |
| GET | `/api/qr/plant-info` | Public | QR page data |
| GET | `/api/qr/generate` | JWT | Download QR PNG |
| POST | `/api/payment/create-order` | Public | Create Razorpay order |
| POST | `/api/payment/verify` | Public | Verify + complete payment |

---

## Running Tests

```bash
# Run all tests
dotnet test DeskOasis.Tests/

# With coverage
dotnet test DeskOasis.Tests/ --collect:"XPlat Code Coverage"
```

---

## Production Deployment

### Environment Variables (set in your host / Kubernetes secret)

```
ConnectionStrings__DefaultConnection=Server=...
Jwt__Key=<min-32-char-random-string>
Razorpay__KeyId=rzp_live_xxx
Razorpay__KeySecret=xxx
FrontendBaseUrl=https://your-domain.com
AllowedOrigins__0=https://your-domain.com
```

### Build Production Images

```bash
# API
cd DeskOasis.API && docker build -t deskoasis-api .

# Frontend
cd frontend && docker build -t deskoasis-frontend .
```

---

## Security Notes

- **Never commit** `appsettings.Production.json` or real secrets to Git
- Use **User Secrets** locally: `dotnet user-secrets set "Razorpay:KeyId" "rzp_test_xxx"`
- **Razorpay HMAC** signature is verified server-side before any stock is decremented
- **BCrypt** password hashing (cost factor 12) for admin users
- **JWT** tokens expire in 24h (prod) / 72h (dev)
- All admin endpoints require `[Authorize]`

---

## License

MIT
