# Guía Completa de Comentarios - Archivos JavaScript

## Estructura General del Frontend

El frontend es una Single Page Application (SPA) basada en JavaScript vanilla.

```
view/templates/
├── index.html (SPA principal)
├── login.html (Página de login)
├── partials/ (Componentes cargados dinámicamente)
│   ├── home.html
│   ├── evento.html
│   ├── carrito.html
│   ├── historial.html
│   ├── perfil.html
│   ├── admin.html
│   └── proveedor.html
└── static/
    ├── javascript/
    │   ├── app.js (Clase principal)
    │   ├── router.js (Gestión de rutas)
    │   ├── login.js (Lógica de autenticación)
    │   ├── home.js (Página de inicio)
    │   ├── evento.js (Detalles de evento)
    │   ├── carrito.js (Gestión del carrito)
    │   ├── historial.js (Historial de compras)
    │   ├── perfil.js (Perfil del usuario)
    │   ├── admin.js (Panel de admin)
    │   └── proveedor.js (Panel de proveedor)
    ├── css/ (Estilos)
    └── yaml/
        └── data.yaml (Datos estáticos)
```

---

## 1. app.js - Clase Principal de la Aplicación

### Propósito
Gestiona el estado global de la aplicación, coordina todos los componentes.

### Constantes Principales
```javascript
const DEFAULT_AVATAR = '...';  // Avatar por defecto si usuario no tiene foto
const EURO_FORMATTER = new Intl.NumberFormat(...);  // Formateador de moneda
```

### Estructura de la Clase SubsonicApp
```javascript
class SubsonicApp {
    constructor() {
        // Inicializa propiedades
        this.data = null;           // Datos globales de la app
        this.currentUser = null;    // Usuario autenticado actual
        this.cart = [];             // Carrito de compras
        this.isLoading = false;     // Bandera de carga
        this.init();                // Inicia la aplicación
    }
    
    async init() {
        // 1. Configura event listeners
        // 2. Carga datos iniciales
        // 3. Inicializa búsqueda
        // 4. Configura tema
        // 5. Valida autenticación
        // 6. Carga carrito
        // 7. Actualiza UI
    }
}
```

### Métodos Principales

#### 1. Gestión del Carrito

**LECTURA DEL CARRITO**
```javascript
async loadCartFromAPI()
// Obtiene carrito del backend (/api/cart)
// Almacena en this.cart
// Actualiza badge del carrito en UI

async loadCart()
// Intenta cargar desde API
// Fallback a localStorage si API falla

// CÓMO MODIFICAR:
// Agregar campo de descuento
async loadCartFromAPI() {
    const response = await fetch("/api/cart", ...);
    const result = await response.json();
    if (result.success && result.data) {
        this.cart = result.data.items || [];
        this.discount = result.data.discount_code || null;  // NUEVO
        this.discountAmount = result.data.discount_amount || 0;  // NUEVO
        this.updateCartBadge();
    }
}
```

**AGREGAR AL CARRITO**
```javascript
async addToCartAPI(item)
// POST /api/cart/add
// Item contiene: nombre, precio, cantidad, evento_id, zona_id, etc.
// Retorna: carrito actualizado
// Muestra toast de confirmación

// CÓMO MODIFICAR:
// Validar disponibilidad antes de agregar
async addToCartAPI(item) {
    // Validar stock
    const available = await this.checkAvailability(item.zona_id);
    if (!available) {
        this.showToast("Zona sin disponibilidad", "error");
        return false;
    }
    // ... resto del código
}
```

**ACTUALIZAR CANTIDAD**
```javascript
async updateCartItemAPI(itemId, quantity)
// POST /api/cart/update
// Actualiza cantidad de un item específico
// Si cantidad es 0, elimina el item

// CÓMO MODIFICAR:
// Agregar validación de cantidad máxima
async updateCartItemAPI(itemId, quantity) {
    if (quantity > 10) {
        this.showToast("Máximo 10 unidades por item", "error");
        return false;
    }
    // ... resto del código
}
```

**ELIMINAR DEL CARRITO**
```javascript
async removeFromCartAPI(itemId)
// POST /api/cart/remove
// Elimina completamente un item
// Actualiza totales
```

**CALCULAR TOTALES**
```javascript
calculateCartTotals()
// Suma: cantidad total + precio total
// Aplica descuentos si existen
// Actualiza UI con totales

// Estructura de retorno:
{
    total_items: 5,
    total_price: 150.00,
    discount: 15.00,
    final_price: 135.00
}
```

#### 2. Gestión de Autenticación

**CHECK DE AUTENTICACIÓN**
```javascript
async checkAuth()
// Valida si usuario tiene cookie de sesión
// Obtiene datos del perfil si está autenticado
// Actualiza this.currentUser

// CÓMO MODIFICAR:
// Agregar renovación automática de token
async checkAuth() {
    const session = await this.getSession();
    if (!session) return;
    
    // Renovar token si está por expirar
    if (this.isTokenExpiringSoon()) {
        await this.renewToken();
    }
}
```

**LOGIN**
```javascript
async login(email, password)
// POST /login-credentials
// O login con Google via /login-google
// Establece cookie de sesión
// Carga perfil del usuario
// Redirige a home

async loginWithGoogle()
// Usa Firebase Google Auth
// Obtiene token de Google
// Llama a /login-google en backend
```

**LOGOUT**
```javascript
async logout()
// POST /logout
// Borra cookie de sesión
// Limpia carrito
// Redirige a login
```

#### 3. Gestión de Perfil

**OBTENER PERFIL**
```javascript
async loadProfile()
// GET /api/profile
// Retorna: DNI, nombre, email, teléfono, dirección, etc.
// Verifica si perfil está completo

// CÓMO MODIFICAR:
// Agregar validación de cambios no guardados
async loadProfile() {
    this.profileBackup = JSON.parse(JSON.stringify(this.currentUser));
    // Resto del código...
}
```

**ACTUALIZAR PERFIL**
```javascript
async updateProfile(profileData)
// PUT /api/profile
// Actualiza datos del usuario
// Valida campos obligatorios
// Muestra confirmación

// CÓMO MODIFICAR:
// Agregar validaciones antes de enviar
async updateProfile(profileData) {
    // Validar DNI
    if (!this.validateDNI(profileData.dni)) {
        this.showToast("DNI inválido", "error");
        return false;
    }
    
    // Validar email
    if (!this.validateEmail(profileData.email)) {
        this.showToast("Email inválido", "error");
        return false;
    }
}
```

**CARGAR FOTO DE PERFIL**
```javascript
async uploadAvatar(file)
// Sube imagen a servidor (ej: Firebase Storage)
// Obtiene URL de imagen
// Actualiza perfil del usuario
// Actualiza foto en UI

// CÓMO MODIFICAR:
// Limitar tamaño y formato
async uploadAvatar(file) {
    // Validar tipo
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
        throw new Error("Solo JPEG o PNG permitidos");
    }
    
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        throw new Error("Tamaño máximo 5MB");
    }
}
```

#### 4. Gestión de Compras

**PROCESAR COMPRA**
```javascript
async checkout()
// POST /api/checkout
// Valida que perfil esté completo
// Envía items del carrito
// Recibe tickets con códigos QR
// Limpia carrito
// Muestra confirmación

// CÓMO MODIFICAR:
// Agregar integración con Stripe
async checkout() {
    // 1. Crear pago en Stripe
    const payment = await this.createStripePayment(this.getCartTotal());
    
    // 2. Confirmar pago en backend
    const checkout_result = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
            items: this.cart,
            total: this.getCartTotal(),
            stripe_payment_id: payment.id
        })
    });
}
```

**OBTENER HISTORIAL**
```javascript
async loadHistory()
// GET /api/history
// Retorna: Todas las compras del usuario
// Muestra en orden cronológico inverso

// CÓMO MODIFICAR:
// Agregar filtros
async loadHistory(filters = {}) {
    const params = new URLSearchParams();
    if (filters.from_date) params.append('from_date', filters.from_date);
    if (filters.to_date) params.append('to_date', filters.to_date);
    if (filters.status) params.append('status', filters.status);
    
    const response = await fetch(`/api/history?${params}`, ...);
}
```

#### 5. Gestión de Datos

**CARGAR EVENTOS**
```javascript
async loadData()
// GET /api/events
// Carga todos los eventos con:
//   - Artistas
//   - Zonas disponibles
//   - Puestos para alquiler

async loadEventDetails(eventId)
// GET /api/events/{eventId}
// Carga detalles completos de un evento
```

**BÚSQUEDA**
```javascript
async initSearch()
// Inicializa funcionalidad de búsqueda
// Filtra eventos por nombre

// CÓMO MODIFICAR:
// Agregar búsqueda avanzada
async initSearch() {
    this.searchIndex = lunr(function() {
        this.field('nombre');
        this.field('descripcion');
        this.ref('id');
        
        // Agregar eventos al índice
        this.events.forEach(event => {
            this.add(event);
        });
    });
}
```

#### 6. Gestión del Tema

**TEMA CLARO/OSCURO**
```javascript
setupTheme()
// Carga tema guardado en localStorage
// Aplica tema a documento
// Configura event listener para toggle

toggleTheme()
// Cambia tema actual
// Guarda preferencia en localStorage
// Sincroniza UI

// CÓMO MODIFICAR:
// Agregar más temas
setupTheme() {
    const themes = ['light', 'dark', 'auto'];
    // Agregar tema 'sepia' para facilidad de lectura
    const themes = ['light', 'dark', 'sepia', 'auto'];
}
```

#### 7. Notificaciones (Toasts)

```javascript
showToast(message, type = 'info', duration = 3000)
// type: 'success', 'error', 'info', 'warning'
// Muestra notificación temporal
// Auto-desaparece después de duration ms

// CÓMO MODIFICAR:
// Agregar sonido a notificaciones
showToast(message, type = 'info', duration = 3000) {
    // ... crear toast ...
    
    // Agregar sonido
    if (type === 'error') {
        this.playSound('error.mp3');
    }
}
```

---

## 2. router.js - Sistema de Rutas SPA

### Propósito
Gestiona navegación entre páginas sin recargar la página (SPA).

### Características Principales

**NAVEGACIÓN**
```javascript
navigate(page, addToHistory = true)
// Cambia a página especificada
// Mantiene histórico del navegador
// Permite botones atrás/adelante

// Rutas disponibles:
// - home: Página de inicio
// - evento: Detalles de evento
// - carrito: Carrito de compras
// - historial: Historial de compras
// - perfil: Perfil del usuario
// - admin: Panel de administración (solo admin)
// - proveedor: Panel de proveedor (solo proveedor)
```

**PARSING DE RUTAS**
```javascript
parseRoute(route)
// Separa: página, query string, query params
// Soporta URLs como: evento?id=123

// Ejemplo:
// Input: "evento?id=evt123&tab=artistas"
// Output: {
//     basePage: "evento",
//     queryParams: { id: "evt123", tab: "artistas" }
// }
```

**CARGA DE CONTENIDO**
```javascript
async loadPage(route)
// 1. Obtiene HTML del partial
// 2. Renderiza en DOM
// 3. Ejecuta función init de página
// 4. Emite evento 'pageLoaded'
// 5. Scroll al top

// CÓMO MODIFICAR:
// Agregar transiciones suaves
async loadPage(route) {
    const content = document.getElementById('page-content');
    
    // Fade out
    content.style.opacity = '0';
    await new Promise(r => setTimeout(r, 200));
    
    // Cambiar contenido
    content.innerHTML = html;
    
    // Fade in
    content.style.opacity = '1';
}
```

---

## 3. login.js - Autenticación

### Funcionalidad Principal

**LOGIN CON EMAIL/PASSWORD**
```javascript
async handleEmailLogin(email, password)
// 1. Valida formato de email
// 2. Valida longitud de contraseña
// 3. Llama Firebase Auth
// 4. Obtiene token de Firebase
// 5. Envía a backend (/login-credentials)
// 6. Establece sesión
// 7. Redirige a home

// CÓMO MODIFICAR:
// Agregar recordar email
async handleEmailLogin(email, password, rememberEmail = false) {
    if (rememberEmail) {
        localStorage.setItem('remembered_email', email);
    }
    // ... resto del código
}
```

**LOGIN CON GOOGLE**
```javascript
async handleGoogleLogin()
// 1. Abre popup de Google
// 2. Usuario autoriza
// 3. Obtiene token de Google
// 4. Envía a backend (/login-google)
// 5. Backend crea usuario si no existe
// 6. Establece sesión
// 7. Redirige a home

// CÓMO MODIFICAR:
// Agregar login con más proveedores (Apple, GitHub, etc)
```

**REGISTRO**
```javascript
async handleRegister(email, password, confirmPassword)
// 1. Valida email único
// 2. Valida contraseña fuerte
// 3. Crea usuario en Firebase Auth
// 4. Crea documento en Firestore
// 5. Login automático
// 6. Redirige a perfil para completar datos

// CÓMO MODIFICAR:
// Agregar verificación de email
async handleRegister(email, password, confirmPassword) {
    // Enviar email de verificación
    await firebase.auth().currentUser.sendEmailVerification();
    this.showToast("Email de verificación enviado");
}
```

---

## 4. Archivos de Páginas (home.js, evento.js, etc.)

### Patrón Común

Cada página tiene una función `init()` que se ejecuta al cargar:

```javascript
async function init() {
    // 1. Obtener parámetros de ruta
    // 2. Cargar datos necesarios
    // 3. Renderizar contenido
    // 4. Configurar event listeners
    // 5. Inicializar componentes (cargar imágenes, etc.)
}

// Ejemplo: evento.js
async function init() {
    const eventId = router.currentRoute.queryParams.get('id');
    const event = await app.loadEventDetails(eventId);
    
    document.getElementById('event-title').textContent = event.nombre;
    document.getElementById('event-description').innerHTML = event.descripcion;
    
    // Renderizar artistas
    renderArtists(event.artistas);
    
    // Renderizar zonas disponibles
    renderZones(event.zonas);
    
    // Configurar botones
    setupEventListeners();
}
```

### Páginas Principales

**home.js**
- Carga eventos principales
- Muestra estadísticas (total eventos, artistas, asistentes)
- Carga noticias desde YAML
- Componentes: listado de eventos, filtros, búsqueda

**evento.js**
- Obtiene evento por ID
- Muestra detalles completos
- Lista artistas
- Muestra zonas disponibles con precios
- Botón "Comprar entrada"

**carrito.js**
- Muestra todos los items del carrito
- Permite actualizar cantidades
- Permite eliminar items
- Calcula totales
- Botón "Finalizar compra"

**historial.js**
- Obtiene compras del usuario
- Muestra en tabla o grid
- Permite descargar recibo (QR)
- Filtros por fecha, estado

**perfil.js**
- Obtiene datos del usuario
- Formulario para editar
- Upload de avatar
- Muestra estado de perfil (completo/incompleto)
- Valida todos los campos

**admin.js** (solo para admin)
- Panel de estadísticas
- Gestión de eventos
- Gestión de usuarios
- Reportes de ventas

**proveedor.js** (solo para proveedores)
- Listado de puestos disponibles
- Formulario para solicitar alquiler
- Historial de alquileres

---

## 5. carrito.js - Gestión del Carrito

### Funciones Principales

```javascript
async addItemToCart(item)
// Añade entrada o puesto al carrito
// Muestra confirmación

async removeItemFromCart(itemId)
// Elimina item del carrito

async updateQuantity(itemId, newQuantity)
// Actualiza cantidad de item

async checkout()
// Valida perfil completo
// Procesa compra
// Muestra tickets con QR
// Limpia carrito

function renderCart()
// Muestra items del carrito
// Muestra totales
// Botones de acciones

// CÓMO MODIFICAR:
// Agregar cupones de descuento
async applyCoupon(couponCode) {
    const response = await fetch("/api/coupons/apply", {
        method: "POST",
        body: JSON.stringify({ coupon_code: couponCode })
    });
    
    const result = await response.json();
    if (result.success) {
        this.discountAmount = result.discount;
        this.discountCode = couponCode;
        this.recalculateTotals();
    }
}
```

---

## 6. Almacenamiento Local (localStorage)

Los datos se almacenan en localStorage para persistencia:

```javascript
// Carrito
localStorage.setItem('cart', JSON.stringify(cart));

// Tema
localStorage.setItem('theme', 'dark' | 'light');

// Preferencias del usuario
localStorage.setItem('user_preferences', JSON.stringify({
    notifications_enabled: true,
    language: 'es'
}));
```

---

## PATRONES COMUNES

### Validación de Datos
```javascript
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validatePassword(password) {
    // Al menos 8 caracteres, mayúscula, número
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[0-9]/.test(password);
}

function validateDNI(dni) {
    // Validación de DNI español
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(dni.substring(0, 8), 10);
    const letter = dni.substring(8, 9).toUpperCase();
    return letters[number % 23] === letter;
}
```

### Llamadas API
```javascript
// Patrón estándar
async function apiCall(endpoint, options = {}) {
    const response = await fetch(endpoint, {
        credentials: 'include', // Incluir cookies
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
    }
    
    return data.data;
}
```

### Manejo de Errores
```javascript
try {
    const result = await someAsyncOperation();
} catch (error) {
    console.error('Error:', error);
    app.showToast(error.message || 'Algo salió mal', 'error');
}
```

---

## MEJORAS SUGERIDAS

1. **Usar TypeScript** para mejor type safety
2. **Implementar Service Workers** para funcionamiento offline
3. **Agregar Progressive Web App (PWA)** capacidades
4. **Usar async/await** consistentemente
5. **Implementar debouncing** en búsqueda
6. **Agregar lazy loading** de imágenes
7. **Minificar y bundlear** JavaScript con Webpack/Rollup
8. **Agregar tests unitarios** con Jest
9. **Implementar Vuex/Redux** para manejo de estado más robusto
10. **Usar framework** (Vue/React) para mejor mantenibilidad
