const CONFIG = {
  libros: {
    singular: 'libro', plural: 'libros', person: 'autor', endpoint: '/api/libros/',
    hero: ['Cada historia', 'tiene su lugar.'],
    subtitle: 'Organiza los libros que te acompañan y vuelve a encontrarlos cuando quieras.',
    search: 'Buscar por título o autor...',
  },
  canciones: {
    singular: 'canción', plural: 'canciones', person: 'artista', endpoint: '/api/canciones/',
    hero: ['La banda sonora', 'de tus días.'],
    subtitle: 'Guarda las canciones que te mueven y tenlas siempre a mano.',
    search: 'Buscar por título, artista o género...',
  },
};

const $ = (selector) => document.querySelector(selector);
const state = { section: 'libros', records: { libros: [], canciones: [] }, loaded: { libros: false, canciones: false }, editing: null, deleting: null, requestId: 0 };
const editor = $('#editor-dialog');
const deleteDialog = $('#delete-dialog');
let toastTimer;

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Comprueba que el frontend y Django estén en ejecución.');
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail || data?.non_field_errors?.[0] || `La solicitud falló (${response.status}).`;
    const error = new Error(detail);
    error.fields = data && typeof data === 'object' ? data : {};
    throw error;
  }
  return data;
}

function showFeedback(message) {
  const box = $('#feedback');
  box.textContent = message;
  box.hidden = !message;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3500);
}

function setConnection(ok) {
  const element = $('#connection-status');
  element.classList.toggle('offline', !ok);
  element.querySelector('span:last-child').textContent = ok ? 'API conectada' : 'API sin conexión';
}

async function loadSection(section) {
  const requestId = ++state.requestId;
  showFeedback('Cargando colección...');
  $('#items').replaceChildren();
  $('#empty').hidden = true;
  try {
    const data = await api(CONFIG[section].endpoint);
    if (requestId !== state.requestId) return;
    state.records[section] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    state.loaded[section] = true;
    $('#nav-count-' + section).textContent = String(state.records[section].length);
    setConnection(true);
    showFeedback('');
    render();
  } catch (error) {
    if (requestId !== state.requestId) return;
    setConnection(false);
    showFeedback(error.message);
  }
}

function setSection(section) {
  if (!CONFIG[section]) return;
  state.section = section;
  const config = CONFIG[section];
  for (const button of document.querySelectorAll('.nav-item')) {
    const active = button.dataset.section === section;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  }
  $('#breadcrumb-current').textContent = titleCase(config.plural);
  $('#page-title').replaceChildren(document.createTextNode(config.hero[0]), document.createElement('br'), Object.assign(document.createElement('em'), { textContent: config.hero[1] }));
  $('#page-subtitle').textContent = config.subtitle;
  $('#hero-add').lastChild.textContent = ' Añadir ' + config.singular;
  $('#toolbar-add').lastChild.textContent = ' ' + (section === 'canciones' ? 'Nueva' : 'Nuevo') + ' ' + config.singular;
  $('#collection-title').firstChild.textContent = 'Tus ' + config.plural + ' ';
  $('#search').placeholder = config.search;
  $('#search').value = '';
  $('#sort').value = 'recent';
  history.replaceState(null, '', '#' + section);
  loadSection(section);
}

function titleCase(value) { return value[0].toUpperCase() + value.slice(1); }
function inflect(participle) { return state.section === 'canciones' ? participle.replace(/o$/, 'a') : participle; }

function filteredRecords() {
  const query = $('#search').value.trim().toLocaleLowerCase('es');
  const config = CONFIG[state.section];
  const records = state.records[state.section].filter((item) =>
    [item.titulo, item[config.person], item.genero].some((value) => String(value ?? '').toLocaleLowerCase('es').includes(query))
  );
  const sort = $('#sort').value;
  if (sort === 'title') records.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
  else if (sort === 'year') records.sort((a, b) => Number(b.anio) - Number(a.anio) || Number(b.id) - Number(a.id));
  else records.sort((a, b) => Number(b.id) - Number(a.id));
  return records;
}

function node(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = String(content);
  return element;
}

function card(item, index) {
  const config = CONFIG[state.section];
  const article = node('article', 'item-card');
  article.style.setProperty('--card-index', index);
  const artwork = node('div', 'card-art ' + (state.section === 'libros' ? 'book-art' : 'music-art'));
  artwork.setAttribute('aria-hidden', 'true');
  artwork.append(node('span', 'artwork-glyph', state.section === 'libros' ? '▤' : '♫'));
  const type = node('span', 'card-type', state.section === 'libros' ? 'LIBRO' : 'CANCIÓN');
  artwork.append(type);
  const body = node('div', 'card-body');
  body.append(node('div', 'card-year', item.anio));
  body.append(node('h3', 'card-title', item.titulo));
  body.append(node('p', 'card-person', item[config.person]));
  if (state.section === 'canciones') body.append(node('span', 'genre-tag', item.genero));
  const actions = node('div', 'card-actions');
  const edit = node('button', 'action-button', 'Editar');
  edit.type = 'button'; edit.setAttribute('aria-label', `Editar ${config.singular}: ${item.titulo}`);
  edit.addEventListener('click', () => openEditor(item));
  const remove = node('button', 'action-button danger-action', 'Eliminar');
  remove.type = 'button'; remove.setAttribute('aria-label', `Eliminar ${config.singular}: ${item.titulo}`);
  remove.addEventListener('click', () => openDelete(item));
  actions.append(edit, remove);
  body.append(actions);
  article.append(artwork, body);
  return article;
}

function render() {
  const config = CONFIG[state.section];
  const records = filteredRecords();
  $('#title-count').textContent = String(state.records[state.section].length);
  $('#items').replaceChildren(...records.map(card));
  const empty = $('#empty');
  empty.hidden = records.length > 0 || !state.loaded[state.section];
  if (!empty.hidden) {
    const searching = $('#search').value.trim().length > 0;
    $('#empty-title').textContent = searching ? 'No encontramos resultados' : `Todavía no hay ${config.plural}`;
    $('#empty-copy').textContent = searching ? 'Prueba con otra palabra o borra la búsqueda.' : `Añade ${config.singular === 'canción' ? 'la primera' : 'el primero'} para comenzar tu archivo.`;
    $('#empty-add').hidden = searching;
    $('#empty-add').textContent = 'Añadir ' + config.singular;
    $('.empty-icon').textContent = state.section === 'libros' ? '▤' : '♫';
  }
}

function clearErrors() {
  $('#form-error').hidden = true;
  for (const field of document.querySelectorAll('.field-error')) field.textContent = '';
  for (const input of editor.querySelectorAll('input')) input.removeAttribute('aria-invalid');
}

function fieldError(name, message) {
  const field = editor.querySelector(`[name="${name}"]`);
  field.setAttribute('aria-invalid', 'true');
  editor.querySelector(`[data-error-for="${name}"]`).textContent = message;
}

function openEditor(item = null) {
  const config = CONFIG[state.section];
  state.editing = item;
  $('#editor-form').reset();
  clearErrors();
  $('#dialog-title').textContent = (item ? 'Editar ' : 'Añadir ') + config.singular;
  $('#person-label').firstChild.textContent = titleCase(config.person) + ' ';
  $('#field-person').placeholder = config.person === 'autor' ? 'Nombre del autor' : 'Nombre del artista';
  $('#genre-field').hidden = state.section !== 'canciones';
  $('#field-genero').required = state.section === 'canciones';
  $('#submit-button').textContent = item ? 'Guardar cambios' : 'Guardar ' + config.singular;
  if (item) {
    $('#field-titulo').value = item.titulo;
    $('#field-person').value = item[config.person];
    $('#field-anio').value = item.anio;
    $('#field-genero').value = item.genero || '';
  }
  editor.showModal();
  $('#field-titulo').focus();
}

function validateForm() {
  clearErrors();
  const title = $('#field-titulo').value.trim();
  const person = $('#field-person').value.trim();
  const yearText = $('#field-anio').value.trim();
  const genre = $('#field-genero').value.trim();
  let valid = true;
  if (!title) { fieldError('titulo', 'Escribe un título.'); valid = false; }
  if (!person) { fieldError('person', 'Este campo es obligatorio.'); valid = false; }
  if (!yearText || !Number.isSafeInteger(Number(yearText))) { fieldError('anio', 'Escribe un año entero.'); valid = false; }
  if (state.section === 'canciones' && !genre) { fieldError('genero', 'Escribe un género.'); valid = false; }
  if (!valid) return null;
  return { titulo: title, [CONFIG[state.section].person]: person, anio: Number(yearText), ...(state.section === 'canciones' ? { genero: genre } : {}) };
}

async function save(event) {
  event.preventDefault();
  const data = validateForm();
  if (!data) return;
  const config = CONFIG[state.section];
  const button = $('#submit-button');
  const editing = state.editing;
  button.disabled = true;
  try {
    await api(editing ? config.endpoint + editing.id + '/' : config.endpoint, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) });
    editor.close();
    showToast(editing ? `${titleCase(config.singular)} ${inflect('actualizado')}.` : `${titleCase(config.singular)} ${inflect('añadido')}.`);
    await loadSection(state.section);
  } catch (error) {
    $('#form-error').textContent = error.message;
    $('#form-error').hidden = false;
    for (const [name, value] of Object.entries(error.fields || {})) {
      const fieldName = name === config.person ? 'person' : name;
      if (['titulo', 'person', 'anio', 'genero'].includes(fieldName)) fieldError(fieldName, Array.isArray(value) ? value.join(' ') : String(value));
    }
  } finally { button.disabled = false; }
}

function openDelete(item) {
  state.deleting = item;
  $('#delete-copy').textContent = `Se eliminará “${item.titulo}” de tu colección. Esta acción no se puede deshacer.`;
  deleteDialog.showModal();
}

async function confirmDelete() {
  if (!state.deleting) return;
  const config = CONFIG[state.section];
  const button = $('#delete-confirm');
  button.disabled = true;
  try {
    await api(config.endpoint + state.deleting.id + '/', { method: 'DELETE' });
    deleteDialog.close();
    state.deleting = null;
    showToast(`${titleCase(config.singular)} ${inflect('eliminado')}.`);
    await loadSection(state.section);
  } catch (error) {
    deleteDialog.close();
    showFeedback(error.message);
  } finally { button.disabled = false; }
}

document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => setSection(button.dataset.section)));
['#hero-add', '#toolbar-add', '#empty-add'].forEach((selector) => $(selector).addEventListener('click', () => openEditor()));
$('#search').addEventListener('input', render);
$('#sort').addEventListener('change', render);
$('#editor-form').addEventListener('submit', save);
$('#dialog-close').addEventListener('click', () => editor.close());
$('#dialog-cancel').addEventListener('click', () => editor.close());
$('#delete-cancel').addEventListener('click', () => deleteDialog.close());
$('#delete-confirm').addEventListener('click', confirmDelete);
window.addEventListener('hashchange', () => { const section = location.hash.slice(1); if (CONFIG[section] && section !== state.section) setSection(section); });

setSection(CONFIG[location.hash.slice(1)] ? location.hash.slice(1) : 'libros');

