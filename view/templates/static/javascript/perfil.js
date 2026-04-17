// perfil.js

let currentUserData = null;

const DEFAULT_AVATAR_URL = 'https://static.vecteezy.com/system/resources/previews/036/594/092/non_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg';

window.initPerfil = async function () {
    console.log('Inicializando perfil...');

    if (!window.app) {
        setTimeout(() => window.initPerfil(), 100);
        return;
    }

    if (!document.getElementById('perfil-content')) {
        return;
    }

    if (typeof firebase !== 'undefined') {
        console.log('Esperando sesion de Firebase...');
        await new Promise((resolve) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                console.log('Usuario de Firebase:', user?.email);
                unsubscribe();
                resolve();
            });
        });
    }

    setupForm();
    setupAvatarUrlPreview();
    setupPasswordSection();
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
    const avatarUrl = document.getElementById('user-avatar-url');
    const role = document.getElementById('user-role');
    const phone = document.getElementById('user-phone');

    if (!dni || !name || !birth || !email || !address || !card || !phone || !avatarUrl) {
        return;
    }

    dni.value = data.dni || '';
    name.value = data.nombre_apellidos || '';
    birth.value = data.fecha_nacimiento || '';
    email.value = data.email || '';
    address.value = data.direccion || '';
    card.value = data.num_tarjeta || '';
    phone.value = data.telefono || '';
    avatarUrl.value = data.avatar_url || '';

    updateAvatarPreview(data.avatar_url || '');

    if (role) {
        role.textContent = data.rol_asignado || 'Cliente';
    }
}

function updateAvatarPreview(url) {
    const avatarImg = document.getElementById('profile-avatar');
    if (!avatarImg) return;

    const trimmedUrl = String(url || '').trim();
    avatarImg.onerror = () => {
        avatarImg.onerror = null;
        avatarImg.src = DEFAULT_AVATAR_URL;
    };
    avatarImg.src = trimmedUrl || DEFAULT_AVATAR_URL;
}

function setupAvatarUrlPreview() {
    const avatarUrlInput = document.getElementById('user-avatar-url');
    if (!avatarUrlInput) return;

    avatarUrlInput.addEventListener('input', () => {
        updateAvatarPreview(avatarUrlInput.value);
    });

    avatarUrlInput.addEventListener('blur', () => {
        updateAvatarPreview(avatarUrlInput.value);
    });
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
    const dni = document.getElementById('user-dni');
    const name = document.getElementById('user-name');
    const email = document.getElementById('user-email');
    const birth = document.getElementById('user-birth');
    const address = document.getElementById('user-address');
    const card = document.getElementById('user-card');
    const phone = document.getElementById('user-phone');
    const avatarUrl = document.getElementById('user-avatar-url');

    if (!dni || !name || !email || !birth || !address || !card || !phone || !avatarUrl) {
        return;
    }

    const updated = {
        dni: dni.value,
        nombre_apellidos: name.value,
        email: email.value,
        fecha_nacimiento: birth.value,
        direccion: address.value,
        num_tarjeta: card.value,
        telefono: phone.value,
        avatar_url: avatarUrl.value
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

            if (window.app) {
                window.app.currentUser.nombre_apellidos = name.value;
                window.app.currentUser.email = email.value;
                window.app.currentUser.avatar = avatarUrl.value;
                window.app.updateUserUI();
            }

            updateAvatarPreview(avatarUrl.value);
        } else {
            window.app?.showToast(result.error || 'Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error guardando perfil:', error);
        window.app?.showToast('Error al guardar', 'error');
    }
}

function setupPasswordSection() {
    console.log('Configurando seccion de contrasena...');

    const header = document.getElementById('password-header');
    const content = document.getElementById('password-content');

    if (!header) {
        console.error('No se encontro password-header');
        return;
    }

    if (!content) {
        console.error('No se encontro password-content');
        return;
    }

    content.classList.add('is-hidden');

    const icon = header.querySelector('i:last-child');
    if (icon) {
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }

    header.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('Click en password-header');
        content.classList.toggle('is-hidden');

        if (icon) {
            if (content.classList.contains('is-hidden')) {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            } else {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        }
    };

    const changeBtn = document.getElementById('change-password-btn');
    if (changeBtn) {
        changeBtn.onclick = async () => {
            const currentPass = document.getElementById('current-password')?.value;
            const newPass = document.getElementById('new-password')?.value;
            const confirmPass = document.getElementById('confirm-password')?.value;

            if (!currentPass || !newPass || !confirmPass) {
                window.app?.showToast('Completa todos los campos', 'warning');
                return;
            }

            if (newPass !== confirmPass) {
                window.app?.showToast('Las contrasenas nuevas no coinciden', 'error');
                return;
            }

            if (newPass.length < 6) {
                window.app?.showToast('La contrasena debe tener al menos 6 caracteres', 'error');
                return;
            }

            changeBtn.disabled = true;
            changeBtn.textContent = 'Verificando...';

            try {
                if (typeof firebase === 'undefined' || !firebase.auth) {
                    console.error('Firebase no esta disponible');
                    window.app?.showToast('Firebase no esta disponible. Recarga la pagina.', 'error');
                    changeBtn.disabled = false;
                    changeBtn.textContent = 'Actualizar contrasena';
                    return;
                }

                const auth = firebase.auth();
                const user = auth.currentUser;

                console.log('Usuario actual de Firebase:', user?.email);

                if (!user || !user.email) {
                    window.app?.showToast('No hay usuario autenticado. Vuelve a iniciar sesion.', 'error');
                    changeBtn.disabled = false;
                    changeBtn.textContent = 'Actualizar contrasena';
                    return;
                }

                const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPass);

                try {
                    await user.reauthenticateWithCredential(credential);
                    await user.updatePassword(newPass);

                    window.app?.showToast('Contrasena actualizada correctamente', 'success');

                    document.getElementById('current-password').value = '';
                    document.getElementById('new-password').value = '';
                    document.getElementById('confirm-password').value = '';

                    content.classList.add('is-hidden');
                    if (icon) {
                        icon.classList.remove('fa-chevron-up');
                        icon.classList.add('fa-chevron-down');
                    }
                } catch (reauthError) {
                    console.error('Error de reautenticacion:', reauthError);
                    if (reauthError.code === 'auth/wrong-password') {
                        window.app?.showToast('Contrasena actual incorrecta', 'error');
                    } else if (reauthError.code === 'auth/too-many-requests') {
                        window.app?.showToast('Demasiados intentos. Intenta mas tarde', 'error');
                    } else if (reauthError.code === 'auth/user-token-expired') {
                        window.app?.showToast('La sesion ha expirado. Vuelve a iniciar sesion.', 'error');
                    } else {
                        window.app?.showToast(`Error al verificar la contrasena: ${reauthError.message}`, 'error');
                    }
                }
            } catch (error) {
                console.error('Error cambiando contrasena:', error);
                window.app?.showToast(`Error al cambiar la contrasena: ${error.message}`, 'error');
            } finally {
                changeBtn.disabled = false;
                changeBtn.textContent = 'Actualizar contrasena';
            }
        };
    }

    console.log('Seccion de contrasena configurada correctamente');
}
