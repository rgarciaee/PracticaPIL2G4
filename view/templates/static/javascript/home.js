/**
 * ============================================================================
 * home.js - Página de inicio del festival
 * ============================================================================
 * Este archivo gestiona:
 * - Carrusel de eventos destacados
 * - Rejilla de próximos eventos
 * - Sección de noticias
 * - Estadísticas del festival (visitantes, artistas, etc)
 * - Botones de llamada a la acción (CTA)
 * - Paleta de colores dinámicos para tarjetas
 * ============================================================================
 */

// Paletas de colores para las tarjetas de eventos (se asignan al azar)
const HOME_EVENT_PALETTES = [
  ["#2563eb", "#ec4899"],
  ["#f97316", "#ef4444"],
  ["#14b8a6", "#06b6d4"],
  ["#8b5cf6", "#6366f1"],
  ["#22c55e", "#84cc16"],
];

// Estado global de la página home (eventos, noticias, página actual)
const homeState = {
  events: [],
  news: [],
  carousels: {
    events: { page: 0 },
    news: { page: 0 },
  },
};

// Inicialización de la página home: carrusel, CTA, datos
window.initHome = async function () {
  console.log("Inicializando home...");

  setupHomeCtas();
  setupHomeCarousels();
  await loadHomePayload();
};

// Configura los botones de llamada a la acción (CTA)
function setupHomeCtas() {
  document.getElementById("buy-tickets-cta")?.addEventListener("click", () => {
    document.getElementById("events-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("cta-buy-button")?.addEventListener("click", () => {
    document.getElementById("events-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// Configura los controles del carrusel de eventos y noticias
function setupHomeCarousels() {
  document.getElementById("events-prev")?.addEventListener("click", () => changeCarouselPage("events", -1));
  document.getElementById("events-next")?.addEventListener("click", () => changeCarouselPage("events", 1));
  document.getElementById("news-prev")?.addEventListener("click", () => changeCarouselPage("news", -1));
  document.getElementById("news-next")?.addEventListener("click", () => changeCarouselPage("news", 1));

  if (!window.__homeResizeListenerBound) {
    window.addEventListener("resize", handleHomeResize);
    window.__homeResizeListenerBound = true;
  }
}

// Maneja el redimensionamiento de la ventana para actualizar carrusel
function handleHomeResize() {
  if (homeState.events.length) {
    renderEventsGrid(homeState.events);
  }
  if (homeState.news.length) {
    renderNews(homeState.news);
  }
}

// Carga todos los datos para la página (eventos, noticias, estadísticas)
async function loadHomePayload() {
  try {
    const homeData = await window.app?.getHomeData?.();
    const eventsSource = Array.isArray(homeData?.events) ? homeData.events : [];
    const news = Array.isArray(homeData?.news) ? homeData.news : [];
    const stats = homeData?.stats || null;

    const events = [...eventsSource].sort(sortEventsByDate);
    homeState.events = events;
    homeState.carousels.events.page = 0;
    renderFeaturedEvents(events);
    renderEventsGrid(events);
    bindHomeEventActions();

    homeState.news = news;
    homeState.carousels.news.page = 0;
    renderNews(news);
    renderHomeStats(stats, events);
  } catch (error) {
    console.error("Error fatal cargando home:", error);
  }
}

// Renderiza la rejilla de eventos en HTML
function renderEventsGrid(events) {
  const grid = document.getElementById("events-grid");
  if (!grid) return;

  if (!events.length) {
    grid.innerHTML = '<div class="empty-state">No hay eventos disponibles.</div>';
    updateCarouselControls("events", 0);
    return;
  }

  const pageItems = getCarouselItems("events", events);
  grid.innerHTML = pageItems
    .map((event, index) => buildEventCard(event, index))
    .join("");

  updateCarouselControls("events", events.length);
  bindHomeEventActions();
}

function renderFeaturedEvents(events) {
  const featuredGrid = document.getElementById("featured-grid");
  if (!featuredGrid) return;

  if (!events.length) {
    featuredGrid.innerHTML = '<div class="empty-state">No hay eventos destacados.</div>';
    return;
  }

  featuredGrid.innerHTML = events
    .slice(0, 4)
    .map((event, index) => {
      const palette = getPalette(index);
      return `
        <article class="featured-spotlight-card" style="${palette.style}">
          ${buildEventImage(event, "featured")}
          <div class="featured-spotlight-content">
            <div class="featured-spotlight-topline">
              <span class="featured-spotlight-tag">Primera fila</span>
              <span class="featured-spotlight-date">${escapeHtml(formatDateRange(event.fecha_ini, event.fecha_fin))}</span>
            </div>
            <h3>${escapeHtml(event.nombre || "Evento")}</h3>
            <p>${escapeHtml(event.descripcion || "Sin descripcion disponible")}</p>
            <div class="featured-spotlight-meta">
              <span>${escapeHtml(getLocationLabel(event))}</span>
              <span>${getArtistCount(event)} artistas</span>
              <span>${escapeHtml(getFeaturedPriceLabel(event))}</span>
            </div>
            <div class="featured-spotlight-actions">
              <button class="btn btn-outline btn-sm event-info-btn" data-id="${escapeAttribute(event.id || "")}">
                Ver evento
              </button>
              <button class="btn btn-primary btn-sm buy-ticket-btn" data-id="${escapeAttribute(event.id || "")}">
                Comprar
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderNews(news) {
  const grid = document.getElementById("news-grid");
  if (!grid) return;

  if (!news.length) {
    grid.innerHTML = '<div class="empty-state">No hay noticias disponibles.</div>';
    updateCarouselControls("news", 0);
    return;
  }

  const pageItems = getCarouselItems("news", news);
  grid.innerHTML = pageItems
    .map(
      (item, index) => `
        <article class="news-card" style="${getPalette(index).style}">
          <span class="news-kicker">Noticia</span>
          <h3>${escapeHtml(item.titulo || "Actualizacion")}</h3>
          <p>${escapeHtml(item.contenido || "")}</p>
        </article>
      `,
    )
    .join("");

  updateCarouselControls("news", news.length);
}

function buildEventCard(event, index) {
  const palette = getPalette(index);
  const artistCount = getArtistCount(event);
  const zoneCount = getZoneCount(event);
  const minPrice = getMinimumPrice(event);
  const priceMarkup = minPrice !== null
    ? `
      <div class="event-metric-price">
        <span class="event-metric-price-prefix">Desde</span>
        <strong class="event-metric-value event-metric-value-price">${escapeHtml(formatPrice(minPrice))}</strong>
      </div>
    `
    : '<strong class="event-metric-value">Por confirmar</strong>';

  return `
    <article class="event-card" style="${palette.style}">
      ${buildEventImage(event, "card")}
      <div class="event-card-hero">
        <div class="event-card-hero-top">
          <span class="event-chip">${escapeHtml(formatDateRange(event.fecha_ini, event.fecha_fin))}</span>
          <span class="event-chip event-chip-soft">${escapeHtml(getLocationLabel(event))}</span>
        </div>
        <h3>${escapeHtml(event.nombre || "Evento")}</h3>
        <p>${escapeHtml(event.descripcion || "Sin descripcion disponible")}</p>
      </div>

      <div class="event-card-body">
        <div class="event-card-metrics">
          <div class="event-metric">
            <span class="event-metric-label">Artistas</span>
            <strong class="event-metric-value">${artistCount}</strong>
          </div>
          <div class="event-metric">
            <span class="event-metric-label">Zonas</span>
            <strong class="event-metric-value">${zoneCount}</strong>
          </div>
          <div class="event-metric event-metric-ticket">
            <span class="event-metric-label">Entradas</span>
            ${priceMarkup}
          </div>
        </div>

        <div class="event-card-footer">
          <button class="btn btn-outline btn-sm event-info-btn" data-id="${escapeAttribute(event.id || "")}">
            Ver evento
          </button>
          <button class="btn btn-primary btn-sm buy-ticket-btn" data-id="${escapeAttribute(event.id || "")}">
            Comprar
          </button>
        </div>
      </div>
    </article>
  `;
}

function buildEventImage(event, variant) {
  const image = event?.imagen ? escapeAttribute(event.imagen) : "";
  const name = escapeAttribute(event?.nombre || "Evento");
  const baseClass = variant === "featured" ? "featured-spotlight-media" : "event-card-media";

  return `
    <div class="${baseClass}${image ? "" : " is-placeholder"}">
      ${image
        ? `<img src="${image}" alt="${name}" loading="lazy">`
        : `
          <div class="${baseClass}-placeholder">
            <i class="fas fa-calendar-alt"></i>
            <span>Imagen del evento</span>
          </div>
        `}
      <div class="${baseClass}-overlay"></div>
    </div>
  `;
}

function getCarouselItems(type, items) {
  const perPage = getCarouselItemsPerPage();
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  homeState.carousels[type].page = Math.min(homeState.carousels[type].page, totalPages - 1);
  const start = homeState.carousels[type].page * perPage;
  return items.slice(start, start + perPage);
}

function getCarouselItemsPerPage() {
  if (window.innerWidth <= 768) return 1;
  if (window.innerWidth <= 1180) return 2;
  return 4;
}

function changeCarouselPage(type, delta) {
  const items = type === "events" ? homeState.events : homeState.news;
  if (!items.length) return;

  const perPage = getCarouselItemsPerPage();
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const nextPage = Math.min(Math.max(homeState.carousels[type].page + delta, 0), totalPages - 1);

  if (nextPage === homeState.carousels[type].page) return;

  homeState.carousels[type].page = nextPage;

  if (type === "events") {
    renderEventsGrid(items);
  } else {
    renderNews(items);
  }
}

function updateCarouselControls(type, totalItems) {
  const prev = document.getElementById(`${type}-prev`);
  const next = document.getElementById(`${type}-next`);
  if (!prev || !next) return;

  const perPage = getCarouselItemsPerPage();
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const page = Math.min(homeState.carousels[type].page, totalPages - 1);
  homeState.carousels[type].page = page;

  prev.disabled = page === 0 || totalItems <= perPage;
  next.disabled = page >= totalPages - 1 || totalItems <= perPage;
}

function bindHomeEventActions() {
  document.querySelectorAll(".event-info-btn").forEach((btn) => {
    btn.onclick = () => {
      const eventId = btn.dataset.id;
      if (!eventId) return;
      window.router?.navigate(`evento?id=${encodeURIComponent(eventId)}`);
    };
  });

  document.querySelectorAll(".buy-ticket-btn").forEach((btn) => {
    btn.onclick = async () => {
      const isAuthenticated = await window.app.checkAuthStatus();

      if (!isAuthenticated) {
        window.app?.showModal(
          "Iniciar sesion requerido",
          "<p>Para comprar entradas necesitas iniciar sesion o registrarte.</p><p>Quieres ir a la pagina de inicio de sesion?</p>",
          () => {
            window.location.href = "/login";
          },
        );
        return;
      }

      const eventId = btn.dataset.id;
      const response = await fetch(`/api/events/${eventId}`);
      const result = await response.json();

      if (!result.success) return;

      const event = result.data;
      const zone = event.zonas?.[0];

      if (!zone) return;

      const cartItem = {
        id: `${event.id}_${zone.id}_${Date.now()}`,
        nombre: `${event.nombre} - ${zone.nombre}`,
        precio: zone.precio || 50,
        cantidad: 1,
        tipo: zone.nombre,
        zona_id: zone.id,
        zona_nombre: zone.nombre,
        evento_id: event.id,
        evento_nombre: event.nombre,
        fecha_evento: event.fecha_ini,
        imagen: event.imagen,
      };

      await window.app?.addToCart(cartItem);
    };
  });
}

function renderHomeStats(stats, events = []) {
  const eventsEl = document.getElementById("stat-events");
  const artistsEl = document.getElementById("stat-artists");
  const attendeesEl = document.getElementById("stat-attendees");

  const fallbackStats = buildStatsFromEvents(events);
  const safeStats = stats || fallbackStats;

  if (eventsEl) eventsEl.textContent = safeStats.totalEventos;
  if (artistsEl) artistsEl.textContent = safeStats.totalArtistas;
  if (attendeesEl) attendeesEl.textContent = formatNumber(safeStats.totalAsistentes);
}

function buildStatsFromEvents(events) {
  return (events || []).reduce((accumulator, event) => {
    accumulator.totalEventos += 1;
    accumulator.totalArtistas += getArtistCount(event);
    accumulator.totalAsistentes += (event.zonas || []).reduce((zoneTotal, zone) => {
      return String(zone?.tipo || "").trim().toLowerCase() === "ticket"
        ? zoneTotal + Number(zone?.aforo_maximo || 0)
        : zoneTotal;
    }, 0);
    return accumulator;
  }, {
    totalEventos: 0,
    totalArtistas: 0,
    totalAsistentes: 0,
  });
}

function getPalette(index) {
  const [from, to] = HOME_EVENT_PALETTES[index % HOME_EVENT_PALETTES.length];
  return {
    from,
    to,
    style: `--event-accent-a: ${from}; --event-accent-b: ${to};`,
  };
}

function getArtistCount(event) {
  return Array.isArray(event.artistas) ? event.artistas.length : 0;
}

function getZoneCount(event) {
  return Array.isArray(event.zonas) ? event.zonas.length : 0;
}

function getMinimumPrice(event) {
  const prices = (event.zonas || [])
    .map((zone) => Number(zone.precio))
    .filter((price) => Number.isFinite(price) && price >= 0);

  return prices.length ? Math.min(...prices) : null;
}

function getFeaturedPriceLabel(event) {
  const minPrice = getMinimumPrice(event);
  return minPrice !== null ? formatPrice(minPrice) : "Por confirmar";
}

function getLocationLabel(event) {
  const venue = event.ubicacion?.nombre || "";
  const city = event.ubicacion?.ciudad || "";
  return [venue, city].filter(Boolean).join(", ") || "Ubicacion por confirmar";
}

function sortEventsByDate(a, b) {
  return parseDateValue(a?.fecha_ini) - parseDateValue(b?.fecha_ini);
}

function parseDateValue(value) {
  const parsed = new Date(value || "");
  return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
}

function formatNumber(num) {
  if (num >= 1000) {
    return Math.round(num / 1000) + "k+";
  }
  return num;
}

function formatPrice(value) {
  if (window.formatCurrency) {
    return window.formatCurrency(value);
  }

  const parsed = Number(value);
  return `${Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00"} EUR`;
}

function formatDate(date) {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? String(date || "") : d.toLocaleDateString("es-ES");
}

function formatDateRange(start, end) {
  const startLabel = formatDate(start);
  const endLabel = formatDate(end);
  if (!startLabel) return endLabel;
  if (!endLabel || startLabel === endLabel) return startLabel;
  return `${startLabel} - ${endLabel}`;
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

function escapeAttribute(text) {
  return escapeHtml(text).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
