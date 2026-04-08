// carrito.js
window.initCarrito = async function () {
    console.log('Inicializando carrito...');

    // Esperar a que app exista
    let attempts = 0;
    while (!window.app && attempts < 50) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }
    
    if (!window.app) {
        console.error('App no disponible después de esperar');
        return;
    }
    
    // Verificar que el método existe
    if (typeof window.app.loadCartFromAPI !== 'function') {
        console.error('loadCartFromAPI no es una función', window.app);
        return;
    }

    await renderCartItems();
    setupCartButtons();
};

async function renderCartItems() {
    const container = document.getElementById('cart-items-list');
    const subtotalEl = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');
    const emptyMsg = document.getElementById('cart-empty-message');

    if (!container || !subtotalEl || !totalEl) return;

    // Recargar carrito desde API
    await window.app.loadCartFromAPI();
    const cart = window.app.cart || [];

    console.log('Carrito renderizado:', cart.length, 'items');

    if (cart.length === 0) {
        container.innerHTML = '';
        if (emptyMsg) emptyMsg.classList.remove('is-hidden');
        subtotalEl.textContent = '0.00 €';
        totalEl.textContent = '0.00 €';
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('is-hidden');

    // Render items
    container.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-info">
                <h4>${escapeHtml(item.nombre)}</h4>
                <p>${item.tipo || 'General'} | ${item.evento_nombre || 'Subsonic Festival'}</p>
            </div>
            <div class="cart-item-price">${(item.precio || 0).toFixed(2)} €</div>
            <div class="cart-item-quantity">
                <button class="qty-minus" data-id="${item.id}">-</button>
                <span>${item.cantidad || 1}</span>
                <button class="qty-plus" data-id="${item.id}">+</button>
            </div>
            <div class="cart-item-subtotal">${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)} €</div>
            <div class="cart-item-remove" data-id="${item.id}">
                <i class="fas fa-trash-alt"></i>
            </div>
        </div>
    `).join('');

    // Calcular total
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += (item.precio || 0) * (item.cantidad || 1);
    });
    const total = subtotal + 2.5;

    subtotalEl.textContent = subtotal.toFixed(2) + ' €';
    totalEl.textContent = total.toFixed(2) + ' €';

    // Event listeners para cantidad y eliminar
    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const item = cart.find(i => i.id === id);
            if (item && item.cantidad > 1) {
                await window.app.updateCartItemAPI(id, item.cantidad - 1);
                await renderCartItems();
            } else if (item && item.cantidad === 1) {
                await window.app.removeFromCartAPI(id);
                await renderCartItems();
            }
        };
    });

    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const item = cart.find(i => i.id === id);
            if (item) {
                await window.app.updateCartItemAPI(id, item.cantidad + 1);
                await renderCartItems();
            }
        };
    });

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            await window.app.removeFromCartAPI(id);
            await renderCartItems();
        };
    });
}

function setupCartButtons() {
    const checkoutBtn = document.getElementById('checkout-btn');
    const continueBtn = document.getElementById('continue-shopping');

    console.log('Configurando botones:', { checkoutBtn: !!checkoutBtn, continueBtn: !!continueBtn });

    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            console.log('Botón checkout clickeado');
            
            if (!window.app?.cart || window.app.cart.length === 0) {
                window.app?.showToast('El carrito está vacío', 'warning');
                return;
            }

            const subtotal = (window.app.cart || []).reduce(
                (sum, item) => sum + ((item.precio || 0) * (item.cantidad || 1)), 0
            );
            const total = subtotal + 2.50;

            // 👇 AQUÍ VA EL MODAL
            const itemsList = window.app.cart.map(item => 
                `<li>${escapeHtml(item.nombre)} x ${item.cantidad} = ${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)} €</li>`
            ).join('');

            window.app.showModal(
                'Confirmar compra',
                `
                <div class="checkout-summary">
                    <h4>Resumen de tu compra:</h4>
                    <ul style="max-height: 200px; overflow-y: auto;">${itemsList}</ul>
                    <p><strong>Subtotal:</strong> ${subtotal.toFixed(2)} €</p>
                    <p><strong>Gastos de gestión:</strong> 2.50 €</p>
                    <p><strong>Total:</strong> ${total.toFixed(2)} €</p>
                    <hr>
                    <p>¿Deseas proceder con el pago?</p>
                </div>
                `,
                async () => {
                    console.log('Confirmación de compra aceptada');

                    const result = await window.app.processCheckout(window.app.cart, total);

                    console.log('Resultado checkout:', result);

                    if (result && result.success) {
                        await window.app.clearCartAPI();
                        await renderCartItems();

                        if (window.router) {
                            window.router.navigate('historial');
                        }
                    } else {
                        window.app.showToast('Error en la compra', 'error');
                    }
                }
            );
        };
    }

    if (continueBtn) {
        continueBtn.onclick = () => {
            if (window.router) window.router.navigate('home');
        };
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}