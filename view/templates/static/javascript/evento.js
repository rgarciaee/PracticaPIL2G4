let currentEvent = null;

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
    scheduleContainer.innerHTML = '<div class="schedule-day"><div class="schedule-day-header"><h3>Horario por confirmar</h3></div></div>';
    return;
  }

  scheduleContainer.innerHTML = schedule
    .map(
      (day) => `
        <div class="schedule-day">
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

  artistsContainer.innerHTML = currentEvent.artistas
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
    return;
  }

  ticketsContainer.innerHTML = ticketZones
    .map(
      (zone) => `
        <div class="ticket-card">
          <div class="ticket-icon"><i class="fas fa-ticket-alt"></i></div>
          <h3>${escapeHtml(zone.nombre)}</h3>
          <div class="ticket-zone">${escapeHtml(zone.descripcion) || `Aforo: ${zone.aforo_maximo || "Ilimitado"}`}</div>
          <div class="ticket-price">${zone.precio || 0} EUR</div>
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
}

function renderStands() {
  const standsContainer = document.getElementById("stands-list");
  if (!standsContainer || !Array.isArray(currentEvent?.puestos)) return;

  standsContainer.innerHTML = currentEvent.puestos
    .map(
      (stand) => `
        <div class="stand-card">
          <div class="stand-icon"><i class="fas fa-utensils"></i></div>
          <h3>${escapeHtml(stand.nombre)}</h3>
          <p>Tipo: ${escapeHtml(stand.tipo || "No especificado")}</p>
          <div class="stand-type">Zona: ${escapeHtml(stand.zona || "Sin zona asignada")}</div>
        </div>
      `,
    )
    .join("");
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
