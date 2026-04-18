let currentEvent = null;

const EVENT_SECTION_PAGE_SIZE = {
  artists: 8,
  tickets: 8,
  stands: 4,
};

const eventSectionState = {
  artists: 1,
  tickets: 1,
  stands: 1,
};

window.initEvento = async function () {
  console.log("Inicializando evento...");

  let hash = window.location.hash;
  try {
    hash = decodeURIComponent(hash);
  } catch (e) {}

  let eventId = null;
  const match = hash.match(/[?&]id=([^&]+)/);
  if (match) {
    eventId = match[1];
  }

  if (!eventId) {
    document.getElementById("evento-content").innerHTML = `
      <div class="error-page">
        <i class="fas fa-exclamation-triangle"></i>
        <h2>Evento no especificado</h2>
        <button onclick="window.router.navigate('home')" class="btn-primary">Volver al inicio</button>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch(`/api/events/${eventId}`);
    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || "Evento no encontrado");
    }

    currentEvent = result.data;
    resetEventSectionState();

    document.getElementById("event-name").textContent = currentEvent.nombre;
    document.getElementById("event-dates").innerHTML = `<i class="fas fa-calendar-alt"></i> ${formatDate(currentEvent.fecha_ini)} - ${formatDate(currentEvent.fecha_fin)}`;
    if (currentEvent.ubicacion) {
      document.getElementById("event-location").innerHTML = `<i class="fas fa-map-marker-alt"></i> ${currentEvent.ubicacion.nombre}, ${currentEvent.ubicacion.ciudad}`;
    }
    document.getElementById("event-description").textContent = currentEvent.descripcion || "";
    renderEventHeroMedia();

    renderSchedule();
    renderArtists();
    renderTicketZones();
    renderStands();
    renderMap();
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("evento-content").innerHTML = `
      <div class="error-page">
        <i class="fas fa-exclamation-triangle"></i>
        <h2>Error al cargar el evento</h2>
        <p>${escapeHtml(error.message)}</p>
        <button onclick="window.router.navigate('home')" class="btn-primary">Volver al inicio</button>
      </div>
    `;
  }
};

function resetEventSectionState() {
  eventSectionState.artists = 1;
  eventSectionState.tickets = 1;
  eventSectionState.stands = 1;
}

function paginateEventSection(items, sectionKey) {
  const pageSize = EVENT_SECTION_PAGE_SIZE[sectionKey] || items.length || 1;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  eventSectionState[sectionKey] = Math.min(Math.max(1, eventSectionState[sectionKey]), totalPages);

  const startIndex = (eventSectionState[sectionKey] - 1) * pageSize;
  return {
    visibleItems: items.slice(startIndex, startIndex + pageSize),
    totalPages,
  };
}

function updateEventSectionNav(sectionKey, totalPages) {
  const prevButton = document.getElementById(`${sectionKey}-prev`);
  const nextButton = document.getElementById(`${sectionKey}-next`);
  if (!prevButton || !nextButton) return;

  const currentPage = eventSectionState[sectionKey] || 1;
  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= totalPages;

  prevButton.onclick = () => {
    if (eventSectionState[sectionKey] <= 1) return;
    eventSectionState[sectionKey] -= 1;
    renderEventSection(sectionKey);
  };

  nextButton.onclick = () => {
    if (eventSectionState[sectionKey] >= totalPages) return;
    eventSectionState[sectionKey] += 1;
    renderEventSection(sectionKey);
  };
}

function renderEventSection(sectionKey) {
  switch (sectionKey) {
    case "artists":
      renderArtists();
      break;
    case "tickets":
      renderTicketZones();
      break;
    case "stands":
      renderStands();
      break;
    default:
      break;
  }
}

function renderEventHeroMedia() {
  const hero = document.querySelector("#evento-content .event-hero");
  const media = document.getElementById("event-hero-media");
  if (!hero || !media) return;

  if (currentEvent?.imagen) {
    media.hidden = false;
    media.innerHTML = `<img src="${escapeAttribute(currentEvent.imagen)}" alt="${escapeAttribute(currentEvent.nombre || "Evento")}" loading="eager">`;
    hero.classList.add("has-image");
    hero.classList.remove("no-image");
    return;
  }

  media.hidden = true;
  media.innerHTML = "";
  hero.classList.remove("has-image");
  hero.classList.add("no-image");
}

function renderSchedule() {
  const scheduleContainer = document.getElementById("schedule-list");
  if (!scheduleContainer) return;

  const schedule = Array.isArray(currentEvent?.horario) ? currentEvent.horario : [];
  if (!schedule.length) {
    scheduleContainer.innerHTML = '<div class="schedule-day lift-hover-card"><div class="schedule-day-header"><h3>Horario por confirmar</h3></div></div>';
    return;
  }

  scheduleContainer.innerHTML = schedule
    .map(
      (day) => `
        <div class="schedule-day lift-hover-card">
          <div class="schedule-day-header">
            <h3>${escapeHtml(formatScheduleDay(day.dia))}</h3>
          </div>
          <div class="schedule-slots">
            ${(day.slots || [])
              .map(
                (slot) => `
                  <div class="schedule-slot">
                    <span class="slot-time">${escapeHtml(slot.hora || "--:--")}</span>
                    <span class="slot-artist">${escapeHtml(slot.artista || "Actividad por confirmar")}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      `,
    )
    .join("");
}

function renderArtists() {
  const artistsContainer = document.getElementById("artists-list");
  if (!artistsContainer || !Array.isArray(currentEvent?.artistas)) return;

  const artists = currentEvent.artistas;
  if (!artists.length) {
    artistsContainer.innerHTML = `
      <div class="artist-card">
        <div class="artist-icon"><i class="fas fa-user-musician"></i></div>
        <h3>Lineup por confirmar</h3>
        <p class="artist-genre">Artistas pendientes de anunciar</p>
        <p class="artist-description">Todavia no se han publicado artistas para este evento.</p>
      </div>
    `;
    updateEventSectionNav("artists", 1);
    return;
  }

  const { visibleItems, totalPages } = paginateEventSection(artists, "artists");

  artistsContainer.innerHTML = visibleItems
    .map(
      (artist) => `
        <div class="artist-card">
          ${artist.imagen
            ? `<img class="artist-image" src="${escapeAttribute(artist.imagen)}" alt="${escapeAttribute(artist.nombre || "Artista")}" loading="lazy">`
            : `<div class="artist-icon"><i class="fas fa-user-musician"></i></div>`}
          <h3>${escapeHtml(artist.nombre)}</h3>
          <p class="artist-genre">${escapeHtml(artist.genero || "Artista")}</p>
          <p class="artist-description">${escapeHtml(artist.descripcion || "Descripcion no disponible")}</p>
        </div>
      `,
    )
    .join("");

  updateEventSectionNav("artists", totalPages);
}

function renderTicketZones() {
  const ticketsContainer = document.getElementById("tickets-list");
  if (!ticketsContainer || !Array.isArray(currentEvent?.zonas)) return;

  const ticketZones = currentEvent.zonas.filter(
    (zone) => String(zone.tipo || "ticket").toLowerCase() === "ticket",
  );

  if (!ticketZones.length) {
    ticketsContainer.innerHTML = `
      <div class="ticket-card">
        <h3>Entradas por confirmar</h3>
        <div class="ticket-zone">Todavia no hay zonas de tipo ticket disponibles para este evento.</div>
      </div>
    `;
    updateEventSectionNav("tickets", 1);
    return;
  }

  const { visibleItems, totalPages } = paginateEventSection(ticketZones, "tickets");

  ticketsContainer.innerHTML = visibleItems
    .map(
      (zone) => `
        <div class="ticket-card">
          <div class="ticket-icon"><i class="fas fa-ticket-alt"></i></div>
          <h3>${escapeHtml(zone.nombre)}</h3>
          <div class="ticket-zone">${escapeHtml(zone.descripcion) || `Aforo: ${zone.aforo_maximo || "Ilimitado"}`}</div>
          <div class="ticket-price">${escapeHtml(formatCurrencyValue(zone.precio || 0))}</div>
          <button class="btn btn-primary buy-ticket-btn"
                  data-zone-id="${escapeAttribute(zone.id || "")}"
                  data-zone-name="${escapeAttribute(zone.nombre || "")}"
                  data-price="${zone.precio || 0}">
            Anadir al carrito
          </button>
        </div>
      `,
    )
    .join("");

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

      const zoneName = btn.getAttribute("data-zone-name");
      const price = parseFloat(btn.getAttribute("data-price"));
      const zoneId = btn.getAttribute("data-zone-id");

      if (window.app && currentEvent) {
        const cartItem = {
          id: `${currentEvent.id}_${zoneId}_${Date.now()}`,
          nombre: `${currentEvent.nombre} - ${zoneName}`,
          precio: price,
          cantidad: 1,
          tipo: zoneName,
          zona_id: zoneId,
          zona_nombre: zoneName,
          evento_id: currentEvent.id,
          evento_nombre: currentEvent.nombre,
          fecha_evento: currentEvent.fecha_ini,
          imagen: currentEvent.imagen,
        };

        await window.app.addToCart(cartItem);
      }
    };
  });

  updateEventSectionNav("tickets", totalPages);
}

function renderStands() {
  const standsContainer = document.getElementById("stands-list");
  if (!standsContainer || !Array.isArray(currentEvent?.puestos)) return;

  if (!currentEvent.puestos.length) {
    standsContainer.innerHTML = `
      <div class="stand-card">
        <div class="stand-icon"><i class="fas fa-store-slash"></i></div>
        <h3>Puestos por confirmar</h3>
        <p>Este evento todavia no tiene puestos publicados.</p>
        <div class="stand-type">Estado: Pendiente de publicacion</div>
      </div>
    `;
    updateEventSectionNav("stands", 1);
    return;
  }

  const { visibleItems, totalPages } = paginateEventSection(currentEvent.puestos, "stands");

  standsContainer.innerHTML = visibleItems
    .map((stand) => {
      const zoneName = String(stand.zona_nombre || "").trim();
      const zoneLabel = zoneName
        || (stand.zona_id ? "Zona vinculada no disponible" : "Zona pendiente de asignacion");

      return `
        <div class="stand-card">
          <div class="stand-icon"><i class="fas fa-utensils"></i></div>
          <h3>${escapeHtml(stand.nombre)}</h3>
          <p>Tipo: ${escapeHtml(stand.tipo || "No especificado")}</p>
          <div class="stand-type">Zona: ${escapeHtml(zoneLabel)}</div>
        </div>
      `;
    })
    .join("");

  updateEventSectionNav("stands", totalPages);
}

function renderMap() {
  const mapContainer = document.getElementById("event-map");
  if (!mapContainer) return;

  let lat = null;
  let lng = null;
  let direccion = null;

  if (currentEvent?.ubicacion) {
    lat = currentEvent.ubicacion.lat;
    lng = currentEvent.ubicacion.lng;
    direccion =
      currentEvent.ubicacion.direccion ||
      `${currentEvent.ubicacion.nombre}, ${currentEvent.ubicacion.ciudad}`;
  }

  let mapUrl;
  if (lat && lng) {
    mapUrl = `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
  } else if (direccion) {
    mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`;
  } else {
    mapUrl = "https://www.google.com/maps?q=40.4167,-3.7038&output=embed";
  }

  mapContainer.innerHTML = `<iframe src="${mapUrl}" width="100%" height="100%" style="border:0" allowfullscreen loading="lazy"></iframe>`;
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function formatScheduleDay(dayLabel) {
  if (!dayLabel) return "Por confirmar";
  const date = new Date(dayLabel);
  if (Number.isNaN(date.getTime())) return dayLabel;
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

function escapeAttribute(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatCurrencyValue(value) {
  if (window.formatCurrency) {
    return window.formatCurrency(value);
  }

  const parsed = Number(value);
  return `${Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00"} EUR`;
}

