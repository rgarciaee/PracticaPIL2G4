// proveedor.js

window.initProveedor = async function () {
    console.log('Inicializando proveedor...');
    
    try {
        const response = await fetch('/api/zones');
        const result = await response.json();
        
        if (result.success && result.data) {
            renderZones(result.data);
            updateStats(result.data);
        } else {
            console.error('Error cargando zonas:', result.error);
            document.getElementById('zones-list').innerHTML = '<div class="error">No se pudieron cargar las zonas</div>';
        }
    } catch (error) {
        console.error('Error en initProveedor:', error);
    }
};

function renderZones(zones) {
    const container = document.getElementById('zones-list');
    if (!container) return;
    
    if (!zones || zones.length === 0) {
        container.innerHTML = '<div class="no-zones">No hay zonas disponibles</div>';
        return;
    }
    
    container.innerHTML = zones.map(zone => `
        <div class="zone-card" data-zone-id="${zone.id}">
            <div class="zone-header">
                <h3>${zone.nombre}</h3>
            </div>
            <div class="zone-body">
                <div class="zone-info">
                    <div class="zone-info-item">
                        <span class="label">Evento</span>
                        <span class="value">${zone.evento_nombre || zone.evento_id}</span>
                    </div>
                    <div class="zone-info-item">
                        <span class="label">Aforo máximo</span>
                        <span class="value">${zone.aforo_maximo || 'N/A'} personas</span>
                    </div>
                    <div class="zone-info-item">
                        <span class="label">Precio alquiler</span>
                        <span class="value zone-price">${zone.precio || 0} €</span>
                    </div>
                </div>
                <button class="btn btn-primary request-zone-btn" data-zone-name="${zone.nombre}" data-price="${zone.precio || 0}">
                    Solicitar alquiler
                </button>
            </div>
        </div>
    `).join('');
    
    // Event listeners
    document.querySelectorAll('.request-zone-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const zoneName = btn.getAttribute('data-zone-name');
            const price = btn.getAttribute('data-price');
            if (window.app) {
                window.app.showModal(
                    'Solicitar alquiler',
                    `¿Deseas solicitar el alquiler de la zona <strong>${zoneName}</strong> por <strong>${price} €</strong>?`,
                    () => {
                        window.app.showToast(`Solicitud enviada para ${zoneName}`, 'success');
                    }
                );
            }
        });
    });
}

function updateStats(zones) {
    const totalZonesSpan = document.getElementById('total-zones');
    if (totalZonesSpan) {
        totalZonesSpan.textContent = zones.length;
    }
}