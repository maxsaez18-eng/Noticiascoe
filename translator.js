const cache = new Map();

const DELAY = 200;
const MYMEMORY_TIMEOUT = 5000;
let rateLimited = false;

let queue = Promise.resolve();

function enqueue(task) {
  queue = queue.then(() => new Promise(r => setTimeout(r, DELAY))).then(task);
  return queue;
}

function needsTranslation(text) {
  if (!text || text.length < 10) return false;
  if (/[áéíóúüñ¿¡]/i.test(text)) return false;
  if (/\b(que|del|las|los|para|con|por|como|más|pero|este|esta|entre|todo|tiene|está|puede|años|sin|eso|ella|ellos|nos|sus|han|sea|ser|era|son|muy|ahora|hace|siempre|cada|otro|mismo|entonces|durante|además|desarrollo|noticia|información|sistema|proceso|resultado|problema|solución|relación|situación|decisión|parte|lugar|punto|nivel|área|grupo)/i
    .test(text)) return false;
  return true;
}

async function translateMyMemory(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MYMEMORY_TIMEOUT);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.responseStatus !== 200) throw new Error(data.responseDetails || 'Unknown');
    return data.responseData.translatedText;
  } finally {
    clearTimeout(timer);
  }
}

async function translateText(text, retry = 0) {
  if (!text || text.length < 2) return text;
  if (rateLimited) return text;
  const trimmed = text.trim();
  const cacheKey = trimmed.toLowerCase().slice(0, 200);
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  if (!needsTranslation(trimmed)) {
    cache.set(cacheKey, trimmed);
    return trimmed;
  }
  try {
    const translated = await enqueue(() => translateMyMemory(trimmed));
    cache.set(cacheKey, translated);
    return translated;
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'timeout' : err.message;
    if (msg.includes('429')) {
      rateLimited = true;
      console.log(`  [TL] Rate-limited (429), skipping remaining translations`);
      return text;
    }
    if (retry < 2) {
      await new Promise(r => setTimeout(r, 2000));
      return translateText(text, retry + 1);
    }
    console.log(`  [TL] Skipped: ${msg}`);
    return text;
  }
}

async function translateArticle(article) {
  if (article.traducido) return article;
  const titulo = await translateText(article.titulo);
  let descripcion = article.descripcion;
  if (article.descripcion && titulo !== article.titulo) {
    descripcion = await translateText(article.descripcion);
  }
  return {
    ...article,
    titulo_original: article.titulo,
    descripcion_original: article.descripcion,
    titulo,
    descripcion,
    traducido: titulo !== article.titulo,
  };
}

function resetRateLimit() {
  rateLimited = false;
}

module.exports = { translateArticle, resetRateLimit };
