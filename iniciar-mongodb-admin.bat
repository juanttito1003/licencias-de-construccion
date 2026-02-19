@echo off
:: Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :admin
) else (
    echo.
    echo ERROR: Este script necesita permisos de administrador
    echo.
    echo SOLUCION: Haz click derecho en "iniciar-mongodb-admin.vbs"
    echo           y selecciona "Abrir"
    echo.
    echo O haz click derecho en este archivo y "Ejecutar como administrador"
    echo.
    pause
    exit
)

:admin
title Sistema de Licencias - ADMIN
color 0A

echo ========================================
echo   INICIANDO MONGODB CON PERMISOS ADMIN
echo ========================================
echo.

echo [1/1] Iniciando MongoDB...
net start MongoDB
if %errorlevel% == 0 (
    echo [OK] MongoDB iniciado correctamente
    timeout /t 2
) else (
    echo [ERROR] No se pudo iniciar MongoDB
    echo.
    echo Posibles causas:
    echo - MongoDB no esta instalado
    echo - El servicio no existe
    echo - Ya esta corriendo
    echo.
    sc query MongoDB
    echo.
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo.
echo Ahora ejecuta iniciar-sistema.bat normalmente
timeout /t 3
exit
