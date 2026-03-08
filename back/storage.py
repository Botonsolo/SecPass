"""
Almacenamiento cifrado y gestión de archivos.

Responsabilidades:
- Gestionar el archivo de metadatos de clave (salt, iteraciones, verificador).
- Leer y escribir la bóveda cifrada que contiene las cuentas.
- Exportar copias de seguridad cifradas de la bóveda.
"""

from __future__ import annotations

import base64
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from cryptography.fernet import Fernet, InvalidToken

from . import config, crypto, models


def _read_json(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        # Archivo corrupto o ilegible
        raise RuntimeError(f"El archivo de configuración está corrupto: {path}")


def _write_json(path: Path, data: Dict[str, Any]) -> None:
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with tmp_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp_path.replace(path)


def load_key_metadata() -> Optional[Dict[str, Any]]:
    """
    Carga los metadatos de la clave (salt, iteraciones, verificador).

    Devuelve None si es la primera vez (archivo no existe).
    """
    meta_path = config.get_metadata_path()
    if not meta_path.exists():
        return None
    return _read_json(meta_path)


def initialize_master_password(password: str) -> Tuple[Fernet, Dict[str, Any]]:
    """
    Inicializa la contraseña maestra y crea el archivo de metadatos.

    Devuelve la instancia de Fernet y los metadatos generados.
    """
    salt = crypto.generate_salt()
    fernet = crypto.create_fernet(password, salt)
    verifier = crypto.create_verifier(fernet)

    metadata = {
        "version": 1,
        "salt": base64.b64encode(salt).decode("ascii"),
        "iterations": config.KDF_ITERATIONS,
        "verifier": base64.b64encode(verifier).decode("ascii"),
    }

    _write_json(config.get_metadata_path(), metadata)
    return fernet, metadata


def create_fernet_from_metadata(password: str, metadata: Dict[str, Any]) -> Fernet:
    """Crea una instancia de Fernet a partir de la contraseña y los metadatos almacenados."""
    try:
        salt_b64 = metadata["salt"]
        iterations = int(metadata.get("iterations", config.KDF_ITERATIONS))
        salt = base64.b64decode(salt_b64.encode("ascii"))
    except Exception as exc:
        raise RuntimeError("Metadatos de clave inválidos o corruptos.") from exc

    return crypto.create_fernet(password, salt, iterations=iterations)


def verify_master_password(fernet: Fernet, metadata: Dict[str, Any]) -> bool:
    """Verifica la contraseña maestra usando el verificador almacenado."""
    try:
        verifier_b64 = metadata["verifier"]
        verifier = base64.b64decode(verifier_b64.encode("ascii"))
    except Exception as exc:
        raise RuntimeError("Metadatos de verificador inválidos o corruptos.") from exc

    return crypto.verify_password(fernet, verifier)


def load_vault(fernet: Fernet) -> Tuple[List[models.Account], models.UserProfile]:
    """
    Carga y descifra la bóveda.

    Si no existe, devuelve una lista vacía y un perfil por defecto.
    """
    vault_path = config.get_vault_path()
    if not vault_path.exists():
        return [], models.UserProfile()

    try:
        data_encrypted = vault_path.read_bytes()
    except OSError as exc:
        raise RuntimeError(f"No se pudo leer la bóveda: {vault_path}") from exc

    try:
        data_json = crypto.decrypt_data(fernet, data_encrypted).decode("utf-8")
        parsed = json.loads(data_json)
    except (InvalidToken, json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise RuntimeError("La bóveda está corrupta o la clave es incorrecta.") from exc

    return models.deserialize_accounts(parsed)


def save_vault(fernet: Fernet, accounts: List[models.Account], profile: Optional[models.UserProfile] = None) -> None:
    """Serializa, cifra y persiste la bóveda."""
    vault_path = config.get_vault_path()
    payload = models.serialize_accounts(accounts, profile)
    data_json = json.dumps(payload, ensure_ascii=False, indent=2)
    data_encrypted = crypto.encrypt_data(fernet, data_json.encode("utf-8"))

    tmp_path = vault_path.with_suffix(vault_path.suffix + ".tmp")
    tmp_path.write_bytes(data_encrypted)
    tmp_path.replace(vault_path)


def export_encrypted_backup() -> Path:
    """
    Exporta una copia de seguridad cifrada de la bóveda y los metadatos.

    La copia se guarda como un archivo .zip en el directorio de copias de
    seguridad configurado.
    """
    backup_dir = config.get_backup_dir()
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    temp_folder = backup_dir / f"backup-{timestamp}"
    temp_folder.mkdir(parents=True, exist_ok=True)

    meta_path = config.get_metadata_path()
    vault_path = config.get_vault_path()

    if meta_path.exists():
        shutil.copy2(meta_path, temp_folder / meta_path.name)
    if vault_path.exists():
        shutil.copy2(vault_path, temp_folder / vault_path.name)

    archive_base = str(backup_dir / f"backup-{timestamp}")
    archive_path = shutil.make_archive(archive_base, "zip", root_dir=temp_folder)

    return Path(archive_path)
