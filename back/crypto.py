"""
Funciones criptográficas: derivación de claves y cifrado simétrico.

Uso principal:
- Derivar una clave segura a partir de una contraseña maestra usando PBKDF2HMAC.
- Cifrar y descifrar datos usando Fernet (cryptography.fernet).
- Gestionar un verificador cifrado para validar la contraseña maestra
  sin almacenar la contraseña en disco.
"""

from __future__ import annotations

import base64
import os
from typing import Tuple

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from . import config


def generate_salt(length: int = config.SALT_SIZE) -> bytes:
    """Genera un salt criptográficamente seguro."""
    return os.urandom(length)


def derive_key(password: str, salt: bytes, iterations: int = config.KDF_ITERATIONS) -> bytes:
    """
    Deriva una clave a partir de una contraseña y un salt usando PBKDF2HMAC.

    Devuelve una clave en formato adecuado para Fernet (base64 url-safe).
    """
    password_bytes = password.encode("utf-8")
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=iterations,
        backend=default_backend(),
    )
    key = kdf.derive(password_bytes)
    return base64.urlsafe_b64encode(key)


def create_fernet(password: str, salt: bytes, iterations: int = config.KDF_ITERATIONS) -> Fernet:
    """Crea una instancia de Fernet a partir de la contraseña y el salt."""
    key = derive_key(password, salt, iterations=iterations)
    return Fernet(key)


def encrypt_data(fernet: Fernet, data: bytes) -> bytes:
    """Cifra datos arbitrarios con Fernet."""
    return fernet.encrypt(data)


def decrypt_data(fernet: Fernet, token: bytes) -> bytes:
    """Descifra datos cifrados con Fernet."""
    return fernet.decrypt(token)


VERIFIER_PLAINTEXT = b"password-manager-verifier-v1"


def create_verifier(fernet: Fernet) -> bytes:
    """
    Crea un verificador cifrado a partir de una constante conocida.

    Este verificador se almacena en disco y se utiliza para comprobar si
    la contraseña maestra introducida es correcta.
    """
    return encrypt_data(fernet, VERIFIER_PLAINTEXT)


def verify_password(fernet: Fernet, verifier: bytes) -> bool:
    """
    Verifica la contraseña maestra intentando descifrar el verificador.

    Si la contraseña es correcta, el descifrado tendrá éxito.
    Si es incorrecta, se lanzará una excepción de Fernet.
    """
    try:
        decrypted = decrypt_data(fernet, verifier)
        return decrypted == VERIFIER_PLAINTEXT
    except InvalidToken:
        return False
