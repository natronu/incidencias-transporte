// ================================================================
// USERS.JS — gestión de usuarios y cambio de contraseña
// ================================================================

function mountUsersPage(container) {
  const el = document.createElement('div');
  el.innerHTML = `<div id="page-users" class="page">
            <div class="card">
              <div class="card-header">
                <span class="card-title">Gestión de usuarios</span>
                <button class="btn btn-primary btn-sm" onclick="openUserModal()">+ Nuevo usuario</button>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Creado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody id="usr-tbody"></tbody>
                </table>
              </div>
            </div>
          </div>`;
  container.appendChild(el.firstElementChild);
}

function mountUserModal(container) {
  const el = document.createElement('div');
  el.innerHTML = `<div class="modal-overlay" id="m-user">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title" id="m-user-title">Alta de usuario</span>
        <button class="modal-close" onclick="closeModal('m-user')">✕</button>
      </div>
      <div id="m-user-alert"></div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nombre completo *</label>
          <input type="text" class="form-control" id="u-name" placeholder="Ana García" maxlength="100" />
        </div>
        <div class="form-group">
          <label class="form-label">Usuario *</label>
          <input type="text" class="form-control" id="u-username" placeholder="ana.garcia" maxlength="50" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input type="email" class="form-control" id="u-email" placeholder="ana@empresa.com" maxlength="100" />
        </div>
        <div class="form-group">
          <label class="form-label">Rol *</label>
          <select class="form-control" id="u-role">
            <option value="user">Usuario</option>
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>
      <div id="u-pass-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"
          id="u-pass-header">
          <span style="font-size:13px;font-weight:500;color:var(--text2)" id="u-pass-label">Contraseña *</span>
          <label id="u-pass-toggle"
            style="display:none;align-items:center;gap:6px;font-size:12.5px;color:var(--text3);cursor:pointer">
            <input type="checkbox" id="u-change-pass" onchange="togglePassFields(this.checked)"
              style="cursor:pointer" />
            Cambiar contraseña
          </label>
        </div>
        <div id="u-pass-fields" class="form-row">
          <div class="form-group">
            <label class="form-label" id="u-pass1-label">Nueva contraseña</label>
            <input type="password" class="form-control" id="u-pass" placeholder="••••••••" maxlength="100" />
          </div>
          <div class="form-group">
            <label class="form-label">Confirmar contraseña</label>
            <input type="password" class="form-control" id="u-pass2" placeholder="••••••••" maxlength="100" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('m-user')">Cancelar</button>
        <button class="btn btn-primary" id="u-save-btn" onclick="saveUser()">Crear usuario</button>
      </div>
    </div>
  </div>`;
  container.appendChild(el.firstElementChild);
}

// Cache all users for edit lookup
let allUsers = [];

async function loadUsers() {
  showLoad();
  try {
    const users = await sb.query('app_users', '?order=created_at.desc');
    allUsers = users;
    document.getElementById('usr-tbody').innerHTML = users.length ? users.map(u => `<tr>
      <td>${escapeHtml(u.name)}</td>
      <td><span class="text-mono" style="color:var(--brand)">${escapeHtml(u.username)}</span></td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="badge ${u.role === 'admin' ? 'badge-admin' : u.role === 'editor' ? 'badge-editor' : 'badge-user'}">${u.role === 'admin' ? 'Administrador' : u.role === 'editor' ? 'Editor' : 'Usuario'}</span></td>
      <td>${fmtDate(u.created_at)}</td>
      <td>
        <div style="display:flex;gap:4px;align-items:center">
          ${isAdmin() ? `<button class="btn btn-secondary btn-sm" onclick="openEditUserModal(${u.id})">✏️ Editar</button>
          ${u.id !== currentUser.id
            ? `<button class="btn btn-danger btn-sm js-delete" data-table="app_users" data-id="${u.id}" data-label="el usuario ${escapeHtml(u.name)}">🗑️</button>`
            : '<span style="color:var(--text3);font-size:12px">— tú —</span>'}` : '<span style="font-size:11px;color:var(--text3)">Solo lectura</span>'}
        </div>
      </td>
    </tr>`).join('') : `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">Sin usuarios</div></div></td></tr>`;
    document.getElementById('usr-tbody').querySelectorAll('.js-delete').forEach(b => b.addEventListener('click', () => confirmDelete(b.dataset.table, b.dataset.id, b.dataset.label)));
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  hideLoad();
}

function togglePassFields(checked) {
  const fields = document.getElementById('u-pass-fields');
  fields.style.display = checked ? 'grid' : 'none';
  if (!checked) {
    document.getElementById('u-pass').value = '';
    document.getElementById('u-pass2').value = '';
  }
}

function openUserModal() {
  editId.user = null;
  document.getElementById('m-user-title').textContent = 'Alta de usuario';
  document.getElementById('m-user-alert').innerHTML = '';
  document.getElementById('u-save-btn').textContent = 'Crear usuario';

  // Reset fields
  ['u-name', 'u-username', 'u-email', 'u-pass', 'u-pass2'].forEach(f => document.getElementById(f).value = '');
  document.getElementById('u-role').value = 'user';
  document.getElementById('u-username').disabled = false;

  // Show password fields as mandatory
  document.getElementById('u-pass-toggle').style.display = 'none';
  document.getElementById('u-pass-label').textContent = 'Contraseña';
  document.getElementById('u-pass-fields').style.display = 'grid';
  document.getElementById('u-change-pass').checked = false;

  openModal('m-user');
}

function openEditUserModal(id) {
  const user = allUsers.find(u => u.id === id);
  if (!user) return;

  editId.user = id;
  document.getElementById('m-user-title').textContent = 'Editar usuario';
  document.getElementById('m-user-alert').innerHTML = '';
  document.getElementById('u-save-btn').textContent = 'Guardar cambios';

  // Fill current data
  document.getElementById('u-name').value = user.name || '';
  document.getElementById('u-username').value = user.username || '';
  document.getElementById('u-username').disabled = true; // username cannot change
  document.getElementById('u-email').value = user.email || '';
  document.getElementById('u-role').value = user.role || 'user';

  // Password section: optional in edit mode
  document.getElementById('u-pass-toggle').style.display = 'flex';
  document.getElementById('u-pass-label').textContent = 'Contraseña';
  document.getElementById('u-change-pass').checked = false;
  document.getElementById('u-pass-fields').style.display = 'none';
  document.getElementById('u-pass').value = '';
  document.getElementById('u-pass2').value = '';

  openModal('m-user');
}

async function saveUser() {
  const alertEl = document.getElementById('m-user-alert');
  const name = document.getElementById('u-name').value.trim();
  const username = document.getElementById('u-username').value.trim();
  const email = document.getElementById('u-email').value.trim() || null;
  const role = document.getElementById('u-role').value;
  const pass = document.getElementById('u-pass').value;
  const pass2 = document.getElementById('u-pass2').value;
  const isEdit = !!editId.user;
  const changingPass = isEdit ? document.getElementById('u-change-pass').checked : true;

  // Validations
  if (!name) { showAlert(alertEl, 'El nombre es obligatorio'); return; }
  if (!isEdit && !username) { showAlert(alertEl, 'El nombre de usuario es obligatorio'); return; }
  if (!isEdit && !pass) { showAlert(alertEl, 'La contraseña es obligatoria'); return; }
  if (changingPass && pass && pass !== pass2) { showAlert(alertEl, 'Las contraseñas no coinciden'); return; }
  if (changingPass && pass && pass.length < 6) { showAlert(alertEl, 'La contraseña debe tener al menos 6 caracteres'); return; }

  showLoad(isEdit ? 'Actualizando usuario...' : 'Creando usuario...');
  try {
    if (isEdit) {
      const data = { name, email, role };
      if (changingPass && pass) data.password_hash = await hashPassword(pass);
      await sb.update('app_users', editId.user, data);
      if (editId.user === currentUser.id) {
        currentUser = { ...currentUser, name, email, role };
        document.getElementById('s-name').textContent = name;
        document.getElementById('s-avatar').textContent = name[0].toUpperCase();
      }
      toast('✓ Usuario actualizado correctamente');
    } else {
      const hashed = await hashPassword(pass);
      await sb.insert('app_users', { name, username, email, password_hash: hashed, role, active: true });
      toast('✓ Usuario creado correctamente');
    }
    closeModal('m-user');
    document.getElementById('u-username').disabled = false;
    allUsers = [];
    await loadUsers();
  } catch (e) {
    showAlert(alertEl, 'Error al guardar. Inténtalo de nuevo.');
  }
  hideLoad();
}
