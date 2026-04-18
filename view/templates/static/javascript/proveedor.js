const providerState = {
    standZones: [],
    currentPage: 1,
    pageSize: 8,
    events: [],
    selectedEventId: '',
    zoneFilterEventId: '',
};

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
            setProviderZones(zonesResult.data);
            updateStats(zonesResult.data);
        } else {
            console.error('Error cargando zonas:', zonesResult.error);
            document.getElementById('zones-list').innerHTML = '<div class="error">No se pudieron cargar las zonas</div>';
            renderZonePagination();
            updateZoneSummary();
        }

        if (eventsResult.success && eventsResult.data) {
            setProviderEvents(eventsResult.data);
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

function setProviderZones(zones) {
    providerState.standZones = (zones || []).filter((zone) => String(zone.tipo || 'ticket').toLowerCase() === 'stand');
    providerState.currentPage = 1;
    providerState.zoneFilterEventId = '';
    renderZoneEventFilter();
    renderZones();
    renderZonePagination();
    updateZoneSummary();
}

function setProviderEvents(events) {
    providerState.events = [...(events || [])].sort((a, b) => parseDateValue(a?.fecha_inicio || a?.fecha_ini) - parseDateValue(b?.fecha_inicio || b?.fecha_ini));
    providerState.selectedEventId = '';
    renderZoneEventFilter();
    renderProviderEventConsultant();
}

function renderZones() {
    const container = document.getElementById('zones-list');
    if (!container) return;

    const standZones = getFilteredStandZones();
    if (!standZones.length) {
        container.innerHTML = '<div class="no-zones">No hay zonas disponibles</div>';
        return;
    }

    const isAuthenticated = !!window.app?.currentUser?.id;
    const isProvider = String(window.app?.currentUser?.role || '').toLowerCase() === 'provider';
    const startIndex = (providerState.currentPage - 1) * providerState.pageSize;
    const visibleZones = standZones.slice(startIndex, startIndex + providerState.pageSize);

    container.innerHTML = visibleZones.map((zone) => {
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
                        <span class="value zone-price">${formatPrice(zone.precio)}</span>
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

    document.querySelectorAll('.request-zone-btn').forEach((btn) => {
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

function renderProviderEventConsultant() {
    const container = document.getElementById('provider-events-list');
    if (!container) return;

    if (!providerState.events.length) {
        container.innerHTML = '<div class="no-zones">No hay eventos disponibles</div>';
        return;
    }

    const selectedEvent = providerState.events.find((event) => event.id === providerState.selectedEventId) || null;
    const schedule = Array.isArray(selectedEvent?.horario) ? selectedEvent.horario : [];

    container.innerHTML = `
        <article class="provider-consultant-card">
            <div class="provider-consultant-toolbar">
                <div class="provider-consultant-copy">
                    <span class="provider-consultant-kicker">Consulta rapida</span>
                    <h3>Agenda del evento</h3>
                    <p>Elige un evento y desplaza sus dias para revisar horarios sin tener todos los calendarios mezclados.</p>
                </div>
                <div class="provider-consultant-picker">
                    <label for="provider-event-selector">Evento</label>
                    <select id="provider-event-selector" class="provider-event-selector">
                        <option value="" ${!providerState.selectedEventId ? 'selected' : ''}>Selecciona un evento</option>
                        ${providerState.events.map((event) => `
                            <option value="${escapeAttribute(event.id || '')}" ${event.id === providerState.selectedEventId ? 'selected' : ''}>
                                ${escapeHtml(event.nombre || 'Evento')}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>

            ${selectedEvent ? `
                <div class="provider-event-overview">
                    <div>
                        <h4>${escapeHtml(selectedEvent.nombre || 'Evento')}</h4>
                        <p class="provider-event-location">${escapeHtml(getProviderLocationLabel(selectedEvent))}</p>
                    </div>
                    <div class="provider-event-overview-meta">
                        <span class="provider-event-badge">${escapeHtml(formatEventRange(selectedEvent.fecha_inicio || selectedEvent.fecha_ini, selectedEvent.fecha_fin))}</span>
                        <span class="provider-event-badge provider-event-badge-soft">${schedule.length || 0} dias planificados</span>
                    </div>
                </div>

                ${schedule.length ? `
                    <div class="provider-event-schedule">
                        ${schedule.map((day) => renderScheduleDayCard(day)).join('')}
                    </div>
                ` : '<p class="provider-event-empty">Horario por confirmar</p>'}
            ` : `
                <div class="provider-event-empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <h4>Selecciona un evento</h4>
                    <p>El horario aparecera aqui cuando elijas un evento del selector.</p>
                </div>
            `}
        </article>
    `;

    const selector = document.getElementById('provider-event-selector');
    selector?.addEventListener('change', (event) => {
        providerState.selectedEventId = event.target.value;
        renderProviderEventConsultant();
    });
}

function renderScheduleDayCard(day) {
    return `
        <div class="provider-schedule-day lift-hover-card">
            <div class="provider-schedule-date">${escapeHtml(formatScheduleDay(day.dia))}</div>
            <div class="provider-schedule-slots">
                ${Array.isArray(day.slots) && day.slots.length
                    ? day.slots.map((slot) => `
                        <div class="provider-schedule-slot">
                            <span class="provider-schedule-time">${escapeHtml(slot.hora || '--:--')}</span>
                            <span class="provider-schedule-artist">${escapeHtml(slot.artista || 'Actividad por confirmar')}</span>
                        </div>
                    `).join('')
                    : '<div class="provider-schedule-slot provider-schedule-slot-empty">Actividad por confirmar</div>'
                }
            </div>
        </div>
    `;
}

function updateStats(zones) {
    const totalZonesSpan = document.getElementById('total-zones');
    const dailyVisitorsSpan = document.getElementById('daily-visitors');
    const minPriceSpan = document.getElementById('zone-min-price');

    const standZones = (zones || []).filter((zone) => String(zone.tipo || 'ticket').toLowerCase() === 'stand');
    const totalZones = standZones.length;
    const totalVisitors = standZones.reduce((sum, zone) => sum + Number(zone.aforo_maximo || 0), 0);
    const prices = standZones
        .map((zone) => Number(zone.precio || 0))
        .filter((price) => !Number.isNaN(price) && price > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;

    if (totalZonesSpan) {
        totalZonesSpan.textContent = String(totalZones);
    }
    if (dailyVisitorsSpan) {
        dailyVisitorsSpan.textContent = totalVisitors > 0 ? formatCompactNumber(totalVisitors) : '0';
    }
    if (minPriceSpan) {
        minPriceSpan.textContent = `Desde ${formatPrice(minPrice)}`;
    }
}

function formatCompactNumber(value) {
    if (value >= 1000) {
        return `+${Math.round(value / 1000)}k`;
    }
    return String(value);
}

function formatPrice(value) {
    if (window.formatCurrency) {
        return window.formatCurrency(value);
    }

    const parsed = Number(value || 0);
    return `${Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00'} EUR`;
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

function getProviderLocationLabel(event) {
    const venue = event?.ubicacion?.nombre || '';
    const city = event?.ubicacion?.ciudad || '';
    return [venue, city].filter(Boolean).join(', ') || 'Ubicacion por confirmar';
}

function renderZonePagination() {
    const container = document.getElementById('provider-zones-pagination');
    if (!container) return;

    const totalZones = getFilteredStandZones().length;
    const totalPages = Math.max(1, Math.ceil(totalZones / providerState.pageSize));
    providerState.currentPage = Math.min(providerState.currentPage, totalPages);

    if (!totalZones || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const start = (providerState.currentPage - 1) * providerState.pageSize + 1;
    const end = Math.min(start + providerState.pageSize - 1, totalZones);

    container.innerHTML = `
        <button class="provider-page-btn" data-direction="prev" ${providerState.currentPage === 1 ? 'disabled' : ''}>
            Anterior
        </button>
        <div class="provider-page-status">
            <strong>${start}-${end}</strong> de ${totalZones} zonas
        </div>
        <button class="provider-page-btn" data-direction="next" ${providerState.currentPage === totalPages ? 'disabled' : ''}>
            Siguiente
        </button>
    `;

    container.querySelectorAll('.provider-page-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const direction = button.getAttribute('data-direction');
            const totalPagesLocal = Math.ceil(getFilteredStandZones().length / providerState.pageSize);
            const nextPage = direction === 'next'
                ? providerState.currentPage + 1
                : providerState.currentPage - 1;

            if (nextPage < 1 || nextPage > totalPagesLocal) {
                return;
            }

            providerState.currentPage = nextPage;
            renderZones();
            renderZonePagination();
            updateZoneSummary();

            const zonesSection = document.querySelector('.provider-zones-section');
            zonesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function updateZoneSummary() {
    const summary = document.getElementById('provider-zones-summary');
    if (!summary) return;

    const totalZones = getFilteredStandZones().length;
    if (!totalZones) {
        summary.textContent = providerState.zoneFilterEventId
            ? 'No hay zonas para este evento'
            : '';
        return;
    }

    const start = (providerState.currentPage - 1) * providerState.pageSize + 1;
    const end = Math.min(start + providerState.pageSize - 1, totalZones);
    summary.textContent = `Mostrando ${start}-${end} de ${totalZones} zonas disponibles`;
}

function renderZoneEventFilter() {
    const select = document.getElementById('provider-zone-event-filter');
    if (!select) return;

    const eventMap = new Map(providerState.events.map((event) => [String(event.id || ''), event]));
    const eventIdsWithZones = [...new Set(providerState.standZones.map((zone) => String(zone.evento_id || '')).filter(Boolean))];
    const sortedEvents = eventIdsWithZones
        .map((eventId) => eventMap.get(eventId))
        .filter(Boolean)
        .sort((a, b) => parseDateValue(a?.fecha_inicio || a?.fecha_ini) - parseDateValue(b?.fecha_inicio || b?.fecha_ini));

    select.innerHTML = `
        <option value="">Todos los eventos</option>
        ${sortedEvents.map((event) => `
            <option value="${escapeAttribute(event.id || '')}" ${String(event.id || '') === providerState.zoneFilterEventId ? 'selected' : ''}>
                ${escapeHtml(event.nombre || 'Evento')}
            </option>
        `).join('')}
    `;

    select.onchange = (event) => {
        providerState.zoneFilterEventId = event.target.value;
        providerState.currentPage = 1;
        renderZones();
        renderZonePagination();
        updateZoneSummary();
    };
}

function getFilteredStandZones() {
    if (!providerState.zoneFilterEventId) {
        return providerState.standZones;
    }

    return providerState.standZones.filter((zone) => String(zone.evento_id || '') === providerState.zoneFilterEventId);
}

function parseDateValue(value) {
    const parsed = new Date(value || '');
    return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttribute(text) {
    return escapeHtml(text).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

