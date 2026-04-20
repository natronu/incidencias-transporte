// ================================================================
// CITY.JS — autocompletado de ciudades
// ================================================================

// ================================================================
// CITY AUTOCOMPLETE — España y Portugal
// ================================================================
const CITIES = [
  // ESPAÑA - Capitales y ciudades principales
  ['Madrid', 'ES', 'Comunidad de Madrid'], ['Barcelona', 'ES', 'Cataluña'], ['Valencia', 'ES', 'Comunitat Valenciana'],
  ['Sevilla', 'ES', 'Andalucía'], ['Zaragoza', 'ES', 'Aragón'], ['Málaga', 'ES', 'Andalucía'],
  ['Murcia', 'ES', 'Región de Murcia'], ['Palma', 'ES', 'Islas Baleares'], ['Las Palmas de Gran Canaria', 'ES', 'Canarias'],
  ['Bilbao', 'ES', 'País Vasco'], ['Alicante', 'ES', 'Comunitat Valenciana'], ['Córdoba', 'ES', 'Andalucía'],
  ['Valladolid', 'ES', 'Castilla y León'], ['Vigo', 'ES', 'Galicia'], ['Gijón', 'ES', 'Asturias'],
  ['Hospitalet de Llobregat', 'ES', 'Cataluña'], ['A Coruña', 'ES', 'Galicia'], ['Vitoria-Gasteiz', 'ES', 'País Vasco'],
  ['Granada', 'ES', 'Andalucía'], ['Elche', 'ES', 'Comunitat Valenciana'], ['Oviedo', 'ES', 'Asturias'],
  ['Santa Cruz de Tenerife', 'ES', 'Canarias'], ['Badalona', 'ES', 'Cataluña'], ['Cartagena', 'ES', 'Región de Murcia'],
  ['Móstoles', 'ES', 'Comunidad de Madrid'], ['Sabadell', 'ES', 'Cataluña'], ['Jerez de la Frontera', 'ES', 'Andalucía'],
  ['Fuenlabrada', 'ES', 'Comunidad de Madrid'], ['Almería', 'ES', 'Andalucía'], ['Leganés', 'ES', 'Comunidad de Madrid'],
  ['Santander', 'ES', 'Cantabria'], ['Burgos', 'ES', 'Castilla y León'], ['Albacete', 'ES', 'Castilla-La Mancha'],
  ['Alcalá de Henares', 'ES', 'Comunidad de Madrid'], ['Getafe', 'ES', 'Comunidad de Madrid'],
  ['Salamanca', 'ES', 'Castilla y León'], ['Huelva', 'ES', 'Andalucía'], ['Logroño', 'ES', 'La Rioja'],
  ['Badajoz', 'ES', 'Extremadura'], ['Tarragona', 'ES', 'Cataluña'], ['León', 'ES', 'Castilla y León'],
  ['Cádiz', 'ES', 'Andalucía'], ['Lleida', 'ES', 'Cataluña'], ['Marbella', 'ES', 'Andalucía'],
  ['Dos Hermanas', 'ES', 'Andalucía'], ['Parla', 'ES', 'Comunidad de Madrid'], ['Mataró', 'ES', 'Cataluña'],
  ['Torrevieja', 'ES', 'Comunitat Valenciana'], ['Algeciras', 'ES', 'Andalucía'], ['Terrassa', 'ES', 'Cataluña'],
  ['Pamplona', 'ES', 'Navarra'], ['Girona', 'ES', 'Cataluña'], ['Toledo', 'ES', 'Castilla-La Mancha'],
  ['Jaén', 'ES', 'Andalucía'], ['Torrejón de Ardoz', 'ES', 'Comunidad de Madrid'], ['Alcobendas', 'ES', 'Comunidad de Madrid'],
  ['Reus', 'ES', 'Cataluña'], ['Barakaldo', 'ES', 'País Vasco'], ['San Sebastián', 'ES', 'País Vasco'],
  ['Donostia', 'ES', 'País Vasco'], ['Ferrol', 'ES', 'Galicia'], ['Lugo', 'ES', 'Galicia'],
  ['Ourense', 'ES', 'Galicia'], ['Pontevedra', 'ES', 'Galicia'], ['Santiago de Compostela', 'ES', 'Galicia'],
  ['Lorca', 'ES', 'Región de Murcia'], ['Elda', 'ES', 'Comunitat Valenciana'], ['Alcoy', 'ES', 'Comunitat Valenciana'],
  ['Gandía', 'ES', 'Comunitat Valenciana'], ['Benidorm', 'ES', 'Comunitat Valenciana'], ['Dénia', 'ES', 'Comunitat Valenciana'],
  ['Castellón de la Plana', 'ES', 'Comunitat Valenciana'], ['Orihuela', 'ES', 'Comunitat Valenciana'],
  ['Manresa', 'ES', 'Cataluña'], ['Cornellà de Llobregat', 'ES', 'Cataluña'], ['Sant Cugat del Vallès', 'ES', 'Cataluña'],
  ['Rubí', 'ES', 'Cataluña'], ['Granollers', 'ES', 'Cataluña'], ['Vic', 'ES', 'Cataluña'], ['Figueres', 'ES', 'Cataluña'],
  ['Igualada', 'ES', 'Cataluña'], ['Vilanova i la Geltrú', 'ES', 'Cataluña'], ['El Prat de Llobregat', 'ES', 'Cataluña'],
  ['Cerdanyola del Vallès', 'ES', 'Cataluña'], ['Viladecans', 'ES', 'Cataluña'], ['Gavà', 'ES', 'Cataluña'],
  ['Castelldefels', 'ES', 'Cataluña'], ['Sitges', 'ES', 'Cataluña'], ['Calella', 'ES', 'Cataluña'],
  ['Benalmádena', 'ES', 'Andalucía'], ['Torremolinos', 'ES', 'Andalucía'], ['Fuengirola', 'ES', 'Andalucía'],
  ['Estepona', 'ES', 'Andalucía'], ['Vélez-Málaga', 'ES', 'Andalucía'], ['Motril', 'ES', 'Andalucía'],
  ['Chiclana de la Frontera', 'ES', 'Andalucía'], ['El Puerto de Santa María', 'ES', 'Andalucía'],
  ['Ronda', 'ES', 'Andalucía'], ['Antequera', 'ES', 'Andalucía'], ['Lucena', 'ES', 'Andalucía'],
  ['Linares', 'ES', 'Andalucía'], ['Úbeda', 'ES', 'Andalucía'], ['Baeza', 'ES', 'Andalucía'],
  ['Roquetas de Mar', 'ES', 'Andalucía'], ['El Ejido', 'ES', 'Andalucía'], ['Almendralejo', 'ES', 'Extremadura'],
  ['Mérida', 'ES', 'Extremadura'], ['Cáceres', 'ES', 'Extremadura'], ['Plasencia', 'ES', 'Extremadura'],
  ['Talavera de la Reina', 'ES', 'Castilla-La Mancha'], ['Ciudad Real', 'ES', 'Castilla-La Mancha'],
  ['Cuenca', 'ES', 'Castilla-La Mancha'], ['Guadalajara', 'ES', 'Castilla-La Mancha'], ['Hellín', 'ES', 'Castilla-La Mancha'],
  ['Segovia', 'ES', 'Castilla y León'], ['Ávila', 'ES', 'Castilla y León'], ['Soria', 'ES', 'Castilla y León'],
  ['Zamora', 'ES', 'Castilla y León'], ['Palencia', 'ES', 'Castilla y León'], ['Miranda de Ebro', 'ES', 'Castilla y León'],
  ['Aranda de Duero', 'ES', 'Castilla y León'], ['Ponferrada', 'ES', 'Castilla y León'],
  ['Alcázar de San Juan', 'ES', 'Castilla-La Mancha'], ['Puertollano', 'ES', 'Castilla-La Mancha'],
  ['Calahorra', 'ES', 'La Rioja'], ['Arnedo', 'ES', 'La Rioja'], ['Tudela', 'ES', 'Navarra'],
  ['Iruña', 'ES', 'Navarra'], ['Estella', 'ES', 'Navarra'], ['Tafalla', 'ES', 'Navarra'],
  ['Irún', 'ES', 'País Vasco'], ['Eibar', 'ES', 'País Vasco'], ['Mondragón', 'ES', 'País Vasco'],
  ['Arrasate', 'ES', 'País Vasco'], ['Durango', 'ES', 'País Vasco'], ['Zarautz', 'ES', 'País Vasco'],
  ['Getxo', 'ES', 'País Vasco'], ['Basauri', 'ES', 'País Vasco'], ['Sestao', 'ES', 'País Vasco'],
  ['Huesca', 'ES', 'Aragón'], ['Teruel', 'ES', 'Aragón'], ['Calatayud', 'ES', 'Aragón'],
  ['Alcañiz', 'ES', 'Aragón'], ['Barbastro', 'ES', 'Aragón'], ['Fraga', 'ES', 'Aragón'],
  ['Ibiza', 'ES', 'Islas Baleares'], ['Manacor', 'ES', 'Islas Baleares'], ['Inca', 'ES', 'Islas Baleares'],
  ['Ciutadella', 'ES', 'Islas Baleares'], ['Mahón', 'ES', 'Islas Baleares'],
  ['Arrecife', 'ES', 'Canarias'], ['Puerto del Rosario', 'ES', 'Canarias'], ['San Cristóbal de La Laguna', 'ES', 'Canarias'],
  ['Arona', 'ES', 'Canarias'], ['Adeje', 'ES', 'Canarias'], ['Telde', 'ES', 'Canarias'],
  ['La Orotava', 'ES', 'Canarias'], ['Mogán', 'ES', 'Canarias'], ['Ceuta', 'ES', 'Ciudad Autónoma'],
  ['Melilla', 'ES', 'Ciudad Autónoma'],
  // PORTUGAL - Principales ciudades
  ['Lisboa', 'PT', 'Lisboa'], ['Porto', 'PT', 'Porto'], ['Amadora', 'PT', 'Lisboa'],
  ['Braga', 'PT', 'Braga'], ['Setúbal', 'PT', 'Setúbal'], ['Coimbra', 'PT', 'Coimbra'],
  ['Funchal', 'PT', 'Madeira'], ['Almada', 'PT', 'Setúbal'], ['Agualva-Cacém', 'PT', 'Lisboa'],
  ['Queluz', 'PT', 'Lisboa'], ['Aveiro', 'PT', 'Aveiro'], ['Viseu', 'PT', 'Viseu'],
  ['Guimarães', 'PT', 'Braga'], ['Évora', 'PT', 'Évora'], ['Leiria', 'PT', 'Leiria'],
  ['Faro', 'PT', 'Algarve'], ['Portimão', 'PT', 'Algarve'], ['Loures', 'PT', 'Lisboa'],
  ['Odivelas', 'PT', 'Lisboa'], ['Cascais', 'PT', 'Lisboa'], ['Sintra', 'PT', 'Lisboa'],
  ['Vila Nova de Gaia', 'PT', 'Porto'], ['Matosinhos', 'PT', 'Porto'], ['Maia', 'PT', 'Porto'],
  ['Gondomar', 'PT', 'Porto'], ['Valongo', 'PT', 'Porto'], ['Santo Tirso', 'PT', 'Porto'],
  ['Viana do Castelo', 'PT', 'Viana do Castelo'], ['Bragança', 'PT', 'Trás-os-Montes'],
  ['Vila Real', 'PT', 'Trás-os-Montes'], ['Lamego', 'PT', 'Viseu'], ['Covilhã', 'PT', 'Castelo Branco'],
  ['Castelo Branco', 'PT', 'Castelo Branco'], ['Portalegre', 'PT', 'Portalegre'],
  ['Santarém', 'PT', 'Santarém'], ['Beja', 'PT', 'Baixo Alentejo'], ['Sines', 'PT', 'Baixo Alentejo'],
  ['Lagos', 'PT', 'Algarve'], ['Tavira', 'PT', 'Algarve'], ['Olhão', 'PT', 'Algarve'],
  ['Albufeira', 'PT', 'Algarve'], ['Quarteira', 'PT', 'Algarve'], ['Vilamoura', 'PT', 'Algarve'],
  ['Ponta Delgada', 'PT', 'Azores'], ['Angra do Heroísmo', 'PT', 'Azores'],
];

let cityHighlightIdx = -1;
let citySearchTimeout = null;

function citySearch(q) {
  const dd = document.getElementById('city-dropdown');
  clearTimeout(citySearchTimeout);
  if (!q || q.length < 2) { dd.classList.remove('open'); dd.innerHTML = ''; return; }
  citySearchTimeout = setTimeout(() => {
    const ql = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const results = CITIES.filter(([name]) => {
      const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return n.startsWith(ql) || n.includes(ql);
    }).sort((a, b) => {
      const an = a[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const bn = b[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return an.startsWith(ql) === bn.startsWith(ql) ? an.localeCompare(bn, 'es') : an.startsWith(ql) ? -1 : 1;
    }).slice(0, 12);
    cityHighlightIdx = -1;
    if (!results.length) { dd.classList.remove('open'); dd.innerHTML = ''; return; }
    dd.innerHTML = results.map(([name, country, region], i) =>
      `<div class="autocomplete-item" data-idx="${i}" data-name="${name}" onmousedown="selectCity('${name.replace(/'/g, "\\'")}')">
        <span class="autocomplete-flag">${country === 'ES' ? '🇪🇸' : '🇵🇹'}</span>
        <span>${name}</span>
        <span class="autocomplete-region">${region}</span>
      </div>`
    ).join('');
    dd.classList.add('open');
  }, 120);
}

function selectCity(name) {
  document.getElementById('i-city').value = name;
  document.getElementById('city-dropdown').classList.remove('open');
  document.getElementById('city-dropdown').innerHTML = '';
}

function cityKey(e) {
  const dd = document.getElementById('city-dropdown');
  const items = dd.querySelectorAll('.autocomplete-item');
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
    if (dd) { dd.classList.remove('open'); }
  }
});
