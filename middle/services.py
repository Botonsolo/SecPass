import base64
import re
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from back import storage, crypto, models, utils

class AuthService:
    @staticmethod
    def get_fernet(master_password: str) -> Optional[Any]:
        """Obtiene instancia de Fernet usando la contraseña maestra y metadatos."""
        try:
            metadata = storage.load_key_metadata()
            if not metadata:
                return None
            return storage.create_fernet_from_metadata(master_password, metadata)
        except Exception as e:
            print(f"AuthService Error: {e}")
            return None

    @staticmethod
    def verify_password(password: str) -> bool:
        """Verifica si la contraseña maestra es correcta."""
        metadata = storage.load_key_metadata()
        if metadata is None:
            return False
        try:
            fernet = storage.create_fernet_from_metadata(password, metadata)
            return storage.verify_master_password(fernet, metadata)
        except:
            return False

    @staticmethod
    def initialize_vault(password: str) -> bool:
        """Inicializa la bóveda con una nueva contraseña maestra."""
        try:
            storage.initialize_master_password(password)
            return True
        except Exception as e:
            print(f"Error inicializando bóveda: {e}")
            return False

class VaultService:
    def __init__(self, master_password: str):
        self.master_password = master_password
        self.fernet = AuthService.get_fernet(master_password)

    def _get_vault_data(self) -> Tuple[List[models.Account], models.UserProfile]:
        if not self.fernet:
            return [], models.UserProfile()
        try:
            return storage.load_vault(self.fernet)
        except Exception as e:
            print(f"Error cargando bóveda: {e}")
            return [], models.UserProfile()

    def _save_vault_data(self, accounts: List[models.Account], profile: Optional[models.UserProfile] = None) -> bool:
        if not self.fernet:
            return False
        try:
            storage.save_vault(self.fernet, accounts, profile)
            return True
        except Exception as e:
            print(f"Error guardando bóveda: {e}")
            return False

    def get_dashboard_data(self) -> Dict[str, Any]:
        accounts, profile = self._get_vault_data()
        total_accounts = len(accounts)
        total_services = sum(len(acc.services) for acc in accounts)
        total_credentials = sum(len(svc.credentials) for acc in accounts for svc in acc.services)
        
        # Auditoría rápida
        audit = PasswordService.audit(accounts, self.fernet)
        osint = PasswordService.audit_osint(accounts, profile, self.fernet)
        
        return {
            'accounts': accounts,
            'user_profile': profile,
            'total_accounts': total_accounts,
            'total_services': total_services,
            'total_credentials': total_credentials,
            'audit': audit,
            'osint': osint
        }

    def update_user_profile(self, profile_data: Dict[str, Any]) -> bool:
        accounts, _ = self._get_vault_data()
        profile = models.UserProfile.from_dict(profile_data)
        return self._save_vault_data(accounts, profile)

    def get_accounts_summary(self) -> List[Dict[str, Any]]:
        accounts, _ = self._get_vault_data()
        return [{
            'id': acc.id,
            'name': acc.name,
            'notes': acc.notes,
            'service_count': len(acc.services),
            'credential_count': acc.get_credential_count(),
            'created_at': acc.created_at,
            'updated_at': acc.updated_at
        } for acc in accounts]

    def create_account(self, name: str, notes: Optional[str] = None) -> Tuple[bool, Any]:
        accounts, profile = self._get_vault_data()
        if any(acc.name.lower() == name.lower() for acc in accounts):
            return False, "Esta cuenta ya existe"
        
        account = models.Account.create(name, notes)
        accounts.append(account)
        if self._save_vault_data(accounts, profile):
            return True, account
        return False, "Error al guardar"

    def get_account_details(self, account_id: str) -> Optional[Dict[str, Any]]:
        accounts, _ = self._get_vault_data()
        for acc in accounts:
            if acc.id == account_id:
                services_data = []
                for svc in acc.services:
                    credentials_data = []
                    for cred in svc.credentials:
                        try:
                            encrypted_pwd = base64.b64decode(cred.password_encrypted.encode())
                            decrypted_pwd = crypto.decrypt_data(self.fernet, encrypted_pwd).decode()
                        except:
                            decrypted_pwd = None
                        
                        credentials_data.append({
                            'id': cred.id,
                            'username': cred.username,
                            'password': decrypted_pwd,
                            'created_at': cred.created_at,
                            'updated_at': cred.updated_at,
                        })
                    
                    services_data.append({
                        'id': svc.id,
                        'name': svc.name,
                        'credentials': credentials_data,
                        'created_at': svc.created_at,
                    })
                
                return {
                    'id': acc.id,
                    'name': acc.name,
                    'notes': acc.notes,
                    'services': services_data,
                    'created_at': acc.created_at,
                    'updated_at': acc.updated_at,
                }
        return None

    def update_account(self, account_id: str, name: Optional[str] = None, notes: Optional[str] = None) -> bool:
        accounts, profile = self._get_vault_data()
        for acc in accounts:
            if acc.id == account_id:
                if name: acc.name = name
                if notes is not None: acc.notes = notes
                acc.updated_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
                return self._save_vault_data(accounts, profile)
        return False

    def delete_account(self, account_id: str) -> bool:
        accounts, profile = self._get_vault_data()
        new_accounts = [acc for acc in accounts if acc.id != account_id]
        if len(new_accounts) < len(accounts):
            return self._save_vault_data(new_accounts, profile)
        return False

    def create_service(self, account_id: str, name: str) -> Tuple[bool, Any]:
        accounts, profile = self._get_vault_data()
        for acc in accounts:
            if acc.id == account_id:
                if acc.get_service_by_name(name):
                    return False, "Este servicio ya existe"
                service = models.Service.create(name)
                acc.add_service(service)
                if self._save_vault_data(accounts, profile):
                    return True, service
                return False, "Error al guardar"
        return False, "Cuenta no encontrada"

    def delete_service(self, account_id: str, service_id: str) -> bool:
        accounts, profile = self._get_vault_data()
        for acc in accounts:
            if acc.id == account_id:
                acc.services = [s for s in acc.services if s.id != service_id]
                return self._save_vault_data(accounts, profile)
        return False

    def create_credential(self, account_id: str, service_id: str, username: str, password: str) -> Tuple[bool, Any]:
        accounts, profile = self._get_vault_data()
        for acc in accounts:
            if acc.id == account_id:
                svc = acc.get_service_by_id(service_id)
                if not svc: return False, "Servicio no encontrado"
                
                encrypted_pwd = crypto.encrypt_data(self.fernet, password.encode())
                encrypted_pwd_b64 = base64.b64encode(encrypted_pwd).decode()
                
                credential = models.Credential.create(username, encrypted_pwd_b64)
                svc.add_credential(credential)
                acc.updated_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
                if self._save_vault_data(accounts, profile):
                    return True, credential
                return False, "Error al guardar"
        return False, "Cuenta no encontrada"

    def delete_credential(self, account_id: str, service_id: str, cred_id: str) -> bool:
        accounts, profile = self._get_vault_data()
        for acc in accounts:
            if acc.id == account_id:
                svc = acc.get_service_by_id(service_id)
                if not svc: return False
                svc.credentials = [c for c in svc.credentials if c.id != cred_id]
                acc.updated_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
                return self._save_vault_data(accounts, profile)
        return False

    def get_credential_plain(self, account_id: str, service_id: str, cred_id: str) -> Optional[Dict[str, Any]]:
        accounts, _ = self._get_vault_data()
        for acc in accounts:
            if acc.id == account_id:
                svc = acc.get_service_by_id(service_id)
                if not svc: return None
                cred = next((c for c in svc.credentials if c.id == cred_id), None)
                if not cred: return None
                
                try:
                    encrypted_pwd = base64.b64decode(cred.password_encrypted.encode())
                    decrypted_pwd = crypto.decrypt_data(self.fernet, encrypted_pwd).decode()
                except:
                    decrypted_pwd = "Error al descifrar"
                
                return {
                    'id': cred.id,
                    'username': cred.username,
                    'password': decrypted_pwd,
                    'service_name': svc.name
                }
        return None

class PasswordService:
    @staticmethod
    def generate(length: int, use_upper: bool, use_lower: bool, use_digits: bool, use_symbols: bool) -> Dict[str, Any]:
        password, params = utils.generate_password(length, use_upper, use_lower, use_digits, use_symbols)
        strength = utils.validate_password_strength(password)
        return {'password': password, 'parameters': params, 'strength': strength}

    @staticmethod
    def validate(password: str) -> Dict[str, Any]:
        return utils.validate_password_strength(password)

    @staticmethod
    def audit(accounts: List[models.Account], fernet: Any) -> Dict[str, Any]:
        total = 0
        secure_count = 0
        insecure_passwords = []
        full_report = []
        password_map = {} # pwd -> list of (acc, svc, user)

        for acc in accounts:
            for svc in acc.services:
                for cred in svc.credentials:
                    total += 1
                    try:
                        encrypted_pwd = base64.b64decode(cred.password_encrypted.encode())
                        pwd = crypto.decrypt_data(fernet, encrypted_pwd).decode()
                    except:
                        continue

                    if pwd not in password_map:
                        password_map[pwd] = []
                    password_map[pwd].append({
                        'account': acc.name,
                        'service': svc.name,
                        'username': cred.username
                    })

                    pwd_len = len(pwd)
                    pwd_has_upper = bool(re.search(r'[A-Z]', pwd))
                    pwd_has_lower = bool(re.search(r'[a-z]', pwd))
                    pwd_has_digit = bool(re.search(r'[0-9]', pwd))
                    pwd_has_symbol = bool(re.search(r'[^A-Za-z0-9]', pwd))

                    is_secure = (pwd_len >= 12 and pwd_has_upper and pwd_has_lower and pwd_has_digit and pwd_has_symbol)
                    crack_time = utils.calculate_cracking_time(pwd)
                    
                    full_report.append({
                        'service': svc.name,
                        'username': cred.username,
                        'password': pwd,
                        'crack_time': crack_time,
                        'is_secure': is_secure
                    })

                    if is_secure:
                        secure_count += 1
                    else:
                        insecure_passwords.append({'account': acc.name, 'service': svc.name, 'username': cred.username})

        insecure_count = total - secure_count
        
        # Criterios para el frontend
        criteria = {
            'has_12_plus': 0,
            'has_symbols': 0,
            'has_digits': 0
        }
        for item in full_report:
            pwd = item['password']
            if len(pwd) >= 12: criteria['has_12_plus'] += 1
            if re.search(r'[^A-Za-z0-9]', pwd): criteria['has_symbols'] += 1
            if re.search(r'[0-9]', pwd) and re.search(r'[A-Z]', pwd): criteria['has_digits'] += 1

        # Reutilizadas detalladas
        reused_groups = []
        for pwd, usages in password_map.items():
            if len(usages) > 1:
                reused_groups.append({
                    'password_masked': pwd[0] + "*" * (len(pwd)-2) + pwd[-1] if len(pwd) > 2 else "***",
                    'count': len(usages),
                    'usages': usages
                })

        if total == 0:
            level, message = 'empty', 'No tienes contraseñas almacenadas aún.'
        else:
            level, message = 'warning' if insecure_count <= total * 0.3 else 'danger', f'Se han detectado {insecure_count} puntos de mejora en tu seguridad.'

        return {
            'total': total, 
            'secure': secure_count, 
            'insecure': insecure_count,
            'reused': len(reused_groups), # Alias para compatibilidad
            'reused_count': len(reused_groups),
            'reused_groups': reused_groups,
            'criteria': criteria, # Nuevo objeto para el dashboard
            'level': level, 
            'message': message, 
            'insecure_list': insecure_passwords[:10],
            'full_report': full_report
        }

    @staticmethod
    def audit_osint(accounts: List[models.Account], profile: models.UserProfile, fernet: Any) -> Dict[str, Any]:
        """Analiza contraseñas buscando patrones personales."""
        patterns = []
        if profile.full_name:
            # Dividir nombres y apellidos
            patterns.extend(re.split(r'\s+', profile.full_name.lower()))
        
        patterns.extend([p.lower() for p in profile.pets])
        patterns.extend([l.lower() for l in profile.locations])
        patterns.extend([k.lower() for k in profile.other_keywords])
        if profile.phone: patterns.append(profile.phone)
        if profile.job_title: patterns.append(profile.job_title.lower())
        if profile.favorite_color: patterns.append(profile.favorite_color.lower())
        patterns.extend([h.lower() for h in profile.hobbies])
        
        # Eliminar duplicados y cortos
        patterns = list(set(p for p in patterns if len(p) > 2))
        
        findings = []
        for acc in accounts:
            for svc in acc.services:
                for cred in svc.credentials:
                    try:
                        encrypted_pwd = base64.b64decode(cred.password_encrypted.encode())
                        pwd = crypto.decrypt_data(fernet, encrypted_pwd).decode().lower()
                    except:
                        continue
                    
                    matched = [p for p in patterns if p in pwd]
                    if matched:
                        findings.append({
                            'account': acc.name,
                            'service': svc.name,
                            'username': cred.username,
                            'patterns': matched
                        })
        
        return {
            'findings': findings,
            'pattern_count': len(patterns),
            'score': max(0, 100 - len(findings) * 10)
        }
