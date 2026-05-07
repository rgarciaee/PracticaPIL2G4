# Documentación Completa de Controller.py

## Estructura General del Controller

El `controller.py` es el responsable de:
- Definir todas las rutas API REST
- Gestionar autenticación y sesiones
- Orquestar llamadas al modelo
- Retornar respuestas JSON al frontend

---

## 1. INICIALIZACIÓN Y VARIABLES GLOBALES

```python
app = APIRouter()                    # Router de FastAPI para agrupar rutas
TOKEN_CLOCK_SKEW_SECONDS = 60       # Tolerancia temporal para validar tokens
sessions = {}                        # Diccionario para almacenar sesiones en memoria
myviewcomponent = View()             # Instancia del gestor de vistas
mymodelcomponent = Model()           # Instancia del modelo de lógica de negocio
_YAML_DATA_PATH = Path(...)         # Ruta al archivo YAML con noticias
```

### CÓMO MODIFICAR:
- Para agregar más tiempo de sesión: Aumentar `TOKEN_CLOCK_SKEW_SECONDS`
- Para usar BD para sesiones: Cambiar `sessions = {}` a una instancia de DAO

---

## 2. FUNCIONES AUXILIARES

### 2.1 `build_global_stats_payload(events)`
**Propósito:** Calcula estadísticas globales del festival

**Cálculos:**
- total_eventos: Cantidad de eventos
- total_artistas: Suma de artistas en todos los eventos
- total_asistentes: Suma del aforo máximo de todas las zonas de tipo "ticket"

**CÓMO MODIFICAR:**
```python
# Agregar estadística de ingresos proyectados
def build_global_stats_payload(events):
    total_ingresos = 0
    for event in events:
        for zona in event.get("zonas", []):
            if zona.get("tipo") == "ticket":
                total_ingresos += (zona.get("precio", 0) * 
                                 zona.get("aforo_maximo", 0))
    # ... resto del código
    return {
        # ... estadísticas existentes
        "ingresos_proyectados": total_ingresos
    }
```

### 2.2 `load_home_news()`
**Propósito:** Lee noticias del archivo YAML data.yaml

**CÓMO MODIFICAR:**
```python
# Para obtener noticias de una API externa
def load_home_news():
    try:
        import requests
        response = requests.get("https://api.tudominio.com/news")
        return response.json().get("news", [])
    except:
        return []
```

### 2.3 `create_user_in_firestore()`
**Propósito:** Crea usuario nuevo o actualiza existente en dos colecciones

**Flujo:**
1. Obtiene datos de usuario y perfil
2. Verifica si el usuario ya existe
3. Preserva rol existente si lo hay
4. Crea/actualiza documento en 'users'
5. Crea/actualiza documento en 'users_extended'

**CÓMO MODIFICAR:**
```python
# Agregar validaciones de email
def create_user_in_firestore(user_id, email, ...):
    # Validar formato de email
    if not "@" in email:
        return False
    
    # Validar DNI con algoritmo
    if dni and not validate_spanish_dni(dni):
        return False
    # ... resto del código
```

### 2.4 Funciones de Utilidad de Sesión

```python
def get_current_session(request):
    # Obtiene sesión del cookie
    # Retorna: (session_id, session_data)

def require_auth(request):
    # Valida que usuario esté autenticado
    # Retorna: (session_id, session_data, error_response)

def require_admin(request):
    # Valida que usuario sea admin
    # Retorna: (session_id, session_data, error_response)
```

**CÓMO MODIFICAR:**
```python
def require_provider(request):
    """Nuevo: Requiere que usuario sea proveedor"""
    session_id, session_data, error = require_auth(request)
    if error:
        return None, None, error
    
    if str(session_data.get("role", "")).strip().lower() != "provider":
        return None, None, auth_error_response("Acceso restringido a proveedores", 403)
    
    return session_id, session_data, None
```

---

## 3. RUTAS PÚBLICAS

### 3.1 `GET /` → Redirect a /app
```python
# Simplemente redirige a la aplicación principal
```

### 3.2 `GET /app` → Carga la SPA
```python
# Retorna template index.html con configuración de Firebase
# No requiere autenticación
```

### 3.3 `GET /login` → Página de login
```python
# Retorna template login.html
# Contiene formularios de email/password y Google Login
```

**CÓMO MODIFICAR:**
```python
# Agregar nueva ruta pública para registro
@app.get("/register")
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})
```

---

## 4. RUTAS DE AUTENTICACIÓN

### 4.1 `POST /login`
**Flujo:**
1. Verifica token con Firebase Auth
2. Extrae UID, email y datos de perfil
3. Crea usuario en Firestore si no existe
4. Crea sesión en memoria
5. Establece cookie segura
6. Retorna rol y avatar

**CÓMO MODIFICAR:**
```python
# Para agregar segundo factor de autenticación (2FA)
@app.post("/login")
async def login(data: dict, response: Response, provider: str):
    # ... validaciones existentes ...
    
    # Generar código 2FA
    code_2fa = generate_2fa_code()
    save_2fa_code_to_cache(user_id, code_2fa)
    
    return {
        "success": True,
        "requires_2fa": True,
        "session_temp_id": user_id
    }
```

### 4.2 `POST /login-credentials` y `POST /login-google`
**Propósito:** Wrappers para login() con diferentes providers

### 4.3 `POST /logout`
**Propósito:** Cierra sesión eliminando cookie y entrada en sessions{}

**CÓMO MODIFICAR:**
```python
# Agregar logging de auditoría
@app.post("/logout")
async def logout(request: Request, response: Response):
    session_id = request.cookies.get("session_id")
    if session_id in sessions:
        # Log: Usuario X cerró sesión a las Y
        log_audit_event("logout", session_id, datetime.now())
        del sessions[session_id]
    
    response.delete_cookie("session_id")
    return {"success": True}
```

---

## 5. RUTAS API DE EVENTOS (PÚBLICAS)

### 5.1 `GET /api/events`
**Propósito:** Obtiene todos los eventos con datos enriquecidos
**Retorna:** Array JSON con eventos, artistas, zonas, puestos

**CÓMO MODIFICAR:**
```python
# Agregar paginación
@app.get("/api/events")
async def get_events(skip: int = 0, limit: int = 10):
    try:
        events = json.loads(mymodelcomponent.get_all_events())
        # Paginar
        paginated = events[skip:skip+limit]
        return {
            "success": True,
            "data": paginated,
            "total": len(events),
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
```

### 5.2 `GET /api/home`
**Propósito:** Datos completos para página de inicio en una sola llamada
**Retorna:** eventos, estadísticas, noticias

### 5.3 `GET /api/events/{event_id}`
**Propósito:** Detalles completos de un evento específico

### 5.4 `GET /api/stats`
**Propósito:** Estadísticas globales del festival

---

## 6. RUTAS DE PERFIL (REQUIEREN AUTENTICACIÓN)

### 6.1 `GET /api/profile`
**Propósito:** Obtiene perfil completo del usuario autenticado
**Retorna:** Datos personales, rol, avatar, estado de perfil

### 6.2 `GET /api/profile/completion`
**Propósito:** Verifica qué campos faltan para completar perfil
**Retorna:** { complete: bool, missing_fields: [] }

### 6.3 `PUT /api/profile`
**Propósito:** Actualiza datos del perfil
**Body:** { nombre_apellidos, dni, telefono, direccion, ... }

**CÓMO MODIFICAR:**
```python
# Agregar validaciones de datos
@app.put("/api/profile")
async def update_profile(request: Request, profile_data: dict):
    # Validar DNI
    if profile_data.get("dni"):
        if not validate_spanish_dni(profile_data["dni"]):
            return {"success": False, "error": "DNI inválido"}
    
    # Validar email
    if profile_data.get("email"):
        if not validate_email(profile_data["email"]):
            return {"success": False, "error": "Email inválido"}
    
    # ... resto del código
```

---

## 7. RUTAS DE COMPRA (REQUIEREN AUTENTICACIÓN)

### 7.1 `POST /api/checkout`
**OPERACIÓN CRÍTICA**

**Validaciones previas:**
- Usuario autenticado ✓
- Perfil completo ✓
- Items válidos ✓

**Proceso:**
1. Valida que perfil esté completo
2. Llama a model.process_purchase()
3. Retorna tickets con códigos QR

**CÓMO MODIFICAR:**
```python
# Integrar con Stripe
@app.post("/api/checkout")
async def checkout(request: Request, purchase_data: dict):
    # ... validaciones ...
    
    # Crear pago en Stripe
    stripe_payment = create_stripe_payment(
        amount=total,
        customer_id=session_id,
        items=items
    )
    
    if stripe_payment["status"] != "succeeded":
        return {"success": False, "error": "Pago fallido"}
    
    # Procesar compra
    result = mymodelcomponent.process_purchase(session_id, items, total)
    # Guardar referencia de Stripe
    result["stripe_payment_id"] = stripe_payment["id"]
    return result
```

---

## 8. RUTAS DE HISTORIAL (REQUIEREN AUTENTICACIÓN)

### 8.1 `GET /api/history`
**Propósito:** Obtiene historial de compras del usuario
**Retorna:** Array de tickets/alquileres realizados

**CÓMO MODIFICAR:**
```python
# Agregar filtros y búsqueda
@app.get("/api/history")
async def get_history(request: Request, 
                     from_date: str = None, 
                     to_date: str = None,
                     status: str = None):
    # Filtrar por rango de fechas
    # Filtrar por estado (usado, cancelado, etc)
```

---

## 9. RUTAS DE ZONAS (PÚBLICAS)

### 9.1 `GET /api/zones`
**Propósito:** Obtiene todas las zonas disponibles
**Retorna:** Array de zonas con precios, aforo, tipo

### 9.2 `POST /api/zones/request`
**Propósito:** Solicita alquiler de zona (solo proveedores)
**Body:** { zone_id, details }

---

## 10. RUTAS DE CARRITO (REQUIEREN AUTENTICACIÓN)

### 10.1 `GET /api/cart`
**Propósito:** Obtiene carrito del usuario

### 10.2 `POST /api/cart/add`
**Propósito:** Agrega item al carrito

### 10.3 `DELETE /api/cart/{item_id}`
**Propósito:** Elimina item del carrito

### 10.4 `PUT /api/cart/{item_id}`
**Propósito:** Actualiza cantidad de item

---

## PATRONES Y CONVENCIONES

### Estructura de Respuesta JSON
```python
# Éxito
{
    "success": True,
    "data": { /* datos */ }
}

# Error
{
    "success": False,
    "error": "mensaje de error"
}
```

### Manejo de Errores
```python
try:
    # Operación
    result = mymodelcomponent.some_operation()
    return {"success": True, "data": result}
except Exception as e:
    return {"success": False, "error": str(e)}
```

### Validación de Autenticación
```python
session_id, session_data, error = require_auth(request)
if error:
    return error  # Retorna JSONResponse con 401
```

---

## MEJORAS SUGERIDAS

1. **Usar transacciones** para operaciones críticas como compras
2. **Agregar rate limiting** para prevenir abuse
3. **Agregar logging completo** de todas las operaciones
4. **Usar caché** para datos que no cambian frecuentemente
5. **Validar datos de entrada** más rigidosamente
6. **Agregar paginación** a endpoints que retornan muchos datos
7. **Usar CORS middleware** para proteger API
8. **Agregar autenticación de API keys** para acceso programático
9. **Implementar webhooks** para eventos importantes
10. **Agregar rate limiting por usuario**
