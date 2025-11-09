// src/lib/userApi.js

/**
 * Helpers para llamadas relacionadas con usuario / pedidos
 * Compatible con el mismo endpoint de Google Apps Script usado en src/lib/api.js
 *
 * Agregar token opcional (bearer) es sencillo: pasar { token } en options.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://script.google.com/macros/s/AKfycbx3RYRMJ8vz_cfc_jhZh3t6FciJ3iszAMh83enMkv8dvBmz8uQonQ_nMCkBVK7jQDNkwg/exec";

/** Helper fetch + errores */
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch error ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

/**
 * Construye headers (incluye Authorization si token está presente)
 */
function buildHeaders(token) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/**
 * Obtener perfil del usuario.
 * - Puede recibir userId o email. Si no se pasa nada, esperar que el backend use sesión.
 *
 * @param {Object} opts
 * @param {string} [opts.userId]
 * @param {string} [opts.email]
 * @param {string} [opts.token] optional bearer token
 * @returns {Promise<Object>}
 */
export async function getUserProfile({ userId, email, token } = {}) {
  const q = userId
    ? `&userId=${encodeURIComponent(userId)}`
    : email
    ? `&email=${encodeURIComponent(email)}`
    : "";
  const url = `${BASE_URL}?action=getUserProfile${q}`;
  return fetchJSON(url, { headers: buildHeaders(token) });
}

/**
 * Obtener historial de pedidos de un usuario.
 * - Preferible pasar userId; si no, backend puede resolver por sesión o email.
 *
 * @param {Object} opts
 * @param {string} [opts.userId]
 * @param {string} [opts.email]
 * @param {string} [opts.token]
 * @returns {Promise<Array>}
 */
export async function getUserOrders({ userId, email, token } = {}) {
  const q = userId
    ? `&userId=${encodeURIComponent(userId)}`
    : email
    ? `&email=${encodeURIComponent(email)}`
    : "";
  const url = `${BASE_URL}?action=getUserOrders${q}`;
  return fetchJSON(url, { headers: buildHeaders(token) });
}

/**
 * Crear/actualizar perfil de usuario (upsert).
 * - body: objeto con los campos que quieras guardar { userId, nombre, email, telefono, direccion, ... }
 *
 * @param {Object} body
 * @param {string} [token]
 * @returns {Promise<Object>}
 */
export async function upsertUserProfile(body = {}, token) {
  const url = `${BASE_URL}?action=upsertUserProfile`;
  return fetchJSON(url, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });
}

/**
 * Marcar pedido como recibido / actualizar estado (para admin / webhooks).
 * - body: { orderId, estado, notas }
 *
 * @param {Object} body
 * @param {string} [token]
 * @returns {Promise<Object>}
 */
export async function updateOrderStatus(body = {}, token) {
  const url = `${BASE_URL}?action=updateOrderStatus`;
  return fetchJSON(url, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });
}

/**
 * Ejemplo de login simulado (si necesitás un endpoint para auth).
 * - Implementalo en tu Google Script si querés un login real.
 */
export async function loginWithEmail({ email, password } = {}) {
  const url = `${BASE_URL}?action=login`;
  return fetchJSON(url, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ email, password }),
  });
}
