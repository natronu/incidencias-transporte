// ================================================================
// UI.JS — helpers de interfaz compartidos
// ================================================================

// ================================================================
// LOADING & TOAST
// ================================================================
function showLoad(msg = 'Cargando...') { document.getElementById('loading-text').textContent = msg; document.getElementById('loading').classList.add('show'); }
function hideLoad() { document.getElementById('loading').classList.remove('show'); }
function escapeHtml(v) {
  if (v == null) return '—';
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function showAlert(el, msg, type = 'error') {
  el.textContent = '';
  const d = document.createElement('div');
  d.className = `alert alert-${type}`;
  d.textContent = msg;
  el.appendChild(d);
}

function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = document.createElement('span');
  icon.textContent = type === 'success' ? '✓' : '✕';
  t.appendChild(icon);
  t.appendChild(document.createTextNode(String(msg)));
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ================================================================
// HELPERS
// ================================================================
function statusBadge(s) {
  const map = {
    open: ['badge-open', 'Abierta'],
    in_progress: ['badge-in_progress', 'En progreso'],
    closed: ['badge-closed', 'Cerrada'],
    deleted: ['badge-deleted', 'Eliminada']
  };
  const [cls, label] = map[s] || ['badge-open', s];
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
}
function statusLabel(s) {
  return { open: 'Abierta', in_progress: 'En progreso', closed: 'Cerrada', deleted: 'Eliminada' }[s] || s;
}
function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return d; }
}
function fmtDateTime(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
}

function df(label, value) {
  return `<div class="detail-field"><div class="detail-label">${label}</div><div class="detail-value">${value}</div></div>`;
}

function shadeColor(color, percent) {
  if (!color || !color.startsWith('#')) return color;
  let r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
  r = Math.max(0, Math.min(255, r + percent)); g = Math.max(0, Math.min(255, g + percent)); b = Math.max(0, Math.min(255, b + percent));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ================================================================
// NAVIGATION
// ================================================================
const PAGE_TITLES = { dashboard: 'Dashboard', incidents: 'Incidencias', rfp: 'RFP — Recogidas fuera de plaza', agencies: 'Agencias y transportistas', 'inc-types': 'Tipos de incidencia', zones: 'Zonas geográficas', 'ship-types': 'Tipos de envío', comerciales: 'Gestión de comerciales', users: 'Gestión de usuarios', config: 'Configuración', log: 'Auditoría (Log)' };

function navTo(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('topbar-title').textContent = PAGE_TITLES[name] || name;
  const loaders = { dashboard: loadDashboard, incidents: loadIncidents, rfp: loadRFP, agencies: loadAgencies, 'inc-types': loadIncTypes, zones: loadZones, 'ship-types': loadShipTypes, comerciales: loadComerciales, users: loadUsers, config: loadConfigForm, log: loadLogs };
  if (loaders[name]) loaders[name]();
}

// ================================================================
// MODAL HELPERS
// ================================================================
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// ================================================================
// DELETE CONFIRM
// ================================================================
function confirmDelete(table, id, label) {
  document.getElementById('m-confirm-msg').textContent = `¿Deseas eliminar ${label}? Esta acción no se puede deshacer.`;
  document.getElementById('m-confirm-btn').onclick = async () => {
    showLoad('Eliminando...');
    closeModal('m-confirm');
    try {
      if (table === 'incidents') {
        const incToDel = allIncidents.find(i => i.id == id);
        if (incToDel) {
          try {
            await sb.insert('incident_logs', { incident_id: id, user_id: currentUser.id, user_name: currentUser.name, action: 'ELIMINAR', incident_data: null, previous_data: incToDel });
          } catch (e) { console.warn('No se pudo guardar log de eliminación', e); }
        }
        await sb.update('incidents', id, { status: 'deleted', updated_at: new Date().toISOString() });
      } else {
        await sb.delete(table, id);
      }
      toast('Registro eliminado');
      const reloaders = { incidents: loadIncidents, rfp_requests: loadRFP, agencies: loadAgencies, incident_types: loadIncTypes, geographic_zones: loadZones, shipment_types: loadShipTypes, comerciales: loadComerciales, app_users: loadUsers };
      if (reloaders[table]) { if (table === 'incidents') { allIncidents = []; } await reloaders[table](); }
    } catch (e) { toast('Error al eliminar: ' + e.message, 'error'); }
    hideLoad();
  };
  openModal('m-confirm');
}
