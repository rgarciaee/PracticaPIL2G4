// historial.js
let allTickets = [];

window.initHistorial = async function () {
    console.log('Inicializando historial...');

    await loadHistoryData();
    setupFilters();
};

async function loadHistoryData() {
    allTickets = [];

    try {
        const response = await fetch('/api/history', {
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                allTickets = result.data.map(ticket => ({
                    id: ticket.id,
                    evento: ticket.evento_nombre || 'Evento',
                    zona: ticket.zona_nombre || 'Zona general',
                    fecha_evento: ticket.fecha_evento || '',
                    fecha_compra: ticket.fecha_compra || '',
                    estado: ticket.estado || 'Activa',
                    qr: ticket.localizador_qr || ''
                }));

                console.log('Historial cargado:', allTickets.length);
                console.log('Estados disponibles:', [...new Set(allTickets.map(t => t.estado))]);
            }
        }
    } catch (error) {
        console.error('Error cargando historial:', error);
    }
    
    // Render inicial (todos los tickets)
    renderTickets(allTickets);
}

function renderTickets(ticketsToShow) {
    const container = document.getElementById('history-list');
    const emptyMsg = document.getElementById('no-tickets-message');

    if (!container || !emptyMsg) return;

    if (!ticketsToShow || ticketsToShow.length === 0) {
        container.innerHTML = '';
        emptyMsg.classList.remove('is-hidden');
        return;
    }

    emptyMsg.classList.add('is-hidden');

    // Render tickets
    container.innerHTML = ticketsToShow.map(ticket => `
        <div class="ticket-card" data-aos="fade-up">
            <div class="ticket-header">
                <h3>${escapeHtml(ticket.evento)}</h3>
            </div>
            <div class="ticket-body">
                <div class="ticket-info">
                    <div class="ticket-info-item">
                        <span class="label">Zona</span>
                        <span class="value">${escapeHtml(ticket.zona)}</span>
                    </div>
                    <div class="ticket-info-item">
                        <span class="label">Fecha evento</span>
                        <span class="value">${escapeHtml(ticket.fecha_evento)}</span>
                    </div>
                    <div class="ticket-info-item">
                        <span class="label">Fecha compra</span>
                        <span class="value">${escapeHtml(ticket.fecha_compra)}</span>
                    </div>
                </div>
                <div class="ticket-qr">
                    <span class="ticket-qr-code">${escapeHtml(ticket.qr)}</span>
                    <div class="ticket-qr-actions">
                        <button class="qr-icon-btn" data-qr="${ticket.qr}" title="Copiar QR">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                <div class="ticket-footer">
                    <span class="ticket-status status-${ticket.estado}">${ticket.estado}</span>
                    <span class="ticket-date">${ticket.fecha_compra}</span>
                </div>
            </div>
        </div>
    `).join('');

    // Event listeners para copiar QR
    document.querySelectorAll('.qr-icon-btn').forEach(btn => {
        btn.onclick = () => {
            const qrText = btn.getAttribute('data-qr');
            navigator.clipboard.writeText(qrText);
            window.app?.showToast('Código QR copiado', 'success');
        };
    });
}

function setupFilters() {
    const eventInput = document.getElementById('filter-event');
    const statusSelect = document.getElementById('filter-status');
    const dateFrom = document.getElementById('filter-date-from');
    const dateTo = document.getElementById('filter-date-to');
    const clearBtn = document.getElementById('clear-filters');

    if (!eventInput) {
        console.warn('Filtros no encontrados en el DOM');
        return;
    }

    const applyFilters = () => {
        const eventValue = eventInput.value.toLowerCase().trim();
        const statusValue = statusSelect.value;
        const fromValue = dateFrom.value;
        const toValue = dateTo.value;

        console.log('Aplicando filtros:', { eventValue, statusValue, fromValue, toValue });

        // Filtrar tickets
        const filtered = allTickets.filter(ticket => {
            // Filtrar por evento (coincidencia exacta o parcial)
            if (eventValue && !ticket.evento.toLowerCase().includes(eventValue)) {
                return false;
            }

            // Filtrar por estado (solo si no es 'all')
            if (statusValue !== 'all' && ticket.estado !== statusValue) {
                return false;
            }

            // Filtrar por fecha desde
            if (fromValue && ticket.fecha_evento) {
                const ticketDate = new Date(ticket.fecha_evento.split('T')[0]);
                const fromDate = new Date(fromValue);
                if (ticketDate < fromDate) {
                    return false;
                }
            }

            // Filtrar por fecha hasta
            if (toValue && ticket.fecha_evento) {
                const ticketDate = new Date(ticket.fecha_evento.split('T')[0]);
                const toDate = new Date(toValue);
                toDate.setDate(toDate.getDate() + 1);
                if (ticketDate > toDate) {
                    return false;
                }
            }

            return true;
        });

        console.log('Tickets filtrados:', filtered.length);
        
        // Siempre renderizar los tickets filtrados (pueden ser 0)
        renderTickets(filtered);
    };

    // Añadir event listeners
    eventInput.addEventListener('input', applyFilters);
    statusSelect.addEventListener('change', applyFilters);
    dateFrom.addEventListener('change', applyFilters);
    dateTo.addEventListener('change', applyFilters);

    // Botón limpiar filtros
    if (clearBtn) {
        clearBtn.onclick = () => {
            eventInput.value = '';
            statusSelect.value = 'all';
            dateFrom.value = '';
            dateTo.value = '';
            renderTickets(allTickets);
            window.app?.showToast('Filtros limpiados', 'info');
        };
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}