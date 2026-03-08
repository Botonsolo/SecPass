"""
Modelos de dominio para el gestor de contraseñas v2.0.

Jerarquía correcta:
    Account (Gmail)
        └─ Service (YouTube)
            └─ Credential (usuario + contraseña)
        └─ Service (Microsoft)
            └─ Credential (usuario + contraseña)
"""

from __future__ import annotations

from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4


ISO_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"


def _now_iso() -> str:
    """Devuelve timestamp actual en ISO format."""
    return datetime.utcnow().strftime(ISO_FORMAT)


@dataclass
class Credential:
    """
    Representa un usuario + contraseña para un servicio específico.
    
    Siempre pertenece a un Service (que a su vez pertenece a una Account).
    """
    id: str
    username: str  # email, usuario, etc.
    password_encrypted: str  # cifrada en base64
    created_at: str
    updated_at: str

    @classmethod
    def create(cls, username: str, password_encrypted: str) -> "Credential":
        """Crea una credencial nueva."""
        now = _now_iso()
        return cls(
            id=str(uuid4()),
            username=username,
            password_encrypted=password_encrypted,
            created_at=now,
            updated_at=now,
        )

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Credential":
        """Deserializa desde diccionario."""
        return cls(
            id=str(data["id"]),
            username=str(data["username"]),
            password_encrypted=str(data["password_encrypted"]),
            created_at=str(data["created_at"]),
            updated_at=str(data["updated_at"]),
        )

    def to_dict(self) -> Dict[str, Any]:
        """Serializa a diccionario."""
        return asdict(self)


@dataclass
class Service:
    """
    Representa un servicio (YouTube, Microsoft, etc.) asociado a una Account.
    
    Contiene una lista de Credentials (puede haber múltiples usuarios para el mismo servicio).
    """
    id: str
    name: str  # YouTube, Microsoft, etc.
    credentials: List[Credential] = field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""

    def __post_init__(self):
        """Inicializa timestamps si no existen."""
        if not self.created_at:
            self.created_at = _now_iso()
        if not self.updated_at:
            self.updated_at = _now_iso()

    @classmethod
    def create(cls, name: str) -> "Service":
        """Crea un servicio nuevo."""
        now = _now_iso()
        return cls(
            id=str(uuid4()),
            name=name,
            credentials=[],
            created_at=now,
            updated_at=now,
        )

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Service":
        """Deserializa desde diccionario."""
        credentials = [
            Credential.from_dict(cred)
            for cred in data.get("credentials", [])
        ]
        return cls(
            id=str(data["id"]),
            name=str(data["name"]),
            credentials=credentials,
            created_at=str(data.get("created_at", "")),
            updated_at=str(data.get("updated_at", "")),
        )

    def to_dict(self) -> Dict[str, Any]:
        """Serializa a diccionario."""
        return {
            "id": self.id,
            "name": self.name,
            "credentials": [cred.to_dict() for cred in self.credentials],
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    def add_credential(self, credential: Credential) -> None:
        """Añade una credencial al servicio."""
        self.credentials.append(credential)
        self.updated_at = _now_iso()


@dataclass
class Account:
    """
    Representa una cuenta principal (Gmail, Yahoo, etc.).
    
    Contiene una lista de Services, cada uno con sus Credentials.
    """
    id: str
    name: str  # Gmail, Yahoo, etc.
    services: List[Service] = field(default_factory=list)
    notes: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""

    def __post_init__(self):
        """Inicializa timestamps si no existen."""
        if not self.created_at:
            self.created_at = _now_iso()
        if not self.updated_at:
            self.updated_at = _now_iso()

    @classmethod
    def create(cls, name: str, notes: Optional[str] = None) -> "Account":
        """Crea una cuenta nueva."""
        now = _now_iso()
        return cls(
            id=str(uuid4()),
            name=name,
            services=[],
            notes=notes,
            created_at=now,
            updated_at=now,
        )

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Account":
        """Deserializa desde diccionario."""
        services = [
            Service.from_dict(svc)
            for svc in data.get("services", [])
        ]
        return cls(
            id=str(data["id"]),
            name=str(data["name"]),
            services=services,
            notes=data.get("notes"),
            created_at=str(data.get("created_at", "")),
            updated_at=str(data.get("updated_at", "")),
        )

    def to_dict(self) -> Dict[str, Any]:
        """Serializa a diccionario."""
        return {
            "id": self.id,
            "name": self.name,
            "services": [svc.to_dict() for svc in self.services],
            "notes": self.notes,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    def add_service(self, service: Service) -> None:
        """Añade un servicio a la cuenta."""
        self.services.append(service)
        self.updated_at = _now_iso()

    def get_service_by_id(self, service_id: str) -> Optional[Service]:
        """Obtiene un servicio por ID."""
        for svc in self.services:
            if svc.id == service_id:
                return svc
        return None

    def get_service_by_name(self, name: str) -> Optional[Service]:
        """Obtiene un servicio por nombre."""
        for svc in self.services:
            if svc.name.lower() == name.lower():
                return svc
        return None

    def get_credential_count(self) -> int:
        """Devuelve número total de credenciales en esta cuenta."""
        return sum(len(svc.credentials) for svc in self.services)


@dataclass
class UserProfile:
    """
    Información personal para análisis OSINT y detección de patrones.
    """
    full_name: str = ""
    birth_date: str = ""
    pets: List[str] = field(default_factory=list)
    locations: List[str] = field(default_factory=list)
    other_keywords: List[str] = field(default_factory=list)
    phone: str = ""
    job_title: str = ""
    favorite_color: str = ""
    hobbies: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserProfile":
        return cls(
            full_name=data.get("full_name", ""),
            birth_date=data.get("birth_date", ""),
            pets=data.get("pets", []),
            locations=data.get("locations", []),
            other_keywords=data.get("other_keywords", []),
            phone=data.get("phone", ""),
            job_title=data.get("job_title", ""),
            favorite_color=data.get("favorite_color", ""),
            hobbies=data.get("hobbies", [])
        )

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def serialize_accounts(accounts: List[Account], profile: Optional[UserProfile] = None) -> Dict[str, Any]:
    """
    Convierte una lista de cuentas a representación JSON serializable.
    Se usa como contenido a cifrar en la bóveda.
    """
    return {
        "version": 3,  # v3 añade el perfil de usuario para OSINT
        "accounts": [acc.to_dict() for acc in accounts],
        "user_profile": profile.to_dict() if profile else UserProfile().to_dict()
    }


def deserialize_accounts(data: Dict[str, Any]) -> Tuple[List[Account], UserProfile]:
    """
    Convierte representación JSON de cuentas a lista de objetos Account y UserProfile.
    """
    version = data.get("version", 1)
    
    if version == 1:
        return _migrate_v1_to_v2(data), UserProfile()
    
    accounts_data = data.get("accounts", [])
    accounts = [Account.from_dict(acc) for acc in accounts_data]
    
    profile_data = data.get("user_profile", {})
    profile = UserProfile.from_dict(profile_data)
    
    return accounts, profile


def _migrate_v1_to_v2(old_data: Dict[str, Any]) -> List[Account]:
    """
    Convierte bóveda antigua (v1) al nuevo formato (v2).
    
    En v1: Account con campos directos (service, username, password)
    En v2: Account con Services que contienen Credentials
    """
    accounts_by_name: Dict[str, Account] = {}
    
    for old_acc in old_data.get("accounts", []):
        service_name = old_acc.get("service", "Unknown")
        account_name = service_name
        
        if account_name not in accounts_by_name:
            account = Account.create(account_name)
            accounts_by_name[account_name] = account
        else:
            account = accounts_by_name[account_name]
        
        service = Service.create(service_name)
        
        credential = Credential.create(
            username=old_acc.get("username", ""),
            password_encrypted=old_acc.get("password_encrypted", "")
        )
        
        service.add_credential(credential)
        account.add_service(service)
    
    return list(accounts_by_name.values())


def get_all_credentials(accounts: List[Account]) -> List[tuple]:
    """
    Devuelve lista de tuplas (account, service, credential).
    Útil para búsquedas o iteraciones globales.
    """
    result = []
    for acc in accounts:
        for svc in acc.services:
            for cred in svc.credentials:
                result.append((acc, svc, cred))
    return result
