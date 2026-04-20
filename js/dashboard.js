// ================================================================
// DASHBOARD.JS — dashboard
// ================================================================

function mountDashboardPage(container) {
  const el = document.createElement('div');
  el.innerHTML = `<div id="page-dashboard" class="page active">
            <div class="stats-grid">
              <div class="stat-card blue">
                <div class="stat-icon">⚠️</div>
                <div class="stat-label">Incidencias abiertas</div>
                <div class="stat-value" id="d-open">—</div>
                <div class="stat-desc">Pendientes de resolución</div>
              </div>
              <div class="stat-card amber">
                <div class="stat-icon">🔄</div>
                <div class="stat-label">En progreso</div>
                <div class="stat-value" id="d-prog">—</div>
                <div class="stat-desc">Siendo gestionadas</div>
              </div>
              <div class="stat-card green">
                <div class="stat-icon">✅</div>
                <div class="stat-label">Cerradas</div>
                <div class="stat-value" id="d-closed">—</div>
                <div class="stat-desc">Resueltas con éxito</div>
              </div>
              <div class="stat-card red">
                <div class="stat-icon">🏢</div>
                <div class="stat-label">Total agencias</div>
                <div class="stat-value" id="d-agencies">—</div>
                <div class="stat-desc">Transportistas activos</div>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <span class="card-title">Últimas incidencias registradas</span>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Agencia</th>
                      <th>Albarán</th>
                      <th>Motivo</th>
                      <th>Estado</th>
                      <th>F. Recogida</th>
                      <th>F. Entrega</th>
                      <th>F. Incidencia</th>
                    </tr>
                  </thead>
                  <tbody id="dash-tbody"></tbody>
                </table>
              </div>
            </div>
          </div>`;
  container.appendChild(el.firstElementChild);
}

async function loadDashboard() {
  showLoad();
  try {
    const [inc, ag] = await Promise.all([
      sb.query('incidents', '?select=status'),
      sb.query('agencies', '?select=id&active=eq.true')
    ]);
    const open = inc.filter(i => i.status === 'open').length;
    const prog = inc.filter(i => i.status === 'in_progress').length;
    const closed = inc.filter(i => i.status === 'closed').length;
    document.getElementById('d-open').textContent = open;
    document.getElementById('d-prog').textContent = prog;
    document.getElementById('d-closed').textContent = closed;
    document.getElementById('d-agencies').textContent = ag.length;
    document.getElementById('badge-open').textContent = open + prog;

    const recent = await sb.query('incidents', '?select=incident_code,albaran,status,shipment_date,reception_date,incident_date,agency_id,incident_type_id,agencies(name),incident_types(name)&order=created_at.desc&limit=8');
    const tbody = document.getElementById('dash-tbody');
    tbody.innerHTML = recent.length ? recent.map(i => `<tr>
      <td>${escapeHtml(i.agencies?.name)}</td>
      <td>${escapeHtml(i.albaran)}</td>
      <td>${escapeHtml(i.incident_types?.name)}</td>
      <td>${statusBadge(i.status)}</td>
      <td>${fmtDate(i.shipment_date)}</td>
      <td>${fmtDate(i.reception_date)}</td>
      <td>${fmtDate(i.incident_date)}</td>
    </tr>`).join('') : `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📋</div><p>Sin incidencias recientes</p></div></td></tr>`;
  } catch (e) { toast('Error cargando dashboard: ' + e.message, 'error'); }
  hideLoad();
}
