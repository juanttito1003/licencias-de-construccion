@echo off
title Sistema de Licencias de Construccion
color 0A

REM Verificar si tiene permisos de administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Ejecutando con permisos de administrador
) else (
    echo [ADVERTENCIA] Sin permisos de administrador
    echo MongoDB podria no iniciarse automaticamente
    echo.
)

echo ========================================
echo   SISTEMA DE LICENCIAS DE CONSTRUCCION
echo ========================================
echo.

echo [1/3] Iniciando MongoDB...
start "MongoDB Server" cmd /k "cd /d %~dp0 && iniciar-mongodb.bat"
timeout /t 3 >nul
echo [OK] MongoDB iniciado

echo.
echo [2/3] Iniciando Backend (puerto 5000)...
start "Backend - Puerto 5000" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 3 >nul

echo.
echo [3/3] Iniciando Frontend (puerto 3000)...
start "Frontend - Puerto 3000" cmd /k "cd /d %~dp0client && npm start"

echo.
echo ========================================
echo   SISTEMA INICIADO
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo IMPORTANTE: No cierres las ventanas que se abrieron
echo Presiona cualquier tecla para abrir el navegador...
pause >nul

start http://localhost:3000

echo.
echo El sistema esta corriendo. Puedes cerrar esta ventana.
timeout /t 5
exit
