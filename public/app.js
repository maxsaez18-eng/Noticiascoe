const API = {
  noticias: (limit, offset) => fetch(`/api/noticias?limit=${limit}&offset=${offset || 0}`).then(r => r.json()),
  markLeido: id => fetch(`/api/noticias/${id}/leer`, { method: 'PATCH' }).then(r => r.json()),
  toggleFavorito: id => fetch(`/api/noticias/${id}/favorito`, { method: 'POST' }).then(r => r.json()),
  stats: () => fetch('/api/stats').then(r => r.json()),
  fetch: () => fetch('/api/fetch', { method: 'POST' }).then(r => r.json()),

  keywords: () => fetch('/api/keywords').then(r => r.json()),
  addKeyword: palabra => fetch('/api/keywords', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ palabra }) }).then(r => r.json()),
  deleteKeyword: id => fetch(`/api/keywords/${id}`, { method: 'DELETE' }).then(r => r.json()),
  toggleKeyword: id => fetch(`/api/keywords/${id}/toggle`, { method: 'POST' }).then(r => r.json()),

  fuentes: () => fetch('/api/fuentes').then(r => r.json()),
  addFuente: (nombre, url, tipo) => fetch('/api/fuentes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, url, tipo }) }).then(r => r.json()),
  deleteFuente: id => fetch(`/api/fuentes/${id}`, { method: 'DELETE' }).then(r => r.json()),
  toggleFuente: id => fetch(`/api/fuentes/${id}/toggle`, { method: 'POST' }).then(r => r.json()),
};

// Notificaciones
function showNotification(msg) {
  const el = document.getElementById('notification');
  document.getElementById('notifMsg').textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

document.getElementById('notifClose').onclick = () => {
  document.getElementById('notification').classList.add('hidden');
};

// WebSocket
let ws;
function connectWS() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}`);
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === 'new_noticias') {
      showNotification(`${data.count} noticia(s) nueva(s) disponible(s)`);
      loadFeed();
      updateStats();
    }
    if (data.type === 'config_update') {
      loadKeywords();
      loadSources();
    }
  };
  ws.onclose = () => setTimeout(connectWS, 2000);
}
connectWS();

// Navegación
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById(`view-${btn.dataset.view}`);
    if (view) view.classList.add('active');
  });
});

// Feed
async function loadFeed(append = false) {
  const feedEl = document.getElementById('feed');
  if (!append) feedEl.innerHTML = '<div class="loading">Cargando noticias...</div>';

  try {
    const noticias = await API.noticias(50, append ? feedEl.children.length : 0);
    if (!append) feedEl.innerHTML = '';

    if (noticias.length === 0) {
      if (!append) feedEl.innerHTML = '<div class="loading">No hay noticias aún. Sincroniza para obtener las primeras.</div>';
      return;
    }

    for (const n of noticias) {
      const card = createCard(n);
      feedEl.appendChild(card);
    }

    updateUnreadBadge();
  } catch (err) {
    feedEl.innerHTML = '<div class="loading">Error al cargar noticias</div>';
  }
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString();
}

function createCard(n) {
  const card = document.createElement('div');
  card.className = `news-card${n.leido ? '' : ' unread'}`;
  card.dataset.id = n.id;
  const traducido = !!n.traducido;
  const tituloActual = n.titulo || n.titulo_original;
  const descActual = n.descripcion || n.descripcion_original;

  card.innerHTML = `
    <div class="card-header">
      <span class="card-source">${escHtml(n.fuente || 'Desconocido')}</span>
      <span class="card-date">${timeAgo(n.fecha_publicacion)}</span>
    </div>
    ${traducido ? '<span class="trans-badge">TRADUCIDO</span>' : ''}
    <div class="card-title">${escHtml(tituloActual)}</div>
    ${descActual ? `<div class="card-desc">${escHtml(descActual)}</div>` : ''}
    <div class="card-footer">
      <span class="card-author">${n.autor ? escHtml(n.autor) : ''}</span>
      <div class="card-actions">
        ${traducido ? `<button class="orig-btn">Ver original</button>` : ''}
        <button class="fav-btn${n.favorito ? ' favorito' : ''}" title="Favorito">${n.favorito ? '♥' : '♡'}</button>
        <button class="open-btn" title="Abrir enlace">↗</button>
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (e.target.closest('.card-actions') || e.target.closest('.orig-btn')) return;
    API.markLeido(n.id);
    card.classList.remove('unread');
    updateUnreadBadge();
  });

  card.querySelector('.fav-btn')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const res = await API.toggleFavorito(n.id);
    const btn = e.target;
    btn.textContent = res.favorito ? '♥' : '♡';
    btn.classList.toggle('favorito', res.favorito);
  });

  card.querySelector('.open-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    window.open(n.url, '_blank');
  });

  card.querySelector('.orig-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const titleEl = card.querySelector('.card-title');
    const descEl = card.querySelector('.card-desc');
    const btn = e.target;
    if (btn.dataset.showingOriginal === 'true') {
      titleEl.textContent = escHtml(n.titulo || n.titulo_original);
      if (descEl) descEl.textContent = escHtml(n.descripcion || n.descripcion_original);
      btn.textContent = 'Ver original';
      btn.dataset.showingOriginal = 'false';
    } else {
      titleEl.textContent = escHtml(n.titulo_original);
      if (descEl && n.descripcion_original) {
        descEl.origText = descEl.textContent;
        descEl.textContent = escHtml(n.descripcion_original);
      }
      btn.textContent = 'Ver traducido';
      btn.dataset.showingOriginal = 'true';
    }
  });

  return card;
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Unread badge
async function updateUnreadBadge() {
  try {
    const res = await API.stats();
    document.getElementById('unreadBadge').textContent = res.noLeidas;
  } catch {}
}

document.getElementById('markAllReadBtn').addEventListener('click', async () => {
  document.querySelectorAll('.news-card.unread').forEach(c => {
    const id = parseInt(c.dataset.id);
    API.markLeido(id);
    c.classList.remove('unread');
  });
  updateUnreadBadge();
});

// Sincronizar
document.getElementById('refreshBtn').addEventListener('click', async function () {
  this.disabled = true;
  this.textContent = '↻ Sincronizando...';
  try {
    const result = await API.fetch();
      showNotification(`Sincronizado: ${result.nuevas} nuevas noticias`);
    loadFeed();
    updateStats();
    document.getElementById('lastUpdate').textContent = `Última: ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    showNotification('Error al sincronizar');
  }
  this.disabled = false;
  this.textContent = '↻ Sincronizar Ahora';
});

// Palabras clave
async function loadKeywords() {
  const list = document.getElementById('keywordsList');
  try {
    const kws = await API.keywords();
    list.innerHTML = kws.map(k => `
      <div class="keyword-item">
        <span class="kw-name">${escHtml(k.palabra)}</span>
        <div class="kw-actions">
          <button class="toggle-btn ${k.activo ? 'active' : 'inactive'}" data-id="${k.id}">
            ${k.activo ? '✓ Activo' : '○ Inactivo'}
          </button>
          <button class="delete-btn" data-id="${k.id}">✕</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await API.toggleKeyword(parseInt(btn.dataset.id));
        loadKeywords();
      });
    });

    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await API.deleteKeyword(parseInt(btn.dataset.id));
        loadKeywords();
      });
    });
  } catch {}
}

document.getElementById('addKeywordBtn').addEventListener('click', async () => {
  const input = document.getElementById('keywordInput');
  const palabra = input.value.trim();
  if (!palabra) return;
  input.value = '';
  try {
    await API.addKeyword(palabra);
    loadKeywords();
  } catch {
    showNotification('Esa palabra ya existe');
  }
});

document.getElementById('keywordInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('addKeywordBtn').click();
});

// Fuentes
async function loadSources() {
  const list = document.getElementById('sourcesList');
  try {
    const srcs = await API.fuentes();
    list.innerHTML = srcs.map(s => `
      <div class="source-item">
        <div class="src-info">
          <span class="src-name">${escHtml(s.nombre)}</span>
          <span class="src-url">${escHtml(s.url)}</span>
        </div>
        <div class="src-actions">
          <button class="toggle-btn ${s.activo ? 'active' : 'inactive'}" data-id="${s.id}">
            ${s.activo ? '✓ Activo' : '○ Inactivo'}
          </button>
          <button class="delete-btn" data-id="${s.id}">✕</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await API.toggleFuente(parseInt(btn.dataset.id));
        loadSources();
      });
    });

    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await API.deleteFuente(parseInt(btn.dataset.id));
        loadSources();
      });
    });
  } catch {}
}

document.getElementById('addSourceBtn').addEventListener('click', async () => {
  const name = document.getElementById('sourceName').value.trim();
  const url = document.getElementById('sourceUrl').value.trim();
    if (!name || !url) return showNotification('Completa nombre y URL');
  document.getElementById('sourceName').value = '';
  document.getElementById('sourceUrl').value = '';
  try {
    await API.addFuente(name, url, 'rss');
    loadSources();
    showNotification('Fuente agregada');
  } catch {
    showNotification('Esa URL ya existe');
  }
});

// Stats
async function updateStats() {
  try {
    const stats = await API.stats();
    document.getElementById('statsContent').innerHTML = `
      <div class="stat-card"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Noticias</div></div>
      <div class="stat-card"><div class="stat-value">${stats.noLeidas}</div><div class="stat-label">Sin Leer</div></div>
      <div class="stat-card"><div class="stat-value">${stats.favoritas}</div><div class="stat-label">Favoritas</div></div>
      <div class="stat-card"><div class="stat-value">${stats.traducidas || 0}</div><div class="stat-label">Traducidas</div></div>
      <div class="stat-card"><div class="stat-value">${stats.keywords}</div><div class="stat-label">Keywords Activas</div></div>
      <div class="stat-card"><div class="stat-value">${stats.fuentes}</div><div class="stat-label">Fuentes Activas</div></div>
    `;
  } catch {}
}

// Init
loadFeed();
loadKeywords();
loadSources();
updateStats();
updateUnreadBadge();
