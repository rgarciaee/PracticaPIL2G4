class SubsonicApp {
  constructor() {
    console.log("Constructor de SubsonicApp llamado");
    this.data = null;
    this.currentUser = null;
    this.cart = [];
    this.isLoading = false;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadData();
    this.setupTheme();
    this.setupPreloader();
    this.checkAuth();
    await this.loadCart();
    this.updateCartBadge();
    this.initSearch();
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

  saveCartToLocal() {
    localStorage.setItem("subsonic_cart_backup", JSON.stringify(this.cart));
  }

  loadCartFromLocal() {
    const stored = localStorage.getItem("subsonic_cart_backup");
    if (stored) {
      this.cart = JSON.parse(stored);
      this.updateCartBadge();
      console.log(
        "Carrito cargado desde localStorage:",
        this.cart.length,
        "items",
      );
    }
  }

  async loadCart() {
    const success = await this.loadCartFromAPI();
    if (!success) {
      this.loadCartFromLocal();
    }
  }

  async addToCart(item) {
    const success = await this.addToCartAPI(item);
    if (!success) {
      const existing = this.cart.find((i) => i.id === item.id);
      if (existing) {
        existing.cantidad += item.cantidad || 1;
      } else {
        this.cart.push({ ...item, cantidad: item.cantidad || 1 });
      }
      this.updateCartBadge();
      this.saveCartToLocal();
      this.showToast(
        `${item.nombre} añadido al carrito (guardado local)`,
        "success",
      );
    }
  }

  async removeFromCart(itemId) {
    const success = await this.removeFromCartAPI(itemId);
    if (!success) {
      this.cart = this.cart.filter((i) => i.id !== itemId);
      this.updateCartBadge();
      this.saveCartToLocal();
      this.showToast("Producto eliminado del carrito", "info");
    }
  }

  async updateCartItem(itemId, quantity) {
    await this.updateCartItemAPI(itemId, quantity);
  }

  // ============================================================
  // MÉTODOS DE API
  // ============================================================

  async apiCall(endpoint, method = "GET", data = null) {
    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`/api${endpoint}`, options);
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================
  // MÉTODOS DE CARGA DE DATOS
  // ============================================================

  async loadData() {
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
    }
  }

  // ============================================================
  // MÉTODOS PARA PROCESAR COMPRAS
  // ============================================================

  async processCheckout(items, total) {
    const tickets = items.map((item) => ({
      evento: item.evento_nombre || item.nombre.split(" - ")[0],
      zona: item.tipo || "General",
      fecha_evento: new Date().toLocaleDateString("es-ES"),
      localizador_qr: this.generateQRCode(),
      fecha_compra: new Date().toISOString().split("T")[0],
      estado: "Activa",
      precio: item.precio,
      cantidad: item.cantidad,
    }));

    const existingHistory = JSON.parse(
      localStorage.getItem("subsonic_history") || "[]",
    );
    const newHistory = [...tickets, ...existingHistory];
    localStorage.setItem("subsonic_history", JSON.stringify(newHistory));

    return { success: true, tickets: tickets };
  }

  generateQRCode() {
    const prefix = "SUB";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return `${prefix}-${result}`;
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

    const newsletterForm = document.getElementById("newsletter-form");
    if (newsletterForm) {
      newsletterForm.addEventListener("submit", (e) =>
        this.handleNewsletter(e),
      );
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.logout());
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

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      const icon = themeToggle.querySelector("i");
      if (savedTheme === "dark") {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
      } else {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
      }
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      const icon = themeToggle.querySelector("i");
      if (newTheme === "dark") {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
      } else {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
      }
    }

    this.showToast(
      `Modo ${newTheme === "dark" ? "oscuro" : "claro"} activado`,
      "info",
    );
  }

  setupPreloader() {
    const preloader = document.getElementById("preloader");
    if (preloader) {
      setTimeout(() => {
        preloader.classList.add("fade-out");
        setTimeout(() => {
          preloader.style.display = "none";
        }, 500);
      }, 1000);
    }
  }

  initSearch() {
    this.searchIndex = [];
    if (this.data) {
      if (this.data.events) {
        this.searchIndex.push(
          ...this.data.events.map((e) => ({
            type: "evento",
            title: e.nombre,
            description: e.descripcion,
            data: e,
          })),
        );
      }
      if (this.data.news) {
        this.searchIndex.push(
          ...this.data.news.map((n) => ({
            type: "noticia",
            title: n.titulo,
            description: n.contenido,
            data: n,
          })),
        );
      }
    }
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
          item.description.toLowerCase().includes(query.toLowerCase()),
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
            <div class="search-result-item" data-type="${item.type}" data-title="${item.title}">
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
        this.showToast(`Buscando: ${el.dataset.title}`, "info");
      });
    });
  }

  getSearchIcon(type) {
    const icons = {
      evento: "fa-calendar-alt",
      noticia: "fa-newspaper",
      artista: "fa-microphone-alt",
    };
    return icons[type] || "fa-search";
  }

  getSearchTypeLabel(type) {
    const labels = {
      evento: "Evento",
      noticia: "Noticia",
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

  async handleNewsletter(e) {
    e.preventDefault();
    const email = e.target.querySelector("input").value;

    if (email && this.validateEmail(email)) {
      this.showToast("¡Suscripción exitosa! Revisa tu correo", "success");
      e.target.reset();
    } else {
      this.showToast("Por favor, introduce un email válido", "error");
    }
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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
                ${
                  onConfirm
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
        confirmBtn.addEventListener("click", () => {
          onConfirm();
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

  checkAuth() {
    const storedUser = localStorage.getItem("subsonic_user");
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      this.updateUserUI();
    } else {
      this.currentUser = {
        id: 1,
        nombre_apellidos: "Usuario Demo",
        email: "demo@subsonic.com",
        avatar: "https://i.pravatar.cc/100?img=12",
      };
    }
    this.updateUserUI();
  }

  updateUserUI() {
    if (this.currentUser) {
      const nameElement = document.getElementById("dropdown-user-name");
      const emailElement = document.getElementById("dropdown-user-email");
      const avatarElement = document.getElementById("nav-profile-image");

      if (nameElement)
        nameElement.textContent = this.currentUser.nombre_apellidos;
      if (emailElement) emailElement.textContent = this.currentUser.email;
      if (avatarElement && this.currentUser.avatar)
        avatarElement.src = this.currentUser.avatar;
    }
  }

  logout() {
    this.showModal("Cerrar sesión", "¿Estás seguro?", async () => {
      await fetch("/logout", { method: "POST", credentials: "include" });
      localStorage.removeItem("subsonic_user");
      this.cart = [];
      this.currentUser = null;
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

  saveCart() {
    this.saveCartToLocal();
  }

  loadCartOld() {
    this.loadCartFromLocal();
  }

  getData() {
    return this.data;
  }

  getUser() {
    return this.currentUser;
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
