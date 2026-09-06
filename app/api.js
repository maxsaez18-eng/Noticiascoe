import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredUrl = Constants.expoConfig?.extra?.apiUrl || '';
const useOrigin = Platform.OS === 'web' && typeof window !== 'undefined' && window.location && window.location.origin && !configuredUrl;
const BASE_URL = useOrigin ? window.location.origin : configuredUrl;

let cachedToken = null;

async function getToken() {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem('@app-noticias:auth-token');
  return cachedToken;
}

export function setCachedToken(t) {
  cachedToken = t;
}

export function clearCachedToken() {
  cachedToken = null;
}

async function authHeaders() {
  const token = await getToken();
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function apiFetch(url, options = {}) {
  const headers = await authHeaders();
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  return res.json();
}

// --- Auth ---

export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function register(username, password, role = 'viewer') {
  return apiFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ username, password, role }),
  });
}

export async function getUsers() {
  return apiFetch(`${BASE_URL}/api/auth/users`);
}

export async function updateUser(id, updates) {
  return apiFetch(`${BASE_URL}/api/auth/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function changePassword(currentPassword, newPassword) {
  return apiFetch(`${BASE_URL}/api/auth/me/password`, {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// --- Noticias ---

export async function getNoticias(limit = 50, offset = 0, search = '') {
  try {
    let url = `${BASE_URL}/api/noticias?limit=${limit}&offset=${offset}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const headers = await authHeaders();
    const res = await fetch(url, { cache: 'no-cache', headers });
    return await res.json();
  } catch { return []; }
}

export async function markLeido(id) {
  try {
    const headers = await authHeaders();
    await fetch(`${BASE_URL}/api/noticias/${id}/leer`, { method: 'PATCH', headers });
  } catch {}
}

export async function markBulkLeido(ids, leido = true) {
  try {
    const headers = await authHeaders();
    await fetch(`${BASE_URL}/api/noticias/bulk/leer`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ ids, leido }),
    });
  } catch {}
}

export async function toggleFavorito(id) {
  const res = await fetch(`${BASE_URL}/api/noticias/${id}/favorito`, { method: 'POST' });
  return res.json();
}

export async function getStats() {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/stats`, { headers });
  return res.json();
}

export async function fetchNews() {
  try {
    const res = await fetch(`${BASE_URL}/api/fetch`, { method: 'POST' });
    return await res.json();
  } catch { return { error: 'fetch failed' }; }
}

// --- Keywords ---

export async function getKeywords() {
  const res = await fetch(`${BASE_URL}/api/keywords`);
  return res.json();
}

export async function addKeyword(palabra) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/keywords`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ palabra }),
  });
  return res.json();
}

export async function deleteKeyword(id) {
  try {
    const headers = await authHeaders();
    await fetch(`${BASE_URL}/api/keywords/${id}`, { method: 'DELETE', headers });
  } catch {}
}

export async function toggleKeyword(id) {
  try {
    const headers = await authHeaders();
    await fetch(`${BASE_URL}/api/keywords/${id}/toggle`, { method: 'POST', headers });
  } catch {}
}

// --- Fuentes ---

export async function getFuentes() {
  const res = await fetch(`${BASE_URL}/api/fuentes`);
  return res.json();
}

export async function addFuente(nombre, url, tipo) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/fuentes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ nombre, url, tipo }),
  });
  return res.json();
}

export async function deleteFuente(id) {
  try {
    const headers = await authHeaders();
    await fetch(`${BASE_URL}/api/fuentes/${id}`, { method: 'DELETE', headers });
  } catch {}
}

export async function toggleFuente(id) {
  try {
    const headers = await authHeaders();
    await fetch(`${BASE_URL}/api/fuentes/${id}/toggle`, { method: 'POST', headers });
  } catch {}
}
