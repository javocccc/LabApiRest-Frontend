import React, { useEffect, useMemo, useState } from 'react';
import { endpoint, request } from './api';

const config = {
  libros: { singular: 'libro', plural: 'libros', person: 'autor', hero: <>Cada historia<br /><em>tiene su lugar.</em></>, subtitle: 'Organiza los libros que te acompañan y vuelve a encontrarlos cuando quieras.' },
  canciones: { singular: 'canción', plural: 'canciones', person: 'artista', hero: <>La banda sonora<br /><em>de tus días.</em></>, subtitle: 'Guarda las canciones que te mueven y tenlas siempre a mano.' },
};
const emptyForm = { titulo: '', person: '', anio: '', genero: '' };

export default function App({ apiUrl }) {
  const [section, setSection] = useState(location.hash === '#canciones' ? 'canciones' : 'libros');
  const [records, setRecords] = useState({ libros: [], canciones: [] });
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const cfg = config[section];

  useEffect(() => {
    const syncHash = () => setSection(location.hash === '#canciones' ? 'canciones' : 'libros');
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoaded(false);
    setFeedback('');
    request(endpoint(apiUrl, section), { signal: controller.signal })
      .then(data => {
        if (controller.signal.aborted) return;
        setRecords(previous => ({ ...previous, [section]: Array.isArray(data) ? data : data?.results || [] }));
        setLoaded(true);
      })
      .catch(error => { if (!controller.signal.aborted) setFeedback(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [apiUrl, section]);

  async function reload() {
    const data = await request(endpoint(apiUrl, section));
    setRecords(previous => ({ ...previous, [section]: Array.isArray(data) ? data : data?.results || [] }));
    setLoaded(true);
  }

  function changeSection(next) {
    setSection(next);
    setSearch('');
    setSort('recent');
    location.hash = next;
  }

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');
    const items = records[section].filter(item =>
      [item.titulo, item[cfg.person], item.genero].some(value => String(value ?? '').toLocaleLowerCase('es').includes(query))
    );
    if (sort === 'title') items.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    else if (sort === 'year') items.sort((a, b) => Number(b.anio) - Number(a.anio));
    else items.sort((a, b) => Number(b.id) - Number(a.id));
    return items;
  }, [records, section, cfg.person, search, sort]);

  function openEditor(item = null) {
    setEditing(item);
    setForm(item ? { titulo: item.titulo, person: item[cfg.person], anio: String(item.anio), genero: item.genero || '' } : emptyForm);
    setFeedback('');
  }

  async function save(event) {
    event.preventDefault();
    const year = Number(form.anio);
    if (!form.titulo.trim() || !form.person.trim() || !Number.isSafeInteger(year) || (section === 'canciones' && !form.genero.trim())) {
      setFeedback('Completa los campos obligatorios con un año entero.');
      return;
    }
    setSaving(true);
    setFeedback('');
    const data = { titulo: form.titulo.trim(), [cfg.person]: form.person.trim(), anio: year };
    if (section === 'canciones') data.genero = form.genero.trim();
    try {
      await request(endpoint(apiUrl, section, editing?.id), { method: editing ? 'PUT' : 'POST', body: JSON.stringify(data) });
      setEditing(undefined);
      await reload();
    } catch (error) {
      const detail = Object.values(error.fields || {}).flat().filter(value => typeof value === 'string').join(' ');
      setFeedback(detail || error.message);
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!deleting) return;
    setSaving(true);
    setFeedback('');
    try {
      await request(endpoint(apiUrl, section, deleting.id), { method: 'DELETE' });
      setDeleting(null);
      await reload();
    } catch (error) { setFeedback(error.message); }
    finally { setSaving(false); }
  }

  return <div className="app-shell">
    <aside className="sidebar" aria-label="Navegación principal">
      <a className="brand" href="/" aria-label="Archivo, inicio"><span className="brand-mark">A<span className="brand-dot">.</span></span><span className="brand-copy"><strong>archivo</strong><small>Tu colección, en orden.</small></span></a>
      <p className="sidebar-label">COLECCIÓN</p>
      <nav className="nav-list" aria-label="Secciones">
        {Object.keys(config).map(key => <button key={key} type="button" className={`nav-item ${section === key ? 'active' : ''}`} aria-current={section === key ? 'page' : undefined} onClick={() => changeSection(key)}>
          <span className="nav-icon" aria-hidden="true">{key === 'libros' ? '▤' : '♫'}</span><span>{key === 'libros' ? 'Libros' : 'Canciones'}</span><span className="nav-count">{records[key].length || '—'}</span>
        </button>)}
      </nav>
      <div className="sidebar-bottom"><div className={`connection ${feedback ? 'offline' : ''}`}><span className="status-dot"></span><span>{loading ? 'Conectando con la API' : feedback ? 'API sin conexión' : 'API conectada'}</span></div>
        <a href="https://github.com/javocccc/LabApiRest" target="_blank" rel="noopener noreferrer" className="backend-link">Ver repositorio backend ↗</a>
      </div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb"><span>Mi espacio</span><span className="breadcrumb-separator">/</span><strong>{section === 'libros' ? 'Libros' : 'Canciones'}</strong></div><span className="topbar-badge">LAB API REST</span></header>
      <div className="page-body">
        <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"></span> TU ARCHIVO PERSONAL</div><h1>{cfg.hero}</h1><p>{cfg.subtitle}</p><button className="button button-primary" type="button" onClick={() => openEditor()}>＋ Añadir {cfg.singular}</button></div><div className="hero-art" aria-hidden="true"><div className="art-sun"></div><div className="art-arch"></div><div className="art-book book-one"></div><div className="art-book book-two"></div><div className="art-book book-three"></div></div></section>
        <section className="collection"><div className="section-heading"><div><p className="overline">EXPLORA TU COLECCIÓN</p><h2>Tus {cfg.plural} <span className="title-count">{records[section].length}</span></h2></div><button className="button button-outline" type="button" onClick={() => openEditor()}>＋ {section === 'libros' ? 'Nuevo libro' : 'Nueva canción'}</button></div>
          <div className="toolbar"><label className="search-field"><span aria-hidden="true">⌕</span><span className="sr-only">Buscar en la colección</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={section === 'libros' ? 'Buscar por título o autor...' : 'Buscar por título, artista o género...'} /></label><label className="sort-field"><span>Ordenar:</span><select aria-label="Ordenar colección" value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Más recientes</option><option value="title">Título A–Z</option><option value="year">Año más nuevo</option></select></label></div>
          {loading && <div className="feedback" role="status">Cargando colección...</div>}
          {feedback && <div className="feedback" role="alert">{feedback}</div>}
          {!loading && loaded && <div className="item-grid" aria-live="polite">{visible.map((item, index) => <article key={item.id} className="item-card" style={{ '--card-index': index }}>
            <div className={`card-art ${section === 'libros' ? 'book-art' : 'music-art'}`} aria-hidden="true"><span className="artwork-glyph">{section === 'libros' ? '▤' : '♫'}</span><span className="card-type">{section === 'libros' ? 'LIBRO' : 'CANCIÓN'}</span></div>
            <div className="card-body"><div className="card-year">{item.anio}</div><h3 className="card-title">{item.titulo}</h3><p className="card-person">{item[cfg.person]}</p>{section === 'canciones' && <span className="genre-tag">{item.genero}</span>}
              <div className="card-actions"><button className="action-button" type="button" aria-label={`Editar ${cfg.singular}: ${item.titulo}`} onClick={() => openEditor(item)}>Editar</button><button className="action-button danger-action" type="button" aria-label={`Eliminar ${cfg.singular}: ${item.titulo}`} onClick={() => setDeleting(item)}>Eliminar</button></div>
            </div></article>)}</div>}
          {!loading && loaded && visible.length === 0 && <div className="empty-state"><div className="empty-icon" aria-hidden="true">{section === 'libros' ? '▤' : '♫'}</div><h3>{search ? 'No encontramos resultados' : `Todavía no hay ${cfg.plural}`}</h3><p>{search ? 'Prueba con otra palabra o borra la búsqueda.' : `Añade ${section === 'libros' ? 'el primero' : 'la primera'} para comenzar tu archivo.`}</p>{!search && <button className="button button-primary" onClick={() => openEditor()}>Añadir {cfg.singular}</button>}</div>}
        </section>
      </div>
    </main>
    {editing !== undefined && <div className="modal-layer"><div className="editor-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><form onSubmit={save} noValidate><div className="dialog-top"><div><p className="overline">TU COLECCIÓN</p><h2 id="dialog-title">{editing ? 'Editar' : 'Añadir'} {cfg.singular}</h2></div><button className="icon-button close-button" type="button" aria-label="Cerrar" onClick={() => setEditing(undefined)}>×</button></div>
      <div className="field"><label htmlFor="field-titulo">Título *</label><input id="field-titulo" value={form.titulo} onChange={event => setForm({ ...form, titulo: event.target.value })} maxLength="200" /></div>
      <div className="field"><label htmlFor="field-person">{section === 'libros' ? 'Autor' : 'Artista'} *</label><input id="field-person" value={form.person} onChange={event => setForm({ ...form, person: event.target.value })} maxLength="200" /></div>
      <div className="field-row"><div className="field"><label htmlFor="field-anio">Año *</label><input id="field-anio" type="number" value={form.anio} onChange={event => setForm({ ...form, anio: event.target.value })} /></div>{section === 'canciones' && <div className="field"><label htmlFor="field-genero">Género *</label><input id="field-genero" value={form.genero} onChange={event => setForm({ ...form, genero: event.target.value })} /></div>}</div>
      <div className="dialog-actions"><button className="button button-ghost" type="button" onClick={() => setEditing(undefined)}>Cancelar</button><button className="button button-primary" type="submit" disabled={saving}>Guardar {cfg.singular}</button></div>
    </form></div></div>}
    {deleting && <div className="modal-layer"><div className="delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title"><div className="delete-symbol">!</div><h2 id="delete-title">¿Eliminar este elemento?</h2><p>Se eliminará “{deleting.titulo}” de tu colección.</p><div className="dialog-actions"><button className="button button-ghost" type="button" onClick={() => setDeleting(null)}>Cancelar</button><button className="button button-danger" type="button" disabled={saving} onClick={remove}>Eliminar</button></div></div></div>}
  </div>;
}
