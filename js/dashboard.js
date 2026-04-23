// ================================================================
// DASHBOARD.JS — dashboard
// ================================================================


async function loadDashboard() {
  showLoad();
  try {
    const [open, prog, closed, agCount] = await Promise.all([
      sb.count('incidents', '?select=*&status=eq.open'),
      sb.count('incidents', '?select=*&status=eq.in_progress'),
      sb.count('incidents', '?select=*&status=eq.closed'),
      sb.count('agencies', '?select=*&active=eq.true')
    ]);
    document.getElementById('d-open').textContent = open;
    document.getElementById('d-prog').textContent = prog;
    document.getElementById('d-closed').textContent = closed;
    document.getElementById('d-agencies').textContent = agCount;
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
