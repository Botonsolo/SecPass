# Análisis de Funciones de Seguridad (v3.1)

Este documento detalla el funcionamiento interno de los cuatro módulos de seguridad integrados en el Gestor de Contraseñas.

## 1. Auditoría de Complejidad
**Sobre qué actúa**: Actúa sobre la entropía individual de cada contraseña.
**Funcionamiento**:
- El sistema utiliza un algoritmo de validación basado en los estándares del **NIST** y el **SANS Institute**.
- Se evalúa la "fuerza" mediante el cálculo de la entropía de Shannon ($log2$ del espacio de búsqueda).
- No solo busca caracteres especiales, sino que detecta **patrones predecibles** (secuencias de teclado, fechas common, palabras de diccionario).
- **Resultado**: Clasifica la contraseña en niveles (Muy Débil a Muy Fuerte) y genera una lista de "Contraseñas a Rotar" si no superan el umbral de seguridad.

## 2. Monitor de Brechas (HIBP)
**Sobre qué actúa**: Actúa sobre la integridad de las credenciales frente a filtraciones externas dinámicas.
**Funcionamiento**:
- Implementa un modelo de **k-anonymity** para preservar la privacidad total.
- El navegador genera el hash **SHA-1** de tu contraseña.
- Solo los **primeros 5 caracteres** del hash se envían a la API de *Have I Been Pwned*.
- La API devuelve miles de hashes que comparten ese prefijo.
- El sistema compara localmente el resto del hash para confirmar si hay una coincidencia exacta sin que la contraseña real haya salido nunca de tu equipo.

## 3. Simulación de Fuerza Bruta
**Sobre qué actúa**: Actúa sobre el tiempo de resistencia teórica frente a ataques de descifrado offline.
**Funcionamiento**:
- Estima el tiempo necesario para romper la contraseña utilizando hardware moderno (GPUs de última generación capaces de procesar miles de millones de hashes por segundo).
- Considera el set de caracteres utilizado (Minúsculas, Mayúsculas, Números, Símbolos).
- **Propósito**: Ayuda al usuario a visualizar por qué la longitud es más importante que la complejidad extraña (entropía combinatoria).

## 4. Detección de Reutilización
**Sobre qué actúa**: Actúa sobre los patrones de duplicidad en toda la bóveda.
**Funcionamiento**:
- Realiza una comparación cruzada de los hashes de todas las contraseñas guardadas bajo el mismo usuario principal.
- Identifica si la misma clave (o variaciones mínimas) se está usando en múltiples servicios (ej. usar la misma clave para Gmail y el Banco).
- **Riesgo**: Mitiga el "efecto dominó" donde una sola filtración compromete toda la identidad digital del usuario.
