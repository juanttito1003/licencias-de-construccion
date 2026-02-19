@echo off
title MongoDB Server
color 0A

echo ========================================
echo   INICIANDO MONGODB
echo ========================================
echo.

cd /d "%~dp0"

:: Crear carpeta para datos si no existe
if not exist "mongodb-data" mkdir mongodb-data

echo Iniciando MongoDB en puerto 27017...
echo.
echo IMPORTANTE: NO CIERRES ESTA VENTANA
echo.

"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath="%~dp0mongodb-data" --port=27017

pause
