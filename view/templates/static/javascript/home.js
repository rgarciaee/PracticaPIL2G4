// home.js

let swiperInstance = null;

window.initHome = async function () {
    console.log('Inicializando home...');
    console.log("DOM home listo:", document.getElementById('events-grid'));

    try {
        const response = await fetch('/api/events');
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
            const events = result.data;
            renderEventsGrid(events);
            renderFeaturedEvents(events);
        } else {
            console.error('Error cargando eventos:', result);
        }

        // Llamada a la nueva función de estadísticas globales
        await loadGlobalStats();

        // Noticias
        try {
            const yamlResponse = await fetch('/static/yaml/data.yaml');
            const yamlText = await yamlResponse.text();
            const yamlData = jsyaml.load(yamlText);
            renderNews(yamlData.news || []);
        } catch (e) {
            console.error('Error cargando noticias:', e);
        }

    } catch (error) {
        console.error('Error en initHome:', error);
    }
};

function renderEventsGrid(events) {
    const grid = document.getElementById('events-grid');
    if (!grid) return;

    if (!events.length) {
        grid.innerHTML = '<div>No hay eventos</div>';
        return;
    }

    grid.innerHTML = events.map(event => `
        <div class="event-card" data-event-id="${event.id}">
            
            <div class="event-card-header">
                <h3>${event.nombre}</h3>
                <div class="event-card-date">
                    ${formatDate(event.fecha_ini)} - ${formatDate(event.fecha_fin)}
                </div>
            </div>

            <div class="event-card-body">
                <p>${event.descripcion || 'Sin descripción'}</p>

                <div class="event-card-footer">
                    <button class="btn btn-outline btn-sm event-info-btn" data-id="${event.id}">
                        Ver evento
                    </button>

                    <button class="btn btn-primary btn-sm buy-ticket-btn" data-id="${event.id}">
                        Comprar
                    </button>
                </div>
            </div>

        </div>
    `).join('');

    // Navegar
    document.querySelectorAll('.event-info-btn').forEach(btn => {
        btn.onclick = () => {
            const eventId = btn.dataset.id;
            console.log('Navegando a evento:', eventId);
            window.router?.navigate(`evento?id=${eventId}`);
        };
    });

    // Comprar
    document.querySelectorAll('.buy-ticket-btn').forEach(btn => {
        btn.onclick = async () => {
            // Verificar si el usuario está autenticado
            const isAuthenticated = await window.app.checkAuthStatus();
            
            if (!isAuthenticated) {
                window.app?.showModal(
                    'Iniciar sesión requerido',
                    '<p>Para comprar entradas necesitas iniciar sesión o registrarte.</p><p>¿Quieres ir a la página de inicio de sesión?</p>',
                    () => {
                        window.location.href = '/login';
                    }
                );
                return;
            }
            
            const id = btn.dataset.id;
            const res = await fetch(`/api/events/${id}`);
            const result = await res.json();
            
            if (!result.success) return;
            
            const event = result.data;
            const zona = event.zonas?.[0];
            
            if (!zona) return;
            
            const cartItem = {
                id: `${event.id}_${zona.id}_${Date.now()}`,
                nombre: `${event.nombre} - ${zona.nombre}`,
                precio: zona.precio || 50,
                cantidad: 1,
                tipo: zona.nombre,
                zona_id: zona.id,
                zona_nombre: zona.nombre,
                evento_id: event.id,
                evento_nombre: event.nombre,
                fecha_evento: event.fecha_ini,
                imagen: event.imagen
            };
            
            await window.app?.addToCart(cartItem);
        };
    });
}

function renderFeaturedEvents(events) {
    const wrapper = document.getElementById('featured-swiper-wrapper');
    if (!wrapper) return;

    const featured = events.slice(0, 5);

    wrapper.innerHTML = featured.map(e => `
        <div class="swiper-slide">
            <div class="featured-card">
                <img src="${e.imagen || 'https://picsum.photos/200'}">
                <h3>${e.nombre}</h3>
                <p>${formatDate(e.fecha_ini)}</p>
            </div>
        </div>
    `).join('');

    if (typeof Swiper !== 'undefined') {
        if (swiperInstance) swiperInstance.destroy(true, true);

        swiperInstance = new Swiper('.featured-swiper', {
            slidesPerView: 1,
            pagination: { el: '.swiper-pagination', clickable: true },
            autoplay: { delay: 4000 }
        });
    }
}

function renderNews(news) {
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    grid.innerHTML = news.map(n => `
        <div class="news-card">
            <h3>${n.titulo}</h3>
            <p>${n.contenido}</p>
        </div>
    `).join('');
}

// NUEVA FUNCIÓN: Obtiene las estadísticas globales del servidor
async function loadGlobalStats() {
    try {
        const res = await fetch('/api/stats');
        const result = await res.json();
        
        if (result.success && result.data) {
            // Mantenemos un pequeño retraso de seguridad para que el HTML esté listo
            setTimeout(() => {
                const eventsEl = document.getElementById('stat-events');
                const artistsEl = document.getElementById('stat-artists');
                const attendeesEl = document.getElementById('stat-attendees');

                if (eventsEl) eventsEl.textContent = result.data.totalEventos;
                if (artistsEl) artistsEl.textContent = result.data.totalArtistas;
                if (attendeesEl) attendeesEl.textContent = formatNumber(result.data.totalAsistentes);
            }, 150);
        }
    } catch (e) {
        console.error("Error cargando estadísticas globales:", e);
    }
}

function formatNumber(num) {
    if (num >= 1000) {
        return Math.round(num / 1000) + 'k+';
    }
    return num;
}

function formatDate(date) {
    const d = new Date(date);
    return isNaN(d) ? date : d.toLocaleDateString('es-ES');
}