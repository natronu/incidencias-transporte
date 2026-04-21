// ================================================================
// RFP.JS — RFP (Recogidas fuera de plaza)
// ================================================================




async function loadRFP() {
  showLoad('Cargando RFPs...');
  try {
    const [rfps, ags, coms] = await Promise.all([
      sb.query('rfp_requests', '?select=*,agencies(name),comerciales(name),geographic_zones(name)&order=pickup_date.desc'),
      sb.query('agencies', '?select=id,name&active=eq.true&order=name'),
      sb.query('comerciales', '?select=id,name&active=eq.true&order=name'),
    ]);
    allAgencies = ags;
    allComerciales = coms;
    allRFPs = rfps.map(r => ({
      ...r,
      agency_name: r.agencies?.name || '—',
      commercial_name: r.comerciales?.name || '—',
      zone_name: r.geographic_zones?.name || '—',
      status: r.status || 'open',
    }));
    filterRFP();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}

function rfpStatusBadge(s) {
  const map = {
    open: ['badge-open', 'Abierta'],
    in_progress: ['badge-in_progress', 'En progreso'],
    finished: ['badge-closed', 'Finalizada'],
  };
  const [cls, label] = map[s] || ['badge-open', 'Abierta'];
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
}

async function setRFPStatus(status) {
  if (!editId.rfp) return;
  showLoad('Actualizando estado...');
  try {
    await sb.update('rfp_requests', editId.rfp, { status });
    toast('Estado actualizado correctamente');
    closeModal('m-rfp');
    allRFPs = [];
    await loadRFP();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}

function filterRFP() {
  const q = (document.getElementById('rfp-search')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('rfp-filter-status')?.value || '';
  filteredRFPs = allRFPs.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (!q) return true;
    return [r.commercial_name, r.order_number, r.client_name, r.agency_name, r.zone_name, r.tracking_number].join(' ').toLowerCase().includes(q);
  });
  filteredRFPs.sort((a, b) => {
    let va = a[rfpSortField] || '', vb = b[rfpSortField] || '';
    if (rfpSortDir === 'desc') [va, vb] = [vb, va];
    return String(va).localeCompare(String(vb), 'es', { numeric: true });
  });
  rfpPage = 1;
  renderRFP();
}

function sortRFP(field) {
  if (rfpSortField === field) rfpSortDir = rfpSortDir === 'asc' ? 'desc' : 'asc';
  else { rfpSortField = field; rfpSortDir = 'asc'; }
  document.querySelectorAll('#rfp-table th').forEach(th => {
    th.classList.remove('sorted');
    const icon = th.querySelector('.sort-icon');
    if (icon) icon.textContent = '↕';
  });
  event.currentTarget.classList.add('sorted');
  const icon = event.currentTarget.querySelector('.sort-icon');
  if (icon) icon.textContent = rfpSortDir === 'asc' ? '↑' : '↓';
  filterRFP();
}

function renderRFP() {
  const pp = appConfig.items_per_page || 10;
  const total = filteredRFPs.length;
  const pages = Math.max(1, Math.ceil(total / pp));
  if (rfpPage > pages) rfpPage = pages;
  const start = (rfpPage - 1) * pp;
  const slice = filteredRFPs.slice(start, start + pp);

  const tbody = document.getElementById('rfp-tbody');
  tbody.innerHTML = slice.length ? slice.map(r => `<tr>
    <td>${escapeHtml(r.commercial_name)}</td>
    <td><span class="text-mono" style="color:var(--brand)">${escapeHtml(r.order_number)}</span></td>
    <td>${escapeHtml(r.client_name)}</td>
    <td>${escapeHtml(r.agency_name)}</td>
    <td>${escapeHtml(r.zone_name)}</td>
    <td>${fmtDate(r.pickup_date)}</td>
    <td>${escapeHtml(r.tracking_number)}</td>
    <td>${rfpStatusBadge(r.status)}</td>
    <td>
      <div style="display:flex;gap:4px">
        <button class="btn btn-secondary btn-sm" onclick="viewRFP(${r.id})">Ver</button>
        ${canEdit() ? `<button class="btn btn-secondary btn-sm" onclick="openRFPModal(${r.id})">✏️</button>
        <button class="btn btn-danger btn-sm js-delete" data-table="rfp_requests" data-id="${r.id}" data-label="la RFP de ${escapeHtml(r.order_number || '')}">🗑️</button>` : ''}
      </div>
    </td>
  </tr>`).join('') : `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">🚛</div><div class="empty-title">Sin RFPs registradas</div><div class="empty-desc">Crea la primera recogida fuera de plaza</div></div></td></tr>`;
  tbody.querySelectorAll('.js-delete').forEach(b => b.addEventListener('click', () => confirmDelete(b.dataset.table, b.dataset.id, b.dataset.label)));

  document.getElementById('rfp-pag-info').textContent = total ? `Mostrando ${start + 1}–${Math.min(start + pp, total)} de ${total} RFPs` : '0 RFPs';

  const ctrl = document.getElementById('rfp-pag-controls');
  ctrl.innerHTML = '';
  const addBtn = (label, page, disabled = false, active = false) => {
    const b = document.createElement('button');
    b.className = 'page-btn' + (active ? ' active' : '');
    b.textContent = label; b.disabled = disabled;
    b.onclick = () => { rfpPage = page; renderRFP(); };
    ctrl.appendChild(b);
  };
  addBtn('«', 1, rfpPage === 1); addBtn('‹', rfpPage - 1, rfpPage === 1);
  for (let p = Math.max(1, rfpPage - 2); p <= Math.min(pages, rfpPage + 2); p++) addBtn(p, p, false, p === rfpPage);
  addBtn('›', rfpPage + 1, rfpPage === pages); addBtn('»', pages, rfpPage === pages);
}

async function openRFPModal(id = null) {
  editId.rfp = id;
  document.getElementById('m-rfp-title').textContent = id ? 'Editar RFP' : 'Nueva RFP';
  document.getElementById('m-rfp-alert').innerHTML = '';
  document.getElementById('rfp-save-btn').textContent = id ? 'Guardar cambios' : 'Guardar RFP';

  // Load selects
  if (allComerciales.length === 0) allComerciales = await sb.query('comerciales', '?select=id,name&active=eq.true&order=name');
  if (allAgencies.length === 0) allAgencies = await sb.query('agencies', '?select=id,name&active=eq.true&order=name');
  if (allZones.length === 0) allZones = await sb.query('geographic_zones', '?select=id,name&active=eq.true&order=name');

  document.getElementById('rfp-comercial').innerHTML = '<option value="">Seleccionar comercial...</option>' +
    allComerciales.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  document.getElementById('rfp-agency').innerHTML = '<option value="">Seleccionar agencia...</option>' +
    allAgencies.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');
  document.getElementById('rfp-zone').innerHTML = '<option value="">Seleccionar zona...</option>' +
    allZones.map(z => `<option value="${z.id}">${escapeHtml(z.name)}</option>`).join('');

  const btnFinish = document.getElementById('rfp-btn-finish');
  const btnProgress = document.getElementById('rfp-btn-progress');

  if (id) {
    const r = allRFPs.find(r => r.id === id);
    if (r) {
      document.getElementById('rfp-comercial').value = r.comercial_id || '';
      document.getElementById('rfp-order').value = r.order_number || '';
      document.getElementById('rfp-client').value = r.client_name || '';
      document.getElementById('rfp-agency').value = r.agency_id || '';
      document.getElementById('rfp-zone').value = r.zone_id || '';
      document.getElementById('rfp-date').value = r.pickup_date || '';
      document.getElementById('rfp-tracking').value = r.tracking_number || '';
      // Show status buttons only when editing
      btnFinish.style.display = r.status !== 'finished' ? 'inline-flex' : 'none';
      btnProgress.style.display = r.status !== 'in_progress' && r.status !== 'finished' ? 'inline-flex' : 'none';
    }
  } else {
    ['rfp-order', 'rfp-client', 'rfp-tracking'].forEach(f => document.getElementById(f).value = '');
    ['rfp-comercial', 'rfp-agency', 'rfp-zone'].forEach(f => document.getElementById(f).value = '');
    document.getElementById('rfp-date').value = new Date().toISOString().slice(0, 10);
    btnFinish.style.display = 'none';
    btnProgress.style.display = 'none';
  }
  openModal('m-rfp');
}

async function saveRFP() {
  const alertEl = document.getElementById('m-rfp-alert');
  const comercialId = parseInt(document.getElementById('rfp-comercial').value);
  const orderNumber = document.getElementById('rfp-order').value.trim();
  const clientName = document.getElementById('rfp-client').value.trim();
  const agencyId = parseInt(document.getElementById('rfp-agency').value);
  const zoneId = parseInt(document.getElementById('rfp-zone').value);
  const pickupDate = document.getElementById('rfp-date').value;
  if (!comercialId || !orderNumber || !clientName || !agencyId || !zoneId || !pickupDate) {
    showAlert(alertEl, 'Complete todos los campos obligatorios'); return;
  }
  showLoad('Guardando...');
  try {
    const data = {
      comercial_id: comercialId, order_number: orderNumber, client_name: clientName,
      agency_id: agencyId, zone_id: zoneId, pickup_date: pickupDate,
      tracking_number: document.getElementById('rfp-tracking').value.trim() || null,
    };
    if (!editId.rfp) data.status = 'open'; // new RFPs start as open
    if (editId.rfp) {
      await sb.update('rfp_requests', editId.rfp, data);
      toast('RFP actualizada');
    } else {
      await sb.insert('rfp_requests', data);
      toast('RFP registrada correctamente');
    }
    closeModal('m-rfp');
    allRFPs = [];
    await loadRFP();
  } catch (e) { showAlert(alertEl, 'Error al guardar. Inténtalo de nuevo.'); }
  hideLoad();
}

// ================================================================
// RFP DETAIL VIEW
// ================================================================
async function viewRFP(id) {
  showLoad('Cargando detalle...');
  try {
    const r = allRFPs.find(r => r.id === id) || (await sb.query('rfp_requests',
      `?id=eq.${id}&select=*,agencies(name),comerciales(name),geographic_zones(name)`))[0];
    const notes = await sb.query('rfp_notes', `?rfp_id=eq.${id}&order=created_at.asc`);

    window._viewingRFPId = id;
    window._viewingRFPStatus = r.status || 'open';

    document.getElementById('m-rfp-detail-title').textContent =
      `RFP — ${r.order_number || id}`;

    // Status buttons visibility
    const st = r.status || 'open';
    document.getElementById('rfp-detail-btn-progress').style.display =
      (st === 'in_progress' || st === 'finished') ? 'none' : 'inline-flex';
    document.getElementById('rfp-detail-btn-finish').style.display =
      st === 'finished' ? 'none' : 'inline-flex';

    document.getElementById('m-rfp-detail-body').innerHTML = `
      <div class="detail-grid" style="margin-bottom:1rem">
        ${df('Comercial', escapeHtml(r.comerciales?.name || r.commercial_name))}
        ${df('Estado', rfpStatusBadge(r.status || 'open'))}
        ${df('Nº Pedido / Albarán', `<span class="text-mono" style="color:var(--brand)">${escapeHtml(r.order_number)}</span>`)}
        ${df('Cliente', escapeHtml(r.client_name))}
        ${df('Agencia', escapeHtml(r.agencies?.name || r.agency_name))}
        ${df('Zona', escapeHtml(r.geographic_zones?.name || r.zone_name))}
        ${df('F. Solicitud recogida', fmtDate(r.pickup_date))}
        ${df('Nº Seguimiento', escapeHtml(r.tracking_number))}
      </div>
      <div class="divider"></div>
      <div style="margin-bottom:0.75rem">
        <div class="detail-label" style="margin-bottom:10px">Añadir nota / actualización</div>
        <textarea class="form-control" id="rfp-note-text" placeholder="Escribe una nota sobre esta RFP..." style="min-height:70px"></textarea>
        <button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="addRFPNote(${id})">Añadir nota</button>
      </div>
      ${notes.length ? `
      <div class="divider"></div>
      <div class="detail-label" style="margin-bottom:12px">Historial de notas</div>
      <div class="timeline">
        ${notes.map(n => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-text">${escapeHtml(n.note)}</div>
            <div class="timeline-meta">${fmtDateTime(n.created_at)} — ${escapeHtml(n.user_name)}</div>
          </div>`).join('')}
      </div>` : '<p style="font-size:13px;color:var(--text3);margin-top:0.5rem">Sin notas registradas aún.</p>'}
    `;
    openModal('m-rfp-detail');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}

async function addRFPNote(rfpId) {
  const text = document.getElementById('rfp-note-text')?.value?.trim();
  if (!text) return;
  showLoad('Guardando nota...');
  try {
    await sb.insert('rfp_notes', {
      rfp_id: rfpId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      note: text
    });
    toast('Nota añadida');
    await viewRFP(rfpId);
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}

async function setRFPStatusFromDetail(status) {
  const id = window._viewingRFPId;
  if (!id) return;
  showLoad('Actualizando estado...');
  try {
    await sb.update('rfp_requests', id, { status });
    toast('Estado actualizado');
    closeModal('m-rfp-detail');
    allRFPs = [];
    await loadRFP();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}
