const express = require('express');
const http = require('http');
const bcrypt = require('bcryptjs');
const { WebSocketServer } = require('ws');
const path = require('path');
const db = require('./database');
const fetcher = require('./fetcher');
const { generateToken, verifyToken, optionalToken, requireRole } = require('./auth');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/app-noticias';

app.use(express.json());

// Serve Expo web build
const webBuild = path.join(__dirname, 'app', 'dist');
app.use(express.static(webBuild, {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.ttf')) res.setHeader('Content-Type', 'font/ttf');
    if (filePath.endsWith('.woff')) res.setHeader('Content-Type', 'font/woff');
    if (filePath.endsWith('.woff2')) res.setHeader('Content-Type', 'font/woff2');
  }
}));

// WebSocket
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

async function tryAutoFetch() {
  try {
    const ultima = await fetcher.getUltimaObtencion();
    if (!ultima || Date.now() - new Date(ultima).getTime() > 6 * 60 * 60 * 1000) {
      console.log('[Auto-fetch] >6h since last fetch, fetching now...');
      const result = await fetcher.fetchAll();
      if (result.nuevas > 0) broadcast({ type: 'new_noticias', count: result.nuevas });
      return result;
    }
  } catch (err) {
    console.error('[Auto-fetch] Error:', err.message);
  }
  return null;
}

// --- Auth routes ---

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  const user = await db.findUserByUsername(username);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = generateToken(user);
  res.json({ token, user: { id: user._id.toString(), username: user.username, role: user.role } });
});

app.post('/api/auth/register', verifyToken, requireRole('admin'), async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  try {
    const user = await db.createUser(username, password, role || 'viewer');
    res.json({ user: { id: user._id.toString(), username: user.username, role: user.role } });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'El usuario ya existe' });
    throw e;
  }
});

app.get('/api/auth/users', verifyToken, requireRole('admin'), async (req, res) => {
  res.json(await db.getUsers());
});

app.patch('/api/auth/users/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const { password, role } = req.body;
  const updates = {};
  if (password) updates.password = password;
  if (role) updates.role = role;
  const user = await db.updateUser(req.params.id, updates);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user: { id: user._id.toString(), username: user.username, role: user.role } });
});

app.get('/api/auth/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// --- API endpoints ---

app.get('/api/noticias', optionalToken, async (req, res) => {
  await tryAutoFetch();
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search || '';
  const userId = req.user ? req.user.id : null;
  res.json(await fetcher.getNoticias(limit, offset, search, userId));
});

app.patch('/api/noticias/bulk/leer', optionalToken, async (req, res) => {
  const { ids, leido } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Se requiere un array de ids' });
  const userId = req.user ? req.user.id : null;
  await fetcher.markMultipleLeido(ids, leido !== false, userId);
  broadcast({ type: 'bulk_update' });
  res.json({ ok: true });
});

app.patch('/api/noticias/:id/leer', optionalToken, async (req, res) => {
  const userId = req.user ? req.user.id : null;
  await fetcher.markLeido(req.params.id, userId);
  res.json({ ok: true });
});

app.post('/api/noticias/:id/favorito', async (req, res) => {
  const estado = await fetcher.toggleFavorito(req.params.id);
  res.json({ favorito: estado });
});

app.get('/api/stats', optionalToken, async (req, res) => {
  const userId = req.user ? req.user.id : null;
  res.json(await fetcher.getStats(userId));
});

app.get('/api/config', async (req, res) => {
  res.json(await fetcher.getConfig());
});

app.post('/api/config', async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: 'Key requerida' });
  await fetcher.setConfig(key, value);
  res.json({ ok: true });
});

app.get('/api/keywords', async (req, res) => {
  res.json(await fetcher.getKeywords());
});

app.post('/api/keywords', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  const { palabra } = req.body;
  if (!palabra) return res.status(400).json({ error: 'Palabra requerida' });
  const ok = await fetcher.addKeyword(palabra);
  if (!ok) return res.status(409).json({ error: 'La palabra ya existe' });
  broadcast({ type: 'config_update' });
  res.json(await fetcher.getKeywords());
});

app.delete('/api/keywords/:id', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  await fetcher.removeKeyword(req.params.id);
  broadcast({ type: 'config_update' });
  res.json({ ok: true });
});

app.post('/api/keywords/:id/toggle', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  await fetcher.toggleKeyword(req.params.id);
  broadcast({ type: 'config_update' });
  res.json({ ok: true });
});

app.get('/api/fuentes', async (req, res) => {
  res.json(await fetcher.getFuentes());
});

app.post('/api/fuentes', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  const { nombre, url, tipo } = req.body;
  if (!nombre || !url) return res.status(400).json({ error: 'Nombre y URL requeridos' });
  try {
    await fetcher.testFeed(url);
  } catch (e) {
    return res.status(400).json({ error: 'No se pudo leer el feed RSS: ' + e.message });
  }
  const ok = await fetcher.addFuente(nombre, url, tipo);
  if (!ok) return res.status(409).json({ error: 'La URL ya existe' });
  broadcast({ type: 'config_update' });
  res.json(await fetcher.getFuentes());
});

app.delete('/api/fuentes/:id', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  await fetcher.removeFuente(req.params.id);
  broadcast({ type: 'config_update' });
  res.json({ ok: true });
});

app.post('/api/fuentes/:id/toggle', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  await fetcher.toggleFuente(req.params.id);
  broadcast({ type: 'config_update' });
  res.json({ ok: true });
});

app.post('/api/fetch', async (req, res) => {
  try {
    const result = await fetcher.fetchAll();
    broadcast({ type: 'new_noticias', count: result.nuevas });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cron', async (req, res) => {
  try {
    console.log('[Cron-job] Fetching news...');
    const result = await fetcher.fetchAll();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(webBuild, 'index.html'), (err) => {
    if (err) res.json({ error: 'Not found', api: 'available at /api/*' });
  });
});

async function start() {
  await db.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  const SIX_HOURS = 6 * 60 * 60 * 1000;
  setInterval(async () => {
    console.log('[Cron] Auto-fetch cada 6h...');
    try {
      const r = await fetcher.fetchAll();
      if (r.nuevas > 0) broadcast({ type: 'new_noticias', count: r.nuevas });
      console.log(`[Cron] ${r.nuevas} nuevas noticias`);
    } catch (err) {
      console.error('[Cron] Error:', err.message);
    }
  }, SIX_HOURS);

  server.listen(PORT, () => {
    console.log(`App de Noticias corriendo en http://localhost:${PORT}`);
    fetcher.fetchAll().then(r => {
      console.log(`Primera carga: ${r.nuevas} noticias nuevas`);
      if (r.nuevas > 0) broadcast({ type: 'new_noticias', count: r.nuevas });
    }).catch(console.error);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
