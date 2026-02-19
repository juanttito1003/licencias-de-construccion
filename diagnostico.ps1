# Script de Diagnóstico - Licencias de Construcción
# Ejecutar con: .\diagnostico.ps1

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    🔍 DIAGNÓSTICO DEL SISTEMA - LICENCIAS DE CONSTRUCCIÓN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$errores = @()
$advertencias = @()
$ok = @()

# 1. Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    if ($nodeVersion) {
        $ok += "✓ Node.js instalado: $nodeVersion"
        Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
    }
} catch {
    $errores += "✗ Node.js NO está instalado"
    Write-Host "  ✗ Node.js NO instalado" -ForegroundColor Red
}

# 2. Verificar NPM
Write-Host "📦 Verificando NPM..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    if ($npmVersion) {
        $ok += "✓ NPM instalado: $npmVersion"
        Write-Host "  ✓ NPM: $npmVersion" -ForegroundColor Green
    }
} catch {
    $errores += "✗ NPM NO está instalado"
    Write-Host "  ✗ NPM NO instalado" -ForegroundColor Red
}

# 3. Verificar MongoDB
Write-Host "🍃 Verificando MongoDB..." -ForegroundColor Yellow
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoProcess) {
    $mongoMB = [math]::Round($mongoProcess.WorkingSet / 1MB, 2)
    $ok += "✓ MongoDB corriendo (PID: $($mongoProcess.Id), RAM: ${mongoMB}MB)"
    Write-Host "  ✓ MongoDB activo - PID: $($mongoProcess.Id) - RAM: ${mongoMB}MB" -ForegroundColor Green
} else {
    $errores += "✗ MongoDB NO está corriendo"
    Write-Host "  ✗ MongoDB NO está corriendo" -ForegroundColor Red
    Write-Host "    Solución: net start MongoDB" -ForegroundColor Yellow
}

# 4. Verificar Redis (opcional)
Write-Host "🔴 Verificando Redis (opcional)..." -ForegroundColor Yellow
$redisProcess = Get-Process redis-server -ErrorAction SilentlyContinue
if ($redisProcess) {
    $ok += "✓ Redis corriendo (PID: $($redisProcess.Id))"
    Write-Host "  ✓ Redis activo" -ForegroundColor Green
} else {
    $advertencias += "⚠ Redis no está corriendo (usa almacenamiento en memoria)"
    Write-Host "  ⚠ Redis no activo (opcional, usa memoria como fallback)" -ForegroundColor DarkYellow
}

# 5. Verificar procesos Node.js
Write-Host "🖥️  Verificando procesos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        $nodeMB = [math]::Round($proc.WorkingSet / 1MB, 2)
        $nodeCPU = [math]::Round($proc.CPU, 2)
        Write-Host "  → Node PID $($proc.Id): RAM ${nodeMB}MB, CPU ${nodeCPU}s" -ForegroundColor Cyan
        
        if ($nodeMB -gt 500) {
            $advertencias += "⚠ Node.js PID $($proc.Id) usando mucha RAM: ${nodeMB}MB"
        }
    }
    $ok += "✓ $($nodeProcesses.Count) proceso(s) Node.js activo(s)"
} else {
    $advertencias += "⚠ No hay procesos Node.js corriendo"
    Write-Host "  ⚠ No hay procesos Node.js activos" -ForegroundColor DarkYellow
}

# 6. Verificar puertos
Write-Host "🔌 Verificando puertos..." -ForegroundColor Yellow

# Puerto 5000 (Backend)
$puerto5000 = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($puerto5000) {
    $ok += "✓ Puerto 5000 (Backend) en uso - PID: $($puerto5000.OwningProcess)"
    Write-Host "  ✓ Puerto 5000 (Backend) activo - PID: $($puerto5000.OwningProcess)" -ForegroundColor Green
} else {
    $advertencias += "⚠ Puerto 5000 (Backend) NO está en uso"
    Write-Host "  ⚠ Puerto 5000 (Backend) libre" -ForegroundColor DarkYellow
}

# Puerto 3000 (Frontend)
$puerto3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($puerto3000) {
    $ok += "✓ Puerto 3000 (Frontend) en uso - PID: $($puerto3000.OwningProcess)"
    Write-Host "  ✓ Puerto 3000 (Frontend) activo - PID: $($puerto3000.OwningProcess)" -ForegroundColor Green
} else {
    $advertencias += "⚠ Puerto 3000 (Frontend) NO está en uso"
    Write-Host "  ⚠ Puerto 3000 (Frontend) libre" -ForegroundColor DarkYellow
}

# 7. Verificar archivo .env
Write-Host "⚙️  Verificando configuración..." -ForegroundColor Yellow
if (Test-Path .env) {
    $ok += "✓ Archivo .env existe"
    Write-Host "  ✓ Archivo .env existe" -ForegroundColor Green
    
    # Verificar variables críticas
    $envContent = Get-Content .env -Raw
    $variablesCriticas = @('MONGODB_URI', 'JWT_SECRET', 'PORT')
    
    foreach ($var in $variablesCriticas) {
        if ($envContent -match "$var=.+") {
            Write-Host "    ✓ $var configurado" -ForegroundColor Green
        } else {
            $errores += "✗ Variable $var NO está configurada en .env"
            Write-Host "    ✗ $var NO configurado" -ForegroundColor Red
        }
    }
} else {
    $errores += "✗ Archivo .env NO existe"
    Write-Host "  ✗ Archivo .env NO existe" -ForegroundColor Red
    Write-Host "    Solución: Copiar .env.example a .env" -ForegroundColor Yellow
}

# 8. Verificar dependencias
Write-Host "📚 Verificando dependencias..." -ForegroundColor Yellow
if (Test-Path node_modules) {
    $ok += "✓ node_modules existe (raíz)"
    Write-Host "  ✓ Dependencias raíz instaladas" -ForegroundColor Green
} else {
    $errores += "✗ node_modules NO existe en raíz"
    Write-Host "  ✗ Dependencias raíz NO instaladas" -ForegroundColor Red
    Write-Host "    Solución: npm install" -ForegroundColor Yellow
}

if (Test-Path client/node_modules) {
    $ok += "✓ node_modules existe (client)"
    Write-Host "  ✓ Dependencias cliente instaladas" -ForegroundColor Green
} else {
    $errores += "✗ node_modules NO existe en client"
    Write-Host "  ✗ Dependencias cliente NO instaladas" -ForegroundColor Red
    Write-Host "    Solución: cd client && npm install" -ForegroundColor Yellow
}

# 9. Verificar espacio en disco
Write-Host "💾 Verificando espacio en disco..." -ForegroundColor Yellow
$disk = Get-PSDrive C | Select-Object Used, Free
$freeGB = [math]::Round($disk.Free / 1GB, 2)
if ($freeGB -gt 5) {
    $ok += "✓ Espacio libre: ${freeGB}GB"
    Write-Host "  ✓ Espacio disponible: ${freeGB}GB" -ForegroundColor Green
} else {
    $advertencias += "⚠ Poco espacio en disco: ${freeGB}GB"
    Write-Host "  ⚠ Poco espacio: ${freeGB}GB" -ForegroundColor DarkYellow
}

# 10. Verificar memoria RAM
Write-Host "🧠 Verificando memoria RAM..." -ForegroundColor Yellow
$os = Get-CimInstance Win32_OperatingSystem
$totalRAM = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
$freeRAM = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
$usedRAM = $totalRAM - $freeRAM
$usedPercent = [math]::Round(($usedRAM / $totalRAM) * 100, 2)

Write-Host "  → Total: ${totalRAM}GB" -ForegroundColor Cyan
Write-Host "  → Usada: ${usedRAM}GB (${usedPercent}%)" -ForegroundColor Cyan
Write-Host "  → Libre: ${freeRAM}GB" -ForegroundColor Cyan

if ($freeRAM -lt 1) {
    $errores += "✗ RAM muy baja: ${freeRAM}GB libre (mínimo 1GB recomendado)"
    Write-Host "  ✗ RAM CRÍTICA: menos de 1GB libre" -ForegroundColor Red
} elseif ($freeRAM -lt 2) {
    $advertencias += "⚠ RAM baja: ${freeRAM}GB libre"
    Write-Host "  ⚠ RAM baja (menos de 2GB libre)" -ForegroundColor DarkYellow
} else {
    $ok += "✓ RAM suficiente: ${freeRAM}GB libre"
    Write-Host "  ✓ RAM suficiente" -ForegroundColor Green
}

# RESUMEN
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                        📊 RESUMEN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($errores.Count -eq 0 -and $advertencias.Count -eq 0) {
    Write-Host "🎉 TODO ESTÁ BIEN - Sistema listo para funcionar" -ForegroundColor Green
} else {
    if ($errores.Count -gt 0) {
        Write-Host "❌ ERRORES CRÍTICOS ($($errores.Count)):" -ForegroundColor Red
        foreach ($error in $errores) {
            Write-Host "   $error" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($advertencias.Count -gt 0) {
        Write-Host "⚠️  ADVERTENCIAS ($($advertencias.Count)):" -ForegroundColor Yellow
        foreach ($adv in $advertencias) {
            Write-Host "   $adv" -ForegroundColor Yellow
        }
        Write-Host ""
    }
}

Write-Host "✅ ELEMENTOS OK ($($ok.Count)):" -ForegroundColor Green
foreach ($item in $ok) {
    Write-Host "   $item" -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# RECOMENDACIONES
Write-Host ""
Write-Host "💡 RECOMENDACIONES:" -ForegroundColor Cyan
Write-Host ""

if ($errores -match "MongoDB") {
    Write-Host "• Iniciar MongoDB:" -ForegroundColor Yellow
    Write-Host "  net start MongoDB" -ForegroundColor White
    Write-Host ""
}

if ($errores -match "node_modules") {
    Write-Host "• Instalar dependencias:" -ForegroundColor Yellow
    Write-Host "  npm run install-all" -ForegroundColor White
    Write-Host ""
}

if ($advertencias -match "Puerto 5000") {
    Write-Host "• Iniciar servidor backend:" -ForegroundColor Yellow
    Write-Host "  npm run server" -ForegroundColor White
    Write-Host ""
}

if ($advertencias -match "Puerto 3000") {
    Write-Host "• Iniciar cliente frontend:" -ForegroundColor Yellow
    Write-Host "  npm run client" -ForegroundColor White
    Write-Host ""
}

if ($errores -match "RAM muy baja" -or $advertencias -match "RAM baja") {
    Write-Host "• Liberar memoria RAM:" -ForegroundColor Yellow
    Write-Host "  - Cerrar aplicaciones innecesarias" -ForegroundColor White
    Write-Host "  - Considerar desplegar en la nube (ver GUIA_DESPLIEGUE.md)" -ForegroundColor White
    Write-Host ""
}

Write-Host "📖 Para desplegar en internet, ver: GUIA_DESPLIEGUE.md" -ForegroundColor Cyan
Write-Host ""

# Preguntar si quiere iniciar los servicios
if ($errores.Count -eq 0) {
    $respuesta = Read-Host "¿Quieres iniciar la aplicación ahora? (S/N)"
    if ($respuesta -eq 'S' -or $respuesta -eq 's') {
        Write-Host ""
        Write-Host "🚀 Iniciando aplicación..." -ForegroundColor Green
        Write-Host ""
        npm run dev
    }
}
