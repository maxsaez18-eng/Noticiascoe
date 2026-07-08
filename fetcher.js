const RssParser = require('rss-parser');
const db = require('./database');
const { translateArticle, resetRateLimit } = require('./translator');

const rssParser = new RssParser({
  timeout: 15000,
  headers: { 'User-Agent': 'AppNoticias/1.0' },
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail'],
      ['dc:creator', 'dcCreator'],
    ],
  },
});

function extractImage(item) {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item.media?.$?.url) return item.media.$.url;
  if (item.thumbnail?.$?.url) return item.thumbnail.$.url;
  const match = (item.content || item.description || '')
    .match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function extractDescription(content, maxLen = 300) {
  const clean = (content || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > maxLen ? clean.slice(0, maxLen) + '...' : clean;
}

async function fetchFuente(fuente) {
  try {
    const feed = await rssParser.parseURL(fuente.url);
    const items = feed.items || [];
    const resultados = [];

    for (const item of items) {
      const titulo = item.title?.trim();
      if (!titulo) continue;
      const url = item.link?.trim();
      if (!url) continue;

      resultados.push({
        titulo,
        descripcion: extractDescription(item.content || item.contentSnippet || item.description),
        contenido: item.content || item['content:encoded'] || null,
        url,
        fuente: fuente.nombre,
        autor: item.creator || item.dcCreator || null,
        imagen: extractImage(item),
        fecha_publicacion: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
      });
    }
    return resultados;
  } catch (err) {
    console.error(`Error fetching ${fuente.nombre}: ${err.message}`);
    return [];
  }
}

async function searchByKeyword(keyword, source = 'google') {
  const urls = {
    google: `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=es-419&gl=US&ceid=US:es-419`,
    bing: `https://www.bing.com/news/search?q=${encodeURIComponent(keyword)}&format=rss`,
  };
  const url = urls[source];
  if (!url) return [];
  try {
    const feed = await rssParser.parseURL(url);
    const items = feed.items || [];
    return items
      .map(item => ({
        titulo: item.title?.trim() || '',
        descripcion: extractDescription(item.content || item.contentSnippet || item.description),
        contenido: item.content || item['content:encoded'] || null,
        url: item.link?.trim() || '',
        fuente: `Búsqueda: ${keyword}`,
        autor: item.creator || item.dcCreator || null,
        imagen: extractImage(item),
        fecha_publicacion: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
      }))
      .filter(a => a.titulo && a.url);
  } catch (err) {
    console.error(`Error searching keyword "${keyword}" (${source}): ${err.message}`);
    return [];
  }
}

async function fetchAll() {
  resetRateLimit();
  const fuentes = await db.getActiveFuentes();
  const todas = [];

  // 1. Fetch from manually-added sources in parallel
  console.log(`Fetching ${fuentes.length} sources...`);
  const sourceResults = await Promise.allSettled(
    fuentes.map(fuente => fetchFuente(fuente))
  );
  for (const r of sourceResults) {
    if (r.status === 'fulfilled') todas.push(...r.value);
  }

  // 2. Search all keywords in both engines in parallel
  const palabras = await db.getActiveKeywords();
  if (palabras.length > 0) {
    console.log(`Searching ${palabras.length} keywords in Google + Bing...`);
    const searchPromises = [];
    for (const palabra of palabras) {
      for (const source of ['google', 'bing']) {
        searchPromises.push(
          searchByKeyword(palabra, source).then(items => {
            return items.filter(a => {
              const text = `${a.titulo} ${a.descripcion || ''}`.toLowerCase();
              return text.includes(palabra.toLowerCase());
            });
          })
        );
      }
    }
    const searchResults = await Promise.allSettled(searchPromises);
    for (const r of searchResults) {
      if (r.status === 'fulfilled') todas.push(...r.value);
    }
  }

  // 3. Translate articles in parallel (concurrency = 2)
  console.log(`Translating ${todas.length} articles...`);
  const traducidas = [];
  const CONCURRENCY = 2;
  for (let i = 0; i < todas.length; i += CONCURRENCY) {
    const batch = todas.slice(i, i + CONCURRENCY);
    const translations = await Promise.allSettled(
      batch.map(item => translateArticle(item))
    );
    for (const t of translations) {
      traducidas.push(t.status === 'fulfilled' ? t.value : t.reason);
    }
  }

  // 4. Save to database (deduplicated by URL)
  let nuevas = 0;
  for (const item of traducidas) {
    if (await db.insertNoticia(item)) nuevas++;
  }

  console.log(`Obtenidas ${todas.length}, guardadas nuevas: ${nuevas}`);
  return { total: todas.length, nuevas };
}

async function testFeed(url) {
  const feed = await rssParser.parseURL(url);
  if (!feed || !feed.items || feed.items.length === 0) {
    throw new Error('El feed no contiene artículos');
  }
}

module.exports = {
  fetchAll,
  testFeed,
  ...db,
};
