# 🔐 SecPass

<img width="1907" height="846" alt="image" src="https://github.com/user-attachments/assets/ff33cf06-383f-4a7f-90a5-82a216df28de" />

**SecPass** es un gestor de contraseñas diseñado con un enfoque centrado en la seguridad, la simplicidad y la evolución hacia una arquitectura preparada para producción.

El proyecto nace con el objetivo de proporcionar un entorno seguro para la gestión de credenciales, aplicando principios de desarrollo seguro desde las primeras fases de diseño y sirviendo al mismo tiempo como plataforma de aprendizaje en ciberseguridad, criptografía aplicada y desarrollo de sistemas.

---

## 🎯 Objetivos

* Almacenar credenciales de forma segura.
* Reducir el riesgo asociado a la reutilización de contraseñas.
* Aplicar principios de seguridad por diseño.
* Desarrollar una arquitectura escalable y mantenible.
* Evolucionar progresivamente hacia un modelo cliente-servidor.

---

## ✨ Características

### Gestión de credenciales

* Almacenamiento centralizado de contraseñas.
* Organización de credenciales por servicios.
* Consulta rápida de registros almacenados.
* Eliminación segura de entradas.

  

### Seguridad

* Protección de información sensible.
* Minimización de exposición de datos.
* Validación de entradas.
* Gestión controlada de secretos.
* Diseño orientado a reducir la superficie de ataque.


### Usabilidad

* Interfaz sencilla y directa.
* Flujo de trabajo intuitivo.
* Acceso rápido a credenciales almacenadas.

---

## 🏗️ Arquitectura

Actualmente SecPass está concebido como una aplicación local, con una evolución planificada hacia una arquitectura más robusta orientada a servicios.

```text
┌─────────────────┐
│     Usuario     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     SecPass     │
│  Aplicación UI  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Almacenamiento  │
│   Credenciales  │
└─────────────────┘
```

Arquitectura futura:

```text
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API SecPass │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Base Datos  │
└─────────────┘
```

---

## 🛡️ Principios de Seguridad

SecPass sigue una filosofía basada en:

### Mínimo privilegio

Cada componente debe disponer únicamente de los permisos estrictamente necesarios para realizar su función.

### Reducción de superficie de ataque

Se evita incorporar funcionalidades innecesarias que aumenten la complejidad o el riesgo.

### Validación de entradas

Toda entrada de usuario debe considerarse potencialmente maliciosa hasta ser validada.

### Defensa en profundidad

La seguridad no depende de un único mecanismo, sino de múltiples capas complementarias.

### Diseño orientado a amenazas

Antes de implementar nuevas funcionalidades se analizan posibles vectores de ataque y riesgos asociados.

---

## 🚀 Instalación

```bash
git clone https://github.com/usuario/secpass.git

cd secpass
```

Instala las dependencias necesarias:

```bash
pip install -r requirements.txt
```

Ejecuta la aplicación:

```bash
python main.py
```

---

## 📂 Estructura del Proyecto

```text
secpass/
│
├── main.py
├── requirements.txt
├── README.md
│
├── src/
│   ├── core/
│   ├── storage/
│   ├── security/
│   └── ui/
│
├── tests/
│
└── docs/
```

---

## 🗺️ Roadmap

### v1.0.0

* Gestión básica de credenciales.
* Interfaz funcional.
* Persistencia de datos.

### v1.1.0

* Visualización controlada de contraseñas.
* Mejoras de experiencia de usuario.
* Optimización del almacenamiento.

### v1.2.0

* Evaluación de fortaleza de contraseñas.
* Recomendaciones de seguridad.

### v1.3.0

* Integración con Have I Been Pwned.
* Verificación de credenciales filtradas.

### v2.0.0

* Arquitectura cliente-servidor.
* API dedicada.
* Gestión multiusuario.
* Preparación para despliegues en producción.

---

## 🔬 Objetivos de Aprendizaje

Este proyecto permite profundizar en:

* Desarrollo seguro.
* Gestión de credenciales.
* Arquitecturas de aplicaciones.
* Seguridad ofensiva y defensiva.
* Gestión de secretos.
* Hardening de aplicaciones.
* Buenas prácticas de ingeniería de software.

---

## ⚠️ Aviso

SecPass se encuentra en desarrollo activo. Antes de utilizarlo para almacenar información crítica en entornos reales, se recomienda realizar auditorías de seguridad, pruebas de penetración y revisiones completas del código.

---

## 📜 Licencia

Este proyecto se distribuye bajo la licencia que el propietario considere adecuada para su uso y distribución.
