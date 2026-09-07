$ErrorActionPreference = "Continue"
$Root        = Split-Path $PSScriptRoot -Parent
$DesktopApp  = $PSScriptRoot
$ResDir      = Join-Path $DesktopApp "resources"
$SchemaOrig  = Join-Path $Root "packages\db\prisma\schema.prisma"
$SchemaBak   = Join-Path $Root "packages\db\prisma\schema.prisma.bak"
$SchemaSQLite= Join-Path $DesktopApp "schema.desktop.prisma"

Write-Host "==== VENTECH ERP - Build Desktop Standalone ====" -ForegroundColor Cyan

# Limpieza
Remove-Item "$DesktopApp\dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $ResDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "$ResDir\api" | Out-Null
New-Item -ItemType Directory -Force -Path "$ResDir\web" | Out-Null

# Backup schema original
Copy-Item $SchemaOrig $SchemaBak -Force

function RestoreSchema {
    if (Test-Path $SchemaBak) {
        Write-Host "Restaurando schema PostgreSQL del servidor..." -ForegroundColor Yellow
        Copy-Item $SchemaBak $SchemaOrig -Force
        Remove-Item $SchemaBak -Force -ErrorAction SilentlyContinue
        Push-Location (Join-Path $Root "packages\db")
        npx prisma generate 2>&1 | Select-Object -Last 2
        Pop-Location
        Write-Host "Schema PostgreSQL restaurado. Servidor intacto." -ForegroundColor Green
    }
}

try {
    # â”€â”€ PASO 1: Compilar NestJS con schema PostgreSQL (tiene enums â†’ sin errores TS) â”€â”€
    Write-Host "[1/7] Compilando API NestJS (TypeScript)..." -ForegroundColor Cyan
    Push-Location (Join-Path $Root "apps\api")
    npx nest build 2>&1 | Select-Object -Last 5
    Pop-Location
    Write-Host "   OK - API compilada" -ForegroundColor Green

    # â”€â”€ PASO 2: Cambiar schema a SQLite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Write-Host "[2/7] Activando schema SQLite..." -ForegroundColor Cyan
    Copy-Item $SchemaSQLite $SchemaOrig -Force

    # â”€â”€ PASO 3: Generar cliente Prisma SQLite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Write-Host "[3/7] Generando cliente Prisma SQLite..." -ForegroundColor Cyan
    Push-Location (Join-Path $Root "packages\db")
    npx prisma generate 2>&1 | Select-Object -Last 3
    Pop-Location
    Write-Host "   OK - Cliente SQLite generado" -ForegroundColor Green

    # â”€â”€â”€ PASO 3.5: Generar template DB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Write-Host "[3.5/7] Generando DB SQLite inicial..." -ForegroundColor Cyan
    $Env:DATABASE_URL = "file:./template.db"
    Push-Location (Join-Path $Root "packages\db")
    npx prisma db push --accept-data-loss 2>&1 | Select-Object -Last 3
    Pop-Location
    $TemplatePath = Join-Path $Root "packages\db\prisma\template.db"
    if (Test-Path $TemplatePath) {
        Copy-Item $TemplatePath -Destination "$ResDir\api\template.db" -Force
        
        # Inyectar superadmin
        Write-Host "Inyectando superadmin..." -ForegroundColor Cyan
        $SqliteScript = @"
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('$($ResDir.Replace('\', '\\'))\\\\api\\\\template.db');
db.serialize(() => {
    db.run("INSERT OR IGNORE INTO Tenant (id, name, rif, isActive, createdAt) VALUES ('default-tenant', 'Ventech Offline', 'J-00000000-0', 1, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))");
    const hash = '`$2b`$10`$fUBAs4dtzJCnZ92MWRqyauRVtDvthy7efk4jjUTkyHOyMy9q7wMeq';
    db.run("INSERT OR IGNORE INTO User (id, tenantId, email, password, role, name, isActive, createdAt, updatedAt) VALUES ('b00165f3-bbd6-4b20-b7c8-0f5a9dc2cfd2', 'default-tenant', '12832779', '" + hash + "', 'SUPERADMIN', 'Administrador General', 1, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))");
});
db.close();
"@
        Set-Content -Path "$ResDir\api\inject.js" -Value $SqliteScript -Encoding UTF8
        Push-Location "$ResDir\api"
        npm install sqlite3 --no-save 2>&1 | Out-Null
        node inject.js
        Pop-Location
    }
    Remove-Item $TemplatePath -Force -ErrorAction SilentlyContinue
    $Env:DATABASE_URL = ""

    # â”€â”€ PASO 4: Parchar cliente SQLite para compatibilidad de enums â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Write-Host "[4/7] Aplicando parche de compatibilidad de enums..." -ForegroundColor Cyan
    $ClientJs = Join-Path $Root "node_modules\@prisma\client\index.js"
    $EnumPatch = @"

// â”€â”€â”€ Desktop enum compatibility patch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const __desktopEnums = exports.`$Enums || {};
if (!exports.Role) exports.Role = __desktopEnums.Role || { SUPERADMIN:'SUPERADMIN', ADMIN:'ADMIN', MANAGER:'MANAGER', AUDITOR:'AUDITOR', CASHIER:'CASHIER', INVENTORY:'INVENTORY' };
if (!exports.ProductStatus) exports.ProductStatus = __desktopEnums.ProductStatus || { ACTIVO:'ACTIVO', AGOTADO:'AGOTADO', SUSPENDIDO:'SUSPENDIDO' };
if (!exports.OrderStatus) exports.OrderStatus = __desktopEnums.OrderStatus || { PENDING:'PENDING', COMPLETED:'COMPLETED', CANCELLED:'CANCELLED', CREDIT:'CREDIT' };
if (!exports.PaymentMethod) exports.PaymentMethod = __desktopEnums.PaymentMethod || { CASH:'CASH', CARD:'CARD', TRANSFER:'TRANSFER', ZELLE:'ZELLE', PAGO_MOVIL:'PAGO_MOVIL', BINANCE:'BINANCE', CREDIT:'CREDIT' };
if (!exports.SerialStatus) exports.SerialStatus = __desktopEnums.SerialStatus || { AVAILABLE:'AVAILABLE', SOLD:'SOLD', RETURNED:'RETURNED', LOST:'LOST' };
"@
    Add-Content -Path $ClientJs -Value $EnumPatch
    Write-Host "   OK - Enums compatibles" -ForegroundColor Green

    # â”€â”€ PASO 5: Bundle API con NCC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Write-Host "[5/7] Empaquetando API en bundle unico (NCC)..." -ForegroundColor Cyan
    $ApiMain = Join-Path $Root "apps\api\dist\main.js"
    Push-Location $Root
    Remove-Item -Path "$Root\node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
    npx @vercel/ncc build $ApiMain -o "$ResDir\api" --no-source-map-register 2>&1 | Select-Object -Last 5
    Pop-Location
    # Copiar query engine de Prisma (binario nativo .node)
    $PrismaClient = Join-Path $Root "node_modules\.prisma\client"
    if (Test-Path $PrismaClient) {
        New-Item -ItemType Directory -Force -Path "$ResDir\api\prisma" | Out-Null
        Get-ChildItem $PrismaClient -Filter "*.node" | Copy-Item -Destination "$ResDir\api\prisma\" -Force
        Get-ChildItem $PrismaClient -Filter "*.node" | Copy-Item -Destination "$ResDir\api\" -Force
        Get-ChildItem $PrismaClient -Filter "*.db" | Copy-Item -Destination "$ResDir\api\prisma\" -Force
        
        # Include C++ Redistributable DLLs for Prisma query engine
        Copy-Item "C:\Windows\System32\vcruntime140.dll" -Destination "$ResDir\api\" -Force -ErrorAction SilentlyContinue
        Copy-Item "C:\Windows\System32\msvcp140.dll" -Destination "$ResDir\api\" -Force -ErrorAction SilentlyContinue
        Copy-Item "C:\Windows\System32\vcruntime140_1.dll" -Destination "$ResDir\api\" -Force -ErrorAction SilentlyContinue
    }
    Write-Host "   OK - API empaquetada" -ForegroundColor Green

    # â”€â”€ PASO 6: Compilar Next.js standalone â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Write-Host "[6/7] Compilando interfaz Next.js..." -ForegroundColor Cyan
    $env:API_URL = "http://127.0.0.1:3001"
    $env:NEXT_TELEMETRY_DISABLED = "1"
    Push-Location (Join-Path $Root "apps\web")
    npx next build 2>&1 | Select-Object -Last 5
    Pop-Location

    $Standalone = Join-Path $Root "apps\web\.next\standalone"
    Get-ChildItem $Standalone | Copy-Item -Destination "$ResDir\web\" -Recurse -Force
    $WebDest = "$ResDir\web\apps\web"
    New-Item -ItemType Directory -Force -Path "$WebDest\.next\static" | Out-Null
    $Static = Join-Path $Root "apps\web\.next\static"
    if (Test-Path $Static) {
        Get-ChildItem $Static | Copy-Item -Destination "$WebDest\.next\static\" -Recurse -Force
    }
    $Public = Join-Path $Root "apps\web\public"
    if (Test-Path $Public) {
        New-Item -ItemType Directory -Force -Path "$WebDest\public" | Out-Null
        Get-ChildItem $Public | Copy-Item -Destination "$WebDest\public\" -Recurse -Force -ErrorAction SilentlyContinue
    }
    Write-Host "   OK - Interfaz compilada" -ForegroundColor Green

} finally {
    RestoreSchema
}

# â”€â”€ PASO 7: Crear instalador .exe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "[7/7] Creando instalador Windows (.exe)..." -ForegroundColor Cyan
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
$env:WIN_CSC_IDENTITY_AUTO_DISCOVERY = "false"
Push-Location $DesktopApp
npx electron-builder --win nsis --x64 2>&1 | Select-Object -Last 12
Pop-Location

$Exe = Get-ChildItem "$DesktopApp\dist" -Filter "VENTECH*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($Exe) {
    $MB = [math]::Round($Exe.Length / 1MB, 1)
    Write-Host ""
    Write-Host "INSTALADOR LISTO: $($Exe.Name) ($MB MB)" -ForegroundColor Green
    Write-Host "Ruta: $($Exe.FullName)" -ForegroundColor Green
} else {
    Write-Host "No se genero el .exe. Revisa los errores arriba." -ForegroundColor Red
}


