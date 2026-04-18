let allTickets = [];
let filteredTickets = [];
let currentPage = 1;

const TICKETS_PER_PAGE = 8;

window.initHistorial = async function () {
    console.log('Inicializando historial...');

    await loadHistoryData();
    setupFilters();
};

async function loadHistoryData() {
    allTickets = [];
    filteredTickets = [];
    currentPage = 1;

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

    filteredTickets = [...allTickets];
    renderTickets();
}

function renderTickets() {
    const container = document.getElementById('history-list');
    const emptyMsg = document.getElementById('no-tickets-message');
    const pagination = document.getElementById('history-pagination');

    if (!container || !emptyMsg || !pagination) return;

    if (!filteredTickets.length) {
        container.innerHTML = '';
        emptyMsg.classList.remove('is-hidden');
        pagination.innerHTML = '';
        pagination.classList.add('is-hidden');
        return;
    }

    emptyMsg.classList.add('is-hidden');

    const totalPages = Math.max(1, Math.ceil(filteredTickets.length / TICKETS_PER_PAGE));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);

    const start = (currentPage - 1) * TICKETS_PER_PAGE;
    const visibleTickets = filteredTickets.slice(start, start + TICKETS_PER_PAGE);

    container.innerHTML = visibleTickets.map(ticket => {
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
                        <span class="value">${formatCurrencyValue(ticket.precio || 0)}</span>
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

    renderHistoryPagination(totalPages);
}

function renderHistoryPagination(totalPages) {
    const pagination = document.getElementById('history-pagination');
    if (!pagination) return;

    pagination.classList.remove('is-hidden');
    pagination.dataset.totalPages = String(totalPages);
    pagination.dataset.totalItems = String(filteredTickets.length);

    const pageItems = Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        return `
            <button
                type="button"
                class="page-item pagination-button ${page === currentPage ? 'active' : ''}"
                data-history-page="${page}"
                aria-label="Ir a la pagina ${page}"
                aria-current="${page === currentPage ? 'page' : 'false'}"
            >
                ${page}
            </button>
        `;
    }).join('');

    pagination.innerHTML = `
        <span class="history-page-summary">Pagina ${currentPage} de ${totalPages}</span>
        <button
            type="button"
            class="page-item pagination-button pagination-button-nav history-page-nav"
            data-history-page="${currentPage - 1}"
            ${currentPage === 1 ? 'disabled' : ''}
            aria-label="Pagina anterior"
        >
            <i class="fas fa-chevron-left"></i>
        </button>
        ${pageItems}
        <button
            type="button"
            class="page-item pagination-button pagination-button-nav history-page-nav"
            data-history-page="${currentPage + 1}"
            ${currentPage === totalPages ? 'disabled' : ''}
            aria-label="Pagina siguiente"
        >
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.querySelectorAll('[data-history-page]').forEach(button => {
        button.addEventListener('click', () => {
            if (button.disabled) return;
            const nextPage = Number(button.dataset.historyPage);
            if (!Number.isFinite(nextPage) || nextPage === currentPage) return;
            currentPage = nextPage;
            renderTickets();
            pagination.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
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

        filteredTickets = allTickets.filter(ticket => {
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

        currentPage = 1;
        renderTickets();
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
            filteredTickets = [...allTickets];
            currentPage = 1;
            renderTickets();
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

function formatCurrencyValue(value) {
    if (window.formatCurrency) {
        return window.formatCurrency(value);
    }

    const parsed = Number(value);
    return `${Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00'} EUR`;
}
