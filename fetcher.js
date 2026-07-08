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

function getTextToFilter(article) {
  return `${article.titulo_original || article.titulo} ${article.descripcion_original || article.descripcion || ''} ${article.titulo} ${article.descripcion || ''}`.toLowerCase();
}

async function filtrar(noticias) {
  const palabras = await db.getActiveKeywords();
  if (palabras.length === 0) return noticias;
  return noticias.filter(n => {
    const text = getTextToFilter(n);
    return palabras.some(p => text.includes(p));
  });
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

async function fetchAll() {
  const fuentes = await db.getActiveFuentes();
  const todas = [];

  for (const fuente of fuentes) {
    console.log(`Fetching: ${fuente.nombre}...`);
    const items = await fetchFuente(fuente);
    todas.push(...items);
  }

  const preliminares = await filtrar(todas);
  console.log(`  Coinciden keywords en texto original: ${preliminares.length} de ${todas.length}`);

  let traducidas = [];
  for (const item of preliminares) {
    const t = await translateArticle(item);
    traducidas.push(t);
  }

  const finales = await filtrar(traducidas);
  console.log(`  Coinciden keywords en texto traducido: ${finales.length} de ${traducidas.length}`);

  let nuevas = 0;
  for (const item of finales) {
    if (await db.insertNoticia(item)) nuevas++;
  }

  console.log(`Obtenidas ${todas.length}, pasaron filtro: ${finales.length}, nuevas: ${nuevas}`);
  return { total: todas.length, filtradas: finales.length, nuevas };
}

module.exports = {
  fetchAll,
  ...db,
};
