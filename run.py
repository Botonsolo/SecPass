import sys
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde el directorio raíz de la versión
load_dotenv()

# Añadir el directorio actual al path para que las capas (back, middle, front) sean visibles como paquetes
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from front.app import app

if __name__ == "__main__":
    print("--- Gestor de Contraseñas v3.0.0 ---")
    print("Arquitectura de 3 capas: Back, Middle, Front")
    print("Iniciando servidor en http://localhost:5000")
    
    # Ejecutar la aplicación
    app.run(debug=True, host='0.0.0.0', port=5000)
