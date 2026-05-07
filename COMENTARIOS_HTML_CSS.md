# Guía Completa de Comentarios - HTML y CSS

## 1. ESTRUCTURA HTML

### index.html - SPA Principal

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Meta tags para responsivo y encoding -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- CSS -->
    <link rel="stylesheet" href="/static/css/main.css">
    <link rel="stylesheet" href="/static/css/componentes.css">
    
    <!-- Firebase -->
    <script src="https://www.gstatic.com/firebasejs/..."></script>
    
    <!-- Font Awesome para iconos -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/...">
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar">
        <!-- Logo -->
        <!-- Links de navegación -->
        <!-- Carrito badge -->
        <!-- Tema toggle -->
        <!-- Usuario menu -->
    </nav>
    
    <!-- Contenido dinámico -->
    <div id="page-content">
        <!-- Cargado por router.js -->
    </div>
    
    <!-- Footer -->
    <footer class="footer">
        <!-- Links e información -->
    </footer>
    
    <!-- Scripts -->
    <script src="/static/javascript/app.js"></script>
    <script src="/static/javascript/router.js"></script>
    <script src="/static/javascript/login.js"></script>
    <!-- Más scripts... -->
</body>
</html>
```

### login.html - Página de Login

```html
<!-- Estructura -->
<div class="login-container">
    <!-- Sección de login con email/password -->
    <form id="login-form">
        <input type="email" id="email" placeholder="Email">
        <input type="password" id="password" placeholder="Contraseña">
        <input type="checkbox" id="remember-me"> Recuérdame
        <button type="submit">Entrar</button>
    </form>
    
    <!-- Divisor -->
    <div class="divider">O</div>
    
    <!-- Login con Google -->
    <button id="google-login-btn">
        <i class="fab fa-google"></i> Entrar con Google
    </button>
    
    <!-- Link para registrarse -->
    <p>¿No tienes cuenta? <a href="#" id="show-register">Regístrate</a></p>
    
    <!-- Formulario de registro (oculto) -->
    <form id="register-form" style="display:none;">
        <input type="email" id="register-email" placeholder="Email">
        <input type="password" id="register-password" placeholder="Contraseña">
        <input type="password" id="register-confirm" placeholder="Confirmar contraseña">
        <button type="submit">Registrarse</button>
    </form>
</div>

<!-- CÓMO MODIFICAR:
1. Agregar más campos de registro (nombre, teléfono)
2. Agregar términos de servicio
3. Agregar verificación de email
4. Agregar CAPTCHA para prevenir bots
-->
```

### Partials (Componentes Dinámicos)

**home.html**
```html
<!-- Sección Hero -->
<section class="hero">
    <h1>Bienvenido a Subsonic Festival</h1>
    <p>{{ total_eventos }} eventos | {{ total_artistas }} artistas | {{ total_asistentes }} asistentes</p>
</section>

<!-- Grid de eventos -->
<div class="events-grid">
    <!-- Eventos cargados por JavaScript -->
    <div class="event-card" data-page="evento" data-event-id="...">
        <img src="..." alt="evento">
        <h3>Nombre evento</h3>
        <p>Descripción</p>
        <p class="price">Desde €50</p>
    </div>
</div>

<!-- Noticias -->
<section class="news">
    <h2>Últimas noticias</h2>
    <!-- Cargadas desde data.yaml -->
</section>

<!-- CÓMO MODIFICAR:
1. Agregar carrusel de eventos destacados
2. Agregar filtros por género de música
3. Agregar filtros por fecha
4. Agregar búsqueda en tiempo real
-->
```

**evento.html**
```html
<div class="event-detail">
    <!-- Header con imagen -->
    <div class="event-header" style="background-image: url(...)">
        <h1 id="event-title">Nombre del evento</h1>
    </div>
    
    <!-- Detalles principales -->
    <div class="event-info">
        <p><i class="fas fa-calendar"></i> <span id="event-date"></span></p>
        <p><i class="fas fa-map-marker"></i> <span id="event-location"></span></p>
    </div>
    
    <!-- Descripción -->
    <p id="event-description"></p>
    
    <!-- Artistas -->
    <section class="artists">
        <h2>Artistas</h2>
        <div class="artists-grid" id="artists-container"></div>
    </section>
    
    <!-- Zonas disponibles -->
    <section class="zones">
        <h2>Entradas disponibles</h2>
        <div class="zones-grid" id="zones-container">
            <!-- Cada zona es una tarjeta clickeable -->
            <div class="zone-card" data-zone-id="...">
                <h3>VIP</h3>
                <p class="aforo">Aforo: 500</p>
                <p class="price">€150</p>
                <button class="buy-btn">Comprar</button>
            </div>
        </div>
    </section>
</div>

<!-- CÓMO MODIFICAR:
1. Agregar mapa interactivo de zonas
2. Agregar galería de fotos del evento
3. Agregar video promocional
4. Agregar comentarios/reviews
-->
```

**carrito.html**
```html
<div class="cart-container">
    <h1>Carrito de compras</h1>
    
    <!-- Lista de items -->
    <div class="cart-items">
        <!-- Item template -->
        <div class="cart-item">
            <img src="..." alt="item">
            <div class="item-info">
                <h3>Nombre item</h3>
                <p>Evento | Zona</p>
            </div>
            <div class="item-quantity">
                <button class="qty-down">-</button>
                <input type="number" value="1" min="1">
                <button class="qty-up">+</button>
            </div>
            <div class="item-price">
                <span>€150</span>
                <button class="remove-btn" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    </div>
    
    <!-- Resumen -->
    <div class="cart-summary">
        <div class="summary-row">
            <span>Items:</span>
            <span id="total-items">0</span>
        </div>
        <div class="summary-row">
            <span>Subtotal:</span>
            <span id="subtotal">€0.00</span>
        </div>
        <div class="summary-row">
            <span>Impuestos (21%):</span>
            <span id="taxes">€0.00</span>
        </div>
        <div class="summary-row total">
            <span>Total:</span>
            <span id="total">€0.00</span>
        </div>
        
        <!-- Cupón (NUEVO) -->
        <div class="coupon-input">
            <input type="text" id="coupon-code" placeholder="Código de descuento">
            <button id="apply-coupon">Aplicar</button>
        </div>
    </div>
    
    <!-- Botones de acción -->
    <div class="cart-actions">
        <button class="continue-shopping" data-page="home">
            Seguir comprando
        </button>
        <button class="checkout-btn">
            Finalizar compra
        </button>
    </div>
    
    <!-- Carrito vacío -->
    <div id="empty-cart" style="display:none;">
        <p>El carrito está vacío</p>
        <a data-page="home">Ir a eventos</a>
    </div>
</div>

<!-- CÓMO MODIFICAR:
1. Agregar estimado de entrega
2. Agregar protección de comprador
3. Agregar envío digital vs físico
4. Agregar formulario de dirección
-->
```

**perfil.html**
```html
<div class="profile-container">
    <h1>Mi Perfil</h1>
    
    <!-- Avatar -->
    <div class="profile-header">
        <img id="avatar" src="..." alt="Avatar" class="avatar-large">
        <button id="upload-avatar-btn">Cambiar foto</button>
        <input type="file" id="avatar-input" accept="image/*" style="display:none;">
    </div>
    
    <!-- Estado de perfil -->
    <div class="profile-status">
        <h3>Estado del perfil</h3>
        <div class="progress-bar">
            <div class="progress" style="width: 75%"></div>
        </div>
        <p id="profile-completion">75% completado</p>
        <ul id="missing-fields">
            <!-- Campos que faltan -->
        </ul>
    </div>
    
    <!-- Formulario -->
    <form id="profile-form">
        <div class="form-group">
            <label>Nombre y apellidos</label>
            <input type="text" name="nombre_apellidos" required>
        </div>
        
        <div class="form-group">
            <label>DNI</label>
            <input type="text" name="dni" placeholder="12345678A" required>
        </div>
        
        <div class="form-group">
            <label>Fecha de nacimiento</label>
            <input type="date" name="fecha_nacimiento" required>
        </div>
        
        <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" required>
        </div>
        
        <div class="form-group">
            <label>Teléfono</label>
            <input type="tel" name="telefono" required>
        </div>
        
        <div class="form-group">
            <label>Dirección</label>
            <textarea name="direccion" required></textarea>
        </div>
        
        <div class="form-group">
            <label>Número de tarjeta</label>
            <input type="text" name="num_tarjeta" placeholder="XXXX XXXX XXXX XXXX" required>
            <small>⚠️ Información segura - Encriptada</small>
        </div>
        
        <button type="submit" class="save-btn">Guardar cambios</button>
    </form>
</div>

<!-- CÓMO MODIFICAR:
1. Agregar gestión de direcciones múltiples
2. Agregar múltiples métodos de pago
3. Agregar historial de cambios
4. Agregar verificación en dos pasos
-->
```

**historial.html**
```html
<div class="history-container">
    <h1>Mis compras</h1>
    
    <!-- Filtros -->
    <div class="filters">
        <input type="date" id="filter-from" placeholder="Desde">
        <input type="date" id="filter-to" placeholder="Hasta">
        <select id="filter-status">
            <option value="">Todos los estados</option>
            <option value="activa">Activa</option>
            <option value="usada">Usada</option>
            <option value="cancelada">Cancelada</option>
        </select>
        <button id="apply-filters">Filtrar</button>
    </div>
    
    <!-- Tabla de historial -->
    <table class="history-table">
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Evento</th>
                <th>Zona</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody id="history-body">
            <!-- Filas generadas por JavaScript -->
        </tbody>
    </table>
    
    <!-- O vista de tarjetas -->
    <div class="history-cards" id="history-cards">
        <!-- Tarjetas generadas por JavaScript -->
        <div class="history-card">
            <div class="ticket-preview">
                <p>Subsonic Festival 2026</p>
                <p>VIP - Zona A</p>
                <p class="qr-code">
                    <i class="fas fa-qrcode"></i> SUB-XXXXXXXX
                </p>
            </div>
            <div class="ticket-actions">
                <button class="download-btn">Descargar</button>
                <button class="email-btn">Enviar por email</button>
            </div>
        </div>
    </div>
</div>

<!-- CÓMO MODIFICAR:
1. Agregar descarga de PDF
2. Agregar transferencia de entrada
3. Agregar canje de entrada
4. Agregar notificaciones de eventos
-->
```

**admin.html**
```html
<div class="admin-panel">
    <h1>Panel de Administración</h1>
    
    <!-- Tabs -->
    <div class="admin-tabs">
        <button class="tab-btn active" data-tab="dashboard">Dashboard</button>
        <button class="tab-btn" data-tab="events">Eventos</button>
        <button class="tab-btn" data-tab="users">Usuarios</button>
        <button class="tab-btn" data-tab="reports">Reportes</button>
    </div>
    
    <!-- Dashboard -->
    <div id="dashboard" class="tab-content">
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Ingresos totales</h3>
                <p class="big-number">€125.450</p>
            </div>
            <div class="stat-card">
                <h3>Entradas vendidas</h3>
                <p class="big-number">1.250</p>
            </div>
            <div class="stat-card">
                <h3>Usuarios registrados</h3>
                <p class="big-number">850</p>
            </div>
        </div>
        
        <!-- Gráficos -->
        <div class="charts">
            <canvas id="sales-chart"></canvas>
            <canvas id="attendance-chart"></canvas>
        </div>
    </div>
    
    <!-- Gestión de Eventos -->
    <div id="events" class="tab-content" style="display:none;">
        <!-- Tabla de eventos -->
        <table class="events-table">
            <thead>
                <tr>
                    <th>Evento</th>
                    <th>Fecha</th>
                    <th>Entradas vendidas</th>
                    <th>Ingresos</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <!-- Filas dinámicas -->
            </tbody>
        </table>
        
        <button class="create-event-btn">+ Crear evento</button>
    </div>
</div>

<!-- CÓMO MODIFICAR:
1. Agregar charts más avanzados (Chart.js, D3.js)
2. Agregar export de datos (CSV, Excel)
3. Agregar gestión de usuarios (ban, roles)
4. Agregar email masivos
-->
```

---

## 2. ESTILOS CSS

### Estructura de CSS

```
static/css/
├── main.css           (Estilos principales)
├── componentes.css    (Componentes reutilizables)
├── login.css          (Estilos de login)
├── admin.css          (Estilos de admin)
└── [otros...]
```

### main.css - Estilos Base

```css
/* ===== VARIABLES CSS ===== */
:root {
    /* Colores */
    --primary: #1976d2;      /* Azul principal */
    --secondary: #f50057;    /* Rojo/magenta */
    --success: #4caf50;      /* Verde */
    --warning: #ff9800;      /* Naranja */
    --danger: #f44336;       /* Rojo */
    --light: #f5f5f5;        /* Gris claro */
    --dark: #212121;         /* Gris oscuro */
    
    /* Modos de tema */
    --bg-primary: #ffffff;   /* Fondo principal */
    --bg-secondary: #f5f5f5; /* Fondo secundario */
    --text-primary: #212121; /* Texto principal */
    --text-secondary: #666;  /* Texto secundario */
    
    /* Espaciado */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    
    /* Tipografía */
    --font-main: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    --font-size-base: 16px;
    --font-size-sm: 14px;
    --font-size-lg: 20px;
    --font-size-xl: 28px;
}

/* TEMA OSCURO */
body.dark {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2a2a2a;
    --text-primary: #ffffff;
    --text-secondary: #aaa;
}

/* ===== RESET Y ESTILOS BASE ===== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    font-size: var(--font-size-base);
    scroll-behavior: smooth;
}

body {
    font-family: var(--font-main);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
    transition: background-color 0.3s, color 0.3s;
}

/* ===== NAVBAR ===== */
.navbar {
    background-color: var(--primary);
    color: white;
    padding: var(--spacing-md);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.navbar-brand {
    font-size: var(--font-size-xl);
    font-weight: bold;
    text-decoration: none;
    color: white;
}

.navbar-links {
    display: flex;
    gap: var(--spacing-md);
    list-style: none;
}

.navbar-links a {
    color: white;
    text-decoration: none;
    transition: opacity 0.3s;
}

.navbar-links a:hover {
    opacity: 0.8;
}

/* ===== CARRITO BADGE ===== */
.cart-badge {
    background-color: var(--danger);
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
}

/* ===== TEMA TOGGLE ===== */
#theme-toggle {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 20px;
    transition: transform 0.3s;
}

#theme-toggle:hover {
    transform: rotate(20deg);
}

/* ===== GRID DE CONTENIDO ===== */
.events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--spacing-lg);
    padding: var(--spacing-lg);
}

@media (max-width: 768px) {
    .events-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
}

@media (max-width: 480px) {
    .events-grid {
        grid-template-columns: 1fr;
    }
}

/* ===== TARJETAS ===== */
.event-card {
    background-color: var(--bg-secondary);
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.event-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.event-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.event-card > div {
    padding: var(--spacing-md);
}

.event-card h3 {
    margin-bottom: var(--spacing-sm);
}

.event-card .price {
    color: var(--primary);
    font-weight: bold;
    font-size: var(--font-size-lg);
}

/* ===== FORMULARIOS ===== */
.form-group {
    margin-bottom: var(--spacing-md);
}

.form-group label {
    display: block;
    margin-bottom: var(--spacing-sm);
    font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: var(--font-size-base);
    font-family: var(--font-main);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

/* ===== BOTONES ===== */
button {
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: 4px;
    font-size: var(--font-size-base);
    cursor: pointer;
    transition: background-color 0.3s;
}

.btn-primary {
    background-color: var(--primary);
    color: white;
}

.btn-primary:hover {
    background-color: #1565c0;
}

.btn-success {
    background-color: var(--success);
    color: white;
}

.btn-danger {
    background-color: var(--danger);
    color: white;
}

/* ===== FOOTER ===== */
.footer {
    background-color: var(--dark);
    color: white;
    padding: var(--spacing-xl) var(--spacing-lg);
    margin-top: var(--spacing-xl);
    text-align: center;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
    .navbar-links {
        flex-direction: column;
        gap: var(--spacing-sm);
    }
}
```

### componentes.css - Componentes Reutilizables

```css
/* ===== LOADING SPINNER ===== */
.spinner {
    border: 4px solid var(--light);
    border-top: 4px solid var(--primary);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* ===== TOAST/NOTIFICACIONES ===== */
.toast {
    position: fixed;
    bottom: var(--spacing-lg);
    right: var(--spacing-lg);
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    color: white;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.toast.success {
    background-color: var(--success);
}

.toast.error {
    background-color: var(--danger);
}

.toast.info {
    background-color: var(--primary);
}

/* ===== MODAL ===== */
.modal {
    display: none;
    position: fixed;
    z-index: 999;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
}

.modal.active {
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background-color: var(--bg-primary);
    padding: var(--spacing-xl);
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}

.modal-close {
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
    color: var(--text-secondary);
}

/* ===== BADGE ===== */
.badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
}

.badge.primary {
    background-color: var(--primary);
    color: white;
}

.badge.success {
    background-color: var(--success);
    color: white;
}

/* ===== TABLA ===== */
table {
    width: 100%;
    border-collapse: collapse;
    margin: var(--spacing-lg) 0;
}

thead {
    background-color: var(--bg-secondary);
}

th, td {
    padding: var(--spacing-md);
    text-align: left;
    border-bottom: 1px solid #ddd;
}

tbody tr:hover {
    background-color: var(--bg-secondary);
}

/* ===== PROGRESS BAR ===== */
.progress-bar {
    width: 100%;
    height: 8px;
    background-color: var(--light);
    border-radius: 4px;
    overflow: hidden;
    margin: var(--spacing-md) 0;
}

.progress {
    height: 100%;
    background-color: var(--success);
    transition: width 0.3s ease;
}
```

---

## CÓMO MODIFICAR Y EXTENDER

### Agregar Nuevo Componente de Página

1. Crear archivo HTML en `view/templates/partials/`
2. Crear archivo JavaScript con función `init()`
3. Importar JavaScript en `index.html`
4. Agregar ruta en `router.js`

### Agregar Nuevo Estilo Global

1. Editar `static/css/main.css`
2. Agregar variables en `:root`
3. Aplicar estilos a elementos

### Temas Personalizados

```css
/* Agregar nuevo tema */
body.sepia {
    --bg-primary: #f4eae0;
    --text-primary: #333;
    --primary: #8b4513;
}

/* Aplicar tema */
localStorage.setItem('theme', 'sepia');
document.body.classList.add('sepia');
```

---

## MEJORAS SUGERIDAS

1. **Usar SASS/SCSS** para mejor organización
2. **Implementar Sistema de Diseño** (Design System)
3. **Agregar Tailwind CSS** para utilidades
4. **Optimizar imágenes** (WebP, srcset)
5. **Agregar animaciones** más sofisticadas
6. **Usar CSS Grid más avanzadamente**
7. **Agregar PWA styling**
8. **Optimizar para impresión** (@media print)
9. **Agregar soporte para RTL** (idiomas de derecha a izquierda)
10. **Usar custom properties dinámicas**
