/**
 * ROUTER.JS - ENRUTADOR SPA CON NAVEGACIÓN HASH-BASED
 * 
 * PROPÓSITO: Controla navegación de la Single Page Application sin recargar página.
 * Utiliza URL hashes (#home, #evento?id=1) para mantener historial del navegador.
 * 
 * CÓMO FUNCIONA:
 * 1. Usuario clica elemento [data-page="home"]
 * 2. navigate() actualiza URL a #home
 * 3. loadPage() hace fetch de /partials/home
 * 4. Inyecta HTML en #page-content
 * 5. Llama initHome() para setup de eventos y datos
 * 6. Botones atrás/adelante del navegador funcionan (event popstate)
 * 
 * ARQUITECTURA:
 * - Router: Clase singleton que controla navegación
 * - URL basadas en hashes: #pageName o #pageName?param=value
 * - Cada página tiene función init: window.initHome(), window.initEvento(), etc
 * - Router mapea página a su función init en initMap
 * 
 * FLUJO COMPLETO NAVEGACIÓN:
 * click [data-page="evento"]
 *   → eventListener en document.addEventListener('click')
 *   → navigate("evento", true)
 *   → history.pushState() actualiza URL a #evento
 *   → loadPage("evento")
 *   → fetch /partials/evento
 *   → content.innerHTML = HTML recibido
 *   → executePageInit("evento")
 *   → window.initEvento() ejecuta setup de página
 *   → Dispatch custom event 'pageLoaded'
 * 
 * EJEMPLO EXTENSIÓN PARA NUEVA PÁGINA:
 * 1. Crear /partials/nueva.html con estructura
 * 2. Crear /static/javascript/nueva.js con:
 *    window.initNueva = async function() {
 *      const data = await window.app.getEventsData();
 *      renderItems(data);
 *    }
 * 3. Agregar en router.js initMap: nueva: window.initNueva
 * 4. Agregar en router.js titles: nueva: 'Página Nueva'
 * 5. En HTML: <a href="#" data-page="nueva">Nueva</a>
 */

/**
 * CLASE ROUTER - Controla toda la navegación SPA
 * Se instancia una única vez cuando el DOM está listo.
 * Accesible globalmente como window.router
 */
class Router {
    /**
     * CONSTRUCTOR - Inicializa el router
     * Propiedades:
     * - currentPage: Página actual cargada (string)
     * Luego invoca init() para setup
     */
    constructor() {
        this.currentPage = null;  // Página actual renderizada
        this.init();  // Inicializar listeners y cargar página inicial
    }

    /**
     * INIT - Configura listeners y carga página inicial
     * 
     * Setup realizado:
     * 1. addEventListener('click') en [data-page] para navegación
     * 2. addEventListener('popstate') para atrás/adelante navegador
     * 3. Cargar página inicial desde URL hash o 'home' por defecto
     */
    init() {
        // ===================================================
        // LISTENER 1: Click en enlaces de navegación
        // ===================================================
        // Cuando usuario clica cualquier elemento [data-page="pageName"]
        // Ej: <a href="#" data-page="evento" class="nav-link">Evento</a>
        document.addEventListener('click', (e) => {
            // closest() busca hacia arriba en árbol DOM
            // Encuentra element o su padre que sea [data-page]
            const link = e.target.closest('[data-page]');
            if (!link) return;  // No es un enlace de navegación, ignorar

            e.preventDefault();  // Evitar comportamiento por defecto del enlace
            const page = link.getAttribute('data-page');
            if (page) {
                this.navigate(page);  // Navegar a página
            }
        });

        // ===================================================
        // LISTENER 2: Botones atrás/adelante del navegador
        // ===================================================
        // Cuando usuario presiona botón atrás o adelante
        // History API dispara evento 'popstate'
        window.addEventListener('popstate', (e) => {
            // e.state.page contiene página guardada en history
            // Fallback a URL hash o 'home' si no hay state
            const page = e.state?.page || this.getRouteFromHash() || 'home';
            this.loadPage(page);  // Cargar página sin agregar a historio (popstate lo hace)
        });

        // ===================================================
        // CARGA DE PÁGINA INICIAL
        // ===================================================
        // Si usuario accede a URL con hash (#evento?id=1) → cargar esa página
        // Si accede a URL base (sin hash) → cargar 'home'
        const initialPage = this.getRouteFromHash() || 'home';
        this.loadPage(initialPage);
    }

    /**
     * GET ROUTE FROM HASH - Extrae página de URL hash
     * 
     * URL hash es lo que viene después de #
     * Ejemplos:
     * - window.location.hash = "#home" → retorna "home"
     * - window.location.hash = "#evento?id=123" → retorna "evento?id=123"
     * - window.location.hash = "" → retorna null
     * 
     * @returns {string|null} Página y parámetros desde URL hash, o null si no existe
     * 
     * DETALLES TÉCNICOS:
     * - slice(1) elimina el # inicial
     * - decodeURIComponent() convierte caracteres codificados
     *   (ej: %20 → espacio, %3F → ?)
     */
    getRouteFromHash() {
        const hash = window.location.hash.slice(1);  // Quitar # inicial
        
        // Decodificar URL safe
        try {
            return decodeURIComponent(hash);  // Convierte caracteres codificados
        } catch (e) {
            // Si hay error en decoding, retornar hash como está
            return hash;
        }
    }

    /**
     * PARSE ROUTE - Separa página de parámetros query
     * 
     * Las rutas pueden incluir parámetros:
     * - "home" → solo página
     * - "evento?id=123" → página + parámetro
     * - "evento?id=123&type=premium" → página + múltiples parámetros
     * 
     * Este método separa y parsea para acceso fácil.
     * 
     * @param {string} route - Ruta completa (ej: "evento?id=123")
     * @returns {Object} Objeto con:
     *   - route: Ruta original
     *   - basePage: Nombre de página (ej: "evento")
     *   - queryString: String parámetros (ej: "id=123&type=premium")
     *   - queryParams: URLSearchParams para acceso fácil {id: "123", type: "premium"}
     * 
     * EJEMPLO:
     * const parsed = parseRoute("evento?id=123&type=premium");
     * console.log(parsed.basePage);  // "evento"
     * console.log(parsed.queryParams.get('id'));  // "123"
     * console.log(parsed.queryParams.get('type'));  // "premium"
     */
    parseRoute(route) {
        // Encontrar posición del "?" que separa página de parámetros
        const questionMarkIndex = route.indexOf('?');
        let basePage = route;
        let queryString = '';
        
        // Si hay "?", separar
        if (questionMarkIndex !== -1) {
            // basePage = parte antes de "?"
            // queryString = parte después de "?"
            basePage = route.substring(0, questionMarkIndex);
            queryString = route.substring(questionMarkIndex + 1);
        }
        
        // URLSearchParams parsea query string automáticamente
        // Ej: "id=123&type=premium" → {id: "123", type: "premium"}
        return {
            route,  // Ruta original
            basePage: basePage || 'home',  // Usar 'home' si basePage vacía
            queryString,  // String params (ej: "id=123")
            queryParams: new URLSearchParams(queryString)  // Params parseados
        };
    }

    /**
     * NAVIGATE - Cambia a página especificada
     * 
     * Esta es la función principal para cambiar de página.
     * Actualiza URL hash y carga página.
     * 
     * @param {string} page - Página a navegar (ej: "evento", "evento?id=123")
     * @param {boolean} addToHistory - Agregar a historial (default: true)
     *   - true: Botones atrás/adelante funcionarán
     *   - false: No agrega a historial (usado por popstate)
     * 
     * EJEMPLOS:
     * - this.navigate("home") → URL = #home
     * - this.navigate("evento?id=123") → URL = #evento?id=123
     * - this.navigate("home", false) → Navega sin historial
     * 
     * VALIDACIONES:
     * - Si ya estamos en página actual, retorna (no hacer nada)
     */
    navigate(page, addToHistory = true) {
        // Si ya estamos en esa página, no hacer nada
        if (this.currentPage === page) return;

        if (addToHistory) {
            // Agregar a historial del navegador
            // history.pushState(state, title, url)
            // - state: objeto que popstate recupera
            // - title: título (ignorado por navegadores)
            // - url: nueva URL (debe ser misma origin)
            window.history.pushState({ page }, '', `#${page}`);
        }

        // Cargar página (loadPage manejará el fetch y setup)
        this.loadPage(page);
    }

    /**
     * LOAD PAGE - Carga HTML de página e inicializa
     * 
     * Proceso completo:
     * 1. Parse ruta (página + parámetros)
     * 2. Fetch HTML de /partials/{basePage}
     * 3. Inyectar HTML en #page-content
     * 4. Actualizar navegación (marca enlace activo)
     * 5. Actualizar title de página
     * 6. Ejecutar función init de página
     * 7. Dispatch custom event 'pageLoaded'
     * 8. Scroll hacia arriba
     * 
     * @param {string} route - Ruta a cargar (ej: "evento?id=123")
     * 
     * FLUJO TÉCNICO:
     * 1. const {basePage} = parseRoute(route);
     * 2. fetch("/partials/evento") → recibe HTML
     * 3. content.innerHTML = <html from partial>
     * 4. executePageInit("evento") → window.initEvento()
     * 5. Dispatch pageLoaded para que páginas puedan escuchar
     * 
     * MANEJO DE ERRORES:
     * - Si fetch falla: muestra página de error
     * - Si init falla: log error pero página sigue visible
     */
    async loadPage(route) {
        // Obtener elemento contenedor
        const content = document.getElementById('page-content');
        
        // Parse ruta para obtener página y parámetros
        const { basePage, queryParams } = this.parseRoute(route);
        
        console.log('loadPage - route:', route);
        console.log('basePage:', basePage);
        console.log('queryParams:', Object.fromEntries(queryParams.entries()));

        try {
            // ===================================================
            // PASO 1: FETCH HTML PARTIAL
            // ===================================================
            // Fetch /partials/evento para obtener HTML
            // Ejemplo: /partials/home, /partials/evento, /partials/carrito, etc
            const response = await fetch(`/partials/${basePage}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();  // Obtener HTML como texto

            if (content) {
                // ===================================================
                // PASO 2: INYECTAR HTML EN DOM
                // ===================================================
                // Reemplazar contenido de #page-content con nuevo HTML
                content.innerHTML = html;
                
                // ===================================================
                // PASO 3: ACTUALIZAR UI DE NAVEGACIÓN
                // ===================================================
                // Marcar enlace actual como 'active' en navbar
                this.updateActiveNav(basePage);
                
                // Cambiar título de pestaña del navegador
                this.updatePageTitle(basePage);

                // ===================================================
                // PASO 4: EJECUTAR INICIALIZACIÓN DE PÁGINA
                // ===================================================
                // Esperar a que el navegador procese el nuevo DOM (requestAnimationFrame)
                // Luego ejecutar función init de página (ej: window.initHome())
                requestAnimationFrame(async () => {
                    await this.executePageInit(basePage);
                });

                // ===================================================
                // PASO 5: DISPATCH CUSTOM EVENT
                // ===================================================
                // Permitir que otros scripts escuchen cuando página se carga
                // Ej: window.addEventListener('pageLoaded', (e) => { ... })
                window.dispatchEvent(new CustomEvent('pageLoaded', {
                    detail: {
                        page: basePage,
                        queryParams: Object.fromEntries(queryParams.entries())
                    }
                }));

                // ===================================================
                // PASO 6: SCROLL ARRIBA
                // ===================================================
                // Hacer scroll hacia arriba de la página suavemente
                // behavior: 'smooth' = animación suave en lugar de salto instantáneo
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Guardar página actual
            this.currentPage = route;
        } catch (error) {
            console.error('Error cargando página:', error);
            if (content) {
                // Mostrar página de error si fetch falla
                content.innerHTML = `
                    <div class="error-page">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h2>Error al cargar la página</h2>
                        <p>${error.message}</p>
                        <button onclick=\"window.router.navigate('home')\" class=\"btn-primary\">Volver al inicio</button>
                    </div>
                `;
            }
        }
    }

    /**
     * EXECUTE PAGE INIT - Llama función init de página específica
     * 
     * Cada página tiene una función init global que realiza setup:
     * - Obtener datos
     * - Renderizar elementos
     * - Configurar event listeners
     * 
     * Este método mapea nombre de página a su función init.
     * 
     * @param {string} page - Nombre de página (ej: "home", "evento")
     * 
     * MAPEO:
     * - "home" → window.initHome()
     * - "evento" → window.initEvento()
     * - "carrito" → window.initCarrito()
     * - "perfil" → window.initPerfil()
     * - "historial" → window.initHistorial()
     * - "proveedor" → window.initProveedor()
     * - "admin" → window.initAdmin()
     * 
     * EJEMPLO DE INIT:
     * window.initHome = async function() {
     *   // 1. Obtener datos
     *   const data = await window.app.getHomeData();
     *   // 2. Renderizar
     *   renderEvents(data.events);
     *   // 3. Setup listeners
     *   document.querySelector('.buy-btn').addEventListener('click', handleBuy);
     * }
     */
    async executePageInit(page) {
        // Mapeo de páginas a funciones init globales
        const initMap = {
            home: window.initHome,        // function() { renderizar home }
            evento: window.initEvento,    // function() { renderizar evento }
            carrito: window.initCarrito,  // function() { renderizar carrito }
            perfil: window.initPerfil,    // function() { renderizar perfil }
            historial: window.initHistorial,  // function() { renderizar historial }
            proveedor: window.initProveedor,  // function() { renderizar proveedor }
            admin: window.initAdmin       // function() { renderizar admin }
        };

        // Obtener función init para página
        const initFn = initMap[page];

        // Si existe función init, ejecutarla
        if (typeof initFn === 'function') {
            try {
                // Promise.resolve() permite esperar funciones async o sync
                await Promise.resolve(initFn());
            } catch (error) {
                // Log error pero no afecta página (ya está renderizada)
                console.error(`Error ejecutando init de ${page}:`, error);
            }
        } else {
            // Log warning si no existe init (página se muestra pero sin setup)
            console.warn(`No existe init para la página: ${page}`);
        }
    }

    /**
     * UPDATE ACTIVE NAV - Marca enlace actual como activo en navbar
     * 
     * Proceso:
     * 1. Remover clase 'active' de todos los enlaces
     * 2. Agregar clase 'active' solo al enlace de página actual
     * 
     * La clase 'active' cambia estilos en CSS:
     * .nav-link.active { color: var(--primary-color); ... }
     * 
     * @param {string} page - Página actual (ej: "home")
     */
    updateActiveNav(page) {
        // Selectionar todos los enlaces de navegación
        document.querySelectorAll('.nav-link').forEach((link) => {
            // Remover clase 'active' de todos
            link.classList.remove('active');
            
            // Agregar 'active' solo al que coincide con página actual
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
    }

    /**
     * UPDATE PAGE TITLE - Actualiza título de página en navegador
     * 
     * El título aparece en:
     * - Pestaña del navegador
     * - Historial
     * - Pestañas abiertas
     * 
     * Mapea nombre de página a título legible.
     * 
     * @param {string} page - Nombre de página (ej: "home")
     * 
     * EJEMPLOS:
     * - page="home" → title="Inicio | Subsonic Festival"
     * - page="evento" → title="Evento | Subsonic Festival"
     */
    updatePageTitle(page) {
        // Mapeo de páginas a títulos legibles
        const titles = {
            home: 'Inicio',
            evento: 'Evento',
            carrito: 'Carrito',
            perfil: 'Mi Perfil',
            historial: 'Historial',
            proveedor: 'Proveedores',
            admin: 'Administracion'
        };
        
        // Establecer título de página
        // Format: "Nombre Página | Subsonic Festival"
        document.title = `${titles[page] || page} | Subsonic Festival`;
    }
}

/**
 * INICIALIZACIÓN - Instancia router cuando DOM está listo
 * 
 * El router se instancia cuando DOMContentLoaded dispara.
 * Se guarda en window.router para acceso global.
 * 
 * ACCESO GLOBAL:
 * - Desde HTML: <a href="#" onclick="window.router.navigate('home')">
 * - Desde JavaScript: window.router.navigate('evento?id=123')
 * - Desde console: window.router.currentPage
 */
document.addEventListener('DOMContentLoaded', () => {
    window.router = new Router();
    console.log('Router inicializado correctamente');
});
