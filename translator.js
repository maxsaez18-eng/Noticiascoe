const cache = new Map();
let queue = Promise.resolve();
const DELAY = 1000;

function enqueue(task) {
  queue = queue.then(() => new Promise(r => setTimeout(r, DELAY))).then(task);
  return queue;
}

function needsTranslation(text) {
  if (!text || text.length < 10) return false;
  if (/[áéíóúüñ¿¡]/i.test(text)) return false;
  if (/\b(que|del|las|los|para|con|por|como|más|pero|este|esta|entre|todo|tiene|está|puede|años|dijo|sin|eso|ella|ellos|nos|sus|han|sea|ser|era|son|muy|ahora|hace|siempre|cada|otro|mismo|entonces|durante|además|desarrollo|noticia|información|sistema|proceso|resultado|problema|solución|relación|situación|decisión|parte|lugar|punto|nivel|área|grupo)/i
    .test(text)) return false;
  return true;
}

function getConfig() {
  try {
    const fs = require('fs');
    const path = require('path');
    const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'database.json'), 'utf-8'));
    const c = cfg.config || {};
    return {
      apiKey: c.translateApiKey || '',
      provider: c.translateProvider || 'mymemory',
    };
  } catch {
    return { apiKey: '', provider: 'mymemory' };
  }
}

async function translateMyMemory(text) {
  const cfg = getConfig();
  let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`;
  if (cfg.apiKey) url += `&key=${cfg.apiKey}`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`MyMemory HTTP ${resp.status}`);
  const data = await resp.json();

  if (data.responseStatus !== 200) {
    throw new Error(`MyMemory error: ${data.responseDetails || data.responseStatus}`);
  }
  return data.responseData.translatedText;
}

async function translateText(text, retry = 0) {
  if (!text || text.length < 2) return text;
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
    if (retry < 2) {
      await new Promise(r => setTimeout(r, 3000));
      return translateText(text, retry + 1);
    }
    console.log(`Translation unavailable (${err.message}), using original`);
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

function clearCache() {
  cache.clear();
}

module.exports = { translateArticle, translateText, clearCache };
