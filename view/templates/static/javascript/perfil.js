// perfil.js

let currentUserData = null;

window.initPerfil = async function () {
    console.log('Inicializando perfil...');

    if (!window.app) {
        setTimeout(() => window.initPerfil(), 100);
        return;
    }

    // Si no estamos realmente en la vista perfil, no hagas nada
    if (!document.getElementById('perfil-content')) {
        return;
    }

    setupForm();
    setupAvatar();
    await loadUserData();
};

async function loadUserData() {
    try {
        const response = await fetch('/api/profile', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('No se pudo cargar el perfil');
        }

        const result = await response.json();

        // Si durante la espera ya no estamos en perfil, salir
        if (!document.getElementById('perfil-content')) {
            return;
        }

        if (result.success && result.data) {
            currentUserData = result.data;
            fillForm(currentUserData);
            return;
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }

    currentUserData = {};
    fillForm(currentUserData);
}

function fillForm(data) {
    const dni = document.getElementById('user-dni');
    const name = document.getElementById('user-name');
    const birth = document.getElementById('user-birth');
    const email = document.getElementById('user-email');
    const address = document.getElementById('user-address');
    const card = document.getElementById('user-card');
    const phone = document.getElementById('user-phone');
    const notifyEmail = document.getElementById('notify-email');
    const notifySms = document.getElementById('notify-sms');
    const language = document.getElementById('user-language');
    const role = document.getElementById('user-role');

    // Si el formulario ya no está en el DOM, no hacer nada
    if (!dni || !name || !birth || !email || !address || !card || !phone || !notifyEmail || !notifySms || !language) {
        return;
    }

    dni.value = data.dni || '';
    name.value = data.nombre_apellidos || '';
    birth.value = data.fecha_nacimiento || '';
    email.value = data.email || '';
    address.value = data.direccion || '';
    card.value = data.num_tarjeta || '';
    phone.value = data.telefono || '';

    if (role) {
        role.textContent = data.rol_asignado || 'Cliente';
    }

    notifyEmail.checked = data.preferencias?.notificaciones_email ?? true;
    notifySms.checked = data.preferencias?.notificaciones_sms ?? false;
    language.value = data.preferencias?.idioma || 'es';
}

function setupForm() {
    const form = document.getElementById('profile-form');
    const cancelBtn = document.getElementById('cancel-profile');
    const logoutBtn = document.getElementById('logout-profile-btn');

    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        await saveProfile();
    };

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            fillForm(currentUserData || {});
            window.app?.showToast('Cambios descartados', 'info');
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            window.app?.logout();
        };
    }
}

async function saveProfile() {
    const name = document.getElementById('user-name');
    const email = document.getElementById('user-email');
    const birth = document.getElementById('user-birth');
    const address = document.getElementById('user-address');
    const card = document.getElementById('user-card');
    const phone = document.getElementById('user-phone');
    const notifyEmail = document.getElementById('notify-email');
    const notifySms = document.getElementById('notify-sms');
    const language = document.getElementById('user-language');

    if (!name || !email || !birth || !address || !card || !phone || !notifyEmail || !notifySms || !language) {
        return;
    }

    const updated = {
        nombre_apellidos: name.value,
        email: email.value,
        fecha_nacimiento: birth.value,
        direccion: address.value,
        num_tarjeta: card.value,
        telefono: phone.value,
        preferencias: {
            notificaciones_email: notifyEmail.checked,
            notificaciones_sms: notifySms.checked,
            idioma: language.value
        }
    };

    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updated)
        });

        const result = await response.json();

        if (result.success) {
            currentUserData = {
                ...(currentUserData || {}),
                ...updated
            };
            window.app?.showToast('Perfil actualizado', 'success');
        } else {
            window.app?.showToast(result.error || 'Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error guardando perfil:', error);
        window.app?.showToast('Error al guardar', 'error');
    }
}

function setupAvatar() {
    const btn = document.getElementById('change-avatar-btn');
    const input = document.getElementById('avatar-upload');
    const img = document.getElementById('profile-avatar');

    if (!btn || !input || !img) return;

    btn.onclick = () => input.click();

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            img.src = ev.target.result;
            localStorage.setItem('subsonic_avatar', ev.target.result);
        };
        reader.readAsDataURL(file);
    };

    const saved = localStorage.getItem('subsonic_avatar');
    if (saved) {
        img.src = saved;
    }
}