// evento.js - Versión con mapa corregido
let currentEvent = null;

window.initEvento = async function () {
    console.log('Inicializando evento...');
    
    let hash = window.location.hash;
    try {
        hash = decodeURIComponent(hash);
    } catch(e) {}
    
    let eventId = null;
    const match = hash.match(/[?&]id=([^&]+)/);
    if (match) {
        eventId = match[1];
    }
    
    console.log('Event ID obtenido:', eventId);
    
    if (!eventId) {
        document.getElementById('evento-content').innerHTML = `
            <div class="error-page">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Evento no especificado</h2>
                <button onclick="window.router.navigate('home')" class="btn-primary">Volver al inicio</button>
            </div>
        `;
        return;
    }
    
    try {
        const response = await fetch(`/api/events/${eventId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            currentEvent = result.data;
            console.log('Evento cargado:', currentEvent);
            console.log('Ubicación:', currentEvent.ubicacion);
            
            // Renderizar hero
            document.getElementById('event-name').textContent = currentEvent.nombre;
            document.getElementById('event-dates').innerHTML = `<i class="fas fa-calendar-alt"></i> ${formatDate(currentEvent.fecha_ini)} - ${formatDate(currentEvent.fecha_fin)}`;
            if (currentEvent.ubicacion) {
                document.getElementById('event-location').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${currentEvent.ubicacion.nombre}, ${currentEvent.ubicacion.ciudad}`;
            }
            document.getElementById('event-description').textContent = currentEvent.descripcion || '';

            const scheduleContainer = document.getElementById('schedule-list');
            if (scheduleContainer) {
                const schedule = Array.isArray(currentEvent.horario) ? currentEvent.horario : [];
                if (schedule.length) {
                    scheduleContainer.innerHTML = schedule.map((day) => `
                        <div class="schedule-day">
                            <div class="schedule-day-header">
                                <h3>${escapeHtml(formatScheduleDay(day.dia))}</h3>
                            </div>
                            <div class="schedule-slots">
                                ${(day.slots || []).map((slot) => `
                                    <div class="schedule-slot">
                                        <span class="slot-time">${escapeHtml(slot.hora || '--:--')}</span>
                                        <span class="slot-artist">${escapeHtml(slot.artista || 'Actividad por confirmar')}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('');
                } else {
                    scheduleContainer.innerHTML = '<div class="schedule-day"><div class="schedule-day-header"><h3>Horario por confirmar</h3></div></div>';
                }
            }
            
            // Renderizar artistas
            const artistsContainer = document.getElementById('artists-list');
            if (artistsContainer && currentEvent.artistas) {
                artistsContainer.innerHTML = currentEvent.artistas.map(a => `
                    <div class="artist-card">
                        ${a.imagen
                            ? `<img class="artist-image" src="${escapeAttribute(a.imagen)}" alt="${escapeAttribute(a.nombre || 'Artista')}" loading="lazy">`
                            : `<div class="artist-icon"><i class="fas fa-user-musician"></i></div>`
                        }
                        <h3>${escapeHtml(a.nombre)}</h3>
                        <p class="artist-genre">${escapeHtml(a.genero || 'Artista')}</p>
                        <p class="artist-description">${escapeHtml(a.descripcion || 'Descripcion no disponible')}</p>
                    </div>
                `).join('');
            }
            
            // Renderizar zonas (entradas)
            const ticketsContainer = document.getElementById('tickets-list');
            if (ticketsContainer && currentEvent.zonas) {
                ticketsContainer.innerHTML = currentEvent.zonas.map(z => `
                    <div class="ticket-card">
                        <div class="ticket-icon"><i class="fas fa-ticket-alt"></i></div>
                        <h3>${escapeHtml(z.nombre)}</h3>
                        <div class="ticket-zone">${escapeHtml(z.descripcion) || `Aforo: ${z.aforo_maximo || 'Ilimitado'}`}</div>
                        <div class="ticket-price">${z.precio || 0} €</div>
                        <button class="btn btn-primary buy-ticket-btn" 
                                data-zone-id="${z.id}"
                                data-zone-name="${escapeHtml(z.nombre)}"
                                data-price="${z.precio || 0}">
                            Añadir al carrito
                        </button>
                    </div>
                `).join('');
                
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
                        
                        const zoneName = btn.getAttribute('data-zone-name');
                        const price = parseFloat(btn.getAttribute('data-price'));
                        const zoneId = btn.getAttribute('data-zone-id');
                        
                        if (window.app && currentEvent) {
                            const cartItem = {
                                id: `${currentEvent.id}_${zoneId}_${Date.now()}`,
                                nombre: `${currentEvent.nombre} - ${zoneName}`,
                                precio: price,
                                cantidad: 1,
                                tipo: zoneName,
                                zona_id: zoneId,
                                zona_nombre: zoneName,
                                evento_id: currentEvent.id,
                                evento_nombre: currentEvent.nombre,
                                fecha_evento: currentEvent.fecha_ini,
                                imagen: currentEvent.imagen
                            };
                            
                            await window.app.addToCart(cartItem);
                        }
                    };
                });
            }
            
            // Renderizar puestos
            const standsContainer = document.getElementById('stands-list');
            if (standsContainer && currentEvent.puestos) {
                standsContainer.innerHTML = currentEvent.puestos.map(s => `
                    <div class="stand-card">
                        <div class="stand-icon"><i class="fas fa-utensils"></i></div>
                        <h3>${escapeHtml(s.nombre)}</h3>
                        <p>Tipo: ${escapeHtml(s.tipo || 'No especificado')}</p>
                        <div class="stand-type">Zona: ${escapeHtml(s.zona || 'Sin zona asignada')}</div>
                    </div>
                `).join('');
            }
            
            // ============================================================
            // MAPA CORREGIDO - Usa las coordenadas del evento actual
            // ============================================================
            const mapContainer = document.getElementById('event-map');
            if (mapContainer) {
                let lat = null;
                let lng = null;
                let direccion = null;
                
                // Obtener coordenadas de la ubicación del evento
                if (currentEvent.ubicacion) {
                    lat = currentEvent.ubicacion.lat;
                    lng = currentEvent.ubicacion.lng;
                    direccion = currentEvent.ubicacion.direccion || 
                                `${currentEvent.ubicacion.nombre}, ${currentEvent.ubicacion.ciudad}`;
                }
                
                console.log(`Mapa para ${currentEvent.nombre}:`, { lat, lng, direccion });
                
                // Construir URL del mapa
                let mapUrl;
                if (lat && lng) {
                    // Usar coordenadas
                    mapUrl = `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
                    console.log('Usando coordenadas:', lat, lng);
                } else if (direccion) {
                    // Usar dirección
                    mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`;
                    console.log('Usando dirección:', direccion);
                } else {
                    // Fallback: Madrid centro
                    mapUrl = `https://www.google.com/maps?q=40.4167,-3.7038&output=embed`;
                    console.log('Usando coordenadas por defecto');
                }
                
                mapContainer.innerHTML = `<iframe src="${mapUrl}" width="100%" height="100%" style="border:0" allowfullscreen loading="lazy"></iframe>`;
            }
            
        } else {
            throw new Error(result.error || 'Evento no encontrado');
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('evento-content').innerHTML = `
            <div class="error-page">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Error al cargar el evento</h2>
                <p>${error.message}</p>
                <button onclick="window.router.navigate('home')" class="btn-primary">Volver al inicio</button>
            </div>
        `;
    }
};

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatScheduleDay(dayLabel) {
    if (!dayLabel) return 'Por confirmar';
    const date = new Date(dayLabel);
    if (isNaN(date.getTime())) return dayLabel;
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttribute(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
