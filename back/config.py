"""
Configuración y constantes dependientes del sistema operativo.

Este módulo centraliza rutas y parámetros de seguridad para asegurar
un comportamiento consistente entre Linux y Windows.
"""

from __future__ import annotations

import os
import platform
from pathlib import Path


APP_NAME = "password_manager"

# Parámetros de seguridad
KDF_ITERATIONS: int = 200_000
SALT_SIZE: int = 16

# Bloqueo por intentos fallidos
MAX_FAILED_ATTEMPTS: int = 5
LOCKOUT_SECONDS: int = 60  # 1 minuto; ajustar según necesidad


def get_data_dir() -> Path:
    """
    Devuelve el directorio de datos específico según el sistema operativo.

    - Linux: ~/.local/share/<APP_NAME>/
    - Windows: %APPDATA%\\<APP_NAME>\\
    """
    system = platform.system().lower()

    if system == "windows":
        appdata = os.getenv("APPDATA")
        if not appdata:
            # Fallback razonable si APPDATA no está definido
            base = Path.home() / "AppData" / "Roaming"
        else:
            base = Path(appdata)
    else:
        # Asumimos estándar freedesktop para Linux-like
        base = Path(os.getenv("XDG_DATA_HOME", Path.home() / ".local" / "share"))

    data_dir = base / APP_NAME
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def get_metadata_path() -> Path:
    """Ruta al archivo de metadatos de clave (no cifrado)."""
    return get_data_dir() / "key_metadata.json"


def get_vault_path() -> Path:
    """Ruta al archivo de bóveda cifrada (JSON cifrado)."""
    return get_data_dir() / "vault.bin"


def get_backup_dir() -> Path:
    """Directorio para copias de seguridad cifradas."""
    backup_dir = get_data_dir() / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    return backup_dir
