const HOME_EVENT_PALETTES = [
  ["#2563eb", "#ec4899"],
  ["#f97316", "#ef4444"],
  ["#14b8a6", "#06b6d4"],
  ["#8b5cf6", "#6366f1"],
  ["#22c55e", "#84cc16"],
];

const homeState = {
  events: [],
  news: [],
  carousels: {
    events: { page: 0 },
    news: { page: 0 },
  },
};

window.initHome = async function () {
  console.log("Inicializando home...");

  setupHomeCtas();
  setupHomeCarousels();
  loadGlobalStats();
  loadEvents();
  loadNews();
};

function setupHomeCtas() {
  document.getElementById("buy-tickets-cta")?.addEventListener("click", () => {
    document.getElementById("events-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("explore-events-cta")?.addEventListener("click", () => {
    document.getElementById("events-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("cta-buy-button")?.addEventListener("click", () => {
    document.getElementById("events-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

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

function handleHomeResize() {
  if (homeState.events.length) {
    renderEventsGrid(homeState.events);
  }
  if (homeState.news.length) {
    renderNews(homeState.news);
  }
}

async function loadEvents() {
  try {
    const response = await fetch("/api/events");
    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      const events = [...result.data].sort(sortEventsByDate);
      homeState.events = events;
      homeState.carousels.events.page = 0;
      renderFeaturedEvents(events);
      renderEventsGrid(events);
      bindHomeEventActions();
    } else {
      console.error("Error cargando eventos:", result);
    }
  } catch (error) {
    console.error("Error fatal cargando eventos:", error);
  }
}

async function loadNews() {
  try {
    const yamlResponse = await fetch("/static/yaml/data.yaml");
    const yamlText = await yamlResponse.text();
    const yamlData = jsyaml.load(yamlText);
    const news = Array.isArray(yamlData.news) ? yamlData.news : [];
    homeState.news = news;
    homeState.carousels.news.page = 0;
    renderNews(news);
  } catch (error) {
    console.error("Error fatal cargando noticias:", error);
  }
}

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
  const priceLabel = minPrice !== null ? `Desde ${formatPrice(minPrice)}` : "Precio por confirmar";

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
            <strong>${artistCount}</strong>
          </div>
          <div class="event-metric">
            <span class="event-metric-label">Zonas</span>
            <strong>${zoneCount}</strong>
          </div>
          <div class="event-metric">
            <span class="event-metric-label">Entradas</span>
            <strong>${escapeHtml(priceLabel)}</strong>
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

async function loadGlobalStats() {
  try {
    const res = await fetch("/api/stats");
    const result = await res.json();

    if (result.success && result.data) {
      const eventsEl = document.getElementById("stat-events");
      const artistsEl = document.getElementById("stat-artists");
      const attendeesEl = document.getElementById("stat-attendees");

      if (eventsEl) eventsEl.textContent = result.data.totalEventos;
      if (artistsEl) artistsEl.textContent = result.data.totalArtistas;
      if (attendeesEl) attendeesEl.textContent = formatNumber(result.data.totalAsistentes);
    }
  } catch (e) {
    console.error("Error cargando estadisticas globales:", e);
  }
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
  return `${Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 2)} EUR`;
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
