window.initCarrito = async function () {
    console.log('Inicializando carrito...');

    let attempts = 0;
    while (!window.app && attempts < 50) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }

    if (!window.app) {
        console.error('App no disponible despues de esperar');
        return;
    }

    const isAuthenticated = await window.app.checkAuthStatus();
    if (!isAuthenticated) {
        document.getElementById('page-content').innerHTML = `
            <div class="auth-required-page">
                <div class="card text-center">
                    <i class="fas fa-lock" style="font-size: 4rem; color: var(--primary-color);"></i>
                    <h2>Acceso restringido</h2>
                    <p>Para ver tu carrito necesitas iniciar sesion.</p>
                    <div class="auth-buttons-page">
                        <button onclick="window.location.href='/login'" class="btn btn-primary">
                            Iniciar sesion
                        </button>
                        <button onclick="window.location.href='/login'" class="btn btn-outline">
                            Registrarse
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    await renderCartItems();
    setupCartButtons();
};

const CART_MANAGEMENT_FEE = 2.5;

async function renderCartItems() {
    const container = document.getElementById('cart-items-list');
    const subtotalEl = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');
    const emptyMsg = document.getElementById('cart-empty-message');

    if (!container || !subtotalEl || !totalEl) return;

    await window.app.loadCartFromAPI();
    const cart = window.app.cart || [];

    console.log('Carrito renderizado:', cart.length, 'items');

    if (cart.length === 0) {
        container.innerHTML = '';
        if (emptyMsg) emptyMsg.classList.remove('is-hidden');
        subtotalEl.textContent = formatCurrencyValue(0);
        totalEl.textContent = formatCurrencyValue(0);
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('is-hidden');

    container.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-info">
                <h4>${escapeHtml(item.nombre)}</h4>
                <p>${item.tipo || 'General'} | ${item.evento_nombre || 'Subsonic Festival'}</p>
            </div>
            <div class="cart-item-price">${formatCurrencyValue(item.precio || 0)}</div>
            <div class="cart-item-quantity">
                ${item.item_category === 'provider_rental'
                    ? `<span>Solicitud unica</span>`
                    : `<button class="qty-minus" data-id="${item.id}">-</button>
                <span>${item.cantidad || 1}</span>
                <button class="qty-plus" data-id="${item.id}">+</button>`}
            </div>
            <div class="cart-item-subtotal">${formatCurrencyValue((item.precio || 0) * (item.cantidad || 1))}</div>
            <div class="cart-item-remove" data-id="${item.id}">
                <i class="fas fa-trash-alt"></i>
            </div>
        </div>
    `).join('');

    let subtotal = 0;
    cart.forEach(item => {
        subtotal += (item.precio || 0) * (item.cantidad || 1);
    });
    const total = subtotal + CART_MANAGEMENT_FEE;

    subtotalEl.textContent = formatCurrencyValue(subtotal);
    totalEl.textContent = formatCurrencyValue(total);

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
            console.log('Boton checkout clickeado');

            if (!window.app?.cart || window.app.cart.length === 0) {
                window.app?.showToast('El carrito esta vacio', 'warning');
                return;
            }

            const subtotal = (window.app.cart || []).reduce(
                (sum, item) => sum + ((item.precio || 0) * (item.cantidad || 1)), 0
            );
            const total = subtotal + CART_MANAGEMENT_FEE;

            const completionResult = await window.app.getProfileCompletionStatus();
            if (!completionResult.success) {
                window.app?.showToast('No se pudo comprobar el perfil', 'error');
                return;
            }

            if (!completionResult.data?.complete) {
                showIncompleteProfileModal(completionResult.data?.missing_fields || []);
                return;
            }

            const itemsList = window.app.cart.map(item =>
                `<li>${escapeHtml(item.nombre)} x ${item.cantidad} = ${formatCurrencyValue((item.precio || 0) * (item.cantidad || 1))}</li>`
            ).join('');

            window.app.showModal(
                'Confirmar compra',
                `
                <div class="checkout-summary">
                    <h4>Resumen de tu compra:</h4>
                    <ul style="max-height: 200px; overflow-y: auto;">${itemsList}</ul>
                    <p><strong>Subtotal:</strong> ${formatCurrencyValue(subtotal)}</p>
                    <p><strong>Gastos de gestion:</strong> ${formatCurrencyValue(CART_MANAGEMENT_FEE)}</p>
                    <p><strong>Total:</strong> ${formatCurrencyValue(total)}</p>
                    <hr>
                    <p>Deseas proceder con el pago?</p>
                </div>
                `,
                async () => {
                    console.log('Confirmacion de compra aceptada');

                    const result = await window.app.processCheckout(window.app.cart, total);

                    console.log('Resultado checkout:', result);

                    if (result && result.success) {
                        await window.app.clearCartAPI();
                        await renderCartItems();

                        if (window.router) {
                            window.router.navigate('historial');
                        }
                    } else if (result && result.code === 'PROFILE_INCOMPLETE') {
                        showIncompleteProfileModal(result.missing_fields || []);
                    } else {
                        window.app.showToast(result?.error || 'Error en la compra', 'error');
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

function showIncompleteProfileModal(missingFields) {
    const missingFieldsHtml = missingFields
        .map(item => `<li>${escapeHtml(item.label || item.field)}</li>`)
        .join('');

    window.app.showModal(
        'Completa tu perfil',
        `
        <div class="checkout-summary">
            <p>Para finalizar la compra necesitas completar tu perfil.</p>
            <p>Campos pendientes:</p>
            <ul>${missingFieldsHtml}</ul>
            <p>Te llevamos a la pagina de perfil para completarlo.</p>
        </div>
        `,
        async () => {
            if (window.router) {
                window.router.navigate('perfil');
            }
        }
    );
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

