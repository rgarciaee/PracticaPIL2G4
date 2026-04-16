const adminState = {
  loaded: false,
  sessionUserId: null,
  users: [],
  events: [],
  artists: [],
  zones: [],
  stands: [],
  eventScheduleDraft: [],
};

window.initAdmin = async function () {
  const root = document.getElementById('admin-content');
  if (!root) return;

  setupAdminTabs();
  setupAdminActions();
  await loadAdminData();
};

function setupAdminTabs() {
  document.querySelectorAll('[data-admin-tab]').forEach((button) => {
    button.onclick = () => {
      const target = button.getAttribute('data-admin-tab');

      document.querySelectorAll('[data-admin-tab]').forEach((tab) => {
        tab.classList.toggle('active', tab === button);
      });

      document.querySelectorAll('[data-admin-panel]').forEach((panel) => {
        panel.classList.toggle(
          'active',
          panel.getAttribute('data-admin-panel') === target,
        );
      });
    };
  });
}

function setupAdminActions() {
  document.getElementById('admin-refresh-btn')?.addEventListener('click', () => {
    loadAdminData(true);
  });

  document.getElementById('admin-user-form')?.addEventListener('submit', submitUserForm);
  document.getElementById('admin-event-form')?.addEventListener('submit', submitEventForm);
  document.getElementById('admin-artist-form')?.addEventListener('submit', submitArtistForm);
  document.getElementById('admin-zone-form')?.addEventListener('submit', submitZoneForm);
  document.getElementById('admin-stand-form')?.addEventListener('submit', submitStandForm);

  document.getElementById('admin-user-reset')?.addEventListener('click', resetUserForm);
  document.getElementById('admin-event-reset')?.addEventListener('click', resetEventForm);
  document.getElementById('admin-artist-reset')?.addEventListener('click', resetArtistForm);
  document.getElementById('admin-zone-reset')?.addEventListener('click', resetZoneForm);
  document.getElementById('admin-stand-reset')?.addEventListener('click', resetStandForm);
  document.getElementById('admin-event-schedule-add')?.addEventListener('click', addEventScheduleEntry);

  document.getElementById('admin-stand-event')?.addEventListener('change', () => {
    populateZoneOptionsForStand();
  });
  document.getElementById('admin-event-start')?.addEventListener('change', syncEventScheduleControls);
  document.getElementById('admin-event-end')?.addEventListener('change', syncEventScheduleControls);
}

async function loadAdminData(showToast = false) {
  try {
    const response = await fetch('/api/admin/bootstrap', {
      credentials: 'include',
    });
    const result = await response.json();

    if (!result.success) {
      renderAdminError(result.error || 'No se pudo cargar el panel de administracion');
      return;
    }

    adminState.loaded = true;
    adminState.sessionUserId = result.data.session_user_id || null;
    adminState.users = result.data.users || [];
    adminState.events = result.data.events || [];
    adminState.artists = result.data.artists || [];
    adminState.zones = result.data.zones || [];
    adminState.stands = result.data.stands || [];

    renderAdminStats();
    renderAdminTables();
    populateAdminSelects();
    resetAllAdminForms();

    if (showToast) {
      window.app?.showToast('Panel de administracion actualizado', 'success');
    }
  } catch (error) {
    console.error('Error cargando admin:', error);
    renderAdminError(error.message);
  }
}

function renderAdminError(message) {
  const root = document.getElementById('admin-content');
  if (!root) return;

  root.innerHTML = `
    <section class="auth-required-page">
      <div class="card">
        <i class="fas fa-shield-halved"></i>
        <h2>Acceso restringido</h2>
        <p>${escapeHtml(message || 'No tienes permisos para ver esta pagina.')}</p>
        <div class="auth-buttons-page">
          <button class="btn btn-primary" onclick="window.router.navigate('home')">Volver al inicio</button>
        </div>
      </div>
    </section>
  `;
}

function renderAdminStats() {
  setText('admin-stat-users', adminState.users.length);
  setText('admin-stat-events', adminState.events.length);
  setText('admin-stat-zones', adminState.zones.length);
  setText('admin-stat-stands', adminState.stands.length);
}

function renderAdminTables() {
  renderUsersTable();
  renderEventsTable();
  renderArtistsTable();
  renderZonesTable();
  renderStandsTable();
}

function renderUsersTable() {
  const tbody = document.getElementById('admin-users-table');
  if (!tbody) return;

  if (!adminState.users.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="admin-empty">No hay usuarios registrados</td></tr>';
    return;
  }

  tbody.innerHTML = adminState.users.map((user) => `
    <tr>
      <td>
        <strong>${escapeHtml(user.nombre_apellidos || 'Sin nombre')}</strong>
        <small>${escapeHtml(user.email || '')}</small>
      </td>
      <td><span class="badge ${user.role === 'admin' ? 'badge-warning' : 'badge-primary'}">${escapeHtml(user.role || 'user')}</span></td>
      <td>${escapeHtml(user.telefono || '-')}</td>
      <td>
        <div class="admin-actions">
          <button class="btn btn-secondary btn-sm" data-admin-edit-user="${user.id}">Editar</button>
          <button class="btn btn-outline btn-sm" data-admin-delete-user="${user.id}" ${user.id === adminState.sessionUserId ? 'disabled' : ''}>Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-admin-edit-user]').forEach((button) => {
    button.onclick = () => editUser(button.getAttribute('data-admin-edit-user'));
  });

  tbody.querySelectorAll('[data-admin-delete-user]').forEach((button) => {
    button.onclick = () => deleteUser(button.getAttribute('data-admin-delete-user'));
  });
}

function renderEventsTable() {
  const tbody = document.getElementById('admin-events-table');
  if (!tbody) return;

  if (!adminState.events.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="admin-empty">No hay eventos</td></tr>';
    return;
  }

  tbody.innerHTML = adminState.events.map((eventItem) => `
    <tr>
      <td>
        <strong>${escapeHtml(eventItem.nombre || '')}</strong>
        <small>${escapeHtml(eventItem.ubicacion?.nombre || eventItem.ubicacion?.ciudad || '')}</small>
      </td>
      <td>${escapeHtml(eventItem.fecha_ini || '')}<br /><small>${escapeHtml(eventItem.fecha_fin || '')}</small></td>
      <td>
        <div class="admin-inline-badges">
          <span class="badge badge-primary">${(eventItem.artistas || []).length} artistas</span>
          <span class="badge badge-success">${(eventItem.zonas || []).length} zonas</span>
          <span class="badge badge-warning">${(eventItem.puestos || []).length} stands</span>
        </div>
      </td>
      <td>
        <div class="admin-actions">
          <button class="btn btn-secondary btn-sm" data-admin-edit-event="${eventItem.id}">Editar</button>
          <button class="btn btn-outline btn-sm" data-admin-delete-event="${eventItem.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-admin-edit-event]').forEach((button) => {
    button.onclick = () => editEvent(button.getAttribute('data-admin-edit-event'));
  });

  tbody.querySelectorAll('[data-admin-delete-event]').forEach((button) => {
    button.onclick = () => deleteEvent(button.getAttribute('data-admin-delete-event'));
  });
}

function renderArtistsTable() {
  const tbody = document.getElementById('admin-artists-table');
  if (!tbody) return;

  if (!adminState.artists.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="admin-empty">No hay artistas</td></tr>';
    return;
  }

  tbody.innerHTML = adminState.artists.map((artist) => `
    <tr>
      <td>
        <strong>${escapeHtml(artist.nombre || '')}</strong>
        <small>${escapeHtml(artist.descripcion || '')}</small>
      </td>
      <td>${escapeHtml(artist.evento_nombre || '-')}</td>
      <td>${escapeHtml(artist.genero || '-')}</td>
      <td>
        <div class="admin-actions">
          <button class="btn btn-secondary btn-sm" data-admin-edit-artist="${artist.id}">Editar</button>
          <button class="btn btn-outline btn-sm" data-admin-delete-artist="${artist.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-admin-edit-artist]').forEach((button) => {
    button.onclick = () => editArtist(button.getAttribute('data-admin-edit-artist'));
  });

  tbody.querySelectorAll('[data-admin-delete-artist]').forEach((button) => {
    button.onclick = () => deleteArtist(button.getAttribute('data-admin-delete-artist'));
  });
}

function renderZonesTable() {
  const tbody = document.getElementById('admin-zones-table');
  if (!tbody) return;

  if (!adminState.zones.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="admin-empty">No hay zonas</td></tr>';
    return;
  }

  tbody.innerHTML = adminState.zones.map((zone) => `
    <tr>
      <td>
        <strong>${escapeHtml(zone.nombre || '')}</strong>
        <small>${formatPrice(zone.precio)} EUR</small>
      </td>
      <td>${escapeHtml(zone.evento_nombre || '-')}</td>
      <td>${escapeHtml(String(zone.aforo_maximo ?? '-'))}</td>
      <td>
        <div class="admin-actions">
          <button class="btn btn-secondary btn-sm" data-admin-edit-zone="${zone.id}">Editar</button>
          <button class="btn btn-outline btn-sm" data-admin-delete-zone="${zone.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-admin-edit-zone]').forEach((button) => {
    button.onclick = () => editZone(button.getAttribute('data-admin-edit-zone'));
  });

  tbody.querySelectorAll('[data-admin-delete-zone]').forEach((button) => {
    button.onclick = () => deleteZone(button.getAttribute('data-admin-delete-zone'));
  });
}

function renderStandsTable() {
  const tbody = document.getElementById('admin-stands-table');
  if (!tbody) return;

  if (!adminState.stands.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="admin-empty">No hay stands</td></tr>';
    return;
  }

  tbody.innerHTML = adminState.stands.map((stand) => `
    <tr>
      <td>
        <strong>${escapeHtml(stand.nombre || '')}</strong>
        <small>${escapeHtml(stand.tipo || '')}</small>
      </td>
      <td>${escapeHtml(stand.evento_nombre || '-')}</td>
      <td>${escapeHtml(stand.zona_nombre || '-')}</td>
      <td>
        <div class="admin-actions">
          <button class="btn btn-secondary btn-sm" data-admin-edit-stand="${stand.id}">Editar</button>
          <button class="btn btn-outline btn-sm" data-admin-delete-stand="${stand.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-admin-edit-stand]').forEach((button) => {
    button.onclick = () => editStand(button.getAttribute('data-admin-edit-stand'));
  });

  tbody.querySelectorAll('[data-admin-delete-stand]').forEach((button) => {
    button.onclick = () => deleteStand(button.getAttribute('data-admin-delete-stand'));
  });
}

function populateAdminSelects() {
  populateSelect(
    document.getElementById('admin-artist-event'),
    adminState.events,
    'Selecciona un evento',
  );
  populateSelect(
    document.getElementById('admin-zone-event'),
    adminState.events,
    'Selecciona un evento',
  );
  populateSelect(
    document.getElementById('admin-stand-event'),
    adminState.events,
    'Selecciona un evento',
  );
  populateZoneOptionsForStand();
}

function populateSelect(select, items, placeholder) {
  if (!select) return;

  const currentValue = select.value;
  const options = [`<option value="">${escapeHtml(placeholder)}</option>`]
    .concat(items.map((item) => `<option value="${item.id}">${escapeHtml(item.nombre || item.email || item.id)}</option>`));

  select.innerHTML = options.join('');

  if (currentValue && items.some((item) => item.id === currentValue)) {
    select.value = currentValue;
  }
}

function populateZoneOptionsForStand(selectedZoneId = '') {
  const eventId = document.getElementById('admin-stand-event')?.value || '';
  const zoneSelect = document.getElementById('admin-stand-zone');
  if (!zoneSelect) return;

  const zones = adminState.zones.filter((zone) => !eventId || zone.evento_id === eventId);
  const options = [`<option value="">Selecciona una zona</option>`]
    .concat(zones.map((zone) => `<option value="${zone.id}">${escapeHtml(zone.nombre)}</option>`));

  zoneSelect.innerHTML = options.join('');

  if (selectedZoneId && zones.some((zone) => zone.id === selectedZoneId)) {
    zoneSelect.value = selectedZoneId;
  }
}

function resetAllAdminForms() {
  resetUserForm();
  resetEventForm();
  resetArtistForm();
  resetZoneForm();
  resetStandForm();
}

function resetUserForm() {
  setValue('admin-user-id', '');
  setValue('admin-user-email', '');
  setValue('admin-user-password', '');
  setValue('admin-user-role', 'user');
  setValue('admin-user-name', '');
  setValue('admin-user-phone', '');
  setValue('admin-user-address', '');
  setValue('admin-user-dni', '');
  setValue('admin-user-birth', '');
}

function resetEventForm() {
  setValue('admin-event-id', '');
  setValue('admin-event-name', '');
  setValue('admin-event-image', '');
  setValue('admin-event-start', '');
  setValue('admin-event-end', '');
  setValue('admin-event-description', '');
  setValue('admin-event-schedule', '');
  adminState.eventScheduleDraft = [];
  setValue('admin-event-venue', '');
  setValue('admin-event-city', '');
  setValue('admin-event-address', '');
  setValue('admin-event-lat', '');
  setValue('admin-event-lng', '');
  syncEventScheduleControls();
  renderEventScheduleList();
}

function resetArtistForm() {
  setValue('admin-artist-id', '');
  setValue('admin-artist-event', '');
  setValue('admin-artist-name', '');
  setValue('admin-artist-genre', '');
  setValue('admin-artist-image', '');
  setValue('admin-artist-description', '');
}

function resetZoneForm() {
  setValue('admin-zone-id', '');
  setValue('admin-zone-event', '');
  setValue('admin-zone-name', '');
  setValue('admin-zone-capacity', '');
  setValue('admin-zone-price', '');
}

function resetStandForm() {
  setValue('admin-stand-id', '');
  setValue('admin-stand-event', '');
  populateZoneOptionsForStand();
  setValue('admin-stand-zone', '');
  setValue('admin-stand-name', '');
  setValue('admin-stand-type', '');
  setValue('admin-stand-price', '');
  setValue('admin-stand-size', '');
  setValue('admin-stand-schedule', '');
}

function editUser(userId) {
  const user = adminState.users.find((item) => item.id === userId);
  if (!user) return;

  setValue('admin-user-id', user.id);
  setValue('admin-user-email', user.email || '');
  setValue('admin-user-password', '');
  setValue('admin-user-role', user.role || 'user');
  setValue('admin-user-name', user.nombre_apellidos || '');
  setValue('admin-user-phone', user.telefono || '');
  setValue('admin-user-address', user.direccion || '');
  setValue('admin-user-dni', user.dni || '');
  setValue('admin-user-birth', user.fecha_nacimiento || '');
}

function editEvent(eventId) {
  const eventItem = adminState.events.find((item) => item.id === eventId);
  if (!eventItem) return;

  setValue('admin-event-id', eventItem.id);
  setValue('admin-event-name', eventItem.nombre || '');
  setValue('admin-event-image', eventItem.imagen || '');
  setValue('admin-event-start', normalizeDateInput(eventItem.fecha_ini));
  setValue('admin-event-end', normalizeDateInput(eventItem.fecha_fin));
  setValue('admin-event-description', eventItem.descripcion || '');
  setValue('admin-event-schedule', stringifyEventSchedule(eventItem.horario));
  adminState.eventScheduleDraft = flattenEventSchedule(eventItem.horario);
  setValue('admin-event-venue', eventItem.ubicacion?.nombre || '');
  setValue('admin-event-city', eventItem.ubicacion?.ciudad || '');
  setValue('admin-event-address', eventItem.ubicacion?.direccion || '');
  setValue('admin-event-lat', eventItem.ubicacion?.lat ?? '');
  setValue('admin-event-lng', eventItem.ubicacion?.lng ?? '');
  syncEventScheduleControls();
  renderEventScheduleList();
}

function editArtist(artistId) {
  const artist = adminState.artists.find((item) => item.id === artistId);
  if (!artist) return;

  setValue('admin-artist-id', artist.id);
  setValue('admin-artist-event', artist.evento_id || '');
  setValue('admin-artist-name', artist.nombre || '');
  setValue('admin-artist-genre', artist.genero || '');
  setValue('admin-artist-image', artist.imagen || '');
  setValue('admin-artist-description', artist.descripcion || '');
}

function editZone(zoneId) {
  const zone = adminState.zones.find((item) => item.id === zoneId);
  if (!zone) return;

  setValue('admin-zone-id', zone.id);
  setValue('admin-zone-event', zone.evento_id || '');
  setValue('admin-zone-name', zone.nombre || '');
  setValue('admin-zone-capacity', zone.aforo_maximo ?? '');
  setValue('admin-zone-price', zone.precio ?? '');
}

function editStand(standId) {
  const stand = adminState.stands.find((item) => item.id === standId);
  if (!stand) return;

  setValue('admin-stand-id', stand.id);
  setValue('admin-stand-event', stand.evento_id || '');
  populateZoneOptionsForStand(stand.zona_id || '');
  setValue('admin-stand-zone', stand.zona_id || '');
  setValue('admin-stand-name', stand.nombre || '');
  setValue('admin-stand-type', stand.tipo || '');
  setValue('admin-stand-price', stand.precio_alquiler ?? '');
  setValue('admin-stand-size', stand.dimension_m2 ?? '');
  setValue('admin-stand-schedule', stand.horario || '');
}

async function submitUserForm(event) {
  event.preventDefault();

  const userId = getValue('admin-user-id');
  const payload = {
    email: getValue('admin-user-email'),
    password: getValue('admin-user-password'),
    role: getValue('admin-user-role'),
    nombre_apellidos: getValue('admin-user-name'),
    telefono: getValue('admin-user-phone'),
    direccion: getValue('admin-user-address'),
    dni: getValue('admin-user-dni'),
    fecha_nacimiento: getValue('admin-user-birth'),
  };

  const method = userId ? 'PUT' : 'POST';
  const endpoint = userId ? `/api/admin/users/${userId}` : '/api/admin/users';
  const result = await adminApiCall(endpoint, method, payload);

  if (result.success) {
    window.app?.showToast('Usuario guardado correctamente', 'success');
    await loadAdminData();
  } else {
    window.app?.showToast(result.error || 'No se pudo guardar el usuario', 'error');
  }
}

async function submitEventForm(event) {
  event.preventDefault();

  const eventSchedule = buildEventSchedulePayload();
  if (eventSchedule === null) {
    return;
  }

  const eventId = getValue('admin-event-id');
  const payload = {
    nombre: getValue('admin-event-name'),
    imagen: getValue('admin-event-image'),
    fecha_ini: getValue('admin-event-start'),
    fecha_fin: getValue('admin-event-end'),
    descripcion: getValue('admin-event-description'),
    horario: eventSchedule,
    ubicacion: {
      nombre: getValue('admin-event-venue'),
      ciudad: getValue('admin-event-city'),
      direccion: getValue('admin-event-address'),
      lat: parseOptionalNumber(getValue('admin-event-lat')),
      lng: parseOptionalNumber(getValue('admin-event-lng')),
    },
  };

  const method = eventId ? 'PUT' : 'POST';
  const endpoint = eventId ? `/api/admin/events/${eventId}` : '/api/admin/events';
  const result = await adminApiCall(endpoint, method, payload);

  if (result.success) {
    window.app?.showToast('Evento guardado correctamente', 'success');
    await loadAdminData();
  } else {
    window.app?.showToast(result.error || 'No se pudo guardar el evento', 'error');
  }
}

async function submitArtistForm(event) {
  event.preventDefault();

  const artistId = getValue('admin-artist-id');
  const payload = {
    evento_id: getValue('admin-artist-event'),
    nombre: getValue('admin-artist-name'),
    genero: getValue('admin-artist-genre'),
    imagen: getValue('admin-artist-image'),
    descripcion: getValue('admin-artist-description'),
  };

  const method = artistId ? 'PUT' : 'POST';
  const endpoint = artistId ? `/api/admin/artists/${artistId}` : '/api/admin/artists';
  const result = await adminApiCall(endpoint, method, payload);

  if (result.success) {
    window.app?.showToast('Artista guardado correctamente', 'success');
    await loadAdminData();
  } else {
    window.app?.showToast(result.error || 'No se pudo guardar el artista', 'error');
  }
}

async function submitZoneForm(event) {
  event.preventDefault();

  const zoneId = getValue('admin-zone-id');
  const payload = {
    evento_id: getValue('admin-zone-event'),
    nombre: getValue('admin-zone-name'),
    aforo_maximo: getValue('admin-zone-capacity'),
    precio: getValue('admin-zone-price'),
  };

  const method = zoneId ? 'PUT' : 'POST';
  const endpoint = zoneId ? `/api/admin/zones/${zoneId}` : '/api/admin/zones';
  const result = await adminApiCall(endpoint, method, payload);

  if (result.success) {
    window.app?.showToast('Zona guardada correctamente', 'success');
    await loadAdminData();
  } else {
    window.app?.showToast(result.error || 'No se pudo guardar la zona', 'error');
  }
}

async function submitStandForm(event) {
  event.preventDefault();

  const standId = getValue('admin-stand-id');
  const payload = {
    evento_id: getValue('admin-stand-event'),
    zona_id: getValue('admin-stand-zone'),
    nombre: getValue('admin-stand-name'),
    tipo: getValue('admin-stand-type'),
    precio_alquiler: getValue('admin-stand-price'),
    dimension_m2: getValue('admin-stand-size'),
    horario: getValue('admin-stand-schedule'),
  };

  const method = standId ? 'PUT' : 'POST';
  const endpoint = standId ? `/api/admin/stands/${standId}` : '/api/admin/stands';
  const result = await adminApiCall(endpoint, method, payload);

  if (result.success) {
    window.app?.showToast('Stand guardado correctamente', 'success');
    await loadAdminData();
  } else {
    window.app?.showToast(result.error || 'No se pudo guardar el stand', 'error');
  }
}

async function deleteUser(userId) {
  const user = adminState.users.find((item) => item.id === userId);
  if (!user) return;

  window.app?.showModal(
    'Eliminar usuario',
    `<p>Vas a eliminar al usuario <strong>${escapeHtml(user.email || user.nombre_apellidos || user.id)}</strong>.</p><p>La cuenta dejara de poder autenticarse.</p>`,
    async () => {
      const result = await adminApiCall(`/api/admin/users/${userId}`, 'DELETE');
      if (result.success) {
        window.app?.showToast('Usuario eliminado', 'success');
        await loadAdminData();
      } else {
        window.app?.showToast(result.error || 'No se pudo eliminar el usuario', 'error');
      }
    },
  );
}

async function deleteEvent(eventId) {
  const eventItem = adminState.events.find((item) => item.id === eventId);
  if (!eventItem) return;

  window.app?.showModal(
    'Eliminar evento',
    `<p>Vas a eliminar <strong>${escapeHtml(eventItem.nombre)}</strong>.</p><p>Tambien se eliminaran sus artistas, zonas y stands asociados.</p>`,
    async () => {
      const result = await adminApiCall(`/api/admin/events/${eventId}`, 'DELETE');
      if (result.success) {
        window.app?.showToast('Evento eliminado', 'success');
        await loadAdminData();
      } else {
        window.app?.showToast(result.error || 'No se pudo eliminar el evento', 'error');
      }
    },
  );
}

async function deleteArtist(artistId) {
  const result = await adminApiCall(`/api/admin/artists/${artistId}`, 'DELETE');
  if (result.success) {
    window.app?.showToast('Artista eliminado', 'success');
    await loadAdminData();
  } else {
    window.app?.showToast(result.error || 'No se pudo eliminar el artista', 'error');
  }
}

async function deleteZone(zoneId) {
  const zone = adminState.zones.find((item) => item.id === zoneId);
  if (!zone) return;

  window.app?.showModal(
    'Eliminar zona',
    `<p>La zona <strong>${escapeHtml(zone.nombre)}</strong> se eliminara junto a los stands que dependan de ella.</p>`,
    async () => {
      const result = await adminApiCall(`/api/admin/zones/${zoneId}`, 'DELETE');
      if (result.success) {
        window.app?.showToast('Zona eliminada', 'success');
        await loadAdminData();
      } else {
        window.app?.showToast(result.error || 'No se pudo eliminar la zona', 'error');
      }
    },
  );
}

async function deleteStand(standId) {
  const result = await adminApiCall(`/api/admin/stands/${standId}`, 'DELETE');
  if (result.success) {
    window.app?.showToast('Stand eliminado', 'success');
    await loadAdminData();
  } else {
    window.app?.showToast(result.error || 'No se pudo eliminar el stand', 'error');
  }
}

async function adminApiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data !== null) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(endpoint, options);
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value);
}

function setValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value ?? '';
}

function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : '';
}

function parseOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function formatPrice(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
}

function stringifyEventSchedule(schedule) {
  if (!Array.isArray(schedule) || schedule.length === 0) return '';
  return schedule.flatMap((day) => {
    const dayLabel = day?.dia || '';
    return (day?.slots || []).map((slot) => `${dayLabel} | ${slot.hora || ''} | ${slot.artista || ''}`);
  }).join('\n');
}

function flattenEventSchedule(schedule) {
  if (!Array.isArray(schedule)) return [];
  return schedule.flatMap((day) => {
    const dayLabel = day?.dia || '';
    return (day?.slots || []).map((slot) => ({
      dia: normalizeScheduleDraftDay(dayLabel),
      hora: slot?.hora || '',
      artista: slot?.artista || '',
    }));
  }).filter((item) => item.dia && item.hora && item.artista);
}

function syncEventScheduleControls() {
  populateEventScheduleDayOptions();
  populateEventScheduleArtistOptions();
  updateEventScheduleHelp();
}

function populateEventScheduleDayOptions() {
  const select = document.getElementById('admin-event-schedule-day');
  if (!select) return;

  const selectedValue = select.value;
  const options = getEventScheduleDateOptions();

  if (!options.length) {
    select.innerHTML = '<option value="">Define primero las fechas del evento</option>';
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = options
    .map((value) => `<option value="${value}">${escapeHtml(formatScheduleDateLabel(value))}</option>`)
    .join('');

  if (selectedValue && options.includes(selectedValue)) {
    select.value = selectedValue;
  }
}

function populateEventScheduleArtistOptions() {
  const select = document.getElementById('admin-event-schedule-artist');
  if (!select) return;

  const selectedValue = select.value;
  const artists = getCurrentEventArtists();

  if (!artists.length) {
    select.innerHTML = '<option value="">No hay artistas asociados a este evento</option>';
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = artists
    .map((artist) => `<option value="${escapeHtmlAttribute(artist.nombre || '')}">${escapeHtml(artist.nombre || 'Artista')}</option>`)
    .join('');

  if (selectedValue && artists.some((artist) => artist.nombre === selectedValue)) {
    select.value = selectedValue;
  }
}

function updateEventScheduleHelp() {
  const help = document.getElementById('admin-event-schedule-help');
  const addButton = document.getElementById('admin-event-schedule-add');
  if (!help || !addButton) return;

  const hasDates = getEventScheduleDateOptions().length > 0;
  const artists = getCurrentEventArtists();
  const eventId = getValue('admin-event-id');

  if (!hasDates) {
    help.textContent = 'Primero define la fecha de inicio y fin del evento.';
    addButton.disabled = true;
    return;
  }

  if (!eventId) {
    help.textContent = 'Guarda el evento primero para poder asignar artistas al horario.';
    addButton.disabled = true;
    return;
  }

  if (!artists.length) {
    help.textContent = 'Crea artistas para este evento y luego podras anadirlos al horario.';
    addButton.disabled = true;
    return;
  }

  help.textContent = 'Selecciona un dia del evento, una hora y uno de sus artistas para anadir un pase.';
  addButton.disabled = false;
}

function getCurrentEventArtists() {
  const eventId = getValue('admin-event-id');
  if (!eventId) return [];
  return adminState.artists
    .filter((artist) => artist.evento_id === eventId)
    .sort((left, right) => String(left.nombre || '').localeCompare(String(right.nombre || '')));
}

function getEventScheduleDateOptions() {
  const start = getValue('admin-event-start');
  const end = getValue('admin-event-end');
  if (!start) return [];

  const startDate = parseDateParts(start);
  const endDate = parseDateParts(end || start);
  if (!startDate || !endDate) return [];

  const safeEnd = compareDateParts(endDate, startDate) >= 0 ? endDate : startDate;
  const values = [];
  let current = { ...startDate };

  while (compareDateParts(current, safeEnd) <= 0) {
    values.push(formatDateParts(current));
    current = addDaysToDateParts(current, 1);
  }

  return values;
}

function addEventScheduleEntry() {
  const day = getValue('admin-event-schedule-day');
  const timeInput = document.getElementById('admin-event-schedule-time');
  const artist = getValue('admin-event-schedule-artist');
  const time = timeInput ? timeInput.value.trim() : '';

  if (!day || !time || !artist) {
    window.app?.showToast('Completa dia, hora y artista para anadir un pase', 'error');
    return;
  }

  if (!getEventScheduleDateOptions().includes(day)) {
    window.app?.showToast('El dia elegido esta fuera del rango del evento', 'error');
    return;
  }

  if (!getCurrentEventArtists().some((item) => item.nombre === artist)) {
    window.app?.showToast('Selecciona un artista valido del evento', 'error');
    return;
  }

  adminState.eventScheduleDraft.push({ dia: day, hora: time, artista: artist });
  adminState.eventScheduleDraft.sort(compareScheduleEntries);

  if (timeInput) {
    timeInput.value = '';
  }

  renderEventScheduleList();
}

function renderEventScheduleList() {
  const container = document.getElementById('admin-event-schedule-list');
  if (!container) return;

  if (!adminState.eventScheduleDraft.length) {
    container.innerHTML = '<p class="admin-schedule-empty">Todavia no hay pases definidos para este evento.</p>';
    return;
  }

  const grouped = groupScheduleEntries(adminState.eventScheduleDraft);
  container.innerHTML = Object.entries(grouped).map(([day, items]) => `
    <div class="admin-schedule-day-block">
      <div class="admin-schedule-day-header">
        <strong>${escapeHtml(formatScheduleDateLabel(day))}</strong>
        <span>${items.length} pase${items.length === 1 ? '' : 's'}</span>
      </div>
      <div class="admin-schedule-items">
        ${items.map((item, index) => `
          <div class="admin-schedule-item">
            <span class="admin-schedule-item-time">${escapeHtml(item.hora)}</span>
            <span class="admin-schedule-item-artist">${escapeHtml(item.artista)}</span>
            <button type="button" class="btn btn-outline btn-sm" data-admin-remove-schedule="${item.key}">Eliminar</button>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-admin-remove-schedule]').forEach((button) => {
    button.onclick = () => removeEventScheduleEntry(button.getAttribute('data-admin-remove-schedule'));
  });
}

function removeEventScheduleEntry(entryKey) {
  adminState.eventScheduleDraft = adminState.eventScheduleDraft.filter((item) => buildScheduleEntryKey(item) !== entryKey);
  renderEventScheduleList();
}

function buildEventSchedulePayload() {
  const validDays = new Set(getEventScheduleDateOptions());
  const validArtists = new Set(getCurrentEventArtists().map((artist) => artist.nombre));
  const eventId = getValue('admin-event-id');

  if (!adminState.eventScheduleDraft.length) {
    return [];
  }

  for (const entry of adminState.eventScheduleDraft) {
    if (!validDays.has(entry.dia)) {
      window.app?.showToast('Hay pases con dias fuera del rango del evento', 'error');
      return null;
    }

    if (eventId && !validArtists.has(entry.artista)) {
      window.app?.showToast('Hay pases con artistas que no pertenecen a este evento', 'error');
      return null;
    }
  }

  return Object.entries(groupScheduleEntries(adminState.eventScheduleDraft)).map(([dia, items]) => ({
    dia,
    slots: items.map((item) => ({
      hora: item.hora,
      artista: item.artista,
    })),
  }));
}

function groupScheduleEntries(entries) {
  return [...entries]
    .sort(compareScheduleEntries)
    .reduce((accumulator, entry) => {
      const key = entry.dia;
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push({ ...entry, key: buildScheduleEntryKey(entry) });
      return accumulator;
    }, {});
}

function compareScheduleEntries(left, right) {
  const leftKey = `${left.dia} ${left.hora}`;
  const rightKey = `${right.dia} ${right.hora}`;
  return leftKey.localeCompare(rightKey) || String(left.artista || '').localeCompare(String(right.artista || ''));
}

function buildScheduleEntryKey(entry) {
  return `${entry.dia}__${entry.hora}__${entry.artista}`;
}

function formatScheduleDateLabel(value) {
  if (!value) return 'Por confirmar';
  const normalizedValue = normalizeScheduleDraftDay(value);
  const parts = parseDateParts(normalizedValue);
  if (!parts) return String(value);
  return `${parts.day}-${parts.month}-${parts.year}`;
}

function escapeHtmlAttribute(text) {
  return escapeHtml(text).replaceAll('`', '&#96;');
}

function normalizeScheduleDraftDay(value) {
  if (!value) return '';
  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
    const [day, month, year] = text.split('-');
    return `${year}-${month}-${day}`;
  }

  const parsed = parseDatePartsFromAny(text);
  if (!parsed) {
    return text;
  }

  return formatDateParts(parsed);
}

function parseDateParts(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: match[1],
    month: match[2],
    day: match[3],
  };
}

function parseDatePartsFromAny(value) {
  const normalized = parseDateParts(value);
  if (normalized) return normalized;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    year: String(parsed.getFullYear()),
    month: String(parsed.getMonth() + 1).padStart(2, '0'),
    day: String(parsed.getDate()).padStart(2, '0'),
  };
}

function formatDateParts(parts) {
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function compareDateParts(left, right) {
  return formatDateParts(left).localeCompare(formatDateParts(right));
}

function addDaysToDateParts(parts, days) {
  const date = new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  date.setDate(date.getDate() + days);
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate()).padStart(2, '0'),
  };
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
