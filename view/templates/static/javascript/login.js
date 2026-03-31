const firebaseConfig = {
  apiKey: "AIzaSyChVLwUVRUi1uU_trNd_QbfM8zme9kE_bk",
  authDomain: "pi-l2-g4-2.firebaseapp.com",
  databaseURL: "https://pi-l2-g4-2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pi-l2-g4-2",
  storageBucket: "pi-l2-g4-2.firebasestorage.app",
  messagingSenderId: "556420796675",
  appId: "1:556420796675:web:a31cd4dbfed4a790709936"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Elementos DOM
const authWrapper = document.getElementById('authWrapper');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const mobileRegisterBtn = document.getElementById('mobileRegisterBtn');
const mobileLoginBtn = document.getElementById('mobileLoginBtn');

// Función para mostrar errores
function showError(formId, message) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Eliminar error anterior si existe
    const oldError = form.querySelector('.error-message');
    if (oldError) oldError.remove();
    
    // Crear nuevo error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.firstChild);
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        if (errorDiv.parentNode) errorDiv.remove();
    }, 5000);
}

// Función para limpiar errores
function clearErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    const error = form.querySelector('.error-message');
    if (error) error.remove();
}

// Función para mostrar loading en botón
function setButtonLoading(button, isLoading, originalText = null) {
    if (!button) return;
    if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Cargando...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || originalText || button.textContent;
    }
}

// Función para enviar token al backend
async function sendTokenToBackend(token, provider) {
    const endpoint = provider === 'google' ? '/login-google' : '/login-credentials';
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            credentials: 'include'
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error enviando token:', error);
        return { success: false, error: error.message };
    }
}

// Función para redirigir después de login exitoso
function redirectToApp() {
    window.location.href = '/app';
}

// === LOGIN CON EMAIL/PASSWORD ===
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors('login-form');
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit');
    
    if (!email || !password) {
        showError('login-form', 'Por favor completa todos los campos');
        return;
    }
    
    setButtonLoading(submitBtn, true);
    
    try {
        // Autenticar con Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const token = await userCredential.user.getIdToken();
        
        // Enviar token al backend
        const result = await sendTokenToBackend(token, 'credentials');
        
        if (result.success) {
            // Guardar información básica del usuario en localStorage
            const user = userCredential.user;
            localStorage.setItem('subsonic_user', JSON.stringify({
                id: user.uid,
                email: user.email,
                nombre_apellidos: user.displayName || email.split('@')[0],
                avatar: user.photoURL || 'https://i.pravatar.cc/100?img=' + Math.floor(Math.random() * 70)
            }));
            redirectToApp();
        } else {
            showError('login-form', result.error || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Error al iniciar sesión';
        if (error.code === 'auth/user-not-found') errorMessage = 'Usuario no encontrado';
        else if (error.code === 'auth/wrong-password') errorMessage = 'Contraseña incorrecta';
        else if (error.code === 'auth/invalid-email') errorMessage = 'Email inválido';
        else if (error.code === 'auth/user-disabled') errorMessage = 'Usuario deshabilitado';
        else if (error.code === 'auth/too-many-requests') errorMessage = 'Demasiados intentos. Intenta más tarde';
        else errorMessage = error.message;
        
        showError('login-form', errorMessage);
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// === REGISTRO CON EMAIL/PASSWORD ===
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors('register-form');
    
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const submitBtn = document.getElementById('register-submit');
    
    // Validaciones
    if (!email || !password) {
        showError('register-form', 'Por favor completa todos los campos');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('register-form', 'Las contraseñas no coinciden');
        return;
    }
    
    if (password.length < 6) {
        showError('register-form', 'La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    setButtonLoading(submitBtn, true);
    
    try {
        // Crear usuario en Firebase
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Actualizar perfil con nombre
        if (name) {
            await userCredential.user.updateProfile({ displayName: name });
        }
        
        // Obtener token
        const token = await userCredential.user.getIdToken();
        
        // Enviar token al backend
        const result = await sendTokenToBackend(token, 'credentials');
        
        if (result.success) {
            // Guardar información del usuario
            localStorage.setItem('subsonic_user', JSON.stringify({
                id: userCredential.user.uid,
                email: email,
                nombre_apellidos: name || email.split('@')[0],
                avatar: 'https://i.pravatar.cc/100?img=' + Math.floor(Math.random() * 70)
            }));
            redirectToApp();
        } else {
            showError('register-form', result.error || 'Error al registrar usuario');
        }
    } catch (error) {
        console.error('Register error:', error);
        let errorMessage = 'Error al registrar';
        if (error.code === 'auth/email-already-in-use') errorMessage = 'El email ya está registrado';
        else if (error.code === 'auth/invalid-email') errorMessage = 'Email inválido';
        else if (error.code === 'auth/weak-password') errorMessage = 'La contraseña es muy débil';
        else errorMessage = error.message;
        
        showError('register-form', errorMessage);
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// === LOGIN CON GOOGLE ===
document.getElementById('google-login').addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    const loginBtn = document.getElementById('login-submit');
    
    setButtonLoading(loginBtn, true);
    
    try {
        const result = await auth.signInWithPopup(provider);
        const token = await result.user.getIdToken();
        
        const backendResult = await sendTokenToBackend(token, 'google');
        
        if (backendResult.success) {
            localStorage.setItem('subsonic_user', JSON.stringify({
                id: result.user.uid,
                email: result.user.email,
                nombre_apellidos: result.user.displayName || result.user.email.split('@')[0],
                avatar: result.user.photoURL || 'https://i.pravatar.cc/100?img=' + Math.floor(Math.random() * 70)
            }));
            redirectToApp();
        } else {
            showError('login-form', backendResult.error || 'Error con Google');
        }
    } catch (error) {
        console.error('Google login error:', error);
        showError('login-form', error.message);
    } finally {
        setButtonLoading(loginBtn, false);
    }
});

// === REGISTRO CON GOOGLE ===
document.getElementById('google-register').addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    const registerBtn = document.getElementById('register-submit');
    
    setButtonLoading(registerBtn, true);
    
    try {
        const result = await auth.signInWithPopup(provider);
        const token = await result.user.getIdToken();
        
        const backendResult = await sendTokenToBackend(token, 'google');
        
        if (backendResult.success) {
            localStorage.setItem('subsonic_user', JSON.stringify({
                id: result.user.uid,
                email: result.user.email,
                nombre_apellidos: result.user.displayName || result.user.email.split('@')[0],
                avatar: result.user.photoURL || 'https://i.pravatar.cc/100?img=' + Math.floor(Math.random() * 70)
            }));
            redirectToApp();
        } else {
            showError('register-form', backendResult.error || 'Error con Google');
        }
    } catch (error) {
        console.error('Google register error:', error);
        showError('register-form', error.message);
    } finally {
        setButtonLoading(registerBtn, false);
    }
});

// === ANIMACIÓN DEL PANEL DESLIZANTE ===
if (registerBtn) {
    registerBtn.addEventListener('click', () => {
        authWrapper.classList.add("panel-active");
    });
}

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        authWrapper.classList.remove("panel-active");
    });
}

if (mobileRegisterBtn) {
    mobileRegisterBtn.addEventListener('click', () => {
        authWrapper.classList.add("panel-active");
    });
}

if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener('click', () => {
        authWrapper.classList.remove("panel-active");
    });
}

// === RECUPERAR CONTRASEÑA ===
document.getElementById('forgot-password').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    
    if (!email) {
        showError('login-form', 'Ingresa tu email para recuperar la contraseña');
        return;
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        showError('login-form', '📧 Se ha enviado un enlace de recuperación a tu email');
    } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'Error al enviar el email';
        if (error.code === 'auth/user-not-found') errorMessage = 'No existe una cuenta con ese email';
        else errorMessage = error.message;
        showError('login-form', errorMessage);
    }
});