@echo off
REM Script de inicio para Windows

echo.
echo ============================================
echo  Gestor de Contraseñas v2.0.0 - Web
echo ============================================
echo.

echo Verificando Python...
python --version >nul 2>&1 || (
    echo Error: Python no encontrado
    pause
    exit /b 1
)

echo.
echo Creando entorno virtual (opcional)...
if not exist "venv" (
    python -m venv venv
    echo Entorno virtual creado
)

echo.
echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo.
echo Instalando dependencias...
pip install -q -r requirements.txt

echo.
echo ============================================
echo  Iniciando aplicación...
echo ============================================
echo.
echo Accede a: http://localhost:5000
echo Presiona CTRL+C para detener
echo.

python app.py
pause
