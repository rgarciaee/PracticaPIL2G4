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

            console.log('Eventos cargados:', events);

            renderEventsGrid(events);
            renderFeaturedEvents(events);
            updateStats(events);
        } else {
            console.error('Error cargando eventos:', result);
        }

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

function updateStats(events) {
    const eventsEl = document.getElementById('stat-events');
    const artistsEl = document.getElementById('stat-artists');
    const attendeesEl = document.getElementById('stat-attendees');

    if (!eventsEl || !artistsEl || !attendeesEl) return;

    const totalEventos = events.length;

    const artistasSet = new Set();
    let totalAsistentes = 0;

    events.forEach(event => {

        // 👇 SOLO contar si existen
        if (Array.isArray(event.artistas)) {
            event.artistas.forEach(a => {
                artistasSet.add(a.id || a.nombre);
            });
        }

        if (Array.isArray(event.zonas)) {
            totalAsistentes += event.zonas.reduce((acc, z) => {
                return acc + (Number(z.aforo_maximo) || 0);
            }, 0);
        }
    });

    // 👇 FALLBACK INTELIGENTE (clave)
    eventsEl.textContent = totalEventos || 0;

    artistsEl.textContent =
        artistasSet.size > 0 ? artistasSet.size : '20+';

    attendeesEl.textContent =
        totalAsistentes > 0 ? formatNumber(totalAsistentes) : '10k+';
}

function formatNumber(num) {
    return num >= 1000 ? Math.round(num / 1000) + 'k+' : num;
}

function formatDate(date) {
    const d = new Date(date);
    return isNaN(d) ? date : d.toLocaleDateString('es-ES');
}