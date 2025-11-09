/**
 * API Helper con caché inteligente para 90+5 Store
 * ------------------------------------------------
 * Combina:
 *  1️⃣ Cache en memoria (instantáneo entre rutas)
 *  2️⃣ sessionStorage persistente (sobrevive refresh)
 *  3️⃣ Revalidación silenciosa en background
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://script.google.com/macros/s/AKfycbx3RYRMJ8vz_cfc_jhZh3t6FciJ3iszAMh83enMkv8dvBmz8uQonQ_nMCkBVK7jQDNkwg/exec";

/* 🧰 Helper base */
async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Error en fetch: ${res.statusText}`);
  return res.json();
}

/* 🧠 Cache global en memoria (solo vive mientras la app está abierta) */
const memoryCache = {
  catalog: null,
  config: null,
  featured: null,
  lastUpdated: null,
};

/* 💾 Helper para manejar sessionStorage seguro (Next.js SSR-safe) */
function safeSessionStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/* ⏱ Tiempo máximo antes de revalidar (ms) — 10 minutos */
const REVALIDATE_INTERVAL = 10 * 60 * 1000;

/* 🧩 Utilidad general para leer o refrescar caché */
async function getCached(key, fetcher) {
  const store = safeSessionStorage();
  const now = Date.now();

  // 1️⃣ Intenta cache en memoria
  if (memoryCache[key] && memoryCache.lastUpdated) {
    const age = now - memoryCache.lastUpdated[key];
    if (age < REVALIDATE_INTERVAL) return memoryCache[key];
  }

  // 2️⃣ Intenta sessionStorage
  if (store) {
    const cachedRaw = store.getItem(`cache_${key}`);
    if (cachedRaw) {
      try {
        const { data, timestamp } = JSON.parse(cachedRaw);
        const age = now - timestamp;

        // revalida en segundo plano si pasó el tiempo límite
        if (age > REVALIDATE_INTERVAL) refreshInBackground(key, fetcher);
        else {
          memoryCache[key] = data;
          memoryCache.lastUpdated = memoryCache.lastUpdated || {};
          memoryCache.lastUpdated[key] = timestamp;
        }

        return data;
      } catch {
        console.warn("Cache corrupta, ignorando...");
      }
    }
  }

  // 3️⃣ Si no hay nada, fetch fresco
  const data = await fetcher();
  setCache(key, data);
  return data;
}

/* 💫 Guarda en memoria + sessionStorage */
function setCache(key, data) {
  const store = safeSessionStorage();
  const now = Date.now();

  memoryCache[key] = data;
  memoryCache.lastUpdated = memoryCache.lastUpdated || {};
  memoryCache.lastUpdated[key] = now;

  if (store) {
    store.setItem(`cache_${key}`, JSON.stringify({ data, timestamp: now }));
  }
}

/* 🔄 Revalida en background (silenciosamente) */
async function refreshInBackground(key, fetcher) {
  try {
    const fresh = await fetcher();
    setCache(key, fresh);
    console.info(`Cache ${key} actualizada en background ✅`);
  } catch (err) {
    console.warn(`No se pudo refrescar ${key}:`, err);
  }
}

/* === API principal con cache integrado === */

/** 🏪 Obtener catálogo completo */
export async function getCatalog() {
  return getCached("catalog", () =>
    fetchJSON(`${BASE_URL}?action=getCatalog`)
  );
}

/** ⚙️ Obtener configuración global (ligas, banners, etc.) */
export async function getConfig() {
  return getCached("config", () =>
    fetchJSON(`${BASE_URL}?action=getConfig`)
  );
}

/** ⭐ Obtener productos destacados */
export async function getFeatured() {
  return getCached("featured", () =>
    fetchJSON(`${BASE_URL}?action=getFeatured`)
  );
}

/** 🔍 Obtener producto por ID (sin cache global para evitar stale data puntual) */
export async function getProductById(id) {
  if (!id) throw new Error("ID no proporcionado");
  return fetchJSON(`${BASE_URL}?action=getProductById&id=${encodeURIComponent(id)}`);
}

/** ⚙️ Obtener opciones del producto */
export async function getProductOptions(liga, equipo) {
  if (!liga || !equipo) return {};
  return fetchJSON(
    `${BASE_URL}?action=getProductOptions&liga=${encodeURIComponent(
      liga
    )}&equipo=${encodeURIComponent(equipo)}`
  );
}
