# Script para limpiar puertos y procesos Node.js
Write-Host "`n🧹 LIMPIANDO SISTEMA..." -ForegroundColor Cyan
Write-Host "=" * 60

# 1. Matar procesos Node.js
Write-Host "`n1️⃣  Deteniendo procesos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "   ✅ $($nodeProcesses.Count) proceso(s) Node.js detenidos" -ForegroundColor Green
} else {
    Write-Host "   ✅ No hay procesos Node.js corriendo" -ForegroundColor Green
}

Start-Sleep -Seconds 1

# 2. Liberar puerto 3000
Write-Host "`n2️⃣  Liberando puerto 3000..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    $port3000 | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Write-Host "   ✅ Puerto 3000 liberado" -ForegroundColor Green
} else {
    Write-Host "   ✅ Puerto 3000 ya está libre" -ForegroundColor Green
}

# 3. Liberar puerto 5000
Write-Host "`n3️⃣  Liberando puerto 5000..." -ForegroundColor Yellow
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($port5000) {
    $port5000 | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Write-Host "   ✅ Puerto 5000 liberado" -ForegroundColor Green
} else {
    Write-Host "   ✅ Puerto 5000 ya está libre" -ForegroundColor Green
}

# 4. Limpiar caché de React
Write-Host "`n4️⃣  Limpiando caché del cliente..." -ForegroundColor Yellow
$cacheCleared = $false
if (Test-Path "client\.next") {
    Remove-Item -Recurse -Force "client\.next"
    $cacheCleared = $true
}
if (Test-Path "client\node_modules\.cache") {
    Remove-Item -Recurse -Force "client\node_modules\.cache"
    $cacheCleared = $true
}
if ($cacheCleared) {
    Write-Host "   ✅ Caché limpiado" -ForegroundColor Green
} else {
    Write-Host "   ✅ No hay caché para limpiar" -ForegroundColor Green
}

# 5. Verificación final
Write-Host "`n5️⃣  Verificación final..." -ForegroundColor Yellow
$nodeCheck = Get-Process node -ErrorAction SilentlyContinue
$port3000Check = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$port5000Check = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

Write-Host "`n📊 ESTADO DEL SISTEMA:" -ForegroundColor Cyan
Write-Host "   • Procesos Node.js: " -NoNewline
if ($nodeCheck) {
    Write-Host "$($nodeCheck.Count) corriendo ⚠️" -ForegroundColor Yellow
} else {
    Write-Host "0 (limpio) ✅" -ForegroundColor Green
}

Write-Host "   • Puerto 3000: " -NoNewline
if ($port3000Check) {
    Write-Host "OCUPADO ❌" -ForegroundColor Red
} else {
    Write-Host "LIBRE ✅" -ForegroundColor Green
}

Write-Host "   • Puerto 5000: " -NoNewline
if ($port5000Check) {
    Write-Host "OCUPADO ❌" -ForegroundColor Red
} else {
    Write-Host "LIBRE ✅" -ForegroundColor Green
}

Write-Host "`n✅ SISTEMA LIMPIO - Listo para ejecutar 'npm run dev'" -ForegroundColor Green
Write-Host "=" * 60 "`n"
