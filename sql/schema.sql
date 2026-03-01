-- ============================================================================
-- DeskOasis — Schema (Reference Only)
-- ============================================================================
-- NOTE: EF Core Migrations manage the actual schema.
-- Run: dotnet ef migrations add InitialCreate && dotnet ef database update
--
-- This script is provided as a human-readable reference and for manual setup.
-- ============================================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'DeskOasis')
    CREATE DATABASE DeskOasis;
GO

USE DeskOasis;
GO

-- ── Plants ────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Plants' AND xtype='U')
CREATE TABLE Plants (
    PlantId          INT IDENTITY(1,1) PRIMARY KEY,
    Name             NVARCHAR(100)   NOT NULL,
    Category         NVARCHAR(50)    NOT NULL DEFAULT 'Indoor',
    Description      NVARCHAR(MAX)   NULL,
    ImageUrl         NVARCHAR(500)   NULL,
    BasePrice        DECIMAL(10,2)   NOT NULL,
    PotType          NVARCHAR(100)   NULL,
    MaintenanceLevel NVARCHAR(20)    NOT NULL DEFAULT 'Low',
    IsActive         BIT             NOT NULL DEFAULT 1,
    CreatedAt        DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt        DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ── Locations ─────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Locations' AND xtype='U')
CREATE TABLE Locations (
    LocationId    INT IDENTITY(1,1) PRIMARY KEY,
    Name          NVARCHAR(200) NOT NULL,
    Address       NVARCHAR(500) NULL,
    ContactPerson NVARCHAR(100) NULL,
    MobileNumber  NVARCHAR(20)  NULL,
    Status        NVARCHAR(20)  NOT NULL DEFAULT 'Active',
    CreatedAt     DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt     DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ── LocationPlantStocks ───────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LocationPlantStocks' AND xtype='U')
CREATE TABLE LocationPlantStocks (
    Id                INT IDENTITY(1,1) PRIMARY KEY,
    LocationId        INT         NOT NULL REFERENCES Locations(LocationId),
    PlantId           INT         NOT NULL REFERENCES Plants(PlantId),
    QuantityAvailable INT         NOT NULL DEFAULT 0,
    RefillThreshold   INT         NOT NULL DEFAULT 3,
    LastRefilledDate  DATETIME2   NULL,
    CreatedAt         DATETIME2   NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt         DATETIME2   NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_LocationPlant UNIQUE (LocationId, PlantId)
);
GO

-- ── Orders ────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U')
CREATE TABLE Orders (
    OrderId       NVARCHAR(20)   NOT NULL PRIMARY KEY,
    LocationId    INT            NOT NULL REFERENCES Locations(LocationId),
    PlantId       INT            NOT NULL REFERENCES Plants(PlantId),
    CustomerName  NVARCHAR(100)  NULL,
    CustomerEmail NVARCHAR(200)  NULL,
    Amount        DECIMAL(10,2)  NOT NULL,
    Status        NVARCHAR(30)   NOT NULL DEFAULT 'Pending',
    CreatedAt     DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt     DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ── Payments ──────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Payments' AND xtype='U')
CREATE TABLE Payments (
    PaymentId             INT IDENTITY(1,1) PRIMARY KEY,
    OrderId               NVARCHAR(20)  NOT NULL REFERENCES Orders(OrderId),
    RazorpayOrderId       NVARCHAR(100) NULL,
    RazorpayPaymentId     NVARCHAR(100) NULL,
    RazorpaySignature     NVARCHAR(500) NULL,
    Amount                DECIMAL(10,2) NOT NULL,
    Status                NVARCHAR(30)  NOT NULL DEFAULT 'Pending',
    CreatedAt             DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ── RefillLogs ────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RefillLogs' AND xtype='U')
CREATE TABLE RefillLogs (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    LocationId    INT          NOT NULL REFERENCES Locations(LocationId),
    PlantId       INT          NOT NULL REFERENCES Plants(PlantId),
    QuantityAdded INT          NOT NULL,
    AddedBy       NVARCHAR(100) NOT NULL DEFAULT 'Admin',
    Notes         NVARCHAR(500) NULL,
    Date          DATETIME2    NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ── AdminUsers ────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AdminUsers' AND xtype='U')
CREATE TABLE AdminUsers (
    UserId       INT IDENTITY(1,1) PRIMARY KEY,
    Name         NVARCHAR(100) NOT NULL,
    Email        NVARCHAR(200) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(500) NOT NULL,
    Role         NVARCHAR(50)  NOT NULL DEFAULT 'Admin',
    IsActive     BIT           NOT NULL DEFAULT 1,
    CreatedAt    DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);
GO

PRINT 'DeskOasis schema created successfully.';
PRINT 'NOTE: Seed data is injected automatically by the API on first startup via DbSeeder.cs';
GO
