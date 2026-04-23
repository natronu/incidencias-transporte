// ================================================================
// CATALOGS.JS — agencias, tipos, zonas, envíos, comerciales
// ================================================================


// ================================================================
// AGENCIES
// ================================================================
async function loadAgencies() {
  showLoad();
  try {
    const [ag, inc] = await Promise.all([
      sb.query('agencies', '?order=name'),
      sb.query('incidents', '?select=agency_id')
    ]);
    allAgencies = ag;
    const incCounts = {};
    inc.forEach(i => { incCounts[i.agency_id] = (incCounts[i.agency_id] || 0) + 1; });
    const tbody = document.getElementById('ag-tbody');
    const q = (document.getElementById('ag-search')?.value || '').toLowerCase();
    const filtered = ag.filter(a => !q || a.name.toLowerCase().includes(q));
    tbody.innerHTML = filtered.length ? filtered.map(a => `<tr>
      <td><strong>${escapeHtml(a.name)}</strong></td>
      <td>${escapeHtml(a.contact_name)}</td>
      <td><a href="mailto:${escapeHtml(a.email)}" style="color:var(--brand)">${escapeHtml(a.email)}</a></td>
      <td>${escapeHtml(a.phone)}</td>
      <td><span class="badge ${(incCounts[a.id] || 0) > 0 ? 'badge-in_progress' : 'badge-closed'}">${incCounts[a.id] || 0}</span></td>
      <td><div style="display:flex;gap:4px">
        ${isAdmin() ? `<button class="btn btn-secondary btn-sm" onclick="openAgencyModal(${a.id})">✏️</button>
        <button class="btn btn-danger btn-sm js-delete" data-table="agencies" data-id="${a.id}" data-label="la agencia ${escapeHtml(a.name)}">🗑️</button>` : '<span style="font-size:11px;color:var(--text3)">Solo lectura</span>'}
      </div></td>
    </tr>`).join('') : `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🏢</div><div class="empty-title">Sin agencias</div></div></td></tr>`;
    tbody.querySelectorAll('.js-delete').forEach(b => b.addEventListener('click', () => confirmDelete(b.dataset.table, b.dataset.id, b.dataset.label)));
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}
function renderAgencies() { loadAgencies(); }

function openAgencyModal(id = null) {
  editId.agency = id;
  document.getElementById('m-agency-title').textContent = id ? 'Editar agencia' : 'Alta de agencia';
  document.getElementById('m-agency-alert').innerHTML = '';
  ['a-name', 'a-contact', 'a-email', 'a-phone', 'a-notes'].forEach(f => document.getElementById(f).value = '');
  if (id) {
    const ag = allAgencies.find(a => a.id === id);
    if (ag) {
      document.getElementById('a-name').value = ag.name || '';
      document.getElementById('a-contact').value = ag.contact_name || '';
      document.getElementById('a-email').value = ag.email || '';
      document.getElementById('a-phone').value = ag.phone || '';
      document.getElementById('a-notes').value = ag.notes || '';
    }
  }
  openModal('m-agency');
}

async function saveAgency() {
  const alertEl = document.getElementById('m-agency-alert');
  const name = document.getElementById('a-name').value.trim();
  if (!name) { showAlert(alertEl, 'El nombre es obligatorio'); return; }
  showLoad('Guardando...');
  try {
    const data = { name, contact_name: document.getElementById('a-contact').value, email: document.getElementById('a-email').value, phone: document.getElementById('a-phone').value.trim() || null, notes: document.getElementById('a-notes').value, updated_at: new Date().toISOString() };
    if (editId.agency) await sb.update('agencies', editId.agency, data);
    else await sb.insert('agencies', { ...data, active: true });
    toast(editId.agency ? 'Agencia actualizada' : 'Agencia registrada');
    closeModal('m-agency');
    allAgencies = [];
    await loadAgencies();
  } catch (e) { showAlert(alertEl, 'Error al guardar. Inténtalo de nuevo.'); }
  hideLoad();
}

// ================================================================
// INCIDENT TYPES
// ================================================================
async function loadIncTypes() {
  showLoad();
  try {
    const types = await sb.query('incident_types', '?order=name');
    allIncTypes = types;
    const inc = await sb.query('incidents', '?select=incident_type_id');
    const counts = {};
    inc.forEach(i => { counts[i.incident_type_id] = (counts[i.incident_type_id] || 0) + 1; });
    document.getElementById('inct-tbody').innerHTML = types.length ? types.map(t => `<tr>
      <td><strong>${escapeHtml(t.name)}</strong></td>
      <td style="color:var(--text3)">${escapeHtml(t.description)}</td>
      <td><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:50%;background:${t.color || '#888'};display:inline-block"></span>${escapeHtml(t.color)}</span></td>
      <td><div style="display:flex;gap:4px">
        ${isAdmin() ? `<button class="btn btn-secondary btn-sm" onclick="openIncTypeModal(${t.id})">✏️</button>
        <button class="btn btn-danger btn-sm js-delete" data-table="incident_types" data-id="${t.id}" data-label="el tipo ${escapeHtml(t.name)}">🗑️</button>` : '<span style="font-size:11px;color:var(--text3)">Solo lectura</span>'}
      </div></td>
    </tr>`).join('') : `<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">🏷️</div><div class="empty-title">Sin tipos de incidencia</div></div></td></tr>`;
    document.getElementById('inct-tbody').querySelectorAll('.js-delete').forEach(b => b.addEventListener('click', () => confirmDelete(b.dataset.table, b.dataset.id, b.dataset.label)));
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}

function openIncTypeModal(id = null) {
  editId.inctype = id;
  document.getElementById('m-inctype-title').textContent = id ? 'Editar tipo' : 'Nuevo tipo de incidencia';
  document.getElementById('m-inctype-alert').innerHTML = '';
  document.getElementById('it-name').value = '';
  document.getElementById('it-desc').value = '';
  document.getElementById('it-color').value = '#1a56db';
  document.getElementById('it-color-hex').value = '#1a56db';
  if (id) {
    const t = allIncTypes.find(t => t.id === id);
    if (t) { document.getElementById('it-name').value = t.name; document.getElementById('it-desc').value = t.description || ''; document.getElementById('it-color').value = t.color || '#1a56db'; document.getElementById('it-color-hex').value = t.color || '#1a56db'; }
  }
  openModal('m-inctype');
}

async function saveIncType() {
  const alertEl = document.getElementById('m-inctype-alert');
  const name = document.getElementById('it-name').value.trim();
  if (!name) { showAlert(alertEl, 'El nombre es obligatorio'); return; }
  showLoad();
  try {
    const data = { name, description: document.getElementById('it-desc').value, color: document.getElementById('it-color').value };
    if (editId.inctype) await sb.update('incident_types', editId.inctype, data);
    else await sb.insert('incident_types', { ...data, active: true });
    toast(editId.inctype ? 'Tipo actualizado' : 'Tipo creado');
    closeModal('m-inctype');
    allIncTypes = [];
    await loadIncTypes();
  } catch (e) { showAlert(alertEl, 'Error al guardar. Inténtalo de nuevo.'); }
  hideLoad();
}

// ================================================================
// ZONES
// ================================================================
async function loadZones() {
  showLoad();
  try {
    const zones = await sb.query('geographic_zones', '?order=name');
    allZones = zones;
    const inc = await sb.query('incidents', '?select=zone_id');
    const counts = {};
    inc.forEach(i => { counts[i.zone_id] = (counts[i.zone_id] || 0) + 1; });
    document.getElementById('zone-tbody').innerHTML = zones.length ? zones.map(z => `<tr>
      <td><strong>${escapeHtml(z.name)}</strong></td>
      <td style="color:var(--text3)">${escapeHtml(z.description)}</td>
      <td><span class="badge badge-open">${counts[z.id] || 0}</span></td>
      <td><div style="display:flex;gap:4px">
        ${isAdmin() ? `<button class="btn btn-secondary btn-sm" onclick="openZoneModal(${z.id})">✏️</button>
        <button class="btn btn-danger btn-sm js-delete" data-table="geographic_zones" data-id="${z.id}" data-label="la zona ${escapeHtml(z.name)}">🗑️</button>` : '<span style="font-size:11px;color:var(--text3)">Solo lectura</span>'}
      </div></td>
    </tr>`).join('') : `<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">🗺️</div><div class="empty-title">Sin zonas</div></div></td></tr>`;
    document.getElementById('zone-tbody').querySelectorAll('.js-delete').forEach(b => b.addEventListener('click', () => confirmDelete(b.dataset.table, b.dataset.id, b.dataset.label)));
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}

function openZoneModal(id = null) {
  editId.zone = id;
  document.getElementById('m-zone-title').textContent = id ? 'Editar zona' : 'Nueva zona geográfica';
  document.getElementById('m-zone-alert').innerHTML = '';
  document.getElementById('z-name').value = '';
  document.getElementById('z-desc').value = '';
  if (id) {
    const z = allZones.find(z => z.id === id);
    if (z) { document.getElementById('z-name').value = z.name; document.getElementById('z-desc').value = z.description || ''; }
  }
  openModal('m-zone');
}

async function saveZone() {
  const alertEl = document.getElementById('m-zone-alert');
  const name = document.getElementById('z-name').value.trim();
  if (!name) { showAlert(alertEl, 'El nombre es obligatorio'); return; }
  showLoad();
  try {
    const data = { name, description: document.getElementById('z-desc').value };
    if (editId.zone) await sb.update('geographic_zones', editId.zone, data);
    else await sb.insert('geographic_zones', { ...data, active: true });
    toast(editId.zone ? 'Zona actualizada' : 'Zona creada');
    closeModal('m-zone');
    allZones = [];
    await loadZones();
  } catch (e) { showAlert(alertEl, 'Error al guardar. Inténtalo de nuevo.'); }
  hideLoad();
}

// ================================================================
// SHIPMENT TYPES
// ================================================================
async function loadShipTypes() {
  showLoad();
  try {
    const types = await sb.query('shipment_types', '?order=name');
    allShipTypes = types;
    const inc = await sb.query('incidents', '?select=shipment_type_id');
    const counts = {};
    inc.forEach(i => { if (i.shipment_type_id) counts[i.shipment_type_id] = (counts[i.shipment_type_id] || 0) + 1; });
    document.getElementById('shipt-tbody').innerHTML = types.length ? types.map(t => `<tr>
      <td><strong>${escapeHtml(t.name)}</strong></td>
      <td style="color:var(--text3)">${escapeHtml(t.description)}</td>
      <td><span class="badge badge-open">${counts[t.id] || 0}</span></td>
      <td><div style="display:flex;gap:4px">
        ${isAdmin() ? `<button class="btn btn-secondary btn-sm" onclick="openShipTypeModal(${t.id})">✏️</button>
        <button class="btn btn-danger btn-sm js-delete" data-table="shipment_types" data-id="${t.id}" data-label="el tipo de envío ${escapeHtml(t.name)}">🗑️</button>` : '<span style="font-size:11px;color:var(--text3)">Solo lectura</span>'}
      </div></td>
    </tr>`).join('') : `<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">Sin tipos de envío</div></div></td></tr>`;
    document.getElementById('shipt-tbody').querySelectorAll('.js-delete').forEach(b => b.addEventListener('click', () => confirmDelete(b.dataset.table, b.dataset.id, b.dataset.label)));
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}

async function loadShipTypeSelect() {
  const sel = document.getElementById('i-shiptype');
  if (allShipTypes.length === 0) allShipTypes = await sb.query('shipment_types', '?select=id,name&active=eq.true&order=name');
  sel.innerHTML = '<option value="">Seleccionar...</option>' + allShipTypes.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
}

function openShipTypeModal(id = null) {
  editId.shiptype = id;
  document.getElementById('m-shiptype-title').textContent = id ? 'Editar tipo de envío' : 'Nuevo tipo de envío';
  document.getElementById('m-shiptype-alert').innerHTML = '';
  document.getElementById('st-name').value = '';
  document.getElementById('st-desc').value = '';
  if (id) {
    const t = allShipTypes.find(t => t.id === id);
    if (t) { document.getElementById('st-name').value = t.name; document.getElementById('st-desc').value = t.description || ''; }
  }
  openModal('m-shiptype');
}

async function saveShipType() {
  const alertEl = document.getElementById('m-shiptype-alert');
  const name = document.getElementById('st-name').value.trim();
  if (!name) { showAlert(alertEl, 'El nombre es obligatorio'); return; }
  showLoad();
  try {
    const data = { name, description: document.getElementById('st-desc').value.trim() };
    if (editId.shiptype) await sb.update('shipment_types', editId.shiptype, data);
    else await sb.insert('shipment_types', { ...data, active: true });
    toast(editId.shiptype ? 'Tipo de envío actualizado' : 'Tipo de envío creado');
    closeModal('m-shiptype');
    allShipTypes = [];
    await loadShipTypes();
  } catch (e) { showAlert(alertEl, 'Error al guardar. Inténtalo de nuevo.'); }
  hideLoad();
}

// ================================================================
// COMERCIALES
// ================================================================
async function loadComerciales() {
  showLoad();
  try {
    const [coms, rfps, czones] = await Promise.all([
      sb.query('comerciales', '?select=*&order=name'),
      sb.query('rfp_requests', '?select=comercial_id'),
      sb.query('comerciales_zonas', '?select=comercial_id,geographic_zones(id,name)'),
    ]);
    // Build zones map: comercial_id → [zone names]
    const zonesMap = {};
    czones.forEach(cz => {
      if (!zonesMap[cz.comercial_id]) zonesMap[cz.comercial_id] = [];
      if (cz.geographic_zones) zonesMap[cz.comercial_id].push(cz.geographic_zones.name);
    });
    allComerciales = coms.map(c => ({ ...c, zone_names: zonesMap[c.id] || [] }));
    const counts = {};
    rfps.forEach(r => { if (r.comercial_id) counts[r.comercial_id] = (counts[r.comercial_id] || 0) + 1; });
    document.getElementById('comerciales-tbody').innerHTML = coms.length ? allComerciales.map(c => `<tr>
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td><a href="mailto:${escapeHtml(c.email)}" style="color:var(--brand)">${escapeHtml(c.email)}</a></td>
      <td>${c.zone_names.length ? c.zone_names.map(z => `<span class="chip">${escapeHtml(z)}</span>`).join(' ') : '—'}</td>
      <td><span class="badge badge-open">${counts[c.id] || 0}</span></td>
      <td><div style="display:flex;gap:4px">
        ${isAdmin() ? `<button class="btn btn-secondary btn-sm" onclick="openComercialModal(${c.id})">✏️</button>
        <button class="btn btn-danger btn-sm js-delete" data-table="comerciales" data-id="${c.id}" data-label="el comercial ${escapeHtml(c.name)}">🗑️</button>`
            : '<span style="font-size:11px;color:var(--text3)">Solo lectura</span>'}
      </div></td>
    </tr>`).join('') : `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">👤</div><div class="empty-title">Sin comerciales registrados</div></div></td></tr>`;
    document.getElementById('comerciales-tbody').querySelectorAll('.js-delete').forEach(b => b.addEventListener('click', () => confirmDelete(b.dataset.table, b.dataset.id, b.dataset.label)));
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}

async function openComercialModal(id = null) {
  editId.comercial = id;
  document.getElementById('m-comercial-title').textContent = id ? 'Editar comercial' : 'Nuevo comercial';
  document.getElementById('m-comercial-alert').innerHTML = '';

  // Load zones
  if (allZones.length === 0) allZones = await sb.query('geographic_zones', '?select=id,name&active=eq.true&order=name');

  // Get currently assigned zones if editing
  let assignedZoneIds = [];
  if (id) {
    const czones = await sb.query('comerciales_zonas', `?comercial_id=eq.${id}&select=zone_id`);
    assignedZoneIds = czones.map(cz => cz.zone_id);
  }

  // Render checkbox pill picker
  const wrap = document.getElementById('com-zones-wrap');
  wrap.innerHTML = allZones.map(z => {
    const checked = assignedZoneIds.includes(z.id);
    return `<label class="zone-check-label${checked ? ' checked' : ''}" onclick="toggleZoneCheck(this)">
      <input type="checkbox" value="${z.id}" ${checked ? 'checked' : ''} />
      ${escapeHtml(z.name)}
    </label>`;
  }).join('');

  ['com-name', 'com-email'].forEach(f => document.getElementById(f).value = '');
  if (id) {
    const c = allComerciales.find(c => c.id === id);
    if (c) {
      document.getElementById('com-name').value = c.name || '';
      document.getElementById('com-email').value = c.email || '';
    }
  }
  openModal('m-comercial');
}

function toggleZoneCheck(label) {
  const cb = label.querySelector('input[type="checkbox"]');
  cb.checked = !cb.checked;
  label.classList.toggle('checked', cb.checked);
}

async function saveComercial() {
  const alertEl = document.getElementById('m-comercial-alert');
  const name = document.getElementById('com-name').value.trim();
  const email = document.getElementById('com-email').value.trim() || null;

  // Collect selected zone IDs from checkboxes
  const selectedZoneIds = Array.from(
    document.querySelectorAll('#com-zones-wrap input[type="checkbox"]:checked')
  ).map(cb => parseInt(cb.value));

  if (!name) { showAlert(alertEl, 'El nombre es obligatorio'); return; }
  if (selectedZoneIds.length === 0) { showAlert(alertEl, 'Selecciona al menos una zona geográfica'); return; }

  showLoad();
  try {
    let comercialId = editId.comercial;

    if (comercialId) {
      // Update base data
      await sb.update('comerciales', comercialId, { name, email });
      // Delete existing zone assignments and reinsert
      await fetch(`${SUPABASE_URL}/rest/v1/comerciales_zonas?comercial_id=eq.${comercialId}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${getAuthToken()}` }
      });
    } else {
      // Insert new comercial
      const result = await sb.insert('comerciales', { name, email, active: true });
      comercialId = result[0].id;
    }

    // Insert zone assignments
    const zoneRows = selectedZoneIds.map(zid => ({ comercial_id: comercialId, zone_id: zid }));
    await sb.insert('comerciales_zonas', zoneRows);

    toast(editId.comercial ? 'Comercial actualizado' : 'Comercial registrado');
    closeModal('m-comercial');
    allComerciales = [];
    await loadComerciales();
  } catch (e) { showAlert(alertEl, 'Error al guardar. Inténtalo de nuevo.'); }
  hideLoad();
}
