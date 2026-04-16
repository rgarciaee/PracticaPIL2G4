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
                    detalle_tipo: ticket.detalle_tipo || 'Entrada',
                    evento: ticket.evento_nombre || 'Evento',
                    zona: ticket.zona_nombre || 'Zona general',
                    fecha_evento: ticket.fecha_evento || '',
                    fecha_compra: ticket.fecha_compra || '',
                    estado: ticket.estado || 'Activa',
                    qr: ticket.localizador_qr || '',
                    precio: ticket.precio || 0,
                }));

                console.log('Historial cargado:', allTickets.length);
            }
        }
    } catch (error) {
        console.error('Error cargando historial:', error);
    }

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

    container.innerHTML = ticketsToShow.map(ticket => {
        const normalizedStatus = normalizeClassName(ticket.estado);
        const typeLabel = ticket.detalle_tipo || 'Entrada';
        const codeLabel = 'Codigo';

        return `
        <div class="ticket-card" data-aos="fade-up">
            <div class="ticket-header">
                <h3>${escapeHtml(ticket.evento)}</h3>
                <span class="badge badge-primary">${escapeHtml(typeLabel)}</span>
            </div>
            <div class="ticket-body">
                <div class="ticket-info">
                    <div class="ticket-info-item">
                        <span class="label">Concepto</span>
                        <span class="value">${escapeHtml(ticket.detalle_tipo || typeLabel)}</span>
                    </div>
                    <div class="ticket-info-item">
                        <span class="label">Zona</span>
                        <span class="value">${escapeHtml(ticket.zona)}</span>
                    </div>
                    <div class="ticket-info-item">
                        <span class="label">Fecha evento</span>
                        <span class="value">${escapeHtml(formatEventDate(ticket.fecha_evento))}</span>
                    </div>
                    <div class="ticket-info-item">
                        <span class="label">Importe</span>
                        <span class="value">${Number(ticket.precio || 0).toFixed(2)} EUR</span>
                    </div>
                </div>
                <div class="ticket-qr">
                    <span class="ticket-qr-code">${escapeHtml(ticket.qr)}</span>
                    <div class="ticket-qr-actions">
                        <button class="qr-icon-btn" data-qr="${ticket.qr}" title="Copiar ${escapeHtml(codeLabel)}">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                <div class="ticket-footer">
                    <span class="ticket-status status-${normalizedStatus}">${escapeHtml(ticket.estado)}</span>
                    <span class="ticket-date">${escapeHtml(formatShortDate(ticket.fecha_compra))}</span>
                </div>
            </div>
        </div>
    `;
    }).join('');

    document.querySelectorAll('.qr-icon-btn').forEach(btn => {
        btn.onclick = () => {
            const qrText = btn.getAttribute('data-qr');
            navigator.clipboard.writeText(qrText);
            window.app?.showToast('Codigo copiado', 'success');
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

        const filtered = allTickets.filter(ticket => {
            if (eventValue && !ticket.evento.toLowerCase().includes(eventValue)) {
                return false;
            }

            if (statusValue !== 'all' && ticket.estado !== statusValue) {
                return false;
            }

            if (fromValue && ticket.fecha_evento) {
                const ticketDate = new Date(ticket.fecha_evento.split('T')[0]);
                const fromDate = new Date(fromValue);
                if (ticketDate < fromDate) {
                    return false;
                }
            }

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

        renderTickets(filtered);
    };

    eventInput.addEventListener('input', applyFilters);
    statusSelect.addEventListener('change', applyFilters);
    dateFrom.addEventListener('change', applyFilters);
    dateTo.addEventListener('change', applyFilters);

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

function normalizeClassName(text) {
    return String(text || 'desconocido')
        .toLowerCase()
        .replaceAll(' ', '-');
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

function formatShortDate(value) {
    if (!value) return '';
    const text = String(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        const [year, month, day] = text.split('-');
        return `${day}-${month}-${year}`;
    }

    if (text.includes('T')) {
        return formatShortDate(text.split('T')[0]);
    }

    const date = new Date(text);
    if (Number.isNaN(date.getTime())) {
        return text;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
