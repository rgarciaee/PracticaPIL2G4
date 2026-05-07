/**
 * ============================================================================
 * router.js - Sistema de enrutamiento de la aplicación
 * ============================================================================
 * Este archivo implementa el Router que controla:
 * - Navegación entre páginas (home, evento, carrito, perfil, historial, etc)
 * - Manejo de rutas dinámicas con URL hash (#página?param=valor)
 * - Carga de templates HTML desde el servidor
 * - Historial del navegador (botones atrás/adelante)
 * - Ejecución de código de inicialización de cada página
 * ============================================================================
 */

/**
 * Clase Router: Controla la navegación de páginas en la SPA (Single Page App)
 * Utiliza URLs con hash para cambiar entre páginas sin recargar la página completa
 */
class Router {
    constructor() {
        this.currentPage = null;
        this.init();
    }

    // Inicializa listeners para clics en enlaces y cambios de URL
    init() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-page]');
            if (!link) return;

            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (page) {
                this.navigate(page);
            }
        });

        window.addEventListener('popstate', (e) => {
            const page = e.state?.page || this.getRouteFromHash() || 'home';
            this.loadPage(page);
        });

        const initialPage = this.getRouteFromHash() || 'home';
        this.loadPage(initialPage);
    }

    // Obtiene la ruta actual desde el URL hash
    getRouteFromHash() {
        const hash = window.location.hash.slice(1);
        try {
            return decodeURIComponent(hash);
        } catch (e) {
            return hash;
        }
    }

    // Divide la ruta en página base y parámetros de query (ej: evento?id=123)
    parseRoute(route) {
        const questionMarkIndex = route.indexOf('?');
        let basePage = route;
        let queryString = '';
        
        if (questionMarkIndex !== -1) {
            basePage = route.substring(0, questionMarkIndex);
            queryString = route.substring(questionMarkIndex + 1);
        }
        
        return {
            route,
            basePage: basePage || 'home',
            queryString,
            queryParams: new URLSearchParams(queryString)
        };
    }

    // Cambia a una página diferente
    navigate(page, addToHistory = true) {
        if (this.currentPage === page) return;

        if (addToHistory) {
            window.history.pushState({ page }, '', `#${page}`);
        }

        this.loadPage(page);
    }

    // Carga el HTML de una página desde el servidor e inicializa su lógica
    async loadPage(route) {
        const content = document.getElementById('page-content');
        const { basePage, queryParams } = this.parseRoute(route);
        
        console.log('loadPage - route:', route);
        console.log('basePage:', basePage);
        console.log('queryParams:', Object.fromEntries(queryParams.entries()));


        try {
            const response = await fetch(`/partials/${basePage}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();

            if (content) {
                content.innerHTML = html;
                this.updateActiveNav(basePage);
                this.updatePageTitle(basePage);

                requestAnimationFrame(async () => {
                    await this.executePageInit(basePage);
                });

                window.dispatchEvent(new CustomEvent('pageLoaded', {
                    detail: {
                        page: basePage,
                        queryParams: Object.fromEntries(queryParams.entries())
                    }
                }));

                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            this.currentPage = route;
        } catch (error) {
            console.error('Error cargando página:', error);
            if (content) {
                content.innerHTML = `
                    <div class="error-page">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h2>Error al cargar la página</h2>
                        <p>${error.message}</p>
                        <button onclick="window.router.navigate('home')" class="btn-primary">Volver al inicio</button>
                    </div>
                `;
            }
        }
    }

    async executePageInit(page) {
        const initMap = {
            home: window.initHome,
            evento: window.initEvento,
            carrito: window.initCarrito,
            perfil: window.initPerfil,
            historial: window.initHistorial,
            proveedor: window.initProveedor,
            admin: window.initAdmin
        };

        const initFn = initMap[page];

        if (typeof initFn === 'function') {
            try {
                await Promise.resolve(initFn());
            } catch (error) {
                console.error(`Error ejecutando init de ${page}:`, error);
            }
        } else {
            console.warn(`No existe init para la página: ${page}`);
        }
    }

    updateActiveNav(page) {
        document.querySelectorAll('.nav-link').forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
    }

    updatePageTitle(page) {
        const titles = {
            home: 'Inicio',
            evento: 'Evento',
            carrito: 'Carrito',
            perfil: 'Mi Perfil',
            historial: 'Historial',
            proveedor: 'Proveedores',
            admin: 'Administracion'
        };
        document.title = `${titles[page] || page} | Subsonic Festival`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.router = new Router();
});


