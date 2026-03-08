#!/usr/bin/env python3
"""Script para pre-configurar contraseña maestra."""

import sys
import os
import json
import base64

# Añadir ruta del proyecto
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from password_manager import crypto

def main():
    # Crear directorio de datos
    data_dir = os.path.expandvars(r'%APPDATA%\password_manager')
    os.makedirs(data_dir, exist_ok=True)
    
    # Configurar contraseña
    password = "pelao"
    salt = crypto.generate_salt()
    fernet = crypto.create_fernet(password, salt)
    verifier = crypto.create_verifier(fernet)
    
    # Crear metadatos
    metadata = {
        "version": 1,
        "salt": base64.b64encode(salt).decode("ascii"),
        "iterations": 200000,
        "verifier": base64.b64encode(verifier).decode("ascii"),
    }
    
    # Guardar
    meta_file = os.path.join(data_dir, 'key_metadata.json')
    with open(meta_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    
    # Eliminar bóveda antigua (ya no es descifrable con nueva clave)
    vault_file = os.path.join(data_dir, 'vault.json')
    if os.path.exists(vault_file):
        os.remove(vault_file)
        print("⚠️  Bóveda antigua eliminada (incompatible con nueva clave)")
    
    print("✅ Contraseña maestra configurada: pelao")
    print(f"✅ Archivo guardado: {meta_file}")

if __name__ == '__main__':
    main()
