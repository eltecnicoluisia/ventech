$Root = "C:\Users\Amy Uzcategui\Documents\VENTECH\erp-platform"
$DesktopApp = Join-Path $Root "desktop-app"
$ResDir = Join-Path $DesktopApp "resources"

Write-Host "Compilando Next.js..."
$env:API_URL = "http://127.0.0.1:3001"
$env:NEXT_TELEMETRY_DISABLED = "1"
Push-Location (Join-Path $Root "apps\web")
npx next build
Pop-Location

Write-Host "Copiando Next.js al build..."
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

Write-Host "Repaquetando..."
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
$env:WIN_CSC_IDENTITY_AUTO_DISCOVERY = "false"
Push-Location $DesktopApp
npx electron-builder --win nsis --x64
Pop-Location
