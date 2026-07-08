const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/app-noticias';

const noticiaSchema = new mongoose.Schema({
  titulo:        { type: String, required: true },
  descripcion:   String,
  contenido:     String,
  url:           { type: String, required: true, unique: true },
  fuente:        String,
  autor:         String,
  imagen:        String,
  fecha_publicacion: { type: Date, default: Date.now },
  fecha_obtencion:   { type: Date, default: Date.now },
  leido:         { type: Boolean, default: false },
  leidoPor:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  favorito:      { type: Boolean, default: false },
  titulo_original:    String,
  descripcion_original: String,
  traducido:     { type: Boolean, default: false },
});

noticiaSchema.index({ fecha_publicacion: -1 });

const keywordSchema = new mongoose.Schema({
  palabra: { type: String, required: true, unique: true },
  activo:  { type: Boolean, default: true },
}, { timestamps: true });

const fuenteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  url:    { type: String, required: true, unique: true },
  tipo:   { type: String, default: 'rss' },
  activo: { type: Boolean, default: true },
}, { timestamps: true });

const configSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['admin', 'editor', 'viewer'], default: 'viewer' },
}, { timestamps: true });

let Noticia, Keyword, Fuente, Config, User;

async function connect(uri) {
  await mongoose.connect(uri);
  Noticia  = mongoose.model('Noticia', noticiaSchema);
  Keyword  = mongoose.model('Keyword', keywordSchema);
  Fuente   = mongoose.model('Fuente', fuenteSchema);
  Config   = mongoose.model('Config', configSchema);
  User     = mongoose.model('User', userSchema);
  await seedDefaults();
  await seedUsers();
}

async function seedDefaults() {
  const kwCount = await Keyword.countDocuments();
  if (kwCount === 0) {
    await Keyword.insertMany([
      { palabra: 'tecnología' },
      { palabra: 'inteligencia artificial' },
      { palabra: 'ciencia' },
      { palabra: 'ai' },
      { palabra: 'technology' },
    ]);
  }

  const fuCount = await Fuente.countDocuments();
  if (fuCount === 0) {
    await Fuente.insertMany([
      { nombre: 'TechCrunch',       url: 'https://techcrunch.com/feed/' },
      { nombre: 'Reddit r/technology', url: 'https://www.reddit.com/r/technology/.rss' },
      { nombre: 'BBC Technology',   url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
      { nombre: 'Hacker News',      url: 'https://hnrss.org/frontpage' },
      { nombre: 'Wired',            url: 'https://www.wired.com/feed/rss' },
      { nombre: 'The Verge',        url: 'https://www.theverge.com/rss/index.xml' },
      { nombre: 'ArsTechnica',      url: 'https://feeds.arstechnica.com/arstechnica/index' },
    ]);
  }
}

async function seedUsers() {
  const count = await User.countDocuments();
  if (count === 0) {
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username: 'admin', password: hash, role: 'admin' });
    console.log(`Usuario admin creado (password: ${password === process.env.ADMIN_PASSWORD ? 'de env' : 'admin123'})`);
  }
}

function ensureReady() {
  if (!Noticia) throw new Error('Database not connected. Call connect() first.');
}

// --- Auth ---

async function findUserByUsername(username) {
  ensureReady();
  return User.findOne({ username: username.toLowerCase().trim() });
}

async function createUser(username, password, role = 'viewer') {
  ensureReady();
  const hash = await bcrypt.hash(password, 10);
  return User.create({ username: username.toLowerCase().trim(), password: hash, role });
}

async function updateUser(id, updates) {
  ensureReady();
  if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);
  return User.findByIdAndUpdate(id, updates, { new: true });
}

async function updatePassword(userId, currentPassword, newPassword) {
  ensureReady();
  const user = await User.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw new Error('Contraseña actual incorrecta');
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return true;
}

async function getUsers() {
  ensureReady();
  return User.find().select('-password').sort({ username: 1 }).lean();
}

module.exports = {
  connect,

  // Noticias
  async insertNoticia(n) {
    ensureReady();
    const exists = await Noticia.findOne({ url: n.url });
    if (exists) {
      if (n.traducido && !exists.traducido) {
        exists.titulo = n.titulo;
        exists.descripcion = n.descripcion;
        exists.titulo_original = n.titulo_original;
        exists.descripcion_original = n.descripcion_original;
        exists.traducido = true;
        await exists.save();
        return true;
      }
      return false;
    }
    await Noticia.create(n);
    return true;
  },

  async getNoticias(limit = 50, offset = 0, search = '', userId = null) {
    ensureReady();
    let query = {};
    if (search) {
      const words = search.trim().split(/\s+/).filter(Boolean);
      const conditions = words.map(w => ({
        $or: [
          { titulo: { $regex: w, $options: 'i' } },
          { descripcion: { $regex: w, $options: 'i' } },
        ],
      }));
      query = { $and: conditions };
    }
    const items = await Noticia.find(query).sort({ fecha_publicacion: -1 }).skip(offset).limit(limit).lean();
    return items.map(item => {
      const leido = userId
        ? (item.leidoPor || []).some(id => id.toString() === userId)
        : item.leido;
      return { ...item, id: item._id.toString(), leido };
    });
  },

  async getNoticiasCount() {
    ensureReady();
    return Noticia.countDocuments();
  },

  async markLeido(id, userId = null) {
    ensureReady();
    if (userId) {
      const n = await Noticia.findById(id);
      if (n && !n.leidoPor.some(id => id.toString() === userId)) {
        n.leidoPor.push(userId);
        if (!n.leido) n.leido = true;
        await n.save();
      }
    } else {
      await Noticia.findByIdAndUpdate(id, { leido: true });
    }
  },

  async toggleFavorito(id) {
    ensureReady();
    const n = await Noticia.findById(id);
    if (n) { n.favorito = !n.favorito; await n.save(); return n.favorito; }
    return false;
  },

  async getUnreadCount(userId = null) {
    ensureReady();
    if (userId) {
      return Noticia.countDocuments({ leidoPor: { $ne: userId } });
    }
    return Noticia.countDocuments({ leido: false });
  },

  async markMultipleLeido(ids, leido = true, userId = null) {
    ensureReady();
    if (userId) {
      const items = await Noticia.find({ _id: { $in: ids } });
      for (const n of items) {
        if (leido) {
          if (!n.leidoPor.some(id => id.toString() === userId)) {
            n.leidoPor.push(userId);
          }
          n.leido = true;
        } else {
          n.leidoPor = n.leidoPor.filter(id => id.toString() !== userId);
          n.leido = n.leidoPor.length > 0;
        }
        await n.save();
      }
    } else {
      await Noticia.updateMany({ _id: { $in: ids } }, { leido });
    }
  },

  async getUltimaObtencion() {
    ensureReady();
    const n = await Noticia.findOne().sort({ fecha_obtencion: -1 }).select('fecha_obtencion').lean();
    return n ? n.fecha_obtencion : null;
  },

  // Keywords
  async getKeywords() {
    ensureReady();
    return Keyword.find().sort({ id: 1 }).lean();
  },

  async addKeyword(palabra) {
    ensureReady();
    const kw = palabra.toLowerCase().trim();
    if (!kw) return false;
    try {
      await Keyword.create({ palabra: kw });
      return true;
    } catch { return false; }
  },

  async removeKeyword(id) {
    ensureReady();
    await Keyword.findByIdAndDelete(id);
  },

  async toggleKeyword(id) {
    ensureReady();
    const kw = await Keyword.findById(id);
    if (kw) { kw.activo = !kw.activo; await kw.save(); }
  },

  async getActiveKeywords() {
    ensureReady();
    const kws = await Keyword.find({ activo: true }).lean();
    return kws.map(k => k.palabra);
  },

  // Fuentes
  async getFuentes() {
    ensureReady();
    return Fuente.find().sort({ id: 1 }).lean();
  },

  async addFuente(nombre, url, tipo) {
    ensureReady();
    try {
      await Fuente.create({ nombre, url, tipo: tipo || 'rss' });
      return true;
    } catch { return false; }
  },

  async removeFuente(id) {
    ensureReady();
    await Fuente.findByIdAndDelete(id);
  },

  async toggleFuente(id) {
    ensureReady();
    const f = await Fuente.findById(id);
    if (f) { f.activo = !f.activo; await f.save(); }
  },

  async getActiveFuentes() {
    ensureReady();
    return Fuente.find({ activo: true }).lean();
  },

  // Config
  async getConfig() {
    ensureReady();
    const entries = await Config.find().lean();
    const result = {};
    for (const e of entries) result[e.key] = e.value;
    return result;
  },

  async setConfig(key, value) {
    ensureReady();
    await Config.findOneAndUpdate({ key }, { value }, { upsert: true });
  },

  // Stats
  async getStats(userId = null) {
    ensureReady();
    const noLeidasQuery = userId ? { leidoPor: { $ne: userId } } : { leido: false };
    const [total, noLeidas, favoritas, traducidas, keywords, fuentes] = await Promise.all([
      Noticia.countDocuments(),
      Noticia.countDocuments(noLeidasQuery),
      Noticia.countDocuments({ favorito: true }),
      Noticia.countDocuments({ traducido: true }),
      Keyword.countDocuments({ activo: true }),
      Fuente.countDocuments({ activo: true }),
    ]);
    return { total, noLeidas, favoritas, traducidas, keywords, fuentes };
  },

  // Auth
  findUserByUsername,
  createUser,
  updateUser,
  updatePassword,
  getUsers,
};
