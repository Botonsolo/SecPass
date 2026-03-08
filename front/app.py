"""
Aplicación Flask para Gestor de Contraseñas v3.0.0 - Advanced Dashboard.

Frontend que delega la lógica de negocio a la capa Middle (Services)
y la persistencia a la capa Back (Data/Models).
"""

import sys
import os
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_session import Session
from functools import wraps
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Añadir el directorio raíz de la versión al path para importaciones limpias
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from middle.services import AuthService, VaultService, PasswordService
from back import storage

# Cargar variables de entorno
load_dotenv()

# ============ CONFIGURACIÓN FLASK ============

# Como app.py está en /front, templates y static están en el mismo directorio
app = Flask(__name__, 
            template_folder=os.path.join(os.path.dirname(__file__), 'templates'),
            static_folder=os.path.join(os.path.dirname(__file__), 'static'))

app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "dev-secpass-key")
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

Session(app)

# ============ DECORADORES ============

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'password' not in session:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'error': 'No autenticado'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# ============ HELPERS ============

def get_vault_service():
    """Obtiene una instancia del servicio de bóveda para el usuario actual."""
    password = session.get('password')
    if not password:
        return None
    return VaultService(password)

# ============ RUTAS DE AUTENTICACIÓN ============

@app.route('/')
def index():
    if 'password' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        password = request.form.get('password', '')
        metadata = storage.load_key_metadata()
        
        # Primera vez: inicializar
        if metadata is None:
            if len(password) < 4:
                return render_template('login.html', error='Mínimo 4 caracteres')
            if AuthService.initialize_vault(password):
                session['password'] = password
                return redirect(url_for('dashboard'))
        
        # Verificar existente
        if AuthService.verify_password(password):
            session['password'] = password
            return redirect(url_for('dashboard'))
        
        return render_template('login.html', error='Contraseña maestra incorrecta')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# ============ RUTAS WEB ============

@app.route('/dashboard')
@require_auth
def dashboard():
    vault = get_vault_service()
    data = vault.get_dashboard_data()
    return render_template('dashboard.html', version="3.1.0 PRO", **data)

@app.route('/security/audit')
@require_auth
def security_audit():
    vault = get_vault_service()
    audit_data = vault.get_dashboard_data().get('audit')
    return render_template('security_audit.html', audit=audit_data, version="3.0.0")

@app.route('/security/breach')
@require_auth
def security_breach():
    vault = get_vault_service()
    audit_data = vault.get_dashboard_data().get('audit')
    return render_template('security_breach.html', audit=audit_data, version="3.0.0")

@app.route('/security/cracking')
@require_auth
def security_cracking():
    vault = get_vault_service()
    audit_data = vault.get_dashboard_data().get('audit')
    return render_template('security_cracking.html', audit=audit_data, version="3.0.0")

@app.route('/security/reuse')
@require_auth
def security_reuse():
    vault = get_vault_service()
    audit_data = vault.get_dashboard_data().get('audit')
    return render_template('security_reuse.html', audit=audit_data, version="3.0.0")

# ============ RUTAS API - CUENTAS ============

@app.route('/api/accounts', methods=['GET'])
@require_auth
def api_get_accounts():
    vault = get_vault_service()
    return jsonify({'accounts': vault.get_accounts_summary()})

@app.route('/api/account', methods=['POST'])
@require_auth
def api_create_account():
    data = request.get_json()
    name = data.get('name', '').strip()
    notes = data.get('notes', '').strip() or None
    if not name: return jsonify({'error': 'Nombre requerido'}), 400
    
    success, result = get_vault_service().create_account(name, notes)
    if success:
        return jsonify({'id': result.id, 'name': result.name, 'message': 'Cuenta creada'}), 201
    return jsonify({'error': result}), 500

@app.route('/api/account/<account_id>', methods=['GET'])
@require_auth
def api_get_account(account_id):
    result = get_vault_service().get_account_details(account_id)
    if result: return jsonify(result)
    return jsonify({'error': 'No encontrada'}), 404

@app.route('/api/account/<account_id>', methods=['PUT'])
@require_auth
def api_update_account(account_id):
    data = request.get_json()
    if get_vault_service().update_account(account_id, data.get('name'), data.get('notes')):
        return jsonify({'message': 'Cuenta actualizada'})
    return jsonify({'error': 'Error al actualizar'}), 500

@app.route('/api/account/<account_id>', methods=['DELETE'])
@require_auth
def api_delete_account(account_id):
    if get_vault_service().delete_account(account_id):
        return jsonify({'message': 'Cuenta eliminada'})
    return jsonify({'error': 'Error al eliminar'}), 500

# ============ RUTAS API - SERVICIOS ============

@app.route('/api/account/<account_id>/service', methods=['POST'])
@require_auth
def api_create_service(account_id):
    data = request.get_json()
    success, result = get_vault_service().create_service(account_id, data.get('name', ''))
    if success:
        return jsonify({'id': result.id, 'name': result.name, 'message': 'Servicio creado'}), 201
    return jsonify({'error': result}), 500

@app.route('/api/account/<account_id>/service/<service_id>', methods=['DELETE'])
@require_auth
def api_delete_service(account_id, service_id):
    if get_vault_service().delete_service(account_id, service_id):
        return jsonify({'message': 'Servicio eliminado'})
    return jsonify({'error': 'Error'}), 500

# ============ RUTAS API - CREDENCIALES ============

@app.route('/api/account/<account_id>/service/<service_id>/credential', methods=['POST'])
@require_auth
def api_create_credential(account_id, service_id):
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'error': 'Usuario y contraseña requeridos'}), 400
    
    # Validación de fuerza previa a la creación
    strength = PasswordService.validate(password)
    if strength['score'] < 50:
        return jsonify({'error': f"Contraseña muy débil ({strength['level']})", 'strength': strength}), 400

    success, result = get_vault_service().create_credential(account_id, service_id, username, password)
    if success:
        return jsonify({'id': result.id, 'username': result.username, 'message': 'Credencial creada'}), 201
    return jsonify({'error': result}), 500

@app.route('/api/account/<account_id>/service/<service_id>/credential/<cred_id>', methods=['DELETE'])
@require_auth
def api_delete_credential(account_id, service_id, cred_id):
    if get_vault_service().delete_credential(account_id, service_id, cred_id):
        return jsonify({'message': 'Credencial eliminada'})
    return jsonify({'error': 'Error'}), 500

@app.route('/api/account/<account_id>/service/<service_id>/credential/<cred_id>', methods=['GET'])
@require_auth
def api_get_credential(account_id, service_id, cred_id):
    result = get_vault_service().get_credential_plain(account_id, service_id, cred_id)
    if result: return jsonify(result)
    return jsonify({'error': 'No encontrada'}), 404

# ============ RUTAS API - UTILIDADES ============

@app.route('/api/generate-password', methods=['POST'])
@require_auth
def api_generate_password():
    data = request.get_json() or {}
    result = PasswordService.generate(
        int(data.get('length', 16)),
        data.get('use_uppercase', True),
        data.get('use_lowercase', True),
        data.get('use_digits', True),
        data.get('use_symbols', True)
    )
    return jsonify(result)

@app.route('/api/validate-password', methods=['POST'])
@require_auth
def api_validate_password():
    data = request.get_json() or {}
    return jsonify(PasswordService.validate(data.get('password', '')))

@app.route('/api/password-audit', methods=['GET'])
@require_auth
def api_password_audit():
    vault = get_vault_service()
    return jsonify(vault.get_dashboard_data())

@app.route('/api/security-data', methods=['GET'])
@require_auth
def api_security_data():
    vault = get_vault_service()
    return jsonify(vault.get_dashboard_data())

@app.route('/api/user-profile', methods=['GET', 'POST'])
@require_auth
def api_user_profile():
    vault = get_vault_service()
    if request.method == 'GET':
        _, profile = vault._get_vault_data()
        return jsonify(profile.to_dict())
    
    data = request.get_json()
    profile_dict = {
        'full_name': data.get('full_name', ''),
        'pets': data.get('pets', []),
        'locations': data.get('locations', []),
        'other_keywords': data.get('other_keywords', []),
        'phone': data.get('phone', ''),
        'job_title': data.get('job_title', ''),
        'favorite_color': data.get('favorite_color', ''),
        'hobbies': data.get('hobbies', [])
    }
    
    if vault and vault.update_user_profile(profile_dict):
        return jsonify({'message': 'Perfil actualizado'})
    return jsonify({'error': 'Error al guardar perfil'}), 500

# ============ MANEJO DE ERRORES ============

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'No encontrado'}), 404
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Error interno'}), 500
    return render_template('500.html'), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
