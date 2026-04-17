window.initProveedor = async function () {
    console.log('Inicializando proveedor...');

    try {
        const [zonesResponse, eventsResponse] = await Promise.all([
            fetch('/api/zones'),
            fetch('/api/events'),
        ]);
        const zonesResult = await zonesResponse.json();
        const eventsResult = await eventsResponse.json();

        if (zonesResult.success && zonesResult.data) {
            renderZones(zonesResult.data);
            updateStats(zonesResult.data);
        } else {
            console.error('Error cargando zonas:', zonesResult.error);
            document.getElementById('zones-list').innerHTML = '<div class="error">No se pudieron cargar las zonas</div>';
        }

        if (eventsResult.success && eventsResult.data) {
            renderProviderEvents(eventsResult.data);
        } else {
            console.error('Error cargando eventos proveedor:', eventsResult.error);
            document.getElementById('provider-events-list').innerHTML = '<div class="error">No se pudieron cargar los eventos</div>';
        }
    } catch (error) {
        console.error('Error en initProveedor:', error);
    }

    const contactBtn = document.getElementById('contact-provider');
    if (contactBtn) {
        contactBtn.onclick = () => {
            window.app?.showToast('Escribenos a proveedores@subsonicfestival.test', 'info');
        };
    }
};

function renderZones(zones) {
    const container = document.getElementById('zones-list');
    if (!container) return;

    const standZones = (zones || []).filter((zone) => String(zone.tipo || 'ticket').toLowerCase() === 'stand');

    if (!standZones.length) {
        container.innerHTML = '<div class="no-zones">No hay zonas disponibles</div>';
        return;
    }

    const isAuthenticated = !!window.app?.currentUser?.id;
    const isProvider = String(window.app?.currentUser?.role || '').toLowerCase() === 'provider';

    container.innerHTML = standZones.map(zone => {
        const buttonLabel = isProvider ? 'Anadir al carrito' : 'Solo proveedores';

        return `
        <div class="zone-card" data-zone-id="${zone.id}">
            <div class="zone-header">
                <h3>${escapeHtml(zone.nombre)}</h3>
            </div>
            <div class="zone-body">
                <div class="zone-info">
                    <div class="zone-info-item">
                        <span class="label">Evento</span>
                        <span class="value">${escapeHtml(zone.evento_nombre || zone.evento_id || '')}</span>
                    </div>
                    <div class="zone-info-item">
                        <span class="label">Fecha evento</span>
                        <span class="value">${escapeHtml(formatEventDate(zone.fecha_evento))}</span>
                    </div>
                    <div class="zone-info-item">
                        <span class="label">Aforo maximo</span>
                        <span class="value">${escapeHtml(String(zone.aforo_maximo || 'N/A'))} personas</span>
                    </div>
                    <div class="zone-info-item">
                        <span class="label">Precio alquiler</span>
                        <span class="value zone-price">${formatPrice(zone.precio)} EUR</span>
                    </div>
                </div>
                <button
                    class="btn btn-primary request-zone-btn"
                    data-zone-id="${zone.id}"
                    data-zone-name="${escapeHtml(zone.nombre)}"
                    data-event-id="${zone.evento_id || ''}"
                    data-event-name="${escapeHtml(zone.evento_nombre || '')}"
                    data-price="${zone.precio || 0}"
                >
                    ${buttonLabel}
                </button>
            </div>
        </div>
    `;
    }).join('');

    document.querySelectorAll('.request-zone-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const zoneId = btn.getAttribute('data-zone-id');
            const zoneName = btn.getAttribute('data-zone-name');
            const eventId = btn.getAttribute('data-event-id');
            const eventName = btn.getAttribute('data-event-name');
            const price = Number(btn.getAttribute('data-price') || 0);

            const isAuthenticatedUser = await window.app.checkAuthStatus();
            if (!isAuthenticatedUser) {
                window.app?.showModal(
                    'Iniciar sesion requerido',
                    '<p>Para solicitar alquileres necesitas iniciar sesion.</p>',
                    async () => {
                        window.location.href = '/login';
                    }
                );
                return;
            }

            const currentRole = String(window.app?.currentUser?.role || '').toLowerCase();
            if (currentRole !== 'provider') {
                window.app?.showModal(
                    'Acceso restringido',
                    '<p>Solo los usuarios con rol provider pueden solicitar alquileres de zonas.</p>'
                );
                return;
            }

            const cartItem = {
                item_category: 'provider_rental',
                id: `provider_rental_${zoneId}`,
                nombre: `Alquiler - ${zoneName}`,
                precio: price,
                cantidad: 1,
                tipo: 'Alquiler proveedor',
                zona_id: zoneId,
                zona_nombre: zoneName,
                evento_id: eventId,
                evento_nombre: eventName,
            };

            await window.app.addToCartAPI(cartItem);
        });
    });
}

function renderProviderEvents(events) {
    const container = document.getElementById('provider-events-list');
    if (!container) return;

    if (!events || events.length === 0) {
        container.innerHTML = '<div class="no-zones">No hay eventos disponibles</div>';
        return;
    }

    container.innerHTML = events.map((event) => `
        <article class="provider-event-card">
            <div class="provider-event-header">
                <h3>${escapeHtml(event.nombre || 'Evento')}</h3>
                <span class="provider-event-dates">${escapeHtml(formatEventRange(event.fecha_ini, event.fecha_fin))}</span>
            </div>
            <p class="provider-event-location">${escapeHtml(event.ubicacion?.nombre || event.ubicacion?.ciudad || '')}</p>
            <div class="provider-event-schedule">
                ${renderSchedulePreview(event.horario)}
            </div>
        </article>
    `).join('');
}

function updateStats(zones) {
    const totalZonesSpan = document.getElementById('total-zones');
    const dailyVisitorsSpan = document.getElementById('daily-visitors');
    const minPriceSpan = document.getElementById('zone-min-price');

    const standZones = (zones || []).filter((zone) => String(zone.tipo || 'ticket').toLowerCase() === 'stand');
    const totalZones = standZones.length;
    const totalVisitors = standZones.reduce((sum, zone) => sum + Number(zone.aforo_maximo || 0), 0);
    const prices = standZones
        .map(zone => Number(zone.precio || 0))
        .filter(price => !Number.isNaN(price) && price > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;

    if (totalZonesSpan) {
        totalZonesSpan.textContent = String(totalZones);
    }
    if (dailyVisitorsSpan) {
        dailyVisitorsSpan.textContent = totalVisitors > 0 ? formatCompactNumber(totalVisitors) : '0';
    }
    if (minPriceSpan) {
        minPriceSpan.textContent = `Desde ${formatPrice(minPrice)} EUR`;
    }
}

function formatCompactNumber(value) {
    if (value >= 1000) {
        return `+${Math.round(value / 1000)}k`;
    }
    return String(value);
}

function formatPrice(value) {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
}

function formatEventDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatEventRange(startValue, endValue) {
    if (!startValue && !endValue) return 'Fechas por confirmar';
    const start = formatScheduleDay(startValue);
    const end = formatScheduleDay(endValue);
    return start === end ? start : `${start} - ${end}`;
}

function formatScheduleDay(value) {
    if (!value) return 'Por confirmar';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function renderSchedulePreview(schedule) {
    if (!Array.isArray(schedule) || schedule.length === 0) {
        return '<p class="provider-event-empty">Horario por confirmar</p>';
    }

    return schedule.map((day) => `
        <div class="provider-schedule-day">
            <strong>${escapeHtml(formatScheduleDay(day.dia))}</strong>
            <ul>
                ${(day.slots || []).map((slot) => `
                    <li>${escapeHtml(slot.hora || '--:--')} · ${escapeHtml(slot.artista || 'Actividad por confirmar')}</li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
