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
// INIT
// ================================================================
(async () => {
  const loginScreen = document.getElementById('login-screen');
  loginScreen.style.visibility = 'hidden';
  showLoad('Iniciando aplicación...');

  try { await loadConfig(); } catch (e) { console.warn('Init config load failed:', e); }

  const savedToken = sessionStorage.getItem('sb_access_token');
  const savedUser = sessionStorage.getItem('sb_user');
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
