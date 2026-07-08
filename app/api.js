// Change this to your Render URL when deployed
const BASE_URL = 'http://localhost:3000';

export async function getNoticias(limit = 50, offset = 0) {
  const res = await fetch(`${BASE_URL}/api/noticias?limit=${limit}&offset=${offset}`);
  return res.json();
}

export async function markLeido(id) {
  await fetch(`${BASE_URL}/api/noticias/${id}/leer`, { method: 'PATCH' });
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
  const res = await fetch(`${BASE_URL}/api/fetch`, { method: 'POST' });
  return res.json();
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
  await fetch(`${BASE_URL}/api/keywords/${id}`, { method: 'DELETE' });
}

export async function toggleKeyword(id) {
  await fetch(`${BASE_URL}/api/keywords/${id}/toggle`, { method: 'POST' });
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
  await fetch(`${BASE_URL}/api/fuentes/${id}`, { method: 'DELETE' });
}

export async function toggleFuente(id) {
  await fetch(`${BASE_URL}/api/fuentes/${id}/toggle`, { method: 'POST' });
}
