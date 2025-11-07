// src/lib/api.js

/**
 * API Helper para 90+5 Store
 * Centraliza las peticiones al backend (Google Apps Script)
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://script.google.com/macros/s/AKfycbx3RYRMJ8vz_cfc_jhZh3t6FciJ3iszAMh83enMkv8dvBmz8uQonQ_nMCkBVK7jQDNkwg/exec";

/** Helper para manejar errores */
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error en fetch: ${res.statusText}`);
  return res.json();
}

/** Obtener catálogo completo */
export async function getCatalog() {
  return fetchJSON(`${BASE_URL}?action=getCatalog`);
}

/** Obtener configuración global (ligas, banners, etc.) */
export async function getConfig() {
  return fetchJSON(`${BASE_URL}?action=getConfig`);
}

/** Obtener productos destacados */
export async function getFeatured() {
  return fetchJSON(`${BASE_URL}?action=getFeatured`);
}

/** Obtener un producto por ID */
export async function getProductById(id) {
  if (!id) throw new Error("ID no proporcionado");
  return fetchJSON(`${BASE_URL}?action=getProductById&id=${encodeURIComponent(id)}`);
}

/** Obtener opciones del producto (versiones, tallas, dorsales, parches, etc.) */
export async function getProductOptions(liga, equipo) {
  if (!liga || !equipo) return {};
  return fetchJSON(
    `${BASE_URL}?action=getProductOptions&liga=${encodeURIComponent(
      liga
    )}&equipo=${encodeURIComponent(equipo)}`
  );
}
