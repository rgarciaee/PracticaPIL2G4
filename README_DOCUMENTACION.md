# DOCUMENTACIÓN COMPLETA DEL PROYECTO SUBSONIC FESTIVAL

## 📋 Índice de Documentación Generada

Este proyecto ha sido completamente comentado y documentado. Los siguientes archivos contienen guías exhaustivas:

### 📚 Archivos de Documentación

1. **COMENTARIOS_CONTROLLER.md** - Guía completa del controller.py
   - Estructura de rutas API
   - Funciones de autenticación
   - Operaciones de compra
   - CÓMO MODIFICAR cada sección

2. **COMENTARIOS_JAVASCRIPT.md** - Guía completa del frontend JavaScript
   - Estructura de la clase SubsonicApp
   - Sistema de rutas (Router)
   - Gestión de carrito
   - Autenticación con Firebase
   - CÓMO MODIFICAR funcionalidades

3. **COMENTARIOS_HTML_CSS.md** - Guía de templates y estilos
   - Estructura de HTML
   - Componentes principales
   - Sistema de CSS
   - Temas (claro/oscuro)
   - CÓMO MODIFICAR diseño

### 📄 Archivos Python Comentados

#### DTOs (Data Transfer Objects)
- [model/dto/userDTO.py](model/dto/userDTO.py) - Usuario
- [model/dto/artistDTO.py](model/dto/artistDTO.py) - Artistas
- [model/dto/eventDTO.py](model/dto/eventDTO.py) - Eventos
- [model/dto/ticketDTO.py](model/dto/ticketDTO.py) - Entradas/Tickets
- [model/dto/zoneDTO.py](model/dto/zoneDTO.py) - Zonas/Sectores
- [model/dto/standDTO.py](model/dto/standDTO.py) - Puestos para proveedores
- [model/dto/cartDTO.py](model/dto/cartDTO.py) - Carrito de compras
- [model/dto/userExtDTO.py](model/dto/userExtDTO.py) - Datos extendidos del usuario

#### DAOs (Data Access Objects)
- [model/dao/firebase/firebaseConnector.py](model/dao/firebase/firebaseConnector.py) - Conector singleton a Firebase
- [model/dao/interfaceUserDAO.py](model/dao/interfaceUserDAO.py) - Interfaz de DAO de usuarios
- [model/dao/firebase/collection/firebaseUserDAO.py](model/dao/firebase/collection/firebaseUserDAO.py) - DAO de usuarios en Firebase
- [model/dao/firebase/collection/firebaseArtistDAO.py](model/dao/firebase/collection/firebaseArtistDAO.py) - DAO de artistas

#### Capa de Lógica de Negocio
- [model/model.py](model/model.py) - Modelo central con lógica de compras
- [view/view.py](view/view.py) - Gestor de vistas/templates

---

## 🏗️ Arquitectura del Proyecto

```
PracticaPIL2G4/
│
├── main.py                          ← Punto de entrada
│
├── controller/
│   └── controller.py                ← Rutas FastAPI + Lógica de control
│
├── model/
│   ├── model.py                     ← Lógica de negocio
│   ├── dto/                         ← Data Transfer Objects
│   │   ├── userDTO.py
│   │   ├── artistDTO.py
│   │   ├── eventDTO.py
│   │   ├── ticketDTO.py
│   │   ├── zoneDTO.py
│   │   ├── standDTO.py
│   │   ├── cartDTO.py
│   │   └── userExtDTO.py
│   └── dao/
│       ├── interfaceUserDAO.py
│       ├── interfaceArtistDAO.py
│       ├── ... (más interfaces)
│       └── firebase/
│           ├── firebaseConnector.py
│           ├── firebaseDAOFactory.py
│           └── collection/
│               ├── firebaseUserDAO.py
│               ├── firebaseArtistDAO.py
│               └── ... (más DAOs)
│
├── view/
│   ├── view.py                      ← Gestor de templates
│   └── templates/
│       ├── index.html               ← SPA principal
│       ├── login.html               ← Página de login
│       ├── partials/                ← Componentes dinámicos
│       │   ├── home.html
│       │   ├── evento.html
│       │   ├── carrito.html
│       │   ├── historial.html
│       │   ├── perfil.html
│       │   ├── admin.html
│       │   └── proveedor.html
│       └── static/
│           ├── javascript/
│           │   ├── app.js           ← Clase principal
│           │   ├── router.js        ← Sistema de rutas
│           │   ├── login.js         ← Autenticación
│           │   ├── home.js
│           │   ├── evento.js
│           │   ├── carrito.js
│           │   ├── historial.js
│           │   ├── perfil.js
│           │   ├── admin.js
│           │   └── proveedor.js
│           ├── css/
│           │   ├── main.css
│           │   ├── componentes.css
│           │   ├── login.css
│           │   └── ... (más estilos)
│           └── yaml/
│               └── data.yaml        ← Datos estáticos (noticias)
│
└── requirements.txt                 ← Dependencias Python
```

---

## 🔄 Flujo de una Solicitud

### 1. Usuario se Registra

```
Frontend (login.js)
    ↓ (Firebase Auth)
backend/login-google o /login-credentials (controller.py)
    ↓
create_user_in_firestore()
    ↓ (DAO Factory)
FirebaseUserDAO + FirebaseUserExtDAO
    ↓ (Firestore)
Colecciones: "users" + "users_extended"
    ↓
Sesión creada en memoria
    ↓
Response: { success: true, avatar_url, role }
    ↓
Frontend: Redirigir a /app
```

### 2. Usuario Compra Entrada

```
Frontend (carrito.js)
    ↓ (Usuario hace click en Comprar)
POST /api/checkout
    ↓ (controller.py)
require_auth() - Valida sesión
    ↓
model.process_purchase()
    ↓ (model.py)
Valida: 
  - Perfil completo
  - Rol del usuario
  - Tipos de zonas
    ↓
Genera QR: _generate_qr_code()
    ↓
Crea tickets en Firestore (TicketDAO)
    ↓
Response: { success: true, tickets: [...] }
    ↓
Frontend: Muestra QRs descargables
```

### 3. Usuario Consulta Historial

```
Frontend (historial.js)
    ↓
GET /api/history
    ↓ (controller.py)
model.get_user_history(user_id)
    ↓ (model.py)
ticketDAO.get_tickets_by_user(user_id)
    ↓ (FirebaseTicketDAO)
Consulta: WHERE usuario_id == user_id
    ↓ (Firestore)
Retorna JSON de tickets
    ↓
Frontend: Renderiza tabla/tarjetas
```

---

## 🛠️ Cómo Modificar el Proyecto

### Agregar Nueva Funcionalidad

#### Ejemplo: Agregar Sistema de Wishlist

1. **Crear DTO** (`model/dto/wishlistDTO.py`)
```python
class WishlistDTO:
    def __init__(self):
        self.id = None
        self.usuario_id = None
        self.evento_id = None
        self.fecha_agregado = None
```

2. **Crear Interfaz DAO** (`model/dao/interfaceWishlistDAO.py`)
```python
class InterfaceWishlistDAO(ABC):
    @abstractmethod
    def get_wishlist(self, user_id):
        pass
    
    @abstractmethod
    def add_to_wishlist(self, user_id, event_id):
        pass
```

3. **Implementar en Firebase** (`model/dao/firebase/collection/firebaseWishlistDAO.py`)
```python
class FirebaseWishlistDAO(InterfaceWishlistDAO):
    def __init__(self, collection):
        self.collection = collection
    
    def get_wishlist(self, user_id):
        # Implementar...
        pass
```

4. **Agregar DAO al Factory** (`model/dao/firebase/firebaseDAOFactory.py`)
```python
def getWishlistDAO(self):
    wishlist_collection = self.connector.get_db().collection("wishlist")
    return FirebaseWishlistDAO(wishlist_collection)
```

5. **Agregar método al Model** (`model/model.py`)
```python
def get_wishlist(self, user_id):
    return self.wishlistDAO.get_wishlist(user_id)

def add_to_wishlist(self, user_id, event_id):
    return self.wishlistDAO.add_to_wishlist(user_id, event_id)
```

6. **Agregar rutas al Controller** (`controller/controller.py`)
```python
@app.get("/api/wishlist")
async def get_wishlist(request: Request):
    session_id, _, error = require_auth(request)
    if error:
        return error
    
    wishlist = mymodelcomponent.get_wishlist(session_id)
    return {"success": True, "data": wishlist}

@app.post("/api/wishlist/add")
async def add_to_wishlist(request: Request, event_id: str):
    session_id, _, error = require_auth(request)
    if error:
        return error
    
    result = mymodelcomponent.add_to_wishlist(session_id, event_id)
    return result
```

7. **Crear página frontend** (`view/templates/partials/wishlist.html`)
```html
<div class="wishlist-container">
    <h1>Mi Wishlist</h1>
    <div id="wishlist-items"></div>
</div>
```

8. **Crear JavaScript** (`view/templates/static/javascript/wishlist.js`)
```javascript
async function init() {
    const wishlist = await fetch("/api/wishlist").then(r => r.json());
    renderWishlist(wishlist.data);
}

async function removeFromWishlist(eventId) {
    await fetch("/api/wishlist/remove", {
        method: "POST",
        body: JSON.stringify({ event_id: eventId })
    });
}
```

---

## 🔐 Seguridad

### Medidas Implementadas

✅ **Autenticación**: Firebase Auth (email + Google)
✅ **Sesiones**: Cookies HttpOnly + diccionario en memoria
✅ **Autorización**: Validación de rol (user, admin, provider)
✅ **CORS**: Configurado en FastAPI
✅ **Tokens**: Verificación de JWT con Firebase

### Mejoras Sugeridas

⚠️ **Usar base de datos para sesiones** (Redis)
⚠️ **Encriptar datos sensibles** (tarjeta, DNI)
⚠️ **Agregar rate limiting**
⚠️ **Usar HTTPS en producción**
⚠️ **Agregar CSRF protection**
⚠️ **Validar input más rigidosamente**
⚠️ **Usar variables de entorno** para secretos

---

## 🚀 Deployment

### Producción

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Configurar variables de entorno
export FIREBASE_CREDENTIALS=/path/to/credentials.json
export DATABASE_URL=...

# 3. Ejecutar con Uvicorn
uvicorn main:main_app --host 0.0.0.0 --port 8000

# 4. O usar Gunicorn + Uvicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:main_app
```

### Docker

```dockerfile
FROM python:3.10

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "main:main_app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 📊 Base de Datos (Firestore)

### Colecciones

**users**
```json
{
  "user_id": "firebase_uid",
  "email": "user@example.com",
  "role": "user | admin | provider",
  "created_at": "2026-05-06T10:30:00"
}
```

**users_extended**
```json
{
  "id": "firebase_uid",
  "dni": "12345678A",
  "nombre_apellidos": "Juan Pérez",
  "fecha_nacimiento": "1990-01-15",
  "email": "juan@example.com",
  "telefono": "+34123456789",
  "direccion": "Calle Principal 123",
  "num_tarjeta": "encriptado",
  "avatar_url": "https://...",
  "rol_asignado": "user | provider"
}
```

**events**
```json
{
  "id": "evt_123",
  "nombre": "Subsonic Festival 2026",
  "imagen": "https://...",
  "fecha_ini": "2026-07-01T20:00:00",
  "fecha_fin": "2026-07-03T23:59:59",
  "descripcion": "...",
  "ubicacion": "Madrid, España"
}
```

**zones**
```json
{
  "id": "zona_123",
  "evento_id": "evt_123",
  "nombre": "VIP",
  "aforo_maximo": 500,
  "precio": 150.00,
  "tipo": "ticket | stand",
  "fecha_evento": "2026-07-01"
}
```

**tickets**
```json
{
  "id": "ticket_123",
  "usuario_id": "firebase_uid",
  "evento_id": "evt_123",
  "zona_id": "zona_123",
  "localizador_qr": "SUB-XXXXXXXX",
  "fecha_compra": "2026-05-06",
  "fecha_evento": "2026-07-01",
  "estado": "Activa | Usada | Cancelada",
  "precio": 150.00
}
```

---

## 🔧 Herramientas y Tecnologías

### Backend
- **FastAPI** - Framework web
- **Firebase Admin SDK** - BD y autenticación
- **Firestore** - Base de datos NoSQL
- **Uvicorn** - Servidor ASGI

### Frontend
- **Vanilla JavaScript** - Sin frameworks (opcional: upgradar a Vue/React)
- **Firebase SDK** - Autenticación client-side
- **Jinja2** - Templating en servidor
- **Font Awesome** - Iconos
- **CSS3** - Estilos

### Dependencias (requirements.txt)
```
fastapi==0.104.1
uvicorn==0.24.0
firebase-admin==6.4.0
jinja2==3.1.2
python-multipart==0.0.6
PyYAML==6.0.1
```

---

## 📚 Recursos Útiles

- [Documentación FastAPI](https://fastapi.tiangolo.com/)
- [Documentación Firebase](https://firebase.google.com/docs)
- [Documentación Firestore](https://cloud.google.com/firestore/docs)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Python Official Docs](https://docs.python.org/3/)

---

## ✅ Checklist de Modificaciones Comunes

### Agregar nuevo campo a Usuario
- [ ] Editar `userExtDTO.py` - Agregar propiedad
- [ ] Editar `firebaseUserDAO.py` - Agregar lectura/escritura
- [ ] Editar `perfil.html` - Agregar input
- [ ] Editar `perfil.js` - Agregar validación
- [ ] Editar `controller.py` - Si es necesario

### Agregar nuevo tipo de ticket
- [ ] Editar `zoneDTO.py` si necesario
- [ ] Editar `firebaseZoneDAO.py`
- [ ] Crear lógica de cálculo de precio si es diferente
- [ ] Editar `evento.html` - Mostrar nuevo tipo
- [ ] Editar `model.py` - Agregar validación

### Agregar nueva página
- [ ] Crear `partials/nueva_pagina.html`
- [ ] Crear `javascript/nueva_pagina.js` con función `init()`
- [ ] Editar `router.js` si es necesario
- [ ] Editar `index.html` para incluir JS
- [ ] Agregar link en navbar

---

## 🐛 Debugging

### Ver logs del servidor
```python
# En cualquier archivo Python
print("DEBUG:", variable)
```

### Ver logs del navegador
```javascript
// En consola del navegador (F12)
console.log("DEBUG:", variable);
console.error("ERROR:", error);
```

### Inspeccionar Firestore
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar proyecto
3. Ir a Firestore
4. Ver colecciones y documentos

---

## 📞 Soporte

Para preguntas sobre la documentación o el código, consulta:
1. Los comentarios en cada archivo Python
2. Los archivos COMENTARIOS_*.md
3. El código mismo - está bien estructurado

---

## 📝 Cambios Realizados

✅ **DTOs**: Todos comentados con ejemplos y cómo modificar
✅ **DAOs**: Firebaseconnector y DAOs comentados con patrones
✅ **Model**: Métodos principales comentados exhaustivamente
✅ **View**: Breve pero claro
✅ **Controller**: Guía completa en archivo COMENTARIOS_CONTROLLER.md
✅ **JavaScript**: Guía exhaustiva en COMENTARIOS_JAVASCRIPT.md
✅ **HTML/CSS**: Guía completa en COMENTARIOS_HTML_CSS.md

---

## 🎯 Próximos Pasos

1. Leer los archivos COMENTARIOS_*.md en orden
2. Revisar los DTOs para entender la estructura de datos
3. Seguir el flujo en controller.py
4. Estudiar model.py para la lógica de negocio
5. Revisar el frontend (router.js → app.js → páginas específicas)
6. Hacer cambios basados en los patrones documentados

¡El proyecto está completamente documentado y listo para modificar!
