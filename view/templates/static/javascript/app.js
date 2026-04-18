const DEFAULT_AVATAR = 'https://static.vecteezy.com/system/resources/previews/036/594/092/non_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg';
const EURO_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  const numericValue = Number(value);
  return EURO_FORMATTER.format(Number.isFinite(numericValue) ? numericValue : 0);
}

function syncThemeToggleIcon(theme) {
  const themeToggle = document.getElementById("theme-toggle");
  const icon = themeToggle?.querySelector("i");
  if (!themeToggle || !icon) return;

  icon.classList.remove("fa-sun", "fa-moon");
  icon.classList.add(theme === "dark" ? "fa-moon" : "fa-sun");

  const label = theme === "dark" ? "Tema oscuro activo" : "Tema claro activo";
  themeToggle.setAttribute("aria-label", label);
  themeToggle.setAttribute("title", label);
}

window.formatCurrency = formatCurrency;
window.syncThemeToggleIcon = syncThemeToggleIcon;

class SubsonicApp {
  constructor() {
    console.log("Constructor de SubsonicApp llamado");
    this.data = null;
    this.dataPromise = null;
    this.eventsCache = null;
    this.eventsPromise = null;
    this.homeCache = null;
    this.homePromise = null;
    this.currentUser = null;
    this.cart = [];
    this.isLoading = false;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadData();
    await this.initSearch();
    this.setupTheme();
    await this.checkAuth();
    await this.loadCart();
    this.updateCartBadge();
    this.updateAuthUI();
  }

  // ============================================================
  // MÉTODOS PARA CARRITO (API)
  // ============================================================

  async loadCartFromAPI() {
    console.log("loadCartFromAPI llamado");
    try {
      const response = await fetch("/api/cart", {
        credentials: "include",
      });
      const result = await response.json();
      console.log("Respuesta del carrito:", result);

      if (result.success && result.data) {
        this.cart = result.data.items || [];
        this.updateCartBadge();
        this.saveCartToLocal();
        console.log("Carrito cargado desde API:", this.cart.length, "items");
        return true;
      } else {
        console.log("Error en respuesta de API:", result);
        return false;
      }
    } catch (error) {
      console.error("Error cargando carrito desde API:", error);
      return false;
    }
  }

  async addToCartAPI(item) {
    console.log("addToCartAPI llamado", item);
    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        credentials: "include",
      });
      const result = await response.json();
      console.log("Resultado addToCartAPI:", result);

      if (result.success && result.cart) {
        this.cart = result.cart.items || [];
        this.updateCartBadge();
        this.saveCartToLocal();
        this.showToast(`${item.nombre} añadido al carrito`, "success");
        return true;
      } else {
        this.showToast(result.error || "Error al añadir al carrito", "error");
        return false;
      }
    } catch (error) {
      console.error("Error añadiendo al carrito:", error);
      this.showToast("Error de conexión", "error");
      return false;
    }
  }

  async updateCartItemAPI(itemId, quantity) {
    console.log("updateCartItemAPI llamado", itemId, quantity);
    try {
      const response = await fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, quantity: quantity }),
        credentials: "include",
      });
      const result = await response.json();
      console.log("Resultado updateCartItemAPI:", result);

      if (result.success && result.cart) {
        this.cart = result.cart.items || [];
        this.updateCartBadge();
        this.saveCartToLocal();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error actualizando carrito:", error);
      return false;
    }
  }

  async removeFromCartAPI(itemId) {
    console.log("removeFromCartAPI llamado", itemId);
    try {
      const response = await fetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
        credentials: "include",
      });
      const result = await response.json();
      console.log("Resultado removeFromCartAPI:", result);

      if (result.success && result.cart) {
        this.cart = result.cart.items || [];
        this.updateCartBadge();
        this.saveCartToLocal();
        this.showToast("Producto eliminado del carrito", "info");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error eliminando del carrito:", error);
      return false;
    }
  }

  async clearCartAPI() {
    console.log("clearCartAPI llamado");
    try {
      const response = await fetch("/api/cart/clear", {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json();
      console.log("Resultado clearCartAPI:", result);

      if (result.success && result.cart) {
        this.cart = [];
        this.updateCartBadge();
        this.saveCartToLocal();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error vaciando carrito:", error);
      return false;
    }
  }

  getCartStorageKey(userId = this.currentUser?.id) {
    return userId ? `subsonic_cart_backup_${userId}` : null;
  }

  clearLocalCartData() {
    const keysToRemove = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key === "subsonic_cart_backup" || key?.startsWith("subsonic_cart_backup_")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  saveCartToLocal() {
    const storageKey = this.getCartStorageKey();
    if (!storageKey) {
      this.clearLocalCartData();
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(this.cart));
  }

  loadCartFromLocal() {
    const storageKey = this.getCartStorageKey();
    if (!storageKey) {
      return false;
    }

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      this.cart = JSON.parse(stored);
      this.updateCartBadge();
      console.log(
        "Carrito cargado desde localStorage:",
        this.cart.length,
        "items",
      );
      return true;
    }

    return false;
  }

  async loadCart() {
    if (!this.currentUser?.id) {
      this.cart = [];
      this.clearLocalCartData();
      this.updateCartBadge();
      return;
    }

    const success = await this.loadCartFromAPI();
    if (!success) {
      const localSuccess = this.loadCartFromLocal();
      if (!localSuccess) {
        this.cart = [];
        this.updateCartBadge();
      }
    }
  }

  async addToCart(item) {
    // Verificar autenticación antes de añadir al carrito
    const isAuthenticated = await this.checkAuthStatus();
    if (!isAuthenticated) {
      this.showModal(
        'Iniciar sesión requerido',
        '<p>Para comprar entradas necesitas iniciar sesión o registrarte.</p><p>¿Quieres ir a la página de inicio de sesión?</p>',
        () => {
          window.location.href = '/login';
        }
      );
      return;  // Salir sin añadir nada
    }
    
    // Solo llegar aquí si está autenticado
    const success = await this.addToCartAPI(item);
    if (!success) {
      // Solo mostrar error, no guardar en local
      console.error('Error al añadir al carrito en el servidor');
      this.showToast('Error al añadir al carrito. Inténtalo de nuevo.', 'error');
    }
  }

  async removeFromCart(itemId) {
    const success = await this.removeFromCartAPI(itemId);
    if (!success) {
      this.showToast("No se pudo eliminar el producto del carrito", "error");
    }
  }

  async updateCartItem(itemId, quantity) {
    await this.updateCartItemAPI(itemId, quantity);
  }

  // ============================================================
  // MÉTODOS DE API
  // ============================================================

  // ============================================================
  // MÉTODOS DE CARGA DE DATOS
  // ============================================================

  async loadData() {
    if (this.data) {
      return this.data;
    }

    if (this.dataPromise) {
      return this.dataPromise;
    }

    this.dataPromise = (async () => {
      try {
        const response = await fetch("/static/yaml/data.yaml");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const text = await response.text();
        this.data = jsyaml.load(text);

        window.dispatchEvent(
          new CustomEvent("appDataLoaded", {
            detail: { data: this.data },
          }),
        );

        console.log("Datos cargados correctamente");
        return this.data;
      } catch (error) {
        console.error("Error cargando datos:", error);
        this.showToast("Error al cargar los datos", "error");
        this.data = null;
        return null;
      } finally {
        this.dataPromise = null;
      }
    })();

    return this.dataPromise;
  }

  async getAppData() {
    if (this.data) {
      return this.data;
    }

    return this.loadData();
  }

  async getEventsData(forceRefresh = false) {
    if (!forceRefresh && Array.isArray(this.eventsCache)) {
      return this.eventsCache;
    }

    if (!forceRefresh && this.eventsPromise) {
      return this.eventsPromise;
    }

    this.eventsPromise = (async () => {
      try {
        const response = await fetch("/api/events");
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          this.eventsCache = result.data;
          return this.eventsCache;
        }

        console.error("Error cargando eventos:", result);
        this.eventsCache = [];
        return [];
      } catch (error) {
        console.error("Error cargando eventos:", error);
        this.eventsCache = [];
        return [];
      } finally {
        this.eventsPromise = null;
      }
    })();

    return this.eventsPromise;
  }

  async getHomeData(forceRefresh = false) {
    if (!forceRefresh && this.homeCache) {
      return this.homeCache;
    }

    if (!forceRefresh && this.homePromise) {
      return this.homePromise;
    }

    this.homePromise = (async () => {
      try {
        const response = await fetch("/api/home");
        const result = await response.json();

        if (result.success && result.data) {
          this.homeCache = result.data;
          if (Array.isArray(result.data.events)) {
            this.eventsCache = result.data.events;
          }
          return this.homeCache;
        }

        console.error("Error cargando home:", result);
        this.homeCache = { events: [], stats: null, news: [] };
        return this.homeCache;
      } catch (error) {
        console.error("Error cargando home:", error);
        this.homeCache = { events: [], stats: null, news: [] };
        return this.homeCache;
      } finally {
        this.homePromise = null;
      }
    })();

    return this.homePromise;
  }

  // ============================================================
  // MÉTODOS DE CARGA DE DATOS
  // ============================================================

  async processCheckout(items, total) {
    console.log("processCheckout llamado", items, total);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, total }),
        credentials: "include"
      });

      const result = await response.json();
      console.log("Respuesta checkout:", result);
      return result;
    } catch (error) {
      console.error("Error en processCheckout:", error);
      return { success: false, error: error.message };
    }
  }

  async getProfileCompletionStatus() {
    try {
      const response = await fetch('/api/profile/completion', {
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Error comprobando el perfil:', error);
      return { success: false, error: error.message };
    }
  }

  // === MÉTODOS DE INTERFAZ ===
  setupEventListeners() {
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => this.toggleTheme());
    }

    const searchToggle = document.getElementById("search-toggle");
    const closeSearch = document.getElementById("close-search");
    if (searchToggle) {
      searchToggle.addEventListener("click", () => this.toggleSearch());
    }
    if (closeSearch) {
      closeSearch.addEventListener("click", () => this.closeSearch());
    }

    const globalSearch = document.getElementById("global-search");
    if (globalSearch) {
      globalSearch.addEventListener("input", (e) =>
        this.handleSearch(e.target.value),
      );
    }

    const mobileToggle = document.getElementById("mobile-menu-toggle");
    const navMenu = document.getElementById("nav-menu");
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
      });
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.logout());
    }

    // Botones de autenticación
    const loginNavBtn = document.getElementById("login-nav-btn");
    const registerNavBtn = document.getElementById("register-nav-btn");
    if (loginNavBtn) {
      loginNavBtn.addEventListener("click", () => {
        window.location.href = "/login";
      });
    }
    if (registerNavBtn) {
      registerNavBtn.addEventListener("click", () => {
        window.location.href = "/login";
      });
    }

    const modalContainer = document.getElementById("modal-container");
    if (modalContainer) {
      modalContainer.addEventListener("click", (e) => {
        if (e.target === modalContainer) {
          this.closeModal();
        }
      });
    }

    let lastScroll = 0;
    window.addEventListener("scroll", () => {
      const header = document.querySelector(".main-header");
      const currentScroll = window.pageYOffset;
      if (header) {
        if (currentScroll > lastScroll && currentScroll > 100) {
          header.style.transform = "translateY(-100%)";
        } else {
          header.style.transform = "translateY(0)";
        }
      }
      lastScroll = currentScroll;
    });
  }

  setupTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    syncThemeToggleIcon(savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    syncThemeToggleIcon(newTheme);

    this.showToast(
      `Modo ${newTheme === "dark" ? "oscuro" : "claro"} activado`,
      "info",
    );
  }

  async initSearch() {
    this.searchIndex = [];

    let events = [];
    const appData = await this.getAppData();

    try {
      events = await this.getEventsData();
    } catch (error) {
      console.error("Error cargando eventos para la busqueda:", error);
    }

    if (!events.length && appData?.events) {
      events = appData.events;
    }

    this.searchIndex.push(
      ...events.map((event) => ({
        type: "evento",
        title: event.nombre || "Evento",
        description: event.descripcion || "Evento sin descripcion",
        eventId: event.id || "",
      })),
    );

    events.forEach((event) => {
      const artists = Array.isArray(event.artistas) ? event.artistas : [];
      artists.forEach((artist) => {
        this.searchIndex.push({
          type: "artista",
          title: artist.nombre || "Artista",
          description:
            artist.descripcion ||
            artist.genero ||
            `Actua en ${event.nombre || "este evento"}`,
          eventId: event.id || artist.evento_id || "",
          eventName: event.nombre || "",
        });
      });
    });
  }

  handleSearch(query) {
    const resultsContainer = document.getElementById("search-results");
    if (!resultsContainer) return;

    if (!query.trim()) {
      resultsContainer.innerHTML = "";
      return;
    }

    const filtered = this.searchIndex
      .filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()) ||
          (item.eventName || "").toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, 10);

    if (filtered.length === 0) {
      resultsContainer.innerHTML =
        '<div class="search-no-results">No se encontraron resultados</div>';
      return;
    }

    resultsContainer.innerHTML = filtered
      .map(
        (item) => `
            <div class="search-result-item" data-type="${item.type}" data-title="${item.title}" data-event-id="${item.eventId || ""}">
                <i class="fas ${this.getSearchIcon(item.type)}"></i>
                <div>
                    <strong>${item.title}</strong>
                    <p>${item.description}</p>
                    <small>${this.getSearchTypeLabel(item.type)}</small>
                </div>
            </div>
        `,
      )
      .join("");

    document.querySelectorAll(".search-result-item").forEach((el) => {
      el.addEventListener("click", () => {
        this.closeSearch();
        const eventId = el.dataset.eventId;
        if (!eventId) {
          return;
        }

        window.router?.navigate(`evento?id=${encodeURIComponent(eventId)}`);
      });
    });
  }

  getSearchIcon(type) {
    const icons = {
      evento: "fa-calendar-alt",
      artista: "fa-microphone-alt",
    };
    return icons[type] || "fa-search";
  }

  getSearchTypeLabel(type) {
    const labels = {
      evento: "Evento",
      artista: "Artista",
    };
    return labels[type] || "Resultado";
  }

  toggleSearch() {
    const searchBar = document.getElementById("search-bar");
    if (searchBar) {
      searchBar.classList.toggle("is-hidden");
      if (!searchBar.classList.contains("is-hidden")) {
        document.getElementById("global-search")?.focus();
      }
    }
  }

  closeSearch() {
    const searchBar = document.getElementById("search-bar");
    if (searchBar && !searchBar.classList.contains("is-hidden")) {
      searchBar.classList.add("is-hidden");
      const searchInput = document.getElementById("global-search");
      if (searchInput) searchInput.value = "";
      const results = document.getElementById("search-results");
      if (results) results.innerHTML = "";
    }
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icon = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      warning: "fa-exclamation-triangle",
      info: "fa-info-circle",
    }[type];

    toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  showModal(title, content, onConfirm = null) {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${onConfirm
        ? `
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">Cancelar</button>
                    <button class="btn btn-primary modal-confirm">Confirmar</button>
                </div>
                `
        : ""
      }
            </div>
        `;

    modalContainer.classList.remove("is-hidden");

    const closeBtn = modalContainer.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeModal());
    }

    if (onConfirm) {
      const confirmBtn = modalContainer.querySelector(".modal-confirm");
      const cancelBtn = modalContainer.querySelector(".modal-cancel");

      if (confirmBtn) {
        confirmBtn.addEventListener("click", async () => {
          await onConfirm();
          this.closeModal();
        });
      }
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => this.closeModal());
      }
    }
  }

  closeModal() {
    const modalContainer = document.getElementById("modal-container");
    if (modalContainer) {
      modalContainer.classList.add("is-hidden");
      setTimeout(() => {
        modalContainer.innerHTML = "";
      }, 300);
    }
  }

  getEmptyUser() {
    return {
      id: null,
      nombre_apellidos: "",
      email: "",
      avatar: "",
      role: "user",
    };
  }

  getStoredUser() {
    const sessionUser = sessionStorage.getItem("subsonic_user");
    const localUser = localStorage.getItem("subsonic_user");
    return sessionUser || localUser;
  }

  clearStoredUser() {
    localStorage.removeItem("subsonic_user");
    localStorage.removeItem("subsonic_auth_persistence");
    sessionStorage.removeItem("subsonic_user");
    sessionStorage.removeItem("subsonic_auth_persistence");
  }

  persistUser(userData) {
    const useLocalStorage =
      localStorage.getItem("subsonic_auth_persistence") === "local";

    this.clearStoredUser();

    if (useLocalStorage) {
      localStorage.setItem("subsonic_user", JSON.stringify(userData));
      localStorage.setItem("subsonic_auth_persistence", "local");
      return;
    }

    sessionStorage.setItem("subsonic_user", JSON.stringify(userData));
    sessionStorage.setItem("subsonic_auth_persistence", "session");
  }

  async syncFirebaseLogout() {
    if (typeof firebase === "undefined" || !firebase.auth) {
      return;
    }

    try {
      await firebase.auth().signOut();
    } catch (error) {
      console.error("Error cerrando sesion en Firebase:", error);
    }
  }

  async checkAuth() {
    const storedUser = this.getStoredUser();
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (error) {
        this.currentUser = this.getEmptyUser();
        this.clearStoredUser();
      }
    } else {
      this.currentUser = this.getEmptyUser();
    }

    try {
      const response = await fetch("/api/profile", {
        credentials: "include"
      });
      const result = await response.json();

      if (response.status === 401 || !result.success) {
        this.currentUser = this.getEmptyUser();
        this.clearStoredUser();
        this.cart = [];
        this.clearLocalCartData();
        this.updateCartBadge();
        await this.syncFirebaseLogout();
      } else if (result.data) {
        this.currentUser = {
          id: result.data.user_id || result.data.id || null,
          nombre_apellidos: result.data.nombre_apellidos || "",
          email: result.data.email || "",
          avatar: result.data.avatar_url || "",
          role: result.data.rol_asignado || result.data.role || "user"
        };
        this.persistUser(this.currentUser);
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
      if (!this.currentUser?.id) {
        this.currentUser = this.getEmptyUser();
      }
    }

    this.updateUserUI();
    this.updateAuthUI();
  }

  updateUserUI() {
    const nameElement = document.getElementById('dropdown-user-name');
    const emailElement = document.getElementById('dropdown-user-email');
    const avatarElement = document.getElementById('nav-profile-image');

    if (nameElement) {
      nameElement.textContent = this.currentUser?.nombre_apellidos || 'Usuario';
    }
    if (emailElement) {
      emailElement.textContent = this.currentUser?.email || 'Invitado';
    }
    if (avatarElement) {
      if (this.currentUser?.avatar && this.currentUser.avatar !== '') {
        avatarElement.src = this.currentUser.avatar;
      } else {
        avatarElement.src = DEFAULT_AVATAR;
      }
    }
  }

  logout() {
    this.showModal("Cerrar sesión", "¿Estás seguro?", async () => {
      await fetch("/logout", { method: "POST", credentials: "include" });
      this.clearStoredUser();
      await this.syncFirebaseLogout();
      this.cart = [];
      this.clearLocalCartData();
      this.updateCartBadge();
      this.currentUser = this.getEmptyUser();
      window.location.href = "/";
    });
  }

  updateCartBadge() {
    const badge = document.getElementById("cart-count-badge");
    if (badge) {
      const totalItems = this.cart.reduce(
        (sum, item) => sum + (item.cantidad || 1),
        0,
      );
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? "inline-block" : "none";
    }
  }

  async checkAuthStatus() {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include'
      });
      if (response.status === 401) {
        this.clearStoredUser();
        this.currentUser = this.getEmptyUser();
        this.cart = [];
        this.clearLocalCartData();
        this.updateCartBadge();
        this.updateUserUI();
        this.updateAuthUI();
        await this.syncFirebaseLogout();
        return false;
      }
      if (!response.ok) {
        return false;
      }
      const result = await response.json();
      return !!result.success;
    } catch (error) {
      return false;
    }
  }

  updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const adminMenuLink = document.getElementById('admin-menu-link');

    const isAuthenticated = this.currentUser && this.currentUser.id;
    const isAdmin = isAuthenticated && String(this.currentUser.role || '').toLowerCase() === 'admin';

    if (isAuthenticated) {
      if (authButtons) authButtons.style.display = 'none';
      if (userMenu) userMenu.style.display = 'block';
    } else {
      if (authButtons) authButtons.style.display = 'flex';
      if (userMenu) userMenu.style.display = 'none';
    }

    if (adminMenuLink) {
      adminMenuLink.style.display = isAdmin ? 'flex' : 'none';
    }
  }
}

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", () => {
  window.app = new SubsonicApp();
  console.log(
    "App inicializada, métodos disponibles:",
    Object.getOwnPropertyNames(SubsonicApp.prototype),
  );
});

