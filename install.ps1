# Script de instalación y configuración rápida
# Sistema de Gestión de Licencias de Construcción

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sistema de Licencias de Construcción" -ForegroundColor Cyan
Write-Host "Instalación y Configuración" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js no encontrado. Por favor instale Node.js v16 o superior." -ForegroundColor Red
    exit 1
}

# Verificar MongoDB
Write-Host "Verificando MongoDB..." -ForegroundColor Yellow
try {
    $mongoVersion = mongo --version 2>$null
    if ($mongoVersion) {
        Write-Host "✓ MongoDB encontrado" -ForegroundColor Green
    } else {
        Write-Host "⚠ MongoDB no encontrado o no está en PATH" -ForegroundColor Yellow
        Write-Host "  Por favor asegúrese de que MongoDB esté instalado e iniciado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ No se pudo verificar MongoDB" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Instalando dependencias del servidor..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error al instalar dependencias del servidor" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencias del servidor instaladas" -ForegroundColor Green

Write-Host ""
Write-Host "Instalando dependencias del cliente..." -ForegroundColor Yellow
Set-Location client
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error al instalar dependencias del cliente" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencias del cliente instaladas" -ForegroundColor Green

Set-Location ..

# Crear archivo .env si no existe
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "Creando archivo .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Archivo .env creado" -ForegroundColor Green
    Write-Host "⚠ Por favor configure las variables de entorno en el archivo .env" -ForegroundColor Yellow
}

# Crear directorios necesarios
Write-Host ""
Write-Host "Creando directorios necesarios..." -ForegroundColor Yellow
$dirs = @("uploads", "uploads/pagos", "uploads/reportes")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✓ Directorio creado: $dir" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "¡Instalación completada!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Configure el archivo .env con sus credenciales" -ForegroundColor White
Write-Host "2. Asegúrese de que MongoDB esté corriendo" -ForegroundColor White
Write-Host "3. Ejecute: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "La aplicación estará disponible en:" -ForegroundColor Yellow
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
