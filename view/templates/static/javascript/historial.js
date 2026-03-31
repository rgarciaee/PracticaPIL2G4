// historial.js

let allTickets = [];

window.initHistorial = async function () {
    console.log('Inicializando historial...');

    await loadHistoryData();
    renderHistory();
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
                    evento: ticket.evento_nombre || 'Evento',
                    zona: ticket.zona_nombre || 'Zona general',
                    fecha_evento: ticket.fecha_evento || '',
                    fecha_compra: ticket.fecha_compra || '',
                    estado: ticket.estado || 'Activa',
                    qr: ticket.localizador_qr || ''
                }));

                console.log('Historial cargado:', allTickets.length);
            }
        }
    } catch (error) {
        console.error('Error cargando historial:', error);
    }
}

function renderHistory() {
    const container = document.getElementById('history-list');
    const emptyMsg = document.getElementById('no-tickets-message');

    if (!container || !emptyMsg) return;

    // 🧼 Sin tickets
    if (!allTickets.length) {
        container.innerHTML = '';
        emptyMsg.classList.remove('is-hidden');
        return;
    }

    emptyMsg.classList.add('is-hidden');

    // 🎟️ Render tickets
    container.innerHTML = allTickets.map(ticket => `
        <div class="ticket-card">
            <h3>${ticket.evento}</h3>
            <p><strong>Zona:</strong> ${ticket.zona}</p>
            <p><strong>Fecha evento:</strong> ${ticket.fecha_evento}</p>
            <p><strong>Compra:</strong> ${ticket.fecha_compra}</p>
            <p><strong>Estado:</strong> ${ticket.estado}</p>
            <p><strong>QR:</strong> ${ticket.qr}</p>
        </div>
    `).join('');
}