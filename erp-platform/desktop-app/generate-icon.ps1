# Script para generar el ícono de VENTECH ERP en formato ICO
# Requiere Node.js instalado

$ErrorActionPreference = "Stop"

Write-Host "🎨 Generando ícono VENTECH ERP..." -ForegroundColor Cyan

# Crear el directorio assets si no existe
New-Item -ItemType Directory -Force -Path "$PSScriptRoot\assets" | Out-Null

# Crear SVG del ícono
$svg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <rect width="256" height="256" rx="48" fill="#2563eb"/>
  <polygon points="138 32 58 148 128 148 118 224 198 108 128 108 138 32"
    fill="white" stroke="white" stroke-width="4" stroke-linejoin="round"/>
</svg>
'@

$svg | Out-File -FilePath "$PSScriptRoot\assets\icon.svg" -Encoding UTF8

# Instalar sharp para conversión si no existe
if (-not (Test-Path "$PSScriptRoot\node_modules\sharp")) {
  Write-Host "📦 Instalando herramienta de conversión de imágenes..." -ForegroundColor Yellow
  Push-Location $PSScriptRoot
  npm install sharp --save-dev 2>&1 | Out-Null
  Pop-Location
}

# Script de conversión
$convertScript = @'
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const svgPath = path.join(__dirname, "assets/icon.svg");
const outDir = path.join(__dirname, "assets");

async function generate() {
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  
  for (const size of sizes) {
    const buf = await sharp(svgPath)
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers.push({ size, buf });
    await sharp(buf).toFile(path.join(outDir, `icon_${size}.png`));
  }
  
  // Copy the 256px as main icon reference
  fs.copyFileSync(path.join(outDir, "icon_256.png"), path.join(outDir, "icon.png"));
  
  console.log("✅ Iconos generados en assets/");
}

generate().catch(console.error);
'@

$convertScript | Out-File -FilePath "$PSScriptRoot\convert-icon.js" -Encoding UTF8

Push-Location $PSScriptRoot
node convert-icon.js
Pop-Location

# Si no hay electron-icon-builder, intentar con el .png como .ico directamente
if (-not (Test-Path "$PSScriptRoot\assets\icon.ico")) {
  # Copiar PNG como ICO (electron-builder acepta PNG en Windows)
  Copy-Item "$PSScriptRoot\assets\icon.png" "$PSScriptRoot\assets\icon.ico" -ErrorAction SilentlyContinue
  Write-Host "⚠️  Usando PNG como ICO. Para un .ico real, reemplaza assets\icon.ico con tu archivo." -ForegroundColor Yellow
}

Write-Host "✅ Icono listo en assets/" -ForegroundColor Green
