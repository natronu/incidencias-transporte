// ================================================================
// LOG.JS — Auditoría de incidencias
// ================================================================

let allLogs = [];
let filteredLogs = [];
let logPage = 1;

async function loadLogs() {
  if (!isAdmin()) return; // Solo administradores pueden cargar logs
  showLoad('Cargando registros de auditoría...');
  try {
    const tasks = [sb.query('incident_logs', '?order=created_at.desc')];
    if (allAgencies.length === 0) tasks.push(sb.query('agencies', '?select=id,name').then(r => allAgencies = r || []));
    if (allIncTypes.length === 0) tasks.push(sb.query('incident_types', '?select=id,name').then(r => allIncTypes = r || []));
    if (allZones.length === 0) tasks.push(sb.query('geographic_zones', '?select=id,name').then(r => allZones = r || []));
    if (allShipTypes.length === 0) tasks.push(sb.query('shipment_types', '?select=id,name').then(r => allShipTypes = r || []));

    const results = await Promise.all(tasks);
    allLogs = results[0] || [];
    filterLogs();
  } catch (e) {
    toast('Error al cargar logs: ' + e.message, 'error');
  }
  hideLoad();
}

function filterLogs() {
  const q = (document.getElementById('log-search')?.value || '').toLowerCase();
  const action = document.getElementById('log-filter-action')?.value;

  filteredLogs = allLogs.filter(l => {
    if (action && l.action !== action) return false;
    if (q) {
      const hay = [l.user_name, l.action].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  logPage = 1;
  renderLogs();
}

function getActionBadge(action) {
  if (action === 'CREAR') return '<span class="badge" style="background:rgba(34,197,94,0.1);color:#15803d">ALTA</span>';
  if (action === 'MODIFICAR') return '<span class="badge" style="background:rgba(245,158,11,0.1);color:#b45309">MODIFICACIÓN</span>';
  if (action === 'ELIMINAR') return '<span class="badge" style="background:rgba(239,68,68,0.1);color:#b91c1c">ELIMINACIÓN</span>';
  return `<span class="badge">${action}</span>`;
}

function renderLogs() {
  const pp = appConfig.items_per_page || 15;
  const total = filteredLogs.length;
  const pages = Math.max(1, Math.ceil(total / pp));
  if (logPage > pages) logPage = pages;
  const start = (logPage - 1) * pp;
  const slice = filteredLogs.slice(start, start + pp);

  const tbody = document.getElementById('log-tbody');
  if (!tbody) return;

  tbody.innerHTML = slice.length ? slice.map(l => {
    // Si la incidencia sigue existiendo, intentamos mostrar su código (del json), o solo el ID
    const incData = l.incident_data || {};
    const prevData = l.previous_data || {};
    const incLabel = incData.incident_code || prevData.incident_code || `ID: ${l.incident_id || 'Desconocido'}`;

    return `<tr>
      <td>${fmtDateTime(l.created_at)}</td>
      <td><span style="font-weight:500;color:var(--text)">${escapeHtml(l.user_name || 'Sistema')}</span></td>
      <td>${getActionBadge(l.action)}</td>
      <td><span class="text-mono" style="color:var(--brand)">${escapeHtml(incLabel)}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="viewLogDetail(${l.id})">Ver Diferencias</button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📝</div><div class="empty-title">Sin registros</div><div class="empty-desc">No se encontraron registros de auditoría</div></div></td></tr>`;

  // Pagination info
  const infoEl = document.getElementById('log-pag-info');
  if (infoEl) {
    infoEl.textContent = total ? `Mostrando ${start + 1}–${Math.min(start + pp, total)} de ${total} registros` : '0 registros';
  }

  // Pagination buttons
  const ctrl = document.getElementById('log-pag-controls');
  if (ctrl) {
    ctrl.innerHTML = '';
    const addBtn = (label, page, disabled = false, active = false) => {
      const b = document.createElement('button');
      b.className = 'page-btn' + (active ? ' active' : '');
      b.textContent = label;
      b.disabled = disabled;
      b.onclick = () => { logPage = page; renderLogs(); };
      ctrl.appendChild(b);
    };
    addBtn('«', 1, logPage === 1);
    addBtn('‹', logPage - 1, logPage === 1);
    const range = 2;
    for (let p = Math.max(1, logPage - range); p <= Math.min(pages, logPage + range); p++) addBtn(p, p, false, p === logPage);
    addBtn('›', logPage + 1, logPage === pages);
    addBtn('»', pages, logPage === pages);
  }
}

const FIELD_DICT = {
  incident_code: 'Código', agency_id: 'Agencia', albaran: 'Albarán', incident_type_id: 'Tipo de Incidencia',
  zone_id: 'Zona', city: 'Población', postal_code: 'C. Postal', client_name: 'Cliente', incident_date: 'F. Incidencia',
  description: 'Descripción', shipment_type_id: 'Tipo de Envío', shipment_date: 'F. Envío', reception_date: 'F. Entrega',
  status: 'Estado'
};

function formatLogValue(key, val) {
  if (val === null || val === undefined || val === '') return '<span style="color:var(--text3)">—</span>';
  if (key === 'status') return statusLabel(val); // statusLabel must exist in ui.js
  if (key.includes('date')) return fmtDate(val);
  
  if (key === 'agency_id') {
    const item = allAgencies?.find(a => a.id == val);
    if (item) return escapeHtml(item.name);
  }
  if (key === 'incident_type_id') {
    const item = allIncTypes?.find(a => a.id == val);
    if (item) return escapeHtml(item.name);
  }
  if (key === 'zone_id') {
    const item = allZones?.find(a => a.id == val);
    if (item) return escapeHtml(item.name);
  }
  if (key === 'shipment_type_id') {
    const item = allShipTypes?.find(a => a.id == val);
    if (item) return escapeHtml(item.name);
  }

  return escapeHtml(String(val));
}

function renderLogChanges(prev, current, action) {
  if (action === 'CREAR') return `<div style="color:var(--text2); font-size:13px">Se creó la incidencia con los datos iniciales.</div>`;
  if (action === 'ELIMINAR') return `<div style="color:var(--text2); font-size:13px">La incidencia fue eliminada permanentemente.</div>`;

  const allKeys = new Set([...Object.keys(prev), ...Object.keys(current)]);
  let rows = '';

  const ignoreKeys = ['id', 'created_at', 'updated_at', 'created_by', 'agency_name', 'incident_type_name', 'incident_type_color', 'zone_name', 'shipment_type_name', 'shipment_type'];

  for (let k of allKeys) {
    if (ignoreKeys.includes(k)) continue;
    
    const oldV = prev[k], newV = current[k];
    
    // Ignorar objetos anidados que vienen de los JOIN de Supabase (ej. agencies: {name: ...})
    if (typeof oldV === 'object' && oldV !== null && !Array.isArray(oldV)) continue;
    if (typeof newV === 'object' && newV !== null && !Array.isArray(newV)) continue;
    
    if (JSON.stringify(oldV) !== JSON.stringify(newV)) {
      const label = FIELD_DICT[k] || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Fallback a formato legible si no está en el dict
      rows += `
        <tr style="border-bottom:1px solid var(--border)">
          <td style="padding:8px; font-weight:500; color:var(--text); width:30%">${escapeHtml(label)}</td>
          <td style="padding:8px; color:var(--text2); width:35%; background:rgba(239,68,68,0.05)">${formatLogValue(k, oldV)}</td>
          <td style="padding:8px; color:var(--text); width:35%; background:rgba(34,197,94,0.05)">${formatLogValue(k, newV)}</td>
        </tr>`;
    }
  }

  if (!rows) return `<div style="color:var(--text3); font-size:13px; text-align:center; padding:10px">No hay cambios visibles o solo cambió información interna.</div>`;

  return `
    <table style="width:100%; border-collapse:collapse; font-size:13px">
      <thead>
        <tr style="border-bottom:1px solid var(--border); color:var(--text3); text-align:left">
          <th style="padding:8px">Dato Modificado</th>
          <th style="padding:8px">Antes</th>
          <th style="padding:8px">Después</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function viewLogDetail(id) {
  const log = allLogs.find(l => l.id === id);
  if (!log) return;

  const incData = log.incident_data || {};
  const prevData = log.previous_data || {};
  const incLabel = incData.incident_code || prevData.incident_code || `ID: ${log.incident_id || 'Desconocido'}`;

  document.getElementById('m-log-metadata').innerHTML = `
    ${df('Fecha y Hora', fmtDateTime(log.created_at))}
    ${df('Usuario', escapeHtml(log.user_name))}
    ${df('Acción', getActionBadge(log.action))}
    ${df('Incidencia', escapeHtml(incLabel))}
  `;

  document.getElementById('m-log-changes').innerHTML = renderLogChanges(prevData, incData, log.action);
  openModal('m-log-detail');
}
