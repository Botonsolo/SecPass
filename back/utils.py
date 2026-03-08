"""
Utilidades generales para entrada/salida y generación de contraseñas.
"""

from __future__ import annotations

import secrets
import string
import re
from typing import Optional, Tuple


def generate_password(
    length: int = 16,
    use_uppercase: bool = True,
    use_lowercase: bool = True,
    use_digits: bool = True,
    use_symbols: bool = True,
) -> Tuple[str, dict]:
    """
    Genera una contraseña segura usando `secrets`.

    Asegura que, si se selecciona un conjunto de caracteres, al menos
    uno de ellos aparece en la contraseña generada.
    
    Args:
        length: Longitud de la contraseña (mínimo 4)
        use_uppercase: Incluir mayúsculas
        use_lowercase: Incluir minúsculas
        use_digits: Incluir números
        use_symbols: Incluir símbolos
    
    Returns:
        Tupla (contraseña, dict_parámetros_usados)
    """
    if length < 4:
        raise ValueError("La longitud mínima recomendada es 4 caracteres.")

    char_sets = []
    if use_uppercase:
        char_sets.append(string.ascii_uppercase)
    if use_lowercase:
        char_sets.append(string.ascii_lowercase)
    if use_digits:
        char_sets.append(string.digits)
    if use_symbols:
        symbols = "!@#$%^&*()-_=+[]{};:,.?/\\|"
        char_sets.append(symbols)

    if not char_sets:
        raise ValueError("Debe seleccionar al menos un tipo de carácter.")

    password_chars = [secrets.choice(cs) for cs in char_sets]
    all_chars = "".join(char_sets)
    
    while len(password_chars) < length:
        password_chars.append(secrets.choice(all_chars))

    secrets.SystemRandom().shuffle(password_chars)
    password = "".join(password_chars)
    
    # Devolver contraseña + parámetros usados
    params = {
        "length": length,
        "use_uppercase": use_uppercase,
        "use_lowercase": use_lowercase,
        "use_digits": use_digits,
        "use_symbols": use_symbols,
    }
    
    return password, params


def validate_password_strength(password: str) -> dict:
    """
    Valida y analiza la fortaleza de una contraseña.
    
    Returns:
        Dict con:
        - score: 0-100
        - level: "muy débil" | "débil" | "moderada" | "fuerte" | "muy fuerte"
        - issues: lista de problemas encontrados
        - requirements_met: dict de requisitos cumplidos
    """
    issues = []
    requirements = {
        "length_min_12": len(password) >= 12,
        "uppercase": bool(re.search(r'[A-Z]', password)),
        "lowercase": bool(re.search(r'[a-z]', password)),
        "digits": bool(re.search(r'\d', password)),
        "symbols": bool(re.search(r'[!@#$%^&*\-_=+\[\]{};:,.?/\\|]', password)),
    }
    
    # Identificar problemas
    if len(password) < 8:
        issues.append("Demasiado corta (mínimo 8)")
    if len(password) < 12:
        issues.append("Podría ser más larga (recomendado 12+)")
    
    if not requirements["uppercase"]:
        issues.append("Sin mayúsculas")
    if not requirements["lowercase"]:
        issues.append("Sin minúsculas")
    if not requirements["digits"]:
        issues.append("Sin números")
    if not requirements["symbols"]:
        issues.append("Sin símbolos especiales")
    
    # Calcular score
    score = 0
    if len(password) >= 8:
        score += 20
    if len(password) >= 12:
        score += 10
    if len(password) >= 16:
        score += 10
    
    score += sum(20 for v in [
        requirements["uppercase"],
        requirements["lowercase"],
        requirements["digits"],
        requirements["symbols"]
    ] if v)
    
    # Determinar nivel
    if score >= 90:
        level = "muy fuerte"
    elif score >= 70:
        level = "fuerte"
    elif score >= 50:
        level = "moderada"
    elif score >= 25:
        level = "débil"
    else:
        level = "muy débil"
    
    return {
        "score": min(100, score),
        "level": level,
        "issues": issues,
        "requirements_met": requirements,
    }


def calculate_cracking_time(password: str) -> str:
    """
    Calcula el tiempo estimado de descifrado (fuerza bruta offline).
    Basado en una RTX 4090 (~2.5 TH/s).
    """
    if not password:
        return "0 segundos"
    
    length = len(password)
    pool_size = 0
    if re.search(r'[a-z]', password): pool_size += 26
    if re.search(r'[A-Z]', password): pool_size += 26
    if re.search(r'[0-9]', password): pool_size += 10
    if re.search(r'[^a-zA-Z0-9]', password): pool_size += 32
    
    # Entropía (combinaciones posibles)
    combinations = pool_size ** length
    
    # Hash rate RTX 4090: 2,500,000,000,000 hashes por segundo
    hashes_per_second = 2_500_000_000_000
    
    seconds = combinations / hashes_per_second
    
    if seconds < 1:
        return "Instantáneo"
    elif seconds < 60:
        return f"{int(seconds)} segundos"
    elif seconds < 3600:
        return f"{int(seconds / 60)} minutos"
    elif seconds < 86400:
        return f"{int(seconds / 3600)} horas"
    elif seconds < 31536000:
        return f"{int(seconds / 86400)} días"
    elif seconds < 31536000 * 100:
        return f"{int(seconds / 31536000)} años"
    elif seconds < 31536000 * 10000:
        return f"{int(seconds / (31536000 * 100))} siglos"
    else:
        return "+10,000 siglos"
