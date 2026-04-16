const firebaseConfig = {
  apiKey: "AIzaSyChVLwUVRUi1uU_trNd_QbfM8zme9kE_bk",
  authDomain: "pi-l2-g4-2.firebaseapp.com",
  databaseURL: "https://pi-l2-g4-2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pi-l2-g4-2",
  storageBucket: "pi-l2-g4-2.firebasestorage.app",
  messagingSenderId: "556420796675",
  appId: "1:556420796675:web:a31cd4dbfed4a790709936"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const authWrapper = document.getElementById("authWrapper");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const mobileRegisterBtn = document.getElementById("mobileRegisterBtn");
const mobileLoginBtn = document.getElementById("mobileLoginBtn");

function clearStoredUser() {
  localStorage.removeItem("subsonic_user");
  localStorage.removeItem("subsonic_auth_persistence");
  sessionStorage.removeItem("subsonic_user");
  sessionStorage.removeItem("subsonic_auth_persistence");
}

function persistUser(userData, rememberMe) {
  clearStoredUser();
  if (rememberMe) {
    localStorage.setItem("subsonic_user", JSON.stringify(userData));
    localStorage.setItem("subsonic_auth_persistence", "local");
  } else {
    sessionStorage.setItem("subsonic_user", JSON.stringify(userData));
    sessionStorage.setItem("subsonic_auth_persistence", "session");
  }
}

async function applyAuthPersistence(rememberMe) {
  const persistence = rememberMe
    ? firebase.auth.Auth.Persistence.LOCAL
    : firebase.auth.Auth.Persistence.SESSION;
  await auth.setPersistence(persistence);
}

function showError(formId, message) {
  const form = document.getElementById(formId);
  if (!form) return;

  const oldError = form.querySelector(".error-message");
  if (oldError) oldError.remove();

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  form.insertBefore(errorDiv, form.firstChild);

  setTimeout(() => {
    if (errorDiv.parentNode) errorDiv.remove();
  }, 5000);
}

function clearErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  const error = form.querySelector(".error-message");
  if (error) error.remove();
}

function setButtonLoading(button, isLoading, originalText = null) {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Cargando...";
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || originalText || button.textContent;
  }
}

async function sendTokenToBackend(token, provider, profile = null, rememberMe = false) {
  const endpoint = provider === "google" ? "/login-google" : "/login-credentials";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, profile, remember_me: rememberMe }),
      credentials: "include"
    });

    return await response.json();
  } catch (error) {
    console.error("Error enviando token:", error);
    return { success: false, error: error.message };
  }
}

function redirectToApp() {
  window.location.href = "/app";
}

function buildStoredUser(user, fallbackEmail, fallbackAvatar, role) {
  return {
    id: user.uid,
    email: user.email || fallbackEmail || "",
    nombre_apellidos: user.displayName || (fallbackEmail || "").split("@")[0] || "Usuario",
    avatar: user.photoURL || fallbackAvatar,
    role: role || "user"
  };
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors("login-form");

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const rememberMe = document.getElementById("login-remember")?.checked === true;
  const submitBtn = document.getElementById("login-submit");

  if (!email || !password) {
    showError("login-form", "Por favor completa todos los campos");
    return;
  }

  setButtonLoading(submitBtn, true);

  try {
    await applyAuthPersistence(rememberMe);

    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const token = await userCredential.user.getIdToken();
    const result = await sendTokenToBackend(token, "credentials", null, rememberMe);

    if (result.success) {
      persistUser(
        buildStoredUser(
          userCredential.user,
          email,
          "https://i.pravatar.cc/100?img=" + Math.floor(Math.random() * 70),
          result.role
        ),
        rememberMe
      );
      redirectToApp();
      return;
    }

    await auth.signOut();
    showError("login-form", result.error || "Error al iniciar sesion");
  } catch (error) {
    console.error("Login error:", error);
    let errorMessage = "Error al iniciar sesion";
    if (error.code === "auth/user-not-found") errorMessage = "Usuario no encontrado";
    else if (error.code === "auth/wrong-password") errorMessage = "Contrasena incorrecta";
    else if (error.code === "auth/invalid-email") errorMessage = "Email invalido";
    else if (error.code === "auth/user-disabled") errorMessage = "Usuario deshabilitado";
    else if (error.code === "auth/too-many-requests") errorMessage = "Demasiados intentos. Intenta mas tarde";
    else errorMessage = error.message;

    showError("login-form", errorMessage);
  } finally {
    setButtonLoading(submitBtn, false);
  }
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors("register-form");

  const name = document.getElementById("reg-name").value;
  const dni = document.getElementById("reg-dni").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const confirmPassword = document.getElementById("reg-confirm-password").value;
  const rememberMe = document.getElementById("register-remember")?.checked === true;
  const submitBtn = document.getElementById("register-submit");

  if (!email || !password || !name || !dni) {
    showError("register-form", "Por favor completa todos los campos");
    return;
  }

  if (password !== confirmPassword) {
    showError("register-form", "Las contrasenas no coinciden");
    return;
  }

  if (password.length < 6) {
    showError("register-form", "La contrasena debe tener al menos 6 caracteres");
    return;
  }

  setButtonLoading(submitBtn, true);

  try {
    await applyAuthPersistence(rememberMe);

    const userCredential = await auth.createUserWithEmailAndPassword(email, password);

    if (name) {
      await userCredential.user.updateProfile({ displayName: name });
    }

    const token = await userCredential.user.getIdToken();
    const result = await sendTokenToBackend(
      token,
      "credentials",
      {
        nombre_apellidos: name,
        dni: dni
      },
      rememberMe
    );

    if (result.success) {
      persistUser(
        buildStoredUser(
          userCredential.user,
          email,
          "https://i.pravatar.cc/100?img=" + Math.floor(Math.random() * 70),
          result.role
        ),
        rememberMe
      );
      redirectToApp();
      return;
    }

    await auth.signOut();
    showError("register-form", result.error || "Error al registrar usuario");
  } catch (error) {
    console.error("Register error:", error);
    let errorMessage = "Error al registrar";
    if (error.code === "auth/email-already-in-use") errorMessage = "El email ya esta registrado";
    else if (error.code === "auth/invalid-email") errorMessage = "Email invalido";
    else if (error.code === "auth/weak-password") errorMessage = "La contrasena es muy debil";
    else errorMessage = error.message;

    showError("register-form", errorMessage);
  } finally {
    setButtonLoading(submitBtn, false);
  }
});

document.getElementById("google-login").addEventListener("click", async (e) => {
  e.preventDefault();
  const provider = new firebase.auth.GoogleAuthProvider();
  const submitBtn = document.getElementById("login-submit");
  const rememberMe = document.getElementById("login-remember")?.checked === true;

  setButtonLoading(submitBtn, true);

  try {
    await applyAuthPersistence(rememberMe);

    const result = await auth.signInWithPopup(provider);
    const token = await result.user.getIdToken();
    const backendResult = await sendTokenToBackend(
      token,
      "google",
      {
        nombre_apellidos: result.user.displayName || "",
        avatar_url: result.user.photoURL || ""
      },
      rememberMe
    );

    if (backendResult.success) {
      persistUser(
        buildStoredUser(
          result.user,
          result.user.email,
          "https://i.pravatar.cc/100?img=" + Math.floor(Math.random() * 70),
          backendResult.role
        ),
        rememberMe
      );
      redirectToApp();
      return;
    }

    await auth.signOut();
    showError("login-form", backendResult.error || "Error con Google");
  } catch (error) {
    console.error("Google login error:", error);
    showError("login-form", error.message);
  } finally {
    setButtonLoading(submitBtn, false);
  }
});

document.getElementById("google-register").addEventListener("click", async (e) => {
  e.preventDefault();
  const provider = new firebase.auth.GoogleAuthProvider();
  const submitBtn = document.getElementById("register-submit");
  const rememberMe = document.getElementById("register-remember")?.checked === true;

  setButtonLoading(submitBtn, true);

  try {
    await applyAuthPersistence(rememberMe);

    const result = await auth.signInWithPopup(provider);
    const token = await result.user.getIdToken();
    const backendResult = await sendTokenToBackend(
      token,
      "google",
      {
        nombre_apellidos: result.user.displayName || "",
        avatar_url: result.user.photoURL || ""
      },
      rememberMe
    );

    if (backendResult.success) {
      persistUser(
        buildStoredUser(
          result.user,
          result.user.email,
          "https://i.pravatar.cc/100?img=" + Math.floor(Math.random() * 70),
          backendResult.role
        ),
        rememberMe
      );
      redirectToApp();
      return;
    }

    await auth.signOut();
    showError("register-form", backendResult.error || "Error con Google");
  } catch (error) {
    console.error("Google register error:", error);
    showError("register-form", error.message);
  } finally {
    setButtonLoading(submitBtn, false);
  }
});

if (registerBtn) {
  registerBtn.addEventListener("click", () => {
    authWrapper.classList.add("panel-active");
  });
}

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    authWrapper.classList.remove("panel-active");
  });
}

if (mobileRegisterBtn) {
  mobileRegisterBtn.addEventListener("click", () => {
    authWrapper.classList.add("panel-active");
  });
}

if (mobileLoginBtn) {
  mobileLoginBtn.addEventListener("click", () => {
    authWrapper.classList.remove("panel-active");
  });
}

document.getElementById("forgot-password").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;

  if (!email) {
    showError("login-form", "Introduce tu email para recuperar la contrasena");
    return;
  }

  try {
    await auth.sendPasswordResetEmail(email);
    showError("login-form", "Se ha enviado un enlace de recuperacion a tu email");
  } catch (error) {
    console.error("Password reset error:", error);
    let errorMessage = "Error al enviar el email";
    if (error.code === "auth/user-not-found") errorMessage = "No existe una cuenta con ese email";
    else errorMessage = error.message;
    showError("login-form", errorMessage);
  }
});
