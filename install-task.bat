@echo off
cd /d "%~dp0"
set APP_DIR=%CD%
set NODE_EXE=C:\Program Files\nodejs\node.exe

echo ============================================
echo  App Noticias - Tarea Programada (Windows)
echo ============================================
echo.

echo [1/2] Creando tarea programada al iniciar sesion...

powershell -Command ^
  $action = New-ScheduledTaskAction -Execute '%NODE_EXE%' -Argument 'server.js' -WorkingDirectory '%APP_DIR%'; ^
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User '%USERNAME%'; ^
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable; ^
  $principal = New-ScheduledTaskPrincipal -UserId '%USERNAME%' -LogonType Interactive -RunLevel Limited; ^
  Register-ScheduledTask -TaskName 'AppNoticias' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force

if %errorlevel% neq 0 (
  echo ERROR: No se pudo crear la tarea programada.
  pause
  exit /b 1
)

echo [2/2] Iniciando la app ahora...
start "" "%NODE_EXE%" server.js

echo.
echo ============================================
echo  TAREA PROGRAMADA CREADA
echo ============================================
echo.
echo La app se iniciara automaticamente cada vez
echo que inicies sesion en Windows.
echo.
echo Para iniciarla ahora, abre:
echo   http://localhost:3000
echo.
echo Para detener la app, cierra la ventana de
echo Node.js o usa el Administrador de tareas.
echo.
echo Para desinstalar:
echo   schtasks /delete /tn AppNoticias /f
echo.
pause
