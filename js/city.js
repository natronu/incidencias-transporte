// ================================================================
// CITY.JS — autocompletado de ciudades via Nominatim (OpenStreetMap)
// Sin API key · Gratuito · https://nominatim.openstreetmap.org
// ================================================================

let cityHighlightIdx = -1;
let citySearchTimeout = null;
let cityAbortController = null;

const CITY_PLACE_TYPES = new Set(['city', 'town', 'village', 'municipality', 'hamlet', 'locality']);

async function citySearch(q) {
  const dd = document.getElementById('city-dropdown');
  clearTimeout(citySearchTimeout);
  if (cityAbortController) { cityAbortController.abort(); cityAbortController = null; }

  if (!q || q.length < 2) { dd.classList.remove('open'); dd.innerHTML = ''; return; }

  dd.innerHTML = '<div class="autocomplete-item autocomplete-loading">Buscando...</div>';
  dd.classList.add('open');

  citySearchTimeout = setTimeout(async () => {
    cityAbortController = new AbortController();
    try {
      const params = new URLSearchParams({
        q: q,
        countrycodes: 'es,pt',
        format: 'json',
        limit: 15,
        addressdetails: 1,
        'accept-language': 'es'
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        signal: cityAbortController.signal,
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Error de red');
      const data = await res.json();

      const countryFlag = code => code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));

      const seen = new Set();
      const results = data
        .filter(r => r.class === 'place' || r.class === 'boundary')
        .map(r => {
          const name = r.name || r.address?.city || r.address?.town || r.address?.village || '';
          const region = r.address?.state || r.address?.province || r.address?.county || '';
          const flag = countryFlag(r.address?.country_code || 'es');
          return { name, region, flag };
        })
        .filter(r => {
          if (!r.name || seen.has(r.name)) return false;
          seen.add(r.name);
          return true;
        })
        .slice(0, 12);

      cityHighlightIdx = -1;

      if (!results.length) {
        dd.innerHTML = '<div class="autocomplete-item autocomplete-loading">Sin resultados para España o Portugal</div>';
        return;
      }
      dd.innerHTML = results.map((r, i) =>
        `<div class="autocomplete-item" data-idx="${i}" data-name="${escapeHtml(r.name)}"
          onmousedown="selectCity('${r.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')">
          <span class="autocomplete-flag">${r.flag}</span>
          <span>${escapeHtml(r.name)}</span>
          <span class="autocomplete-region">${escapeHtml(r.region)}</span>
        </div>`
      ).join('');

    } catch (e) {
      if (e.name === 'AbortError') return;
      dd.innerHTML = '<div class="autocomplete-item autocomplete-loading">Error al conectar con el servicio</div>';
      console.warn('Nominatim error:', e.message);
    }
  }, 400);
}

function selectCity(name) {
  document.getElementById('i-city').value = name;
  const dd = document.getElementById('city-dropdown');
  dd.classList.remove('open');
  dd.innerHTML = '';
}

function cityKey(e) {
  const dd = document.getElementById('city-dropdown');
  const items = dd.querySelectorAll('.autocomplete-item:not(.autocomplete-loading)');
  if (!items.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    cityHighlightIdx = Math.min(cityHighlightIdx + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle('highlighted', i === cityHighlightIdx));
    items[cityHighlightIdx]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    cityHighlightIdx = Math.max(cityHighlightIdx - 1, 0);
    items.forEach((el, i) => el.classList.toggle('highlighted', i === cityHighlightIdx));
    items[cityHighlightIdx]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter' && cityHighlightIdx >= 0) {
    e.preventDefault();
    selectCity(items[cityHighlightIdx].dataset.name);
  } else if (e.key === 'Escape') {
    dd.classList.remove('open');
  }
}

document.addEventListener('click', e => {
  if (!e.target.closest('.autocomplete-wrap')) {
    const dd = document.getElementById('city-dropdown');
    if (dd) dd.classList.remove('open');
  }
});
