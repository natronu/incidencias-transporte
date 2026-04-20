// ================================================================
// CONFIG.JS — configuración de la app
// ================================================================

function mountConfigPage(container) {
  const el = document.createElement('div');
  el.innerHTML = `<div id="page-config" class="page">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">

              <!-- Identidad -->
              <div class="config-card">
                <div class="config-card-title">🏢 Identidad corporativa</div>
                <div class="form-group">
                  <label class="form-label">Nombre de empresa</label>
                  <input type="text" class="form-control" id="cfg-company" placeholder="Mi Empresa S.L." maxlength="100" />
                </div>
                <div class="form-group">
                  <label class="form-label">Logotipo de la empresa</label>
                  <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
                    <div id="logo-preview-wrap"
                      style="width:64px;height:64px;border-radius:12px;background:var(--surface2);border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;transition:border-color 0.2s">
                      <span id="logo-preview-placeholder" style="font-size:26px">🏢</span>
                      <img id="logo-preview-img" src="" alt="Logo"
                        style="display:none;width:100%;height:100%;object-fit:contain;border-radius:10px" />
                    </div>
                    <div style="flex:1;min-width:180px">
                      <input type="file" id="cfg-logo-file" accept=".jpg,.jpeg,.png,.bmp,image/jpeg,image/png,image/bmp"
                        style="display:none" onchange="handleLogoFile(this)" />
                      <button type="button" class="btn btn-secondary"
                        onclick="document.getElementById('cfg-logo-file').click()" style="width:100%;margin-bottom:8px">
                        📁 Seleccionar imagen…
                      </button>
                      <div id="logo-file-name" style="font-size:12px;color:var(--text3)">Formatos: JPG, JPEG, PNG, BMP ·
                        Máx. 1 MB</div>
                      <button type="button" id="logo-clear-btn" onclick="clearLogo()"
                        style="display:none;margin-top:6px;font-size:12px;color:var(--danger);background:none;border:none;cursor:pointer;padding:0">✕
                        Eliminar logotipo</button>
                    </div>
                  </div>
                  <input type="hidden" id="cfg-logo" />
                </div>
                <div class="form-group">
                  <label class="form-label">Incidencias por página</label>
                  <select class="form-control" id="cfg-pagesize">
                    <option value="5">5 registros</option>
                    <option value="10">10 registros</option>
                    <option value="20">20 registros</option>
                    <option value="50">50 registros</option>
                    <option value="100">100 registros</option>
                  </select>
                </div>
              </div>

              <!-- Colores interfaz -->
              <div class="config-card">
                <div class="config-card-title">🎨 Colores de la interfaz</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                  <div class="form-group">
                    <label class="form-label">Color de fondo</label>
                    <div class="color-picker-wrap"><input type="color" id="cfg-bg"
                        oninput="liveColor('--bg',this.value)" /><input type="text" class="form-control" id="cfg-bg-hex"
                        style="width:90px" oninput="syncHex('cfg-bg',this.value,'--bg')" /></div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Sidebar / menú</label>
                    <div class="color-picker-wrap"><input type="color" id="cfg-sidebar"
                        oninput="liveColor('--sidebar-bg',this.value)" /><input type="text" class="form-control"
                        id="cfg-sidebar-hex" style="width:90px"
                        oninput="syncHex('cfg-sidebar',this.value,'--sidebar-bg')" /></div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Color principal / botones</label>
                    <div class="color-picker-wrap"><input type="color" id="cfg-brand"
                        oninput="liveColor('--brand',this.value);liveColor('--brand-hover',shadeColor(this.value,-15))" /><input
                        type="text" class="form-control" id="cfg-brand-hex" style="width:90px"
                        oninput="syncHex('cfg-brand',this.value,'--brand')" /></div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Color tarjetas / superficie</label>
                    <div class="color-picker-wrap"><input type="color" id="cfg-surface"
                        oninput="liveColor('--surface',this.value)" /><input type="text" class="form-control"
                        id="cfg-surface-hex" style="width:90px"
                        oninput="syncHex('cfg-surface',this.value,'--surface')" /></div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Color texto principal</label>
                    <div class="color-picker-wrap"><input type="color" id="cfg-text"
                        oninput="liveColor('--text',this.value)" /><input type="text" class="form-control"
                        id="cfg-text-hex" style="width:90px" oninput="syncHex('cfg-text',this.value,'--text')" /></div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Color borde</label>
                    <div class="color-picker-wrap"><input type="color" id="cfg-border"
                        oninput="liveColor('--border',this.value)" /><input type="text" class="form-control"
                        id="cfg-border-hex" style="width:90px" oninput="syncHex('cfg-border',this.value,'--border')" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Colores de estado de incidencias -->
              <div class="config-card" style="grid-column:1/-1">
                <div class="config-card-title">🚦 Colores de estado de incidencias</div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">
                  <div>
                    <div style="font-size:13px;font-weight:500;margin-bottom:10px;color:var(--text2)">Estado: Abierta
                    </div>
                    <div class="form-group">
                      <label class="form-label">Fondo</label>
                      <div class="color-picker-wrap"><input type="color" id="cfg-open-bg"
                          oninput="liveColor('--badge-open-bg',this.value+'26')" /><input type="text"
                          class="form-control" id="cfg-open-bg-hex" style="width:90px" /></div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Texto</label>
                      <div class="color-picker-wrap"><input type="color" id="cfg-open-text"
                          oninput="liveColor('--badge-open-text',this.value)" /><input type="text" class="form-control"
                          id="cfg-open-text-hex" style="width:90px" /></div>
                    </div>
                    <div style="margin-top:8px"><span class="badge badge-open"><span
                          class="badge-dot"></span>Abierta</span></div>
                  </div>
                  <div>
                    <div style="font-size:13px;font-weight:500;margin-bottom:10px;color:var(--text2)">Estado: En
                      progreso</div>
                    <div class="form-group">
                      <label class="form-label">Fondo</label>
                      <div class="color-picker-wrap"><input type="color" id="cfg-prog-bg"
                          oninput="liveColor('--badge-prog-bg',this.value+'26')" /><input type="text"
                          class="form-control" id="cfg-prog-bg-hex" style="width:90px" /></div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Texto</label>
                      <div class="color-picker-wrap"><input type="color" id="cfg-prog-text"
                          oninput="liveColor('--badge-prog-text',this.value)" /><input type="text" class="form-control"
                          id="cfg-prog-text-hex" style="width:90px" /></div>
                    </div>
                    <div style="margin-top:8px"><span class="badge badge-in_progress"><span class="badge-dot"></span>En
                        progreso</span></div>
                  </div>
                  <div>
                    <div style="font-size:13px;font-weight:500;margin-bottom:10px;color:var(--text2)">Estado: Cerrada
                    </div>
                    <div class="form-group">
                      <label class="form-label">Fondo</label>
                      <div class="color-picker-wrap"><input type="color" id="cfg-closed-bg"
                          oninput="liveColor('--badge-closed-bg',this.value+'26')" /><input type="text"
                          class="form-control" id="cfg-closed-bg-hex" style="width:90px" /></div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Texto</label>
                      <div class="color-picker-wrap"><input type="color" id="cfg-closed-text"
                          oninput="liveColor('--badge-closed-text',this.value)" /><input type="text"
                          class="form-control" id="cfg-closed-text-hex" style="width:90px" /></div>
                    </div>
                    <div style="margin-top:8px"><span class="badge badge-closed"><span
                          class="badge-dot"></span>Cerrada</span></div>
                  </div>
                </div>
              </div>

            </div>
            <div style="margin-top:1.25rem;display:flex;gap:10px">
              <button class="btn btn-primary" onclick="saveConfig()">💾 Guardar todos los cambios</button>
              <button class="btn btn-secondary" onclick="resetColors()">↺ Restaurar colores por defecto</button>
            </div>
          </div>`;
  container.appendChild(el.firstElementChild);
}

// Default color palette
const COLOR_DEFAULTS = {
  '--bg': '#f0f4f9',
  '--login-bg': '#0f172a',
  '--sidebar-bg': '#0f172a',
  '--brand': '#1a56db',
  '--surface': '#ffffff',
  '--text': '#0f172a',
  '--border': '#e2e8f0',
  '--badge-open-bg': 'rgba(59,130,246,0.1)',
  '--badge-open-text': '#1d4ed8',
  '--badge-prog-bg': 'rgba(245,158,11,0.1)',
  '--badge-prog-text': '#b45309',
  '--badge-closed-bg': 'rgba(34,197,94,0.1)',
  '--badge-closed-text': '#15803d',
};

function liveColor(variable, value) {
  document.documentElement.style.setProperty(variable, value);
  if (variable === '--brand') document.documentElement.style.setProperty('--brand-hover', shadeColor(value, -15));
}

function syncHex(inputId, value, variable) {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    document.getElementById(inputId).value = value;
    liveColor(variable, value);
  }
}

function rgbaToHex(rgba) {
  // Convert rgba(r,g,b,a) or hex to hex for color picker
  if (!rgba) return '#1a56db';
  if (rgba.startsWith('#')) return rgba.slice(0, 7);
  const m = rgba.match(/[\d.]+/g);
  if (!m) return '#1a56db';
  return '#' + [m[0], m[1], m[2]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

async function loadConfig() {
  try {
    const cfg = await sb.query('app_config', '?select=*&limit=1');
    if (cfg.length) {
      appConfig = cfg[0];
      // Always parse colors if it's a JSON string
      if (typeof appConfig.colors === 'string') {
        try { appConfig.colors = JSON.parse(appConfig.colors); }
        catch { appConfig.colors = {}; }
      }
      if (!appConfig.colors || typeof appConfig.colors !== 'object') {
        appConfig.colors = {};
      }
      applyConfig();
    }
  } catch (e) { console.warn('Config load failed:', e.message); }
}

function applyConfig() {
  document.title = (appConfig.company_name || 'TransLog') + ' — Incidencias';
  const brandEl = document.getElementById('s-brand');
  const loginEl = document.getElementById('login-company');
  if (brandEl) brandEl.textContent = appConfig.company_name || 'TransLog';
  if (loginEl) loginEl.textContent = appConfig.company_name || 'TransLog';

  // Safely get colors object (may arrive as string from Supabase)
  let colors = appConfig.colors || {};
  if (typeof colors === 'string') {
    try { colors = JSON.parse(colors); } catch { colors = {}; }
  }

  // Merge defaults with saved colors and apply all CSS variables
  const merged = { ...COLOR_DEFAULTS, ...colors };
  Object.entries(merged).forEach(([k, v]) => {
    if (v) document.documentElement.style.setProperty(k, v);
  });

  // Always recalculate brand-hover from brand
  const brand = colors['--brand'] || COLOR_DEFAULTS['--brand'];
  document.documentElement.style.setProperty('--brand-hover', shadeColor(brand, -15));
  // Login screen uses sidebar-bg as its base color
  const sidebarBg = colors['--sidebar-bg'] || COLOR_DEFAULTS['--sidebar-bg'];
  document.documentElement.style.setProperty('--login-bg', sidebarBg);

  // Apply logo if set (supports base64 data URIs and plain URLs)
  if (appConfig.logo_url) {
    const src = appConfig.logo_url;
    const li = document.getElementById('login-icon');
    const sl = document.getElementById('s-logo');
    [[li, '18px'], [sl, '10px']].forEach(([el, r]) => { if (el) { el.textContent = ''; const img = document.createElement('img'); img.src = src; img.style.cssText = `width:100%;height:100%;object-fit:contain;border-radius:${r}`; el.appendChild(img); } });
  }
}

function getColorFromCfg(key) {
  return (appConfig.colors && appConfig.colors[key]) || COLOR_DEFAULTS[key] || '#888888';
}

function setPickerPair(pickerId, hexId, value) {
  const hex = rgbaToHex(value);
  const p = document.getElementById(pickerId);
  const h = document.getElementById(hexId);
  if (p) p.value = hex;
  if (h) h.value = hex;
}

async function saveConfig() {
  showLoad('Guardando configuración...');
  // Gather all colors from pickers
  const colors = {
    '--bg': document.getElementById('cfg-bg')?.value || COLOR_DEFAULTS['--bg'],
    '--sidebar-bg': document.getElementById('cfg-sidebar')?.value || COLOR_DEFAULTS['--sidebar-bg'],
    '--brand': document.getElementById('cfg-brand')?.value || COLOR_DEFAULTS['--brand'],
    '--surface': document.getElementById('cfg-surface')?.value || COLOR_DEFAULTS['--surface'],
    '--text': document.getElementById('cfg-text')?.value || COLOR_DEFAULTS['--text'],
    '--border': document.getElementById('cfg-border')?.value || COLOR_DEFAULTS['--border'],
    '--badge-open-text': document.getElementById('cfg-open-text')?.value || COLOR_DEFAULTS['--badge-open-text'],
    '--badge-prog-text': document.getElementById('cfg-prog-text')?.value || COLOR_DEFAULTS['--badge-prog-text'],
    '--badge-closed-text': document.getElementById('cfg-closed-text')?.value || COLOR_DEFAULTS['--badge-closed-text'],
    '--badge-open-bg': (document.getElementById('cfg-open-bg')?.value || '#3b82f6') + '26',
    '--badge-prog-bg': (document.getElementById('cfg-prog-bg')?.value || '#f59e0b') + '26',
    '--badge-closed-bg': (document.getElementById('cfg-closed-bg')?.value || '#22c55e') + '26',
  };

  const colorsJson = JSON.stringify(colors);

  const data = {
    company_name: document.getElementById('cfg-company').value.trim() || appConfig.company_name,
    primary_color: colors['--brand'],
    logo_url: document.getElementById('cfg-logo').value || '',
    items_per_page: parseInt(document.getElementById('cfg-pagesize').value) || 10,
    colors: colorsJson,
    updated_at: new Date().toISOString()
  };

  try {
    await sb.update('app_config', appConfig.id, data);
    // Store colors as parsed object in memory
    appConfig = { ...appConfig, ...data, colors };
    applyConfig();
    toast('✓ Configuración guardada correctamente');
  } catch (e) {
    toast('Error al guardar: ' + e.message, 'error');
    console.error('saveConfig error:', e);
  }
  hideLoad();
}

function resetColors() {
  Object.entries(COLOR_DEFAULTS).forEach(([k, v]) => liveColor(k, v));
  loadConfigForm();
  toast('Colores restaurados a los valores por defecto');
}

function loadConfigForm() {
  document.getElementById('cfg-company').value = appConfig.company_name || '';
  // Restore logo preview
  const existingLogo = appConfig.logo_url || '';
  document.getElementById('cfg-logo').value = existingLogo;
  _renderLogoPreview(existingLogo);
  document.getElementById('cfg-pagesize').value = appConfig.items_per_page || 10;

  // Safely parse colors
  let colors = appConfig.colors || {};
  if (typeof colors === 'string') {
    try { colors = JSON.parse(colors); } catch { colors = {}; }
  }

  const get = k => {
    const v = colors[k] || COLOR_DEFAULTS[k] || '#888888';
    return rgbaToHex(v); // always return a clean #rrggbb for color pickers
  };

  setPickerPair('cfg-bg', 'cfg-bg-hex', get('--bg'));
  setPickerPair('cfg-sidebar', 'cfg-sidebar-hex', get('--sidebar-bg'));
  setPickerPair('cfg-brand', 'cfg-brand-hex', get('--brand'));
  setPickerPair('cfg-surface', 'cfg-surface-hex', get('--surface'));
  setPickerPair('cfg-text', 'cfg-text-hex', get('--text'));
  setPickerPair('cfg-border', 'cfg-border-hex', get('--border'));

  setPickerPair('cfg-open-bg', 'cfg-open-bg-hex', get('--badge-open-bg'));
  setPickerPair('cfg-open-text', 'cfg-open-text-hex', get('--badge-open-text'));
  setPickerPair('cfg-prog-bg', 'cfg-prog-bg-hex', get('--badge-prog-bg'));
  setPickerPair('cfg-prog-text', 'cfg-prog-text-hex', get('--badge-prog-text'));
  setPickerPair('cfg-closed-bg', 'cfg-closed-bg-hex', get('--badge-closed-bg'));
  setPickerPair('cfg-closed-text', 'cfg-closed-text-hex', get('--badge-closed-text'));
}

// ================================================================
// LOGO UPLOAD — File → Base64 → Supabase
// ================================================================
function _renderLogoPreview(src) {
  const img = document.getElementById('logo-preview-img');
  const ph = document.getElementById('logo-preview-placeholder');
  const clr = document.getElementById('logo-clear-btn');
  const wrap = document.getElementById('logo-preview-wrap');
  if (!img) return;
  if (src) {
    img.src = src;
    img.style.display = 'block';
    if (ph) ph.style.display = 'none';
    if (clr) clr.style.display = 'inline';
    if (wrap) wrap.style.border = '2px solid var(--brand)';
  } else {
    img.src = '';
    img.style.display = 'none';
    if (ph) ph.style.display = 'block';
    if (clr) clr.style.display = 'none';
    if (wrap) wrap.style.border = '2px dashed var(--border)';
  }
}

function handleLogoFile(input) {
  const file = input.files[0];
  if (!file) return;

  // Validate format
  const allowed = ['image/jpeg', 'image/png', 'image/bmp'];
  if (!allowed.includes(file.type)) {
    toast('Formato no soportado. Usa JPG, PNG o BMP.', 'error');
    input.value = '';
    return;
  }

  // Validate size (max 1 MB)
  if (file.size > 1024 * 1024) {
    toast('La imagen supera 1 MB. Elige una imagen más pequeña.', 'error');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result; // data:image/png;base64,...
    document.getElementById('cfg-logo').value = base64;
    document.getElementById('logo-file-name').textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
    _renderLogoPreview(base64);
  };
  reader.onerror = function () {
    toast('Error al leer el archivo.', 'error');
  };
  reader.readAsDataURL(file);
}

function clearLogo() {
  document.getElementById('cfg-logo').value = '';
  document.getElementById('cfg-logo-file').value = '';
  document.getElementById('logo-file-name').textContent = 'Formatos: JPG, JPEG, PNG, BMP · Máx. 1 MB';
  _renderLogoPreview('');
}
