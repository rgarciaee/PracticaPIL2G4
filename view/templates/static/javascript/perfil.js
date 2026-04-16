// perfil.js

let currentUserData = null;

// Constante con la imagen por defecto (solo una vez)
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

    // Forzar recarga de la sesión de Firebase
    if (typeof firebase !== 'undefined') {
        console.log('Esperando sesión de Firebase...');
        await new Promise((resolve) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                console.log('Usuario de Firebase:', user?.email);
                unsubscribe();
                resolve();
            });
        });
    }

    setupForm();
    setupAvatar();
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
    const notifyEmail = document.getElementById('notify-email');
    const notifySms = document.getElementById('notify-sms');
    const language = document.getElementById('user-language');
    const role = document.getElementById('user-role');
    const phone = document.getElementById('user-phone');
    const avatarImg = document.getElementById('profile-avatar');

    if (!dni || !name || !birth || !email || !address || !card || !phone || !avatarUrl || !notifyEmail || !notifySms || !language) {
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

    if (avatarImg) {
        if (data.avatar_url && data.avatar_url !== '') {
            avatarImg.src = data.avatar_url;
        } else {
            avatarImg.src = DEFAULT_AVATAR_URL;
        }
    }

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
    const dni = document.getElementById('user-dni');
    const name = document.getElementById('user-name');
    const email = document.getElementById('user-email');
    const birth = document.getElementById('user-birth');
    const address = document.getElementById('user-address');
    const card = document.getElementById('user-card');
    const phone = document.getElementById('user-phone');
    const avatarUrl = document.getElementById('user-avatar-url');
    const notifyEmail = document.getElementById('notify-email');
    const notifySms = document.getElementById('notify-sms');
    const language = document.getElementById('user-language');

    if (!dni || !name || !email || !birth || !address || !card || !phone || !avatarUrl || !notifyEmail || !notifySms || !language) {
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
        avatar_url: avatarUrl.value,
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
            
            if (window.app) {
                window.app.currentUser.nombre_apellidos = name.value;
                window.app.currentUser.email = email.value;
                window.app.currentUser.avatar = avatarUrl.value;
                window.app.updateUserUI();
            }
            
            const avatarImg = document.getElementById('profile-avatar');
            if (avatarImg) {
                if (avatarUrl.value && avatarUrl.value !== '') {
                    avatarImg.src = avatarUrl.value;
                } else {
                    avatarImg.src = DEFAULT_AVATAR_URL;
                }
            }
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
    const avatarUrlInput = document.getElementById('user-avatar-url');

    if (!btn || !input || !img) return;

    btn.onclick = () => input.click();

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            window.app?.showToast('Selecciona una imagen válida', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const imageUrl = ev.target.result;
            img.src = imageUrl;
            if (avatarUrlInput) {
                avatarUrlInput.value = imageUrl;
            }
            window.app?.showToast('Avatar actualizado localmente. Guarda los cambios para mantenerlo.', 'info');
        };
        reader.readAsDataURL(file);
    };
}

function setupPasswordSection() {
    console.log('Configurando sección de contraseña...');
    
    const header = document.getElementById('password-header');
    const content = document.getElementById('password-content');
    
    if (!header) {
        console.error('No se encontró password-header');
        return;
    }
    
    if (!content) {
        console.error('No se encontró password-content');
        return;
    }
    
    // Asegurar que el contenido está oculto inicialmente
    content.classList.add('is-hidden');
    
    // Cambiar la flecha inicial
    const icon = header.querySelector('i:last-child');
    if (icon) {
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
    
    // Event listener para el header
    header.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Click en password-header');
        
        // Alternar la clase is-hidden
        content.classList.toggle('is-hidden');
        
        // Cambiar la flecha
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
    
    // Botón de cambio de contraseña
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
                window.app?.showToast('Las contraseñas nuevas no coinciden', 'error');
                return;
            }
            
            if (newPass.length < 6) {
                window.app?.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            
            // Mostrar loading
            changeBtn.disabled = true;
            changeBtn.textContent = 'Verificando...';
            
            try {
                // Verificar que Firebase Auth está disponible
                if (typeof firebase === 'undefined' || !firebase.auth) {
                    console.error('Firebase no está disponible');
                    window.app?.showToast('Firebase no está disponible. Recarga la página.', 'error');
                    changeBtn.disabled = false;
                    changeBtn.textContent = 'Actualizar contraseña';
                    return;
                }
                
                const auth = firebase.auth();
                const user = auth.currentUser;
                
                console.log('Usuario actual de Firebase:', user?.email);
                
                if (!user || !user.email) {
                    window.app?.showToast('No hay usuario autenticado. Vuelve a iniciar sesión.', 'error');
                    changeBtn.disabled = false;
                    changeBtn.textContent = 'Actualizar contraseña';
                    return;
                }
                
                // Verificar la contraseña actual (reautenticar)
                const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPass);
                
                try {
                    await user.reauthenticateWithCredential(credential);
                    
                    // Contraseña actual correcta, ahora actualizar
                    await user.updatePassword(newPass);
                    
                    window.app?.showToast('Contraseña actualizada correctamente', 'success');
                    
                    // Limpiar campos
                    document.getElementById('current-password').value = '';
                    document.getElementById('new-password').value = '';
                    document.getElementById('confirm-password').value = '';
                    
                    // Cerrar el colapsable
                    content.classList.add('is-hidden');
                    if (icon) {
                        icon.classList.remove('fa-chevron-up');
                        icon.classList.add('fa-chevron-down');
                    }
                    
                } catch (reauthError) {
                    console.error('Error de reautenticación:', reauthError);
                    if (reauthError.code === 'auth/wrong-password') {
                        window.app?.showToast('Contraseña actual incorrecta', 'error');
                    } else if (reauthError.code === 'auth/too-many-requests') {
                        window.app?.showToast('Demasiados intentos. Intenta más tarde', 'error');
                    } else if (reauthError.code === 'auth/user-token-expired') {
                        window.app?.showToast('La sesión ha expirado. Vuelve a iniciar sesión.', 'error');
                    } else {
                        window.app?.showToast('Error al verificar la contraseña: ' + reauthError.message, 'error');
                    }
                }
                
            } catch (error) {
                console.error('Error cambiando contraseña:', error);
                window.app?.showToast('Error al cambiar la contraseña: ' + error.message, 'error');
            } finally {
                changeBtn.disabled = false;
                changeBtn.textContent = 'Actualizar contraseña';
            }
        };
    }
    
    console.log('Sección de contraseña configurada correctamente');
}
