// ================================================================
// DASHBOARD.JS — dashboard
// ================================================================


async function loadDashboard() {
  showLoad();
  try {
    const [inc, ag] = await Promise.all([
      sb.query('incidents', '?select=status&status=neq.deleted'),
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

    const recent = await sb.query('incidents', '?select=incident_code,albaran,status,shipment_date,reception_date,incident_date,agency_id,incident_type_id,agencies(name),incident_types(name)&status=neq.deleted&order=created_at.desc&limit=8');
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
