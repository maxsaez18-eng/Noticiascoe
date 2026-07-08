const RssParser = require('rss-parser');
const db = require('./database');
const { translateArticle } = require('./translator');

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

async function searchByKeyword(keyword) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=es-419&gl=US&ceid=US:es-419`;
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
    console.error(`Error searching keyword "${keyword}": ${err.message}`);
    return [];
  }
}

async function fetchAll() {
  const fuentes = await db.getActiveFuentes();
  const todas = [];

  // 1. Fetch from manually-added sources (no keyword filter — all articles pass)
  for (const fuente of fuentes) {
    console.log(`Fetching source: ${fuente.nombre}...`);
    const items = await fetchFuente(fuente);
    todas.push(...items);
  }

  // 2. Search by each active keyword via Google News RSS
  const palabras = await db.getActiveKeywords();
  for (const palabra of palabras) {
    console.log(`Searching keyword: ${palabra}...`);
    const items = await searchByKeyword(palabra);
    const filtered = items.filter(a => {
      const text = `${a.titulo} ${a.descripcion || ''}`.toLowerCase();
      return text.includes(palabra.toLowerCase());
    });
    todas.push(...filtered);
  }

  // 3. Translate (best-effort, skips on timeout/rate-limit)
  let traducidas = [];
  for (const item of todas) {
    const t = await translateArticle(item);
    traducidas.push(t);
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
