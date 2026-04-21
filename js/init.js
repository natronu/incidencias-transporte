// ================================================================
// INIT.JS — variables de estado globales + IIFE de arranque
// ================================================================

// ================================================================
// STATE
// ================================================================
let currentUser = null;
let appConfig = { company_name: 'TransLog', primary_color: '#1a56db', items_per_page: 10, logo_url: '' };
let allIncidents = [], filteredIncidents = [];
let allAgencies = [], allIncTypes = [], allZones = [], allShipTypes = [];
let incPage = 1;
let sortField = 'incident_date', sortDir = 'desc';
let editId = { incident: null, agency: null, inctype: null, zone: null, user: null, shiptype: null, rfp: null, comercial: null };
let allRFPs = [], filteredRFPs = [], allComerciales = [];
let rfpPage = 1, rfpSortField = 'pickup_date', rfpSortDir = 'desc';

// ================================================================
// LOGIN KEYBOARD SHORTCUT
// ================================================================
document.getElementById('l-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

// ================================================================
// VIEW LOADER
// ================================================================
async function loadView(url, container) {
  const html = await fetch(url).then(r => {
    if (!r.ok) throw new Error(`No se pudo cargar la vista: ${url}`);
    return r.text();
  });
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  while (tmp.firstElementChild) container.appendChild(tmp.firstElementChild);
}

async function mountAllViews() {
  const pages  = document.getElementById('pages-container');
  const modals = document.getElementById('modals-container');

  await Promise.all([
    // Páginas
    loadView('views/page-dashboard.html',   pages),
    loadView('views/page-incidents.html',   pages),
    loadView('views/page-rfp.html',         pages),
    loadView('views/page-agencies.html',    pages),
    loadView('views/page-inc-types.html',   pages),
    loadView('views/page-zones.html',       pages),
    loadView('views/page-ship-types.html',  pages),
    loadView('views/page-comerciales.html', pages),
    loadView('views/page-users.html',       pages),
    loadView('views/page-config.html',      pages),
    // Modales
    loadView('views/modal-incident.html',    modals),
    loadView('views/modal-rfp.html',         modals),
    loadView('views/modal-catalogs.html',    modals),
    loadView('views/modal-user.html',        modals),
    loadView('views/modal-change-pass.html', modals),
    loadView('views/modal-confirm.html',     modals),
  ]);

  // Registrar cierre de modales al hacer clic fuera
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
}

// ================================================================
// INIT
// ================================================================
(async () => {
  const loginScreen = document.getElementById('login-screen');
  loginScreen.style.visibility = 'hidden';
  showLoad('Iniciando aplicación...');

  try { await mountAllViews(); } catch (e) {
    console.error('Error cargando vistas:', e);
    toast('Error al cargar la interfaz. Recarga la página.', 'error');
    hideLoad();
    loginScreen.style.visibility = 'visible';
    return;
  }

  try { await loadConfig(); } catch (e) { console.warn('Init config load failed:', e); }

  const savedToken = sessionStorage.getItem('sb_access_token');
  const savedUser  = sessionStorage.getItem('sb_user');
  if (savedToken && savedUser) {
    try {
      const payload = JSON.parse(atob(savedToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.exp || (Date.now() / 1000) < payload.exp) {
        currentUser = JSON.parse(savedUser);
        try { await loadConfig(); } catch (e) { console.warn('Post-auth config reload failed:', e); }
        _activateApp();
        return;
      }
    } catch (e) { console.warn('Session restore failed:', e); }
    sessionStorage.removeItem('sb_access_token');
    sessionStorage.removeItem('sb_user');
  }

  hideLoad();
  loginScreen.style.visibility = 'visible';
})();
