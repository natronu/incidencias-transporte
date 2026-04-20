// ================================================================
// USERS.JS — gestión de usuarios y cambio de contraseña
// ================================================================

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
  if (!name) {
    alertEl.innerHTML = '<div class="alert alert-error">⚠️ El nombre es obligatorio</div>'; return;
  }
  if (!isEdit && !username) {
    alertEl.innerHTML = '<div class="alert alert-error">⚠️ El nombre de usuario es obligatorio</div>'; return;
  }
  if (!isEdit && !pass) {
    alertEl.innerHTML = '<div class="alert alert-error">⚠️ La contraseña es obligatoria</div>'; return;
  }
  if (changingPass && pass && pass !== pass2) {
    alertEl.innerHTML = '<div class="alert alert-error">⚠️ Las contraseñas no coinciden</div>'; return;
  }
  if (changingPass && pass && pass.length < 6) {
    alertEl.innerHTML = '<div class="alert alert-error">⚠️ La contraseña debe tener al menos 6 caracteres</div>'; return;
  }

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
