#!/bin/bash
# Script de inicio para Linux/Mac

cd "$(dirname "$0")"

echo "🔐 Gestor de Contraseñas v2.0.0 - Web"
echo "======================================"
echo ""
echo "Verificando Python..."
python3 --version || {
    echo "❌ Python 3 no encontrado"
    exit 1
}

echo ""
echo "Creando entorno virtual (opcional)..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Entorno virtual creado"
fi

echo ""
echo "Activando entorno virtual..."
source venv/bin/activate

echo ""
echo "Instalando dependencias..."
pip install -q -r requirements.txt

echo ""
echo "======================================"
echo "🚀 Iniciando aplicación..."
echo "======================================"
echo ""
echo "📍 Accede a: http://localhost:5000"
echo "🛑 Presiona CTRL+C para detener"
echo ""

python app.py
