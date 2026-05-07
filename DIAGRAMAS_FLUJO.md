# 📊 DIAGRAMAS DE FLUJO - SUBSONIC FESTIVAL

## 1️⃣ FLUJO DE REGISTRO Y LOGIN

```
┌─────────────────────────────────────────────────────────┐
│                 USUARIO EN LOGIN.HTML                   │
│        (Muestra opciones de login)                      │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    ┌─────▼────────┐    ┌──────▼──────────┐
    │ Login con    │    │ Login con       │
    │ Credenciales │    │ Google OAuth    │
    └─────┬────────┘    └──────┬──────────┘
          │                    │
          └──────────┬─────────┘
                     │
          ┌──────────▼──────────┐
          │  Firebase Auth      │
          │  - Verifica datos   │
          │  - Genera JWT       │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │ POST /login-google  │
          │ o /login-credentials│
          │  (controller.py)    │
          └──────────┬──────────┘
                     │
    ┌────────────────┴────────────────┐
    │ ¿Usuario existe en Firestore?   │
    └────────────────┬────────────────┘
              NO    │    SÍ
         ┌──────────┴──────────┐
         │                     │
    ┌────▼────────────┐   ┌───▼──────────────┐
    │ Crear documento │   │ Recuperar datos  │
    │ en Firestore    │   │ de Firestore     │
    │ collections:    │   │                  │
    │ - users         │   │ userDAO.py       │
    │ - users_extended│   │                  │
    └────┬────────────┘   └───┬──────────────┘
         │                    │
         └────────┬───────────┘
                  │
         ┌────────▼──────────┐
         │ Crear Sesión      │
         │ (en memoria)      │
         │ - session_id      │
         │ - user_id         │
         │ - role            │
         │ - avatar_url      │
         └────────┬──────────┘
                  │
         ┌────────▼──────────┐
         │ Guardar sesión en │
         │ cookie HttpOnly   │
         │ (30 días opcional)│
         └────────┬──────────┘
                  │
         ┌────────▼──────────┐
         │ Retornar JSON     │
         │ { success: true,  │
         │   avatar_url,     │
         │   role }          │
         └────────┬──────────┘
                  │
         ┌────────▼──────────┐
         │ Frontend: Guardar │
         │ sesión en app.js  │
         │ Mostrar avatar    │
         │ Redirigir a /app  │
         └────────────────────┘
```

---

## 2️⃣ FLUJO DE AGREGAR AL CARRITO

```
┌──────────────────────────────────────┐
│ Usuario en evento.html               │
│ Selecciona zona y cantidad           │
└────────────────┬─────────────────────┘
                 │
        ┌────────▼────────────┐
        │ Click "Agregar al"  │
        │ carrito             │
        └────────┬────────────┘
                 │
        ┌────────▼─────────────────────┐
        │ evento.js::addToCart()        │
        │ Recolecta:                   │
        │ - evento_id                  │
        │ - zona_id                    │
        │ - cantidad                   │
        │ - precio                     │
        └────────┬─────────────────────┘
                 │
        ┌────────▼──────────────┐
        │ POST /api/cart/add    │
        │ (controller.py)       │
        │ require_auth()        │
        └────────┬──────────────┘
                 │
    ┌────────────▼────────────────┐
    │ ¿Sesión válida?             │
    └────────────┬────────────────┘
          SÍ    │    NO
              ┌─┘└──────────────┐
              │                 │
         ┌────▼────────┐   ┌───▼──────┐
         │ Continuar   │   │ Error 401│
         │             │   │ Retornar │
         └────┬────────┘   └──────────┘
              │
    ┌─────────▼──────────┐
    │ model.py:          │
    │ get_event_by_id()  │
    │ Obtiene detalles   │
    │ evento y zona      │
    └─────────┬──────────┘
              │
    ┌─────────▼──────────────┐
    │ Validar:               │
    │ - Zona existe          │
    │ - Aforo disponible     │
    │ - Tipo = "ticket"      │
    └─────────┬──────────────┘
              │
        ┌─────▼──────────┐
        │ ¿Válido?        │
        └─────┬──────────┘
       NO    │    SÍ
    ┌────────┴────────────┐
    │                     │
┌───▼──────────┐   ┌─────▼──────────┐
│ Error 400    │   │ cartDTO.add_   │
│ Retornar     │   │ item()         │
└──────────────┘   │                │
                   │ Calcula:       │
                   │ - subtotal     │
                   │ - impuestos    │
                   │ - total        │
                   └─────┬──────────┘
                         │
                  ┌──────▼────────┐
                  │ Guardar en:   │
                  │ - localStorage│
                  │ - sessions[]  │
                  └──────┬────────┘
                         │
                  ┌──────▼────────┐
                  │ Retornar JSON │
                  │ { success:    │
                  │   true,       │
                  │   cart: {...} │
                  │ }             │
                  └──────┬────────┘
                         │
                  ┌──────▼─────────┐
                  │ Frontend:      │
                  │ - Actualizar   │
                  │   carrito      │
                  │ - Mostrar      │
                  │   notificación │
                  │ - Actualizar   │
                  │   badge        │
                  └────────────────┘
```

---

## 3️⃣ FLUJO DE COMPRA (CHECKOUT)

```
┌──────────────────────────────────────────┐
│ Usuario en carrito.html                  │
│ Items en carrito, listo para comprar     │
└────────────────┬─────────────────────────┘
                 │
        ┌────────▼──────────────┐
        │ Click "Comprar"       │
        │ carrito.js::checkout()│
        └────────┬──────────────┘
                 │
        ┌────────▼──────────────────────┐
        │ POST /api/checkout            │
        │ (controller.py)               │
        │ Envía: carrito completo       │
        └────────┬──────────────────────┘
                 │
        ┌────────▼──────────────┐
        │ Validaciones 1:       │
        │ - require_auth()      │
        │ - ¿Sesión válida?    │
        └────────┬──────────────┘
            NO  │   SÍ
         ┌──────┴────────┐
    ┌────▼─────┐   ┌────▼──────────┐
    │ Error 401│   │ Continuar      │
    └──────────┘   └────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │ Validaciones 2:      │
              │ - ¿Perfil completo? │
              │ - Todos campos reqs  │
              └──────────┬───────────┘
                   NO   │   SÍ
              ┌─────────┴────────┐
          ┌───▼─────┐   ┌───────▼──┐
          │ Error   │   │ Continuar │
          │ 400     │   └───┬───────┘
          └─────────┘       │
                      ┌─────▼─────────────┐
                      │ model.py:         │
                      │ process_purchase()│
                      │                   │
                      │ Para cada item:   │
                      │ 1. Generar QR     │
                      │ 2. Crear ticket   │
                      │ 3. Guardar en     │
                      │    Firestore      │
                      └─────┬─────────────┘
                            │
                      ┌─────▼────────┐
                      │ _generate_   │
                      │ qr_code()    │
                      │              │
                      │ Formato:     │
                      │ "SUB-XXXXX"  │
                      └─────┬────────┘
                            │
                      ┌─────▼──────────────┐
                      │ Crear TicketDTO    │
                      │ - id               │
                      │ - usuario_id       │
                      │ - evento_id        │
                      │ - zona_id          │
                      │ - localizador_qr   │
                      │ - precio           │
                      │ - estado: "Activa" │
                      └─────┬──────────────┘
                            │
                      ┌─────▼────────────────┐
                      │ firebaseTicketDAO:   │
                      │ add_ticket()         │
                      │                      │
                      │ Guarda en Firestore: │
                      │ /tickets/{id}        │
                      └─────┬────────────────┘
                            │
                      ┌─────▼─────────────┐
                      │ Limpiar carrito:  │
                      │ - localStorage    │
                      │ - sessions[]      │
                      │ - Firestore cart  │
                      └─────┬─────────────┘
                            │
                      ┌─────▼───────────┐
                      │ Retornar JSON:  │
                      │ { success: true,│
                      │   tickets: [...],
                      │   qr_codes: [...] 
                      │ }               │
                      └─────┬───────────┘
                            │
                      ┌─────▼──────────────┐
                      │ Frontend:          │
                      │ - Mostrar QRs      │
                      │ - Opción descargar │
                      │ - Botón imprimir   │
                      │ - Redirigir a      │
                      │   historial        │
                      └────────────────────┘
```

---

## 4️⃣ FLUJO DE CONSULTAR HISTORIAL

```
┌──────────────────────────────────────┐
│ Usuario en historial.html            │
│ (Carga de página)                    │
└────────────────┬─────────────────────┘
                 │
        ┌────────▼─────────────────┐
        │ historial.js::init()     │
        │ Al cargar la página      │
        └────────┬─────────────────┘
                 │
        ┌────────▼──────────────┐
        │ GET /api/history      │
        │ (controller.py)       │
        └────────┬──────────────┘
                 │
        ┌────────▼──────────────┐
        │ require_auth()        │
        │ ¿Sesión válida?       │
        └────────┬──────────────┘
            NO  │   SÍ
         ┌──────┴────────┐
    ┌────▼─────┐   ┌────▼──────────┐
    │ Error 401│   │ Continuar      │
    └──────────┘   └────┬───────────┘
                        │
             ┌──────────▼────────────┐
             │ model.py:             │
             │ get_user_history()    │
             │                       │
             │ Obtiene usuario_id    │
             │ de sesión             │
             └──────────┬────────────┘
                        │
             ┌──────────▼────────────┐
             │ firebaseTicketDAO:    │
             │ get_tickets_by_user() │
             │                       │
             │ Query:                │
             │ WHERE usuario_id      │
             │   == session_user_id  │
             │ ORDER BY fecha DESC   │
             └──────────┬────────────┘
                        │
             ┌──────────▼────────────┐
             │ Firestore retorna:    │
             │ Array de tickets      │
             └──────────┬────────────┘
                        │
             ┌──────────▼────────────┐
             │ Enriquecer tickets:   │
             │ - Evento info         │
             │ - Zona info           │
             │ - Artistas del evento │
             │ - Convertir fechas    │
             └──────────┬────────────┘
             │
             ┌──────────▼────────────┐
             │ Retornar JSON:        │
             │ { tickets: [          │
             │   { id,              │
             │     evento,          │
             │     zona,            │
             │     qr_code,         │
             │     fecha_compra,    │
             │     estado },        │
             │   ...                │
             │ ]}                   │
             └──────────┬────────────┘
                        │
             ┌──────────▼────────────┐
             │ Frontend:             │
             │ historial.js          │
             │ renderiza HTML:       │
             │ <table> con tickets   │
             │ Muestra:              │
             │ - Evento              │
             │ - Zona                │
             │ - QR                  │
             │ - Fecha               │
             │ - Estado              │
             │ - Botón descargar QR  │
             │ - Botón imprimir      │
             └────────────────────────┘
```

---

## 5️⃣ FLUJO DE AUTENTICACIÓN (VALIDACIÓN DE TOKEN)

```
┌──────────────────────────────────────────┐
│ Cualquier solicitud al servidor          │
│ Con cookie de sesión                     │
└────────────────┬─────────────────────────┘
                 │
        ┌────────▼──────────────────┐
        │ request.cookies           │
        │ Obtiene session_id        │
        └────────┬──────────────────┘
                 │
        ┌────────▼───────────────────┐
        │ require_auth() en           │
        │ controller.py               │
        │                            │
        │ ¿Cookie contiene           │
        │  session_id?               │
        └────────┬───────────────────┘
           NO   │    SÍ
        ┌───────┴──────────┐
    ┌───▼──────┐   ┌──────▼────────┐
    │ Error 401│   │ Continuar      │
    │ No auth  │   └────┬───────────┘
    └──────────┘        │
                ┌───────▼──────────┐
                │ Buscar sesión    │
                │ en sessions      │
                │ dictionary       │
                └───────┬──────────┘
                   NO  │  SÍ
                ┌──────┴──────┐
            ┌───▼──────┐   ┌─▼────────┐
            │ Error 401│   │ Validar: │
            └──────────┘   │ - timeout │
                           │ - datos   │
                           └───┬──────┘
                          NO  │  SÍ
                       ┌──────┴──────┐
                   ┌───▼──────┐   ┌──▼────────┐
                   │ Error 401│   │ Autorizar │
                   └──────────┘   │           │
                                  │ Retornar: │
                                  │ - user_id │
                                  │ - role    │
                                  └─────┬─────┘
                                        │
                                   ┌────▼─────┐
                                   │ Continuar │
                                   │ endpoint  │
                                   └──────────┘
```

---

## 6️⃣ FLUJO DE NAVEGACIÓN (SPA - ROUTER)

```
┌────────────────────────────────┐
│ Usuario en index.html (SPA)    │
│ app.js cargado                 │
└────────────┬───────────────────┘
             │
    ┌────────▼──────────────┐
    │ Router::init()        │
    │ Añade listeners a:    │
    │ - Links de navbar     │
    │ - Eventos popstate    │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────┐
    │ Usuario clickea link  │
    │ ej: "Eventos"        │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────┐
    │ Router::navigate()    │
    │ Decodifica URL        │
    │ ej: #/eventos        │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────┐
    │ Router::loadPage()    │
    │                       │
    │ fetch('/partials/'    │
    │   + pageName)         │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────┐
    │ Backend:              │
    │ GET /partials/eventos │
    │ (en controller.py     │
    │  o servidas por       │
    │  Jinja2)              │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────┐
    │ Retorna HTML del      │
    │ partial               │
    │ eventos.html          │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────┐
    │ Frontend:             │
    │ - Inyecta HTML en     │
    │   #page-content       │
    │ - Actualiza URL hash  │
    │ - Cambia navbar activo│
    └────────┬──────────────┘
             │
    ┌────────▼──────────────┐
    │ Router::              │
    │ executePageInit()     │
    │                       │
    │ Busca evento.js       │
    │ Ejecuta init()        │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────┐
    │ evento.js::init()     │
    │ - Carga datos         │
    │ - Renderiza eventos   │
    │ - Agrega listeners    │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────┐
    │ Página lista para     │
    │ interacción           │
    └───────────────────────┘
```

---

## 7️⃣ FLUJO DE GESTIÓN DE PERFIL (COMPLETAR DATOS)

```
┌──────────────────────────────────────┐
│ Usuario en perfil.html               │
│ ¿Perfil incompleto?                  │
└────────────────┬─────────────────────┘
                 │
        ┌────────▼──────────────────┐
        │ GET /api/profile          │
        │ (controller.py)           │
        └────────┬──────────────────┘
                 │
        ┌────────▼──────────────────┐
        │ require_auth()            │
        └────────┬──────────────────┘
                 │
        ┌────────▼──────────────────┐
        │ model.get_user_profile()  │
        │                           │
        │ Obtiene:                  │
        │ - users collection        │
        │ - users_extended          │
        │ - Combina datos           │
        └────────┬──────────────────┘
                 │
        ┌────────▼──────────────────┐
        │ Retorna JSON con:         │
        │ - email                   │
        │ - role                    │
        │ - dni (si existe)         │
        │ - nombre_apellidos        │
        │ - fecha_nacimiento        │
        │ - telefono                │
        │ - direccion               │
        │ - avatar_url              │
        └────────┬──────────────────┘
                 │
        ┌────────▼──────────────────┐
        │ Frontend: perfil.js       │
        │ Muestra formulario con:   │
        │ - Campos requeridos:      │
        │   (validación)            │
        │   - DNI                   │
        │   - Nombre y apellidos    │
        │   - Teléfono              │
        │   - Dirección             │
        │   - Fecha nacimiento      │
        │ - Campos opcionales:      │
        │   - Avatar                │
        └────────┬──────────────────┘
                 │
        ┌────────▼──────────────────┐
        │ Usuario completa y        │
        │ click "Guardar"           │
        └────────┬──────────────────┘
                 │
        ┌────────▼──────────────────┐
        │ POST /api/profile         │
        │ Envía: datos completos    │
        └────────┬──────────────────┘
                 │
        ┌────────▼──────────────────┐
        │ Validaciones en backend:  │
        │ - DNI válido              │
        │ - Teléfono válido         │
        │ - Dirección no vacía      │
        │ - Fecha_nacimiento válida │
        │ - Email válido            │
        └────────┬──────────────────┘
           NO   │    SÍ
        ┌───────┴────────────┐
    ┌───▼──────────┐  ┌─────▼────────────┐
    │ Error 400    │  │ Actualizar en    │
    │ Datos        │  │ Firestore:       │
    │ inválidos    │  │ users_extended   │
    └──────────────┘  │ collection       │
                      └─────┬────────────┘
                            │
                      ┌─────▼────────────┐
                      │ Retornar:        │
                      │ { success: true, │
                      │   perfil_completo: true
                      │ }                │
                      └─────┬────────────┘
                            │
                      ┌─────▼────────────┐
                      │ Frontend:        │
                      │ - Mostrar        │
                      │   notificación   │
                      │ - Redirigir a    │
                      │   siguiente paso │
                      │ - O a home       │
                      └──────────────────┘
```

---

## 8️⃣ FLUJO DE ESTRUCTURA DE DATOS

```
                      ┌─────────────────┐
                      │   Firestore     │
                      │   Database      │
                      └────────┬────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         ┌──────▼───┐  ┌───────▼────┐  ┌────▼──────┐
         │  users   │  │  events    │  │   tickets │
         │  coll.   │  │  coll.     │  │   coll.   │
         └────┬─────┘  └────┬───────┘  └────┬──────┘
              │             │              │
       ┌──────▼──┐   ┌──────▼──┐     ┌─────▼───┐
       │ {        │   │ {        │     │ {       │
       │  id:uid, │   │  id:evt, │     │  id:tkt,│
       │  email,  │   │  nombre, │     │  usr_id,│
       │  role    │   │  fecha_* │     │  evt_id,│
       │ }        │   │ }        │     │  qr_cod │
       └──────────┘   └──────────┘     │ }       │
                                       └─────────┘
         
         ┌──────────────────┐   ┌──────────────────┐
         │ users_extended   │   │ zones            │
         │ collection       │   │ collection       │
         └────┬─────────────┘   └────┬─────────────┘
              │                      │
       ┌──────▼──┐          ┌────────▼───┐
       │ {        │          │ {          │
       │  id:uid, │          │  id: zone, │
       │  dni,    │          │  evt_id,   │
       │  nombre, │          │  nombre,   │
       │  tfno,   │          │  precio,   │
       │  dir,    │          │  tipo      │
       │  avatar  │          │ }          │
       │ }        │          └────────────┘
       └──────────┘
```

---

## 9️⃣ FLUJO DE DATOS: VISTA GENERAL

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              Frontend (JavaScript/HTML/CSS)                 │
│          ┌─────────────────────────────────────┐           │
│          │ index.html (SPA Shell)              │           │
│          │ - Navbar                            │           │
│          │ - #page-content (dinámico)          │           │
│          │ - Footer                            │           │
│          └────────────────┬────────────────────┘           │
│                           │                                 │
│          ┌────────────────▼────────────────┐               │
│          │ app.js (SubsonicApp)            │               │
│          │ - Gestiona estado global        │               │
│          │ - Carrito en memoria            │               │
│          │ - Usuario autenticado           │               │
│          │ - Tema                          │               │
│          └────────────────┬────────────────┘               │
│                           │                                 │
│          ┌────────────────▼────────────────┐               │
│          │ router.js (Router)              │               │
│          │ - SPA routing (#/page)          │               │
│          │ - Carga partials               │               │
│          │ - Ejecuta init de página       │               │
│          └────────────────┬────────────────┘               │
│                           │                                 │
│          ┌────────────────▼────────────────┐               │
│          │ Páginas específicas (evento,    │               │
│          │ carrito, perfil, etc)          │               │
│          │ + CSS personalizado             │               │
│          └────────────────┬────────────────┘               │
│                           │                                 │
│                fetch API  │                                 │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                HTTP/HTTPS  │ JSON
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                                                             │
│         Backend (FastAPI / Python)                         │
│          ┌─────────────────────────────────────┐           │
│          │ controller.py (FastAPI Router)      │           │
│          │ - /login, /logout                  │           │
│          │ - /api/events, /api/home           │           │
│          │ - /api/checkout, /api/history      │           │
│          │ - /api/cart/*, /api/zones/*        │           │
│          └────────────────┬────────────────────┘           │
│                           │                                 │
│          ┌────────────────▼────────────────┐               │
│          │ model.py (Business Logic)       │               │
│          │ - process_purchase()            │               │
│          │ - get_user_history()            │               │
│          │ - get_event_by_id()             │               │
│          │ - _generate_qr_code()           │               │
│          └────────────────┬────────────────┘               │
│                           │                                 │
│          ┌────────────────▼────────────────┐               │
│          │ DAO Factory + DTOs              │               │
│          │ - userDAO                        │               │
│          │ - eventDAO                       │               │
│          │ - ticketDAO                      │               │
│          │ - zoneDAO, cartDAO, etc.        │               │
│          └────────────────┬────────────────┘               │
│                           │                                 │
│                 Firestore API
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                    Google Cloud
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                                                             │
│              Firebase Firestore (Database)                 │
│          ┌─────────────────────────────────────┐           │
│          │ Collections:                        │           │
│          │ - users                             │           │
│          │ - users_extended                    │           │
│          │ - events                            │           │
│          │ - zones                             │           │
│          │ - stands                            │           │
│          │ - artists                           │           │
│          │ - tickets                           │           │
│          │ - carts                             │           │
│          └─────────────────────────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔟 FLUJO DE AUTENTICACIÓN GENERAL

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  1. Usuario no autenticado                          │
│     ↓                                               │
│  2. Accede a https://subsonic-festival.com          │
│     ↓                                               │
│  3. Se carga index.html + app.js + router.js        │
│     ↓                                               │
│  4. app.js::checkAuth() valida sesión               │
│     ├─ ¿Hay cookie de sesión?                      │
│     └─ Si no → Redirige a login.html                │
│     ↓                                               │
│  5. Usuario en login.html                           │
│     └─ Opción 1: Login con email/password           │
│     └─ Opción 2: Login con Google                   │
│     ↓                                               │
│  6. Firebase Auth autentica                         │
│     ├─ Si falla → Muestra error                     │
│     └─ Si éxito → Retorna JWT                       │
│     ↓                                               │
│  7. Frontend llama POST /login-credentials          │
│     o POST /login-google                            │
│     ↓                                               │
│  8. Backend (controller.py):                        │
│     ├─ Valida JWT                                   │
│     ├─ Busca usuario en Firestore                   │
│     ├─ Si no existe → create_user_in_firestore()    │
│     ├─ Crea sesión en memoria                       │
│     └─ Retorna { success, avatar_url, role }        │
│     ↓                                               │
│  9. Frontend:                                       │
│     ├─ Guarda sesión                                │
│     ├─ Cookie con session_id                        │
│     ├─ Redirige a /app                              │
│     ↓                                               │
│ 10. Usuario AUTENTICADO                             │
│     ├─ Puede acceder a /app                         │
│     ├─ Puede hacer API calls                        │
│     └─ Cookie se envía automáticamente              │
│     ↓                                               │
│ 11. Para cada request protegido:                    │
│     ├─ Extrae session_id de cookie                  │
│     ├─ Busca en sesiones dictionary                 │
│     ├─ Valida que no ha expirado                    │
│     └─ Continúa o retorna 401                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Resumen: Ciclo Completo Usuario

```
1. LLEGA AL SITIO
   login.html (no autenticado)
   
2. SE REGISTRA/LOGUEA
   Firebase Auth → Backend → Sesión creada
   
3. VE EL APP
   /app → index.html → app.js cargado
   
4. EXPLORA EVENTOS
   Router → carga evento.html → muestra eventos
   
5. AGREGA AL CARRITO
   Click → evento.js → POST /api/cart/add
   
6. VE CARRITO
   Router → carrito.html → muestra items
   
7. VA A CHECKOUT
   Valida perfil → si falta, va a perfil.html
   
8. COMPLETA PERFIL
   Llena formulario → POST /api/profile
   
9. COMPRA
   POST /api/checkout → Genera tickets → QRs
   
10. VE HISTORIAL
    Router → historial.html → GET /api/history
    
11. DESCARGAR/IMPRIMIR
    QR codes con localizador
    
12. LOGOUT
    Click logout → Clear sesión → login.html
```

---

¡Con estos diagramas puedes entender el flujo completo del proyecto! 🎉
