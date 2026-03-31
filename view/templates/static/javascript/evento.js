// evento.js
let currentEvent = null;

window.initEvento = async function () {
    console.log('Inicializando evento...');
    
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const eventId = params.get('id');
    
    if (!eventId) return;
    
    try {
        const response = await fetch(`/api/events/${eventId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            currentEvent = result.data;
            renderEvent(currentEvent);
        }
    } catch (error) {
        console.error('Error cargando evento:', error);
    }
};

function renderEvent(event) {
    const container = document.getElementById('evento-content');
    if (!container) return;

    container.innerHTML = `
        <h1>${event.nombre}</h1>
        <p>${event.descripcion || ''}</p>
        <div id="zones"></div>
    `;

    renderZones(event.zonas || []);
}

function renderZones(zones) {
    const zonesContainer = document.getElementById('zones');
    if (!zonesContainer) return;

    if (!zones.length) {
        zonesContainer.innerHTML = '<p>No hay zonas disponibles</p>';
        return;
    }

    zonesContainer.innerHTML = zones.map(zone => `
        <div class="zone-card">
            <h3>${zone.nombre}</h3>
            <p>Precio: ${zone.precio || 0}€</p>
            <p>Aforo: ${zone.aforo_maximo || 0}</p>
            <button class="btn btn-primary buy-ticket-btn"
                data-zone-id="${zone.id}"
                data-zone-name="${zone.nombre}"
                data-price="${zone.precio || 0}">
                Comprar
            </button>
        </div>
    `).join('');

    document.querySelectorAll('.buy-ticket-btn').forEach(btn => {
        btn.onclick = async () => {
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
                    imagen: currentEvent.imagen
                };
                
                await window.app.addToCart(cartItem);
            }
        };
    });
}