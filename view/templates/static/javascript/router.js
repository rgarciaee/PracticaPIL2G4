// router.js
class Router {
    constructor() {
        this.currentPage = null;
        this.init();
    }

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

    getRouteFromHash() {
        const hash = window.location.hash.slice(1);
        // Decodificar solo una vez
        try {
            return decodeURIComponent(hash);
        } catch (e) {
            return hash;
        }
    }

    parseRoute(route) {
        // Separar correctamente la página de los parámetros
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

    navigate(page, addToHistory = true) {
        if (this.currentPage === page) return;

        if (addToHistory) {
            // No codificar la página completa, usar directamente
            window.history.pushState({ page }, '', `#${page}`);
        }

        this.loadPage(page);
    }

    showLoader() {
        const loader = document.getElementById('content-loader');
        if (loader) loader.classList.add('active');
    }

    hideLoader() {
        const loader = document.getElementById('content-loader');
        if (loader) loader.classList.remove('active');
    }

    async loadPage(route) {
        const content = document.getElementById('page-content');
        const { basePage, queryParams } = this.parseRoute(route);
        
        console.log('loadPage - route:', route);
        console.log('basePage:', basePage);
        console.log('queryParams:', Object.fromEntries(queryParams.entries()));

        this.showLoader();

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
        } finally {
            this.hideLoader();
        }
    }

    async executePageInit(page) {
        const initMap = {
            home: window.initHome,
            evento: window.initEvento,
            carrito: window.initCarrito,
            perfil: window.initPerfil,
            historial: window.initHistorial,
            proveedor: window.initProveedor
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
            proveedor: 'Proveedores'
        };
        document.title = `${titles[page] || page} | Subsonic Festival`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.router = new Router();
});