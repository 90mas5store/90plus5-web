// lib/api.js
const BASE = process.env.NEXT_PUBLIC_API_BASE || "";

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API fetch error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function getCatalog() {
  const url = `${BASE}?action=getCatalog`;
  return fetchJson(url);
}

export async function getConfig() {
  const url = `${BASE}?action=getConfig`;
  return fetchJson(url);
}

export async function getFeatured() {
  const url = `${BASE}?action=getFeatured`;
  return fetchJson(url);
}

export async function getProductById(id) {
  const url = `${BASE}?action=getProductById&id=${encodeURIComponent(id)}`;
  return fetchJson(url);
}

export async function getProductOptions({ liga, equipo }) {
  const url = `${BASE}?action=getProductOptions&liga=${encodeURIComponent(
    liga
  )}&equipo=${encodeURIComponent(equipo)}`;
  return fetchJson(url);
}
