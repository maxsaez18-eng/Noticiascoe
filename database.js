const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/app-noticias';

// --- Schemas ---

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

let Noticia, Keyword, Fuente, Config;

async function connect(uri) {
  await mongoose.connect(uri);
  Noticia  = mongoose.model('Noticia', noticiaSchema);
  Keyword  = mongoose.model('Keyword', keywordSchema);
  Fuente   = mongoose.model('Fuente', fuenteSchema);
  Config   = mongoose.model('Config', configSchema);
  await seedDefaults();
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

function ensureReady() {
  if (!Noticia) throw new Error('Database not connected. Call connect() first.');
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

  async getNoticias(limit = 50, offset = 0) {
    ensureReady();
    const items = await Noticia.find().sort({ fecha_publicacion: -1 }).skip(offset).limit(limit).lean();
    return items.map(item => ({ ...item, id: item._id.toString() }));
  },

  async getNoticiasCount() {
    ensureReady();
    return Noticia.countDocuments();
  },

  async markLeido(id) {
    ensureReady();
    await Noticia.findByIdAndUpdate(id, { leido: true });
  },

  async toggleFavorito(id) {
    ensureReady();
    const n = await Noticia.findById(id);
    if (n) { n.favorito = !n.favorito; await n.save(); return n.favorito; }
    return false;
  },

  async getUnreadCount() {
    ensureReady();
    return Noticia.countDocuments({ leido: false });
  },

  async markMultipleLeido(ids, leido = true) {
    ensureReady();
    await Noticia.updateMany({ _id: { $in: ids } }, { leido });
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
  async getStats() {
    ensureReady();
    const [total, noLeidas, favoritas, traducidas, keywords, fuentes] = await Promise.all([
      Noticia.countDocuments(),
      Noticia.countDocuments({ leido: false }),
      Noticia.countDocuments({ favorito: true }),
      Noticia.countDocuments({ traducido: true }),
      Keyword.countDocuments({ activo: true }),
      Fuente.countDocuments({ activo: true }),
    ]);
    return { total, noLeidas, favoritas, traducidas, keywords, fuentes };
  },
};
