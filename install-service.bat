@echo off
cd /d "%~dp0"
echo ====================================
echo  App Noticias - Instalar PM2 Service
echo ====================================
echo.

echo [1/4] Instalando PM2 globalmente...
call npm.cmd install -g pm2
if %errorlevel% neq 0 (
  echo ERROR: No se pudo instalar PM2.
  pause
  exit /b 1
)

echo [2/4] Iniciando la app con PM2...
call pm2 start server.js --name "app-noticias"
if %errorlevel% neq 0 (
  echo ERROR: No se pudo iniciar la app.
  pause
  exit /b 1
)

echo [3/4] Guardando lista de procesos...
call pm2 save
if %errorlevel% neq 0 (
  echo ERROR: No se pudo guardar la configuracion.
  pause
  exit /b 1
)

echo [4/4] Configurando inicio automatico con Windows...
call pm2 startup
echo.
echo Si el comando anterior pidio permisos de administrador,
ejecuta la linea que aparece arriba manualmente.
echo.
echo ====================================
echo  INSTALACION COMPLETADA
echo ====================================
echo.
echo La app se esta ejecutando en segundo plano.
echo Abrela en tu navegador: http://localhost:3000
echo.
echo Comandos utiles:
echo   pm2 status          - Ver estado
echo   pm2 logs app-noticias - Ver logs
echo   pm2 stop app-noticias - Detener
echo   pm2 restart app-noticias - Reiniciar
echo.
pause
