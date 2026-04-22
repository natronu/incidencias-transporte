// ================================================================
// INCIDENTS.JS — incidencias
// ================================================================




async function loadIncidents() {
  showLoad('Cargando incidencias...');
  try {
    const [inc, ag, zt] = await Promise.all([
      sb.query('incidents', '?select=*,agencies(name),incident_types(name,color),geographic_zones(name),shipment_types(name)&order=created_at.desc'),
      sb.query('agencies', '?select=id,name&active=eq.true&order=name'),
      sb.query('incident_types', '?select=*&active=eq.true'),
    ]);
    allIncidents = inc.map(i => ({
      ...i,
      agency_name: i.agencies?.name || '—',
      incident_type_name: i.incident_types?.name || '—',
      incident_type_color: i.incident_types?.color || '#888',
      zone_name: i.geographic_zones?.name || '—',
      shipment_type_name: i.shipment_types?.name || i.shipment_type || '—'
    }));
    allAgencies = ag;
    allIncTypes = zt;

    // Populate agency filter
    const agSel = document.getElementById('inc-filter-agency');
    agSel.innerHTML = '<option value="">Todas las agencias</option>' + ag.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');

    filterIncidents();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}

function filterIncidents() {
  const q = (document.getElementById('inc-search')?.value || '').toLowerCase();
  const status = document.getElementById('inc-filter-status')?.value;
  const agencyId = document.getElementById('inc-filter-agency')?.value;
  const dateFrom = document.getElementById('inc-filter-date-from')?.value;
  const dateTo = document.getElementById('inc-filter-date-to')?.value;
  filteredIncidents = allIncidents.filter(i => {
    if (status && i.status !== status) return false;
    if (agencyId && String(i.agency_id) !== agencyId) return false;
    if (dateFrom && i.incident_date && i.incident_date < dateFrom) return false;
    if (dateTo && i.incident_date && i.incident_date > dateTo) return false;
    if (q) {
      const hay = [i.incident_code, i.agency_name, i.albaran, i.incident_type_name, i.zone_name, i.city, i.client_name].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  sortIncidentsArr();
  incPage = 1;
  renderIncidents();
}

function sortIncidents(field) {
  if (sortField === field) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  else { sortField = field; sortDir = 'asc'; }
  document.querySelectorAll('#inc-table th').forEach(th => th.classList.remove('sorted'));
  event.currentTarget.classList.add('sorted');
  const icon = event.currentTarget.querySelector('.sort-icon');
  if (icon) icon.textContent = sortDir === 'asc' ? '↑' : '↓';
  sortIncidentsArr();
  renderIncidents();
}

function sortIncidentsArr() {
  filteredIncidents.sort((a, b) => {
    let va = a[sortField] || '', vb = b[sortField] || '';
    if (sortDir === 'desc') [va, vb] = [vb, va];
    return String(va).localeCompare(String(vb), 'es', { numeric: true });
  });
}

function renderIncidents() {
  const pp = appConfig.items_per_page || 10;
  const total = filteredIncidents.length;
  const pages = Math.max(1, Math.ceil(total / pp));
  if (incPage > pages) incPage = pages;
  const start = (incPage - 1) * pp;
  const slice = filteredIncidents.slice(start, start + pp);

  const tbody = document.getElementById('inc-tbody');
  tbody.innerHTML = slice.length ? slice.map(i => `<tr>
    <td>${escapeHtml(i.agency_name)}</td>
    <td>${escapeHtml(i.albaran)}</td>
    <td><span class="chip" style="border-color:${i.incident_type_color}20;color:${i.incident_type_color}">${escapeHtml(i.incident_type_name)}</span></td>
    <td>${escapeHtml(i.zone_name)}</td>
    <td>${escapeHtml(i.client_name)}</td>
    <td>${escapeHtml(i.city)}</td>
    <td>${escapeHtml(i.postal_code)}</td>
    <td>${statusBadge(i.status)}</td>
    <td>${fmtDate(i.incident_date)}</td>
    <td>${fmtDate(i.shipment_date)}</td>
    <td>${fmtDate(i.reception_date)}</td>
    <td>
      <div style="display:flex;gap:4px">
        <button class="btn btn-secondary btn-sm" onclick="viewIncident(${i.id})">Ver</button>
        ${(isAdmin() || (canEdit() && i.status !== 'closed')) ? `<button class="btn btn-secondary btn-sm" onclick="openIncidentModal(${i.id})">✏️</button>
        <button class="btn btn-danger btn-sm js-delete" data-table="incidents" data-id="${i.id}" data-label="la incidencia ${escapeHtml(i.incident_code)}">🗑️</button>` : ''}
      </div>
    </td>
  </tr>`).join('') : `<tr><td colspan="12"><div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Sin incidencias</div><div class="empty-desc">Ajusta los filtros o crea una nueva</div></div></td></tr>`;
  tbody.querySelectorAll('.js-delete').forEach(b => b.addEventListener('click', () => confirmDelete(b.dataset.table, b.dataset.id, b.dataset.label)));

  // Pagination info
  document.getElementById('inc-pag-info').textContent = total ? `Mostrando ${start + 1}–${Math.min(start + pp, total)} de ${total} incidencias` : '0 incidencias';

  // Pagination buttons
  const ctrl = document.getElementById('inc-pag-controls');
  ctrl.innerHTML = '';
  const addBtn = (label, page, disabled = false, active = false) => {
    const b = document.createElement('button');
    b.className = 'page-btn' + (active ? ' active' : '');
    b.textContent = label;
    b.disabled = disabled;
    b.onclick = () => { incPage = page; renderIncidents(); };
    ctrl.appendChild(b);
  };
  addBtn('«', 1, incPage === 1);
  addBtn('‹', incPage - 1, incPage === 1);
  const range = 2;
  for (let p = Math.max(1, incPage - range); p <= Math.min(pages, incPage + range); p++) addBtn(p, p, false, p === incPage);
  addBtn('›', incPage + 1, incPage === pages);
  addBtn('»', pages, incPage === pages);
}

async function openIncidentModal(id = null) {
  if (!canEdit() && id) { viewIncident(id); return; }
  if (id) {
    const inc = allIncidents.find(i => i.id === id);
    if (inc && inc.status === 'closed' && !isAdmin()) {
      toast('Las incidencias cerradas solo pueden ser editadas por un administrador', 'error');
      viewIncident(id);
      return;
    }
  }
  editId.incident = id;
  document.getElementById('m-incident-title').textContent = id ? 'Editar incidencia' : 'Nueva incidencia';
  document.getElementById('m-incident-alert').innerHTML = '';

  // Load selects
  await Promise.all([loadAgencySelect(), loadIncTypeSelect(), loadZoneSelect(), loadShipTypeSelect()]);

  if (id) {
    const inc = allIncidents.find(i => i.id === id);
    if (inc) {
      document.getElementById('i-agency').value = inc.agency_id || '';
      document.getElementById('i-albaran').value = inc.albaran || '';
      document.getElementById('i-type').value = inc.incident_type_id || '';
      document.getElementById('i-shiptype').value = inc.shipment_type_id || '';
      document.getElementById('i-zone').value = inc.zone_id || '';
      document.getElementById('i-city').value = inc.city || '';
      document.getElementById('i-postal').value = inc.postal_code || '';
      document.getElementById('i-client').value = inc.client_name || '';
      document.getElementById('i-ship-date').value = inc.shipment_date || '';
      document.getElementById('i-rec-date').value = inc.reception_date || '';
      document.getElementById('i-inc-date').value = inc.incident_date || '';
      document.getElementById('i-desc').value = inc.description || '';
    }
  } else {
    ['i-agency', 'i-type', 'i-zone', 'i-shiptype'].forEach(f => { const el = document.getElementById(f); if (el) el.value = ''; });
    ['i-albaran', 'i-city', 'i-postal', 'i-client', 'i-ship-date', 'i-rec-date', 'i-inc-date', 'i-desc', 'i-first-note'].forEach(f => { const el = document.getElementById(f); if (el) el.value = ''; });
    document.getElementById('i-inc-date').value = new Date().toISOString().slice(0, 10);
  }
  document.getElementById('i-first-note-group').style.display = id ? 'none' : '';
  openModal('m-incident');
}

async function loadAgencySelect() {
  const sel = document.getElementById('i-agency');
  if (allAgencies.length === 0) allAgencies = await sb.query('agencies', '?select=id,name&active=eq.true&order=name');
  sel.innerHTML = '<option value="">Seleccionar agencia...</option>' + allAgencies.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');
}
async function loadIncTypeSelect() {
  const sel = document.getElementById('i-type');
  if (allIncTypes.length === 0) allIncTypes = await sb.query('incident_types', '?select=id,name&active=eq.true&order=name');
  sel.innerHTML = '<option value="">Seleccionar tipo...</option>' + allIncTypes.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
}
async function loadZoneSelect() {
  const sel = document.getElementById('i-zone');
  if (allZones.length === 0) allZones = await sb.query('geographic_zones', '?select=id,name&active=eq.true&order=name');
  sel.innerHTML = '<option value="">Seleccionar zona...</option>' + allZones.map(z => `<option value="${z.id}">${escapeHtml(z.name)}</option>`).join('');
}

async function saveIncident() {
  const alertEl = document.getElementById('m-incident-alert');
  const agencyId = parseInt(document.getElementById('i-agency').value);
  const albaran = document.getElementById('i-albaran').value.trim();
  const typeId = parseInt(document.getElementById('i-type').value);
  const zoneId = parseInt(document.getElementById('i-zone').value);
  const city = document.getElementById('i-city').value.trim();
  const incDate = document.getElementById('i-inc-date').value;
  const desc = document.getElementById('i-desc').value.trim();
  const isEdit = !!editId.incident;
  const firstNote = document.getElementById('i-first-note').value.trim();
  if (!agencyId || !albaran || !typeId || !zoneId || !city || !incDate) {
    showAlert(alertEl, 'Complete todos los campos obligatorios'); return;
  }
  if (!isEdit && !firstNote) {
    showAlert(alertEl, 'El campo Incidencia es obligatorio'); return;
  }
  showLoad('Guardando...');
  try {
    const data = {
      agency_id: agencyId, albaran, incident_type_id: typeId, zone_id: zoneId,
      city, postal_code: document.getElementById('i-postal').value.trim() || null,
      client_name: document.getElementById('i-client').value.trim() || null,
      incident_date: incDate, description: desc,
      shipment_type_id: parseInt(document.getElementById('i-shiptype').value) || null,
      shipment_date: document.getElementById('i-ship-date').value || null,
      reception_date: document.getElementById('i-rec-date').value || null,
      updated_at: new Date().toISOString()
    };
    if (editId.incident) {
      const oldInc = allIncidents.find(i => i.id === editId.incident) || {};
      await sb.update('incidents', editId.incident, data);
      try { await sb.insert('incident_logs', { incident_id: editId.incident, user_id: currentUser.id, user_name: currentUser.name, action: 'MODIFICAR', incident_data: data, previous_data: oldInc }); } catch(e) { console.warn(e); }
      toast('Incidencia actualizada');
    } else {
      const code = await nextIncidentCode();
      const newInc = await sb.insert('incidents', { ...data, incident_code: code, status: 'open', created_by: currentUser.id });
      if (newInc && newInc[0]) {
        await sb.insert('incident_updates', { incident_id: newInc[0].id, user_id: currentUser.id, user_name: currentUser.name, note: firstNote });
        try { await sb.insert('incident_logs', { incident_id: newInc[0].id, user_id: currentUser.id, user_name: currentUser.name, action: 'CREAR', incident_data: newInc[0] }); } catch(e) { console.warn(e); }
      }
      toast('Incidencia registrada: ' + code);
    }
    closeModal('m-incident');
    allIncidents = []; allIncTypes = [];
    await loadIncidents();
  } catch (e) { showAlert(alertEl, 'Error al guardar. Inténtalo de nuevo.'); }
  hideLoad();
}

async function nextIncidentCode() {
  const all = await sb.query('incidents', '?select=incident_code&order=id.desc&limit=1');
  if (!all.length) return 'INC-0001';
  const last = all[0].incident_code || 'INC-0000';
  const num = parseInt(last.split('-')[1] || '0') + 1;
  return 'INC-' + String(num).padStart(4, '0');
}

async function viewIncident(id) {
  showLoad();
  try {
    const inc = allIncidents.find(i => i.id === id) || (await sb.query('incidents', `?id=eq.${id}&select=*,agencies(name),incident_types(name),geographic_zones(name),shipment_types(name)`))[0];
    const updates = await sb.query('incident_updates', `?incident_id=eq.${id}&order=created_at.asc`);
    document.getElementById('m-detail-title').textContent = `Incidencia ${inc.incident_code}`;
    document.getElementById('btn-set-progress').style.display = (inc.status === 'closed' || !isAdmin()) ? 'none' : '';
    document.getElementById('btn-set-closed').style.display = (inc.status === 'closed' || !isAdmin()) ? 'none' : '';
    document.getElementById('m-detail-body').innerHTML = `
      <div class="detail-grid" style="margin-bottom:1rem">
        ${df('Código', `<span class="text-mono" style="color:var(--brand)">${escapeHtml(inc.incident_code)}</span>`)}
        ${df('Estado', statusBadge(inc.status))}
        ${df('Agencia', escapeHtml(inc.agencies?.name || inc.agency_name))}
        ${df('Albarán', escapeHtml(inc.albaran))}
        ${df('Tipo de incidencia', escapeHtml(inc.incident_types?.name || inc.incident_type_name))}
        ${df('Tipo de envío', escapeHtml(inc.shipment_types?.name || inc.shipment_type_name))}
        ${df('Zona', escapeHtml(inc.geographic_zones?.name || inc.zone_name))}
        ${df('Cliente', escapeHtml(inc.client_name))}
        ${df('Población', escapeHtml(inc.city))}
        ${df('Código postal', escapeHtml(inc.postal_code))}
        ${df('F. Envío', fmtDate(inc.shipment_date))}
        ${df('F. Entrega', fmtDate(inc.reception_date))}
        ${df('F. Incidencia', fmtDate(inc.incident_date))}
        ${df('F. Registro', fmtDate(inc.created_at))}
      </div>
      <div style="margin-bottom:0.75rem">
        <div class="detail-label" style="margin-bottom:10px">Añadir nota / actualización</div>
        <textarea class="form-control" id="upd-text" placeholder="Escribe una actualización..." style="min-height:70px"></textarea>
        <button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="addUpdate(${id})">Añadir nota</button>
      </div>
      ${updates.length ? `
      <div class="divider"></div>
      <div class="detail-label" style="margin-bottom:12px">Historial</div>
      <div class="timeline">
        ${updates.map(u => `
        <div class="timeline-item" id="upd-item-${u.id}">
          <div class="timeline-dot"></div>
          <div class="timeline-text" id="upd-text-${u.id}">${escapeHtml(u.note)}</div>
          <div class="timeline-meta">
            ${fmtDateTime(u.created_at)} — ${escapeHtml(u.user_name)}
            ${isAdmin() ? `
            <span style="margin-left:8px;display:inline-flex;gap:4px">
              <button class="btn btn-secondary btn-sm" style="padding:1px 6px;font-size:11px" onclick="startEditUpdate(${u.id})">✏️</button>
              <button class="btn btn-danger btn-sm" style="padding:1px 6px;font-size:11px" onclick="deleteUpdate(${u.id},${id})">🗑️</button>
            </span>` : ''}
          </div>
        </div>`).join('')}
      </div>` : ''}
      ${inc.description ? `
      <div class="divider"></div>
      <div style="margin-bottom:1rem">
        <div class="detail-label">Descripción mercancía</div>
        <div class="description-box">${escapeHtml(inc.description)}</div>
      </div>` : ''}
    `;
    // Store current incident id for status changes
    window._viewingIncidentId = id;
    window._viewingIncidentStatus = inc.status;
    openModal('m-detail');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}

async function addUpdate(incidentId) {
  const text = document.getElementById('upd-text')?.value?.trim();
  if (!text) { toast('La anotación no puede estar vacía', 'error'); return; }
  showLoad('Guardando nota...');
  try {
    await sb.insert('incident_updates', { incident_id: incidentId, user_id: currentUser.id, user_name: currentUser.name, note: text });
    toast('Nota añadida');
    await viewIncident(incidentId);
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}

function startEditUpdate(updateId) {
  const textEl = document.getElementById(`upd-text-${updateId}`);
  if (!textEl) return;
  const current = textEl.textContent;
  textEl.innerHTML = `
    <textarea class="form-control" id="upd-edit-${updateId}" style="min-height:60px;margin-bottom:6px" maxlength="2000">${escapeHtml(current)}</textarea>
    <div style="display:flex;gap:6px">
      <button class="btn btn-primary btn-sm" onclick="saveEditUpdate(${updateId})">Guardar</button>
      <button class="btn btn-secondary btn-sm" onclick="cancelEditUpdate(${updateId},'${current.replace(/'/g,"\\'").replace(/\n/g,'\\n')}')">Cancelar</button>
    </div>`;
  document.getElementById(`upd-edit-${updateId}`)?.focus();
}

function cancelEditUpdate(updateId, original) {
  const textEl = document.getElementById(`upd-text-${updateId}`);
  if (textEl) textEl.innerHTML = escapeHtml(original.replace(/\\n/g, '\n'));
}

async function saveEditUpdate(updateId) {
  if (!isAdmin()) { toast('Solo los administradores pueden modificar anotaciones', 'error'); return; }
  const textarea = document.getElementById(`upd-edit-${updateId}`);
  if (!textarea) return;
  const text = textarea.value.trim();
  if (!text) { toast('La anotación no puede estar vacía', 'error'); return; }
  showLoad('Guardando...');
  try {
    await sb.update('incident_updates', updateId, { note: text });
    toast('Anotación actualizada');
    await viewIncident(window._viewingIncidentId);
  } catch (e) { toast('Error al guardar: ' + e.message, 'error'); }
  hideLoad();
}

async function deleteUpdate(updateId, incidentId) {
  if (!isAdmin()) { toast('Solo los administradores pueden eliminar anotaciones', 'error'); return; }
  if (!confirm('¿Eliminar esta anotación? Esta acción no se puede deshacer.')) return;
  showLoad('Eliminando...');
  try {
    await sb.delete('incident_updates', updateId);
    toast('Anotación eliminada');
    await viewIncident(incidentId);
  } catch (e) { toast('Error al eliminar: ' + e.message, 'error'); }
  hideLoad();
}

async function setStatus(status) {
  const id = window._viewingIncidentId;
  if (!id) return;
  showLoad();
  try {
    const oldInc = allIncidents.find(i => i.id === id) || {};
    await sb.update('incidents', id, { status, updated_at: new Date().toISOString() });
    try { await sb.insert('incident_logs', { incident_id: id, user_id: currentUser.id, user_name: currentUser.name, action: 'MODIFICAR', incident_data: { status }, previous_data: { status: oldInc.status } }); } catch(e) { console.warn(e); }
    toast('Estado actualizado');
    closeModal('m-detail');
    allIncidents = [];
    await loadIncidents();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}
