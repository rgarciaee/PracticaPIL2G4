# COMENTARIOS EXHAUSTIVOS - FRONTEND SUBSONIC FESTIVAL

## TABLA DE CONTENIDOS
1. [JavaScript - Arquitectura](#javascript---arquitectura)
2. [HTML - Estructura](#html---estructura)
3. [CSS - Estilos](#css---estilos)

---

## JAVASCRIPT - ARQUITECTURA

### app.js - SPA Principal (300+ líneas)

**PROPÓSITO GENERAL:**
Controlador central de toda la SPA. Gestiona autenticación, carrito, datos, tema y UI.

**PROPIEDADES PRINCIPALES:**
```javascript
this.data              // Datos YAML cargados (noticias, config)
this.currentUser       // {id, email, nombre, apellido, rol, avatar}
this.cart              // [{item_id, nombre, precio, cantidad}...]
this.eventsCache       // Eventos desde /api/events
this.homeCache         // {events, stats, news}
this.isLoading         // Flag de carga
```

**MÉTODOS PRINCIPALES:**

#### 1. `constructor()`
Inicializa propiedades e invoca init().

#### 2. `init()`
Secuencia de inicialización:
1. setupEventListeners() - Configura listeners
2. loadData() - Carga YAML
3. initSearch() - Setup búsqueda
4. setupTheme() - Aplica tema
5. checkAuth() - Verifica autenticación
6. loadCart() - Carga carrito del servidor

#### 3. `checkAuth()`
Verifica si usuario está autenticado via Firebase JWT.
- Si NO autenticado: muestra botones login/register
- Si autenticado: muestra menú perfil con avatar
- Carrera roles desde colecciones Firebase (users → users_extended)

#### 4. `checkAuthStatus()`
Retorna booleano si usuario está autenticado.
Uso: `const isAuth = await app.checkAuthStatus()`

#### 5. Métodos de CARRITO:
- `loadCartFromAPI()` - fetch /api/cart (credenciales)
- `addToCartAPI(item)` - POST /api/cart/add
- `updateCartItemAPI(itemId, qty)` - POST /api/cart/update
- `removeFromCartAPI(itemId)` - POST /api/cart/remove
- `clearCartAPI()` - POST /api/cart/clear
- `saveCartToLocal()` - localStorage backup
- `loadCartFromLocal()` - restore del localStorage
- `updateCartBadge()` - actualiza contador en navbar

**VALIDACIONES EN CARRITO:**
- Solo usuarios autenticados pueden comprar
- Si error en API, intenta cargar del localStorage
- Al desloguearse, limpia localStorage

#### 6. Métodos de DATOS:
- `loadData()` - fetch /static/yaml/data.yaml (promise memoizada)
- `getAppData()` - retorna this.data con carga si no existe
- `getEventsData(forceRefresh)` - /api/events con cache
- `getHomeData(forceRefresh)` - /api/home con cache
- `processCheckout(items, total)` - POST /api/checkout
- `getProfileCompletionStatus()` - GET /api/profile/completion

#### 7. Métodos de TEMA:
- `toggleTheme()` - cambia claro/oscuro
- `setupTheme()` - aplica tema al cargar
- Usa `[data-theme="dark"]` CSS attribute

#### 8. Métodos de UI:
- `showToast(msg, type)` - notificación temporal
- `showModal(title, html, callback)` - modal personalizado
- `setupEventListeners()` - configura todos los listeners
- `toggleSearch()` / `closeSearch()` - búsqueda global
- `handleSearch(query)` - busca eventos
- `logout()` - cierra sesión y limpia datos

**CÓMO MODIFICAR APP.JS:**

1. **Agregar nuevo endpoint:**
```javascript
async getNewData() {
  const response = await fetch('/api/new', {credentials: 'include'});
  const result = await response.json();
  if (result.success) {
    this.newCache = result.data;
  }
  return this.newCache;
}
```

2. **Agregar campo a usuario:**
```javascript
// En checkAuth():
this.currentUser.nuevoField = userData.nuevoField;
```

3. **Agregar validación carrito:**
```javascript
async addToCart(item) {
  // Agregar validación nueva
  if (!this.validateItem(item)) {
    this.showToast('Item inválido', 'error');
    return;
  }
  // Resto del código...
}
```

---

### router.js - SPA Router (150 líneas)

**PROPÓSITO:**
Gestiona navegación hash-based (#home, #evento?id=1).

**FLUJO DE NAVEGACIÓN:**
```
Usuario clica [data-page="evento"]
  ↓
navigate("evento") activado
  ↓
window.history.pushState() - URL = #evento
  ↓
loadPage("evento") llamado
  ↓
fetch /partials/evento
  ↓
content.innerHTML = html
  ↓
executePageInit("evento") → window.initEvento()
  ↓
Página renderizada y funcional
```

**MÉTODOS CLAVE:**

#### `getRouteFromHash()`
Extrae página desde URL hash.
- Input: window.location.hash = "#evento?id=123"
- Output: "evento?id=123"

#### `parseRoute(route)`
Separa página de parámetros.
- Input: "evento?id=123&type=premium"
- Output: {basePage: "evento", queryParams: {id: "123", type: "premium"}}

#### `navigate(page, addToHistory)`
Cambia página.
- Agrega a historial (botones atrás/adelante funcionan)
- Invoca loadPage()

#### `loadPage(route)`
Proceso completo:
1. Parse ruta
2. fetch /partials/{basePage}
3. Inyectar HTML
4. Actualizar nav activo
5. Ejecutar init de página
6. Dispatch custom event 'pageLoaded'

#### `executePageInit(page)`
Llama función init de página:
- "home" → window.initHome()
- "evento" → window.initEvento()
- "carrito" → window.initCarrito()
- etc.

**CÓMO MODIFICAR ROUTER:**

1. **Agregar nueva página:**
```javascript
// En initMap:
nueva: window.initNueva

// En titles:
nueva: 'Título Página Nueva'

// En nueva.js:
window.initNueva = async function() {
  // Setup código
}
```

2. **Cambiar URL scheme:**
```javascript
// De hashes a pathname (requiere backend):
navigate(page) {
  window.history.pushState({}, '', `/page/${page}`);
  this.loadPage(page);
}
```

---

### login.js - Autenticación Firebase (200+ líneas)

**PROPÓSITO:**
Maneja autenticación via Firebase (email/password + Google OAuth).

**FLUJO DE REGISTRO/LOGIN:**
```
1. Usuario llena formulario
2. Firebase auth (email/password o Google)
3. Recibe Firebase JWT token
4. sendTokenToBackend(token) → POST /login
5. Backend verifica token + crea sesión HTTP-Only
6. Backend retorna User DTO
7. localStorage guarda user si rememberMe=true
8. Redirige a home
```

**FUNCIONES PRINCIPALES:**

#### `clearStoredUser()`
Borra usuario guardado del localStorage/sessionStorage.

#### `persistUser(user, rememberMe)`
Guarda usuario:
- Si rememberMe: localStorage (30 días)
- Si no: sessionStorage (hasta cerrar navegador)

#### `applyAuthPersistence()`
Configura Firebase persistence según rememberMe.

#### `showError(formId, message)`
Muestra mensaje de error en formulario.

#### `setButtonLoading(button, isLoading)`
Cambia estado del botón (deshabilitado, spinner).

#### `sendTokenToBackend(token, provider, profile, rememberMe)`
Envía JWT a backend:
- Token Firebase
- Provider (password, google)
- Profile (avatar, nombre)
- RememberMe (persistent)

**VALIDACIONES:**
- Email válido
- Contraseña >= 6 caracteres
- Campos requeridos
- Manejo de errores Firebase

**CÓMO MODIFICAR LOGIN.JS:**

1. **Agregar nuevo provider OAuth:**
```javascript
// Importar provider
const facebookProvider = new firebase.auth.FacebookAuthProvider();

// En handler:
firebase.auth().signInWithPopup(facebookProvider)
  .then(result => sendTokenToBackend(result.user.uid, 'facebook', {...}))
```

2. **Agregar validación extra:**
```javascript
function validateEmail(email) {
  // Custom validation
  if (!email.includes('@')) return false;
  return true;
}
```

---

### Archivos de Página (home.js, evento.js, carrito.js, etc.)

Cada archivo sigue patrón similar:

```javascript
/**
 * PAGINA.JS - Descripción
 * Responsabilidades: qué hace
 */

window.initPageName = async function() {
  // 1. Obtener datos
  const data = await window.app.getEventsData();
  
  // 2. Renderizar HTML
  renderEvents(data);
  
  // 3. Configurar listeners
  setupEventListeners();
};

function renderEvents(events) {
  const container = document.getElementById('events-container');
  container.innerHTML = events.map(e => `<div>${e.nombre}</div>`).join('');
}

function setupEventListeners() {
  document.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', handleBuy);
  });
}

async function handleBuy(e) {
  const eventId = e.target.dataset.eventId;
  await window.app.addToCart({
    item_id: eventId,
    type: 'evento'
  });
}
```

---

## HTML - ESTRUCTURA

### index.html - SPA Shell Principal (150 líneas)

**ESTRUCTURA SEMÁNTICA:**
```
<html>
  <head>
    - Meta tags (charset, viewport, description)
    - Links CSS (main.css, componentes.css, tema CSS)
    - Fonts (Google Fonts)
    - Icons (Font Awesome)
  <body>
    <header class="main-header">
      - Logo + brand
      - Nav links [data-page]
      - Theme toggle
      - Search
      - Auth buttons/perfil
    <main id="page-content">
      - [dinámico - router inyecta partials aquí]
    <footer>
      - Links, copyright, etc
```

**COMPONENTES PRINCIPALES:**

#### Navbar:
- Logo con música emoji (🎵)
- Links: Carrito, Proveedores (solo autenticados)
- Theme toggle (sol/luna)
- Search global
- Auth buttons (login/register cuando no autenticado)
- Menú perfil (cuando autenticado)

#### #page-content:
- Contenedor donde Router inyecta HTML de partials
- Router fetch /partials/{pageName}

#### Elementos especiales:
- `[data-page="home"]` - Click invoca router.navigate('home')
- `#theme-toggle` - Click invoca app.toggleTheme()
- `#global-search` - Input ejecuta app.handleSearch()
- `#cart-count-badge` - Actualizado por app.updateCartBadge()

**CÓMO MODIFICAR INDEX.HTML:**

1. **Agregar link navbar:**
```html
<a href="#" data-page="nueva" class="nav-link">
  <i class="fas fa-icon"></i> Nueva Página
</a>
```

2. **Agregar footer link:**
```html
<div class="footer-section">
  <h3>Nuevo Apartado</h3>
  <ul>
    <li><a href="...">Link</a></li>
  </ul>
</div>
```

---

### Partials HTML (home.html, evento.html, etc.)

Cada partial es inyectado en #page-content por Router.

#### home.html (80 líneas)
- Hero section con estadísticas
- Featured events carousel
- Events grid con scroll
- News carousel
- CTA buttons

#### evento.html (150 líneas)
- Event details (nombre, fecha, descripción)
- Artist list
- Zones disponibles
- Comprar entrada form
- Related events

#### carrito.html (120 líneas)
- Items table (producto, precio, cantidad)
- Totales
- Botón comprar
- Mostrar QR después de compra

#### perfil.html (150 líneas)
- Avatar editable
- Formulario datos personales
- Dirección, teléfono, etc.
- Botón guardar

#### historial.html (100 líneas)
- Tabla compras (evento, fecha, QR)
- Filtros (fecha, evento)
- Descargar QR

#### admin.html (200 líneas)
- Crear evento
- Editar evento
- Crear zona
- Asignar artistas

#### proveedor.html (150 líneas)
- Ver stands disponibles
- Solicitar stand
- Ver solicitudes enviadas
- Gestionar stand

**CÓMO MODIFICAR PARTIALS:**

1. **Agregar campo a form:**
```html
<div class="form-group">
  <label for="nuevo-campo">Nuevo Campo</label>
  <input type="text" id="nuevo-campo" name="nuevo_campo">
</div>
```

2. **Agregar validación:**
```html
<input type="email" required pattern="[^@]+@[^@]+\.[^@]+" 
       oninvalid="this.setCustomValidity('Email inválido')">
```

---

## CSS - ESTILOS

### main.css - Estilos Globales (300+ líneas)

**ARQUITECTURA:**

#### 1. CSS Variables (tema):
```css
:root {
  /* Colores */
  --primary-color: #6366f1        /* Indigo */
  --secondary-color: #ec489a      /* Pink */
  --accent-color: #06b6d4         /* Cyan */
  
  /* Fondos */
  --bg-primary: #ffffff
  --bg-secondary: #f8fafc
  
  /* Textos */
  --text-primary: #0f172a
  --text-secondary: #475569
  
  /* Espaciado */
  --spacing-sm: 1rem
  --spacing-md: 1.5rem
  --spacing-lg: 2rem
}

/* Modo oscuro */
[data-theme="dark"] {
  --bg-primary: #0f172a
  --text-primary: #f1f5f9
  /* ... resto de variables */
}
```

#### 2. Reset y Base:
```css
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family: 'Inter', sans-serif; }
```

#### 3. Header y Navbar:
- Sticky position
- Gradient background
- Logo con animación bounce
- Nav links con underline activo
- Cart badge (número de items)

#### 4. Layout:
- Max-width container
- CSS Grid para layouts
- Flexbox para components
- Responsive con media queries

#### 5. Componentes:
- `.btn` - Botones
- `.card` - Tarjetas
- `.form-group` - Campos formulario
- `.toast` - Notificaciones
- `.modal` - Ventanas

**CÓMO MODIFICAR CSS:**

1. **Cambiar colores primarios:**
```css
:root {
  --primary-color: #8b5cf6;      /* Violeta */
  --secondary-color: #f59e0b;    /* Naranja */
}
```

2. **Agregar breakpoint responsive:**
```css
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  .navbar { flex-direction: column; }
}
```

3. **Agregar animación:**
```css
@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.elemento { animation: slideIn 0.3s ease; }
```

---

### Archivos CSS Específicos

#### componentes.css (250 líneas)
Estilos para componentes reutilizables:
- `.btn` + variaciones
- `.card` styles
- `.form-group`
- `.modal`, `.toast`
- `.badge`, `.tag`
- `.dropdown`

#### evento.css (150 líneas)
Estilos página evento:
- `.event-hero` - Cabecera evento
- `.event-grid` - Grid de zonas
- `.zone-card` - Zona individual
- `.artist-list` - Artistas
- `.buy-form` - Formulario compra

#### carrito.css (120 líneas)
Estilos carrito:
- `.cart-table` - Tabla items
- `.cart-summary` - Totales
- `.cart-item-row` - Fila
- `.quantity-selector` - Input cantidad
- `.checkout-btn` - Botón checkout

#### Resto de CSS:
- `perfil.css` - Avatar, form perfil
- `historial.css` - Tabla compras, QR
- `admin.css` - Formularios admin
- `proveedor.css` - Stands
- `login.css` - Formularios auth
- `home.css` - Hero, carousels

**CÓMO MODIFICAR CSS ESPECÍFICOS:**

1. **Cambiar estilos zona:**
```css
.zone-card {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  /* ... */
}
```

2. **Agregar estado hover:**
```css
.zone-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
}
```

---

## GUÍA RÁPIDA DE MODIFICACIONES

### Agregar Evento Calendario
1. Backend: agregar POST /api/events en controller.py
2. Frontend: evento.js llama window.app.getEventsData()
3. Renderizar en evento.html

### Cambiar Colores Tema
1. Modificar variables CSS en main.css
2. Automáticamente aplica a todo (CSS cascade)
3. Dark mode usa [data-theme="dark"] selector

### Agregar Campo a Perfil
1. Backend: agregar a userExtDTO.py
2. Frontend: agregar input en perfil.html
3. perfil.js → handleSave() envía a POST /api/profile

### Agregar Página Nueva
1. Crear `/partials/nueva.html`
2. Crear `/static/javascript/nueva.js` con `window.initNueva()`
3. router.js: agregar en `initMap` y `titles`
4. index.html: agregar `<a data-page="nueva">`

---

