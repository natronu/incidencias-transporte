// ================================================================
// AUTH.JS — autenticación y sesión
// ================================================================

// ================================================================
// PASSWORD HASHING — SHA-256 via Web Crypto API (nativa)
// ================================================================
async function hashPassword(plain) {
  const encoder = new TextEncoder();
  // Add a fixed application salt so identical passwords don't produce
  // identical hashes across different apps
  const salted = 'translog_v1::' + plain;
  const data = encoder.encode(salted);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function doLogin() {
  const user = document.getElementById('l-user').value.trim();
  const pass = document.getElementById('l-pass').value;
  const alertEl = document.getElementById('login-alert');
  if (!user || !pass) { showAlert(alertEl, 'Completa todos los campos'); return; }
  showLoad('Autenticando...');
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
      body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();
    if (!res.ok) {
      showAlert(alertEl, data.error || 'Usuario o contraseña incorrectos');
      hideLoad(); return;
    }
    sessionStorage.setItem('sb_access_token', data.access_token);
    sessionStorage.setItem('sb_user', JSON.stringify(data.user));
    currentUser = data.user;
    alertEl.textContent = '';
    _activateApp();
  } catch (e) { showAlert(alertEl, 'Error al autenticar. Inténtalo de nuevo.'); hideLoad(); }
}

function _activateApp() {
  applyConfig();

  // Restablecer visibilidad antes de aplicar restricciones del nuevo rol
  document.querySelectorAll('.admin-only, .admin-action, .write-action').forEach(el => el.style.display = '');

  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';
  document.getElementById('s-name').textContent = currentUser.name;
  const roleLabels = { admin: 'Administrador', editor: 'Editor', user: 'Usuario' };
  document.getElementById('s-role').textContent = roleLabels[currentUser.role] || currentUser.role;
  document.getElementById('s-avatar').textContent = currentUser.name[0].toUpperCase();
  if (!isAdmin()) {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.admin-action').forEach(el => el.style.display = 'none');
    if (isEditor()) {
      document.querySelectorAll('.editor-visible').forEach(el => el.style.display = '');
      document.querySelectorAll('.write-action').forEach(el => el.style.display = '');
    } else {
      document.querySelectorAll('.write-action').forEach(el => el.style.display = 'none');
    }
  }
  navTo('dashboard', document.querySelector('.nav-item'));
  hideLoad();
}

function isAdmin() { return currentUser && currentUser.role === 'admin'; }
function isEditor() { return currentUser && currentUser.role === 'editor'; }
function canEdit() { return currentUser && (currentUser.role === 'admin' || currentUser.role === 'editor'); }

function doLogout() {
  currentUser = null;
  sessionStorage.removeItem('sb_access_token');
  sessionStorage.removeItem('sb_user');
  const ls = document.getElementById('login-screen');
  ls.style.display = 'flex';
  ls.style.visibility = 'visible';
  document.getElementById('app-screen').style.display = 'none';
  document.getElementById('l-user').value = '';
  document.getElementById('l-pass').value = '';
}

function openChangePasswordModal() {
  ['cp-current', 'cp-new', 'cp-confirm'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('m-change-pass-alert').innerHTML = '';
  openModal('m-change-pass');
}

async function submitChangePassword() {
  const alertEl = document.getElementById('m-change-pass-alert');
  const currentPass = document.getElementById('cp-current').value;
  const newPass = document.getElementById('cp-new').value;
  const confirmPass = document.getElementById('cp-confirm').value;
  if (!currentPass || !newPass || !confirmPass) { showAlert(alertEl, 'Completa todos los campos'); return; }
  if (newPass.length < 8) { showAlert(alertEl, 'La nueva contraseña debe tener al menos 8 caracteres'); return; }
  if (newPass !== confirmPass) { showAlert(alertEl, 'Las contraseñas nuevas no coinciden'); return; }
  showLoad('Cambiando contraseña...');
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${getAuthToken()}` },
      body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
    });
    const data = await res.json();
    if (!res.ok) { showAlert(alertEl, data.error || 'Error al cambiar la contraseña'); hideLoad(); return; }
    closeModal('m-change-pass');
    toast('Contraseña actualizada correctamente');
  } catch (e) { showAlert(alertEl, 'Error al cambiar la contraseña. Inténtalo de nuevo.'); }
  hideLoad();
}
