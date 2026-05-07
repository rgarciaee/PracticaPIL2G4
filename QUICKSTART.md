# ⚡ GUÍA RÁPIDA - EMPEZAR EN 5 MINUTOS

## 🚀 Inicio Rápido

### 1. Instalación (2 minutos)

```bash
# Clonar o descargar el proyecto
cd PracticaPIL2G4

# Instalar dependencias Python
pip install -r requirements.txt

# Instalar Firebase SDK
pip install firebase-admin

# Verificar que todo esté OK
python -c "import firebase_admin; print('✓ Firebase OK')"
```

### 2. Configuración (1 minuto)

```bash
# Copiar archivo de credenciales de Firebase
# IMPORTANTE: Debe estar en: model/dao/firebase/credentials.json

# Verificar que exista:
ls model/dao/firebase/credentials.json

# Si no existe:
# 1. Ir a Firebase Console
# 2. Proyecto Settings → Service Accounts
# 3. Generate new private key
# 4. Guardar como credentials.json
```

### 3. Ejecutar el Servidor (1 minuto)

```bash
# Opción 1: Modo desarrollo
python main.py

# Opción 2: Con uvicorn
uvicorn main:main_app --reload

# Opción 3: Con puerto específico
uvicorn main:main_app --host 0.0.0.0 --port 8000
```

### 4. Acceder a la App (1 minuto)

```bash
# Abrir navegador
http://localhost:8000

# Deberías ver:
# - Página de login
# - Opción login con credenciales
# - Opción login con Google
```

---

## 📚 Documentación Disponible

| Archivo | Contenido | Lectura |
|---------|----------|---------|
| `README_DOCUMENTACION.md` | Guía general del proyecto | ⭐⭐⭐ Empezar aquí |
| `INDICE_DOCUMENTACION.md` | Índice de todo | ⭐⭐ Referencia rápida |
| `DIAGRAMAS_FLUJO.md` | Diagramas ASCII | ⭐⭐ Para entender flujos |
| `COMENTARIOS_CONTROLLER.md` | API endpoints | ⭐⭐⭐ Para backend |
| `COMENTARIOS_JAVASCRIPT.md` | Frontend app | ⭐⭐⭐ Para frontend |
| `COMENTARIOS_HTML_CSS.md` | Estructura y estilos | ⭐⭐ Para UI |

**Recomendación**: Leer en este orden:
1. Este archivo (2 min)
2. README_DOCUMENTACION.md (10 min)
3. DIAGRAMAS_FLUJO.md (5 min)
4. COMENTARIOS_CONTROLLER.md (10 min)

---

## 🎯 Tareas Comunes

### Tarea 1: Agregar un Campo a Usuario

**Paso 1**: Editar DTO
```python
# model/dto/userExtDTO.py

class UserExtDTO:
    def __init__(self):
        # ... campos existentes ...
        self.nuevo_campo = None  # ← AGREGAR AQUÍ
```

**Paso 2**: Editar DAO
```python
# model/dao/firebase/collection/firebaseUserDAO.py

def add_user(self, user_data):
    doc_data = {
        # ... campos existentes ...
        'nuevo_campo': user_data.nuevo_campo,  # ← AGREGAR
    }
```

**Paso 3**: Editar HTML del formulario
```html
<!-- view/templates/partials/perfil.html -->

<input type="text" id="nuevo_campo" placeholder="Mi campo">
```

**Paso 4**: Editar JavaScript
```javascript
// view/templates/static/javascript/perfil.js

const datos = {
    // ... campos existentes ...
    nuevo_campo: document.getElementById('nuevo_campo').value
};

// Enviar al backend
POST /api/profile con datos
```

✅ **Listo!**

---

### Tarea 2: Agregar una Nueva Ruta API

**Paso 1**: Editar controller.py
```python
# controller/controller.py

@app.post("/api/mi-nuevo-endpoint")
async def mi_nuevo_endpoint(request: Request, param1: str):
    # Validar autenticación
    session_id, _, error = require_auth(request)
    if error:
        return error
    
    # Lógica
    resultado = mymodelcomponent.hacer_algo(param1)
    
    # Retornar
    return {"success": True, "data": resultado}
```

**Paso 2**: Editar model.py
```python
# model/model.py

def hacer_algo(self, param1):
    # Tu lógica aquí
    return resultado
```

**Paso 3**: Llamar desde frontend
```javascript
// view/templates/static/javascript/alguna_pagina.js

const response = await fetch('/api/mi-nuevo-endpoint', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ param1: 'valor' })
});

const data = await response.json();
```

✅ **Listo!**

---

### Tarea 3: Agregar una Nueva Página

**Paso 1**: Crear HTML
```html
<!-- view/templates/partials/mi_pagina.html -->

<div class="mi-pagina">
    <h1>Mi Página</h1>
    <div id="contenido"></div>
</div>
```

**Paso 2**: Crear JavaScript
```javascript
// view/templates/static/javascript/mi_pagina.js

async function init() {
    console.log('Mi página cargada');
    
    // Cargar datos
    const data = await fetch('/api/datos').then(r => r.json());
    
    // Renderizar
    document.getElementById('contenido').innerHTML = renderizar(data);
    
    // Event listeners
    document.querySelectorAll('.boton').forEach(btn => {
        btn.addEventListener('click', handleClick);
    });
}

function renderizar(data) {
    return `<p>${data.mensaje}</p>`;
}

function handleClick(e) {
    console.log('Click en', e.target);
}
```

**Paso 3**: Crear CSS (opcional)
```css
/* view/templates/static/css/mi_pagina.css */

.mi-pagina {
    padding: 20px;
    background: var(--bg-color);
    color: var(--text-color);
}

.mi-pagina h1 {
    font-size: 2em;
    margin-bottom: 20px;
}
```

**Paso 4**: Agregar link en navbar
```html
<!-- view/templates/index.html -->

<a href="#/mi_pagina" data-page="mi_pagina">Mi Página</a>
```

✅ **Listo!**

---

### Tarea 4: Modificar Estilo/CSS

**Opción 1**: Cambiar color
```css
/* view/templates/static/css/main.css */

:root {
    --primary-color: #FF6B6B;  /* ← Cambiar aquí */
    --bg-color: #fff;
}
```

**Opción 2**: Cambiar tipografía
```css
body {
    font-family: 'Arial', sans-serif;  /* ← Cambiar aquí */
    font-size: 16px;
}
```

**Opción 3**: Cambiar layout
```css
.navbar {
    display: flex;
    justify-content: space-between;  /* ← Cambiar aquí */
    align-items: center;
}
```

✅ **Los cambios son inmediatos!** (F5 para refrescar)

---

## 🔍 Debugging

### Ver logs del servidor

```python
# En cualquier archivo Python
print("DEBUG:", variable)
# Los verás en la consola donde ejecutas main.py
```

### Ver logs del navegador

```javascript
// En consola del navegador (F12 → Console)
console.log("DEBUG:", variable);
console.error("ERROR:", error);
console.table(data);
```

### Inspeccionar Base de Datos

1. Abre [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a Firestore Database
4. Haz clic en collections

### Ver Peticiones HTTP

1. Abre DevTools (F12)
2. Ve a Network
3. Haz un request
4. Haz clic en el request para ver detalles

---

## 🧪 Pruebas Rápidas

### Prueba 1: ¿Funciona el servidor?

```bash
curl http://localhost:8000
# Debería retornar un HTML
```

### Prueba 2: ¿Se conecta a Firebase?

```python
# En Python
from model.dao.firebase.firebaseConnector import FirebaseConnector
connector = FirebaseConnector()
db = connector.get_db()
print("✓ Conectado a Firebase")
```

### Prueba 3: ¿Funciona login?

1. Ve a http://localhost:8000
2. Click en "Registrarse con Google"
3. Completa el login
4. Deberías ver la app

### Prueba 4: ¿Se guarda en Firestore?

1. Completa el login
2. Ve a Firebase Console → Firestore
3. Abre collection "users"
4. Deberías ver tu usuario

---

## 📝 Convenciones de Código

### Nombres de variables

```python
# ✓ Bueno
usuario_id = "123"
carrito_total = 99.99
es_admin = True

# ✗ Malo
userID = "123"
cartTotal = 99.99
isAdmin = True
```

### Nombres de funciones

```python
# ✓ Bueno
def obtener_usuario(id):
    pass

def crear_ticket(datos):
    pass

# ✗ Malo
def getUser(id):
    pass

def create_ticket(data):
    pass
```

### Nombres de clases

```python
# ✓ Bueno
class UserDTO:
    pass

class FirebaseUserDAO:
    pass

# ✗ Malo
class user_dto:
    pass

class firebase_user_dao:
    pass
```

### Comentarios

```python
# ✓ Bueno
def procesar_compra(usuario_id, carrito):
    """Procesa la compra de un usuario.
    
    Args:
        usuario_id: ID del usuario
        carrito: CartDTO con items
        
    Returns:
        dict: { success: bool, tickets: [] }
    """
    pass

# ✗ Malo
def procesar_compra(uid, c):
    # esto procesa
    pass
```

---

## ⚠️ Errores Comunes

### Error: "credentials.json no encontrado"

**Solución**:
```bash
# Asegurate que el archivo esté en:
model/dao/firebase/credentials.json

# Si no existe, descárgalo de Firebase Console
```

### Error: "ModuleNotFoundError: No module named 'firebase_admin'"

**Solución**:
```bash
pip install firebase-admin
```

### Error: "GET /api/events 401 Unauthorized"

**Solución**: Algunos endpoints necesitan autenticación. Asegúrate de estar logueado.

### Error: "CORS error" en navegador

**Solución**: Ya está configurado en `main.py`, pero si persiste:
```python
# En main.py, edita:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, cambiar a dominio específico
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🎓 Recursos para Aprender

### Sobre FastAPI
- [Documentación oficial](https://fastapi.tiangolo.com/) ⭐⭐⭐
- [Tutorial paso a paso](https://fastapi.tiangolo.com/tutorial/)

### Sobre Firebase
- [Documentación oficial](https://firebase.google.com/docs) ⭐⭐⭐
- [Firestore guía](https://cloud.google.com/firestore/docs)

### Sobre JavaScript (Frontend)
- [MDN Web Docs](https://developer.mozilla.org/) ⭐⭐⭐
- [JavaScript ES6](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference)

### Sobre Python
- [Python oficial](https://docs.python.org/3/) ⭐⭐⭐
- [PEP 8 Style Guide](https://www.python.org/dev/peps/pep-0008/)

---

## 📞 Obtener Ayuda

### Si algo no funciona:

1. **Lee los comentarios** en el archivo
2. **Busca en DIAGRAMAS_FLUJO.md** el flujo relacionado
3. **Consulta COMENTARIOS_*.md** para ese componente
4. **Usa Google** o StackOverflow
5. **Pide ayuda** en Discord/Slack del equipo

### Si encuentras un bug:

1. **Anota pasos para reproducir**
2. **Revisa el código** relacionado
3. **Agrega logs/prints** para debuggear
4. **Consulta la documentación** de la librería
5. **Documenta la solución** para el equipo

---

## ✅ Checklist: Todo Listo?

- [ ] Python 3.8+ instalado
- [ ] `pip install -r requirements.txt` ejecutado
- [ ] Archivo `credentials.json` en lugar correcto
- [ ] `python main.py` ejecutándose sin errores
- [ ] Navegador abierto en `http://localhost:8000`
- [ ] Página de login visible
- [ ] Login con Google funciona
- [ ] Usuario guardado en Firestore
- [ ] App cargada correctamente
- [ ] Documentación leída (este archivo + README)

✨ **¡Listo para empezar!**

---

## 🚀 Próximos Pasos

1. **Explora el código** - Abre un archivo Python y lee
2. **Haz pequeños cambios** - Modifica un color, un texto
3. **Practica las tareas comunes** - Sigue los ejemplos arriba
4. **Lee la documentación completa** - Entiende la arquitectura
5. **Implementa una feature nueva** - Usa los patrones establecidos

---

## 💡 Tips y Trucos

### Recargar servidor automáticamente
```bash
uvicorn main:main_app --reload  # ← Reinicia en cambios
```

### Desactivar caché del navegador
```
DevTools → Settings → Disable cache (while DevTools is open)
```

### Ver todos los endpoints
```bash
# Van a estar en: http://localhost:8000/docs
# (Swagger UI - documentación automática de FastAPI)
```

### Usar SQLite en lugar de Firestore (para testing)
```python
# Modificar en model/dao/firebase/firebaseDAOFactory.py
# (Avanzado - consulta documentación)
```

### Guardar credenciales de Firebase de forma segura
```python
# En producción, usar variables de entorno:
import os
FIREBASE_KEY = os.getenv('FIREBASE_KEY')
```

---

## 📊 Estructura de Carpetas (Recordatorio)

```
PracticaPIL2G4/
├── controller/          ← Rutas API
├── model/               ← Lógica de negocio + DTOs + DAOs
│   ├── dto/
│   └── dao/
├── view/                ← Templates HTML
│   └── templates/
│       ├── partials/    ← Componentes dinámicos
│       └── static/
│           ├── javascript/  ← Lógica del frontend
│           └── css/         ← Estilos
├── main.py              ← Punto de entrada
└── requirements.txt     ← Dependencias
```

---

## 🎉 ¡Ahora Sí!

Estás listo para:
- ✅ Entender el proyecto
- ✅ Modificar funcionalidades
- ✅ Agregar features nuevas
- ✅ Debuggear problemas
- ✅ Trabajar en equipo

**¡A programar!** 🚀
