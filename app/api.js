const BASE_URL = '';

export async function getNoticias(limit = 50, offset = 0) {
  try {
    const res = await fetch(`${BASE_URL}/api/noticias?limit=${limit}&offset=${offset}`, { cache: 'no-cache' });
    return await res.json();
  } catch { return []; }
}

export async function markLeido(id) {
  try { await fetch(`${BASE_URL}/api/noticias/${id}/leer`, { method: 'PATCH' }); } catch {}
}

export async function markBulkLeido(ids, leido = true) {
  try {
    await fetch(`${BASE_URL}/api/noticias/bulk/leer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, leido }),
    });
  } catch {}
}

export async function toggleFavorito(id) {
  const res = await fetch(`${BASE_URL}/api/noticias/${id}/favorito`, { method: 'POST' });
  return res.json();
}

export async function getStats() {
  const res = await fetch(`${BASE_URL}/api/stats`);
  return res.json();
}

export async function fetchNews() {
  try {
    const res = await fetch(`${BASE_URL}/api/fetch`, { method: 'POST' });
    return await res.json();
  } catch { return { error: 'fetch failed' }; }
}

export async function getKeywords() {
  const res = await fetch(`${BASE_URL}/api/keywords`);
  return res.json();
}

export async function addKeyword(palabra) {
  const res = await fetch(`${BASE_URL}/api/keywords`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ palabra }),
  });
  return res.json();
}

export async function deleteKeyword(id) {
  try { await fetch(`${BASE_URL}/api/keywords/${id}`, { method: 'DELETE' }); } catch {}
}

export async function toggleKeyword(id) {
  try { await fetch(`${BASE_URL}/api/keywords/${id}/toggle`, { method: 'POST' }); } catch {}
}

export async function getFuentes() {
  const res = await fetch(`${BASE_URL}/api/fuentes`);
  return res.json();
}

export async function addFuente(nombre, url, tipo) {
  const res = await fetch(`${BASE_URL}/api/fuentes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, url, tipo }),
  });
  return res.json();
}

export async function deleteFuente(id) {
  try { await fetch(`${BASE_URL}/api/fuentes/${id}`, { method: 'DELETE' }); } catch {}
}

export async function toggleFuente(id) {
  try { await fetch(`${BASE_URL}/api/fuentes/${id}/toggle`, { method: 'POST' }); } catch {}
}
