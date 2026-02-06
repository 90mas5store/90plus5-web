import { Product, Config, ShippingZone } from "./types";
import { supabase } from "./supabase/client";

export interface CatalogParams {
  page?: number;
  limit?: number;
  query?: string;
  categoryId?: string;
  leagueId?: string;
}

// ✅ Cliente Supabase inicializado correctamente
// ⚠️ NUNCA hacer console.log del cliente - expone credenciales

async function fetchCatalogFromSupabase(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`
            id,
            name,
            slug,
            description,
            image_url,
            featured,
            category_id,
            league_id,
            team_id,
            teams (
            name,
            logo_url
          ),
            product_variants (
                id,
                version,
                price,
                active
            ),
            product_leagues (
                league_id
            )
        `)

    .eq("active", true)
    .order("name", { ascending: true }); // 🔤 Orden alfabético para catálogo

  if (error) {
    console.error("Error fetching catalog from Supabase:", error);
    throw error;
  }

  // Adaptar estructura de Supabase al formato interno
  //  NO aplicamos sort - respetamos el orden de la BD (sort_order)
  return (data || []).map(adaptSupabaseProductToProduct);
}

export function adaptSupabaseProductToProduct(raw: any): Product {
  const variants = raw.product_variants || [];

  const basePrice =
    variants.length > 0
      ? Math.min(...variants.filter((v: any) => v.active).map((v: any) => v.price))
      : 0;

  return {
    id: raw.id,
    slug: raw.slug, // ✅ Added slug
    equipo: raw.teams?.name ?? "",
    logoEquipo: raw.teams?.logo_url ?? null,
    modelo: raw.name,
    precio: basePrice,
    imagen: raw.image_url,
    destacado: raw.featured ?? false,
    team_id: raw.team_id,
    category_id: raw.category_id,
    league_id: raw.league_id,
    league_ids: raw.product_leagues?.map((pl: any) => pl.league_id) || (raw.league_id ? [raw.league_id] : []),
    sort_order: raw.sort_order || 0,
    product_variants: variants.map((v: any) => ({
      id: v.id,
      version: v.version,
      price: v.price,
      active: v.active,
      original_price: v.original_price,
      active_original_price: v.active_original_price
    })),
  };
}



async function fetchFeaturedFromSupabase(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`
  id,
    name,
    slug,
    image_url,
    featured,
    sort_order,
    team_id,
    category_id,
    league_id,
    teams(
      id,
      name,
      logo_url
    ),
    product_variants(
      id,
      version,
      price,
      active
    ),
    product_leagues(
      league_id
    )
      `)
    .eq("active", true)
    .eq("featured", true)
    .order("sort_order", { ascending: true }); // 🎯 HOME = ORDEN MANUAL

  if (error) {
    console.error("Error fetching featured from Supabase:", error);
    throw error;
  }

  // ✅ NO aplicamos sort - respetamos el orden de la BD (sort_order)
  return data.map(adaptSupabaseProductToProduct);
}


async function fetchConfigFromSupabase(): Promise<Config> {
  // 1️⃣ Traemos categorías y ligas en paralelo
  const [
    { data: categories, error: catError },
    { data: leagues, error: leagueError },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,slug,order_index,icon_url")
      .eq("active", true)
      .order("order_index", { ascending: true }),

    supabase
      .from("leagues")
      .select("id,name,slug,image_url,category_id")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (catError) {
    console.error("Error fetching categories:", catError);
    throw catError;
  }

  if (leagueError) {
    console.error("Error fetching leagues:", leagueError);
    throw leagueError;
  }

  // 2️⃣ Adaptamos categorías al shape que espera el frontend
  const adaptedCategorias = (categories ?? []).map((cat: any) => ({
    id: cat.id,
    nombre: cat.name,
    slug: cat.slug,
    order: cat.order_index,
    icon_url: cat.icon_url,
  }));

  // 3️⃣ Adaptamos ligas al shape que espera el frontend
  // Config.ligas = League[]
  const adaptedLigas = (leagues ?? []).map((league: any) => ({
    id: league.id,
    nombre: league.name,
    slug: league.slug,
    imagen: league.image_url ?? "",
    category_id: league.category_id,
  }));

  // 4️⃣ Devolvemos EXACTAMENTE el Config esperado
  return {
    categorias: adaptedCategorias,
    ligas: adaptedLigas,
  } as Config;
}

async function fetchShippingZonesFromSupabase(): Promise<ShippingZone[]> {
  const { data, error } = await supabase
    .from('shipping_zones')
    .select('*')
    .eq('is_active', true)
    .order('department', { ascending: true })
    .order('municipality', { ascending: true });

  if (error) {
    console.error('Error fetching shipping zones:', error);
    throw error;
  }

  return data as ShippingZone[];
}

export async function getPlayersByTeam(teamId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("id, name, number")
    .eq("team_id", teamId)
    .eq("active", true)
    .order("number");

  if (error) {
    console.error("Error fetching players:", error);
    throw error;
  }

  return data ?? [];
}

export async function getRelatedProducts(currentProductId: string, leagueId?: string, categoryId?: string): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select(`
  id,
    name,
    slug,
    image_url,
    featured,
    team_id,
    category_id,
    league_id,
    teams(
      name,
      logo_url
    ),
    product_variants(
      price,
      active
    )
      `)
    .eq("active", true)
    .neq("id", currentProductId)
    .limit(4);

  if (leagueId) {
    query = query.eq("league_id", leagueId);
  } else if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching related products:", error);
    return [];
  }

  return data.map(adaptSupabaseProductToProduct);
}

export async function getProductOptionsFromSupabase(productId: string) {
  /* =========================
   * 1️⃣ VARIANTES (con ID + label)
   * ========================= */
  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id, version")
    .eq("product_id", productId)
    .eq("active", true);

  if (variantsError) throw variantsError;

  // Crear mapa de versión -> id (para lookup)
  const versionesMap: Record<string, string> = {};
  (variants ?? []).forEach(v => {
    if (!versionesMap[v.version]) {
      versionesMap[v.version] = v.id;
    }
  });

  // Array de objetos {id, label} para versiones
  const versiones = Object.entries(versionesMap).map(([label, id]) => ({ id, label }));
  const variantIds = (variants ?? []).map(v => v.id);

  /* =========================
   * 2️⃣ TALLAS (con ID + label) & MAPPING
   * ========================= */
  let tallas: { id: string; label: string }[] = [];
  const variantSizesMap: Record<string, string[]> = {};

  if (variantIds.length > 0) {
    const { data: variantSizes, error: vsError } = await supabase
      .from("variant_sizes")
      .select("variant_id, size_id")
      .in("variant_id", variantIds)
      .eq("active", true);

    if (vsError) throw vsError;

    // Build the map: variant_id -> [size_id, size_id, ...]
    (variantSizes || []).forEach(vs => {
      if (!variantSizesMap[vs.variant_id]) {
        variantSizesMap[vs.variant_id] = [];
      }
      variantSizesMap[vs.variant_id].push(vs.size_id);
    });

    const sizeIds = [...new Set(variantSizes?.map(vs => vs.size_id))];

    if (sizeIds.length > 0) {
      const { data: sizes, error: sizesError } = await supabase
        .from("sizes")
        .select("id, label")
        .in("id", sizeIds)
        .eq("active", true)
        .order("sort_order");

      if (sizesError) throw sizesError;

      tallas = sizes.map(s => ({ id: s.id, label: s.label }));
    }
  }

  /* =========================
   * 3️⃣ PARCHES (con ID + label)
   * ========================= */
  const { data: productPatches, error: ppError } = await supabase
    .from("product_patches")
    .select("patch_id")
    .eq("product_id", productId);

  if (ppError) throw ppError;

  const patchIds = [...new Set(productPatches.map(pp => pp.patch_id))];

  let parches: { id: string; label: string }[] = [];

  if (patchIds.length > 0) {
    const { data: patches, error: patchesError } = await supabase
      .from("patches")
      .select("id, name")
      .in("id", patchIds)
      .eq("active", true);

    if (patchesError) throw patchesError;

    parches = patches.map(p => ({ id: p.id, label: p.name }));
  }

  /* =========================
   * ✅ RESULTADO FINAL
   * Cada opción es { id: uuid, label: string }
   * ========================= */
  return {
    versiones,
    tallas,
    parches,
    variantSizesMap // ✅ New field
  };
}






/**
 * API Helper con caché inteligente para 90+5 Store
 * ------------------------------------------------
 * Combina:
 *  1️⃣ Cache en memoria (instantáneo entre rutas)
 *  2️⃣ sessionStorage persistente (sobrevive refresh)
 *  3️⃣ Revalidación silenciosa en background
 */

/* 🧠 Cache global en memoria (solo vive mientras la app está abierta) */
interface CacheStore {
  catalog: Product[] | null;
  config: Config | null;
  featured: Product[] | null;
  lastUpdated: Record<string, number> | null;
  [key: string]: any;
}

const memoryCache: CacheStore = {
  catalog: null,
  config: null,
  featured: null,
  lastUpdated: null,
};

/* 💾 Helper para manejar sessionStorage seguro (Next.js SSR-safe) */
function safeSessionStorage(): Storage | null {
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
async function getCached<T>(key: string, fetcher: () => Promise<T>, forceRefresh = false): Promise<T> {
  const store = safeSessionStorage();
  const now = Date.now();

  // 0️⃣ Si forzamos refresh, saltamos directo al fetch
  if (forceRefresh) {
    const data = await fetcher();
    setCache(key, data);
    return data;
  }

  // 1️⃣ Intenta cache en memoria
  if (memoryCache[key] && memoryCache.lastUpdated && memoryCache.lastUpdated[key]) {
    const age = now - memoryCache.lastUpdated[key];
    if (age < REVALIDATE_INTERVAL) return memoryCache[key] as T;
  }

  // 2️⃣ Intenta sessionStorage
  if (store) {
    const cachedRaw = store.getItem(`cache_${key} `);
    if (cachedRaw) {
      try {
        const parsed = JSON.parse(cachedRaw);
        if (parsed && typeof parsed === 'object' && parsed.data) {
          const { data, timestamp } = parsed;
          const age = now - timestamp;

          // Revalida en segundo plano si pasó el tiempo límite
          if (age > REVALIDATE_INTERVAL) {
            refreshInBackground(key, fetcher);
          }

          // Actualizamos memoria para la próxima vez
          memoryCache[key] = data;
          memoryCache.lastUpdated = memoryCache.lastUpdated || {};
          memoryCache.lastUpdated[key] = timestamp;

          return data as T;
        }
      } catch (err) {
        console.warn("Cache corrupta en sessionStorage, ignorando...", err);
      }
    }
  }

  // 3️⃣ Si no hay nada, fetch fresco
  const data = await fetcher();
  setCache(key, data);
  return data;
}

/* 🧹 Limpia todo el caché (se llama al actualizar productos) */
export function clearProductCache(filter: 'all' | 'catalog' | 'config' = 'all') {
  const store = safeSessionStorage();

  if (filter === 'all' || filter === 'catalog') {
    memoryCache.catalog = null;
    memoryCache.featured = null;
    if (store) {
      store.removeItem('cache_catalog');
      store.removeItem('cache_featured');
    }
  }

  if (filter === 'all' || filter === 'config') {
    memoryCache.config = null;
    if (store) {
      store.removeItem('cache_config');
      store.removeItem('cache_shipping_zones');
    }
  }

  memoryCache.lastUpdated = {};
}

/* 💫 Guarda en memoria + sessionStorage */
function setCache<T>(key: string, data: T) {
  const store = safeSessionStorage();
  const now = Date.now();

  memoryCache[key] = data;
  memoryCache.lastUpdated = memoryCache.lastUpdated || {};
  memoryCache.lastUpdated[key] = now;

  if (store) {
    store.setItem(`cache_${key} `, JSON.stringify({ data, timestamp: now }));
  }
}


/* 🔄 Revalida en background (silenciosamente) */
async function refreshInBackground<T>(key: string, fetcher: () => Promise<T>) {
  try {
    const fresh = await fetcher();
    setCache(key, fresh);
    console.info(`Cache ${key} actualizada en background ✅`);
  } catch (err) {
    console.warn(`No se pudo refrescar ${key}: `, err);
  }
}

/* === API principal con cache integrado === */

/** 🏪 Obtener catálogo completo (Legacy - Para compatibilidad) */
export async function getCatalog(): Promise<Product[]> {
  return getCached<Product[]>("catalog", () =>
    fetchCatalogFromSupabase()
  );
}

// Cache LRU simple para paginación
const paginatedCache = new Map<string, { data: any, timestamp: number }>();

/** 🚀 Obtener catálogo paginado (Nuevo - Escalable) 
 *  Ahora con caché en memoria de 60s para navegación instantánea
 */
export async function getCatalogPaginated(params: CatalogParams) {
  const {
    page = 1,
    limit = 24,
    query: searchQuery,
    categoryId,
    leagueId
  } = params;

  // 1️⃣ Revisar Caché
  const cacheKey = JSON.stringify(params) + "_v10_sorted"; // 🔥 v10: Force cache refresh
  const now = Date.now();
  const cached = paginatedCache.get(cacheKey);

  if (cached && (now - cached.timestamp < 60 * 1000)) { // 1 minuto de vida
    return cached.data;
  }

  // Lógica bifurcada: Búsqueda con typos (RPC) vs Navegación normal (Standard)

  // A) Búsqueda Inteligente (Fuzzy)
  if (searchQuery) {
    const from = (page - 1) * limit;

    // 1. Obtener IDs relevantes tolerando errores
    const { data: fuzzyIds, error: rpcError } = await supabase.rpc('search_fuzzy_products', {
      search_term: searchQuery,
      p_category_id: categoryId || null,
      p_league_id: leagueId || null,
      p_limit: limit,
      p_offset: from
    });

    if (rpcError) {
      console.error("Fuzzy search error:", rpcError);
      // Fallback a búsqueda normal si falla el RPC (ej: no creado aun)
    } else if (fuzzyIds && fuzzyIds.length > 0) {
      // 2. Traer el detalle completo de esos IDs
      const ids = fuzzyIds.map((item: any) => item.id);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
            id, name, slug, description, image_url, featured,
            category_id, league_id, team_id,
            teams ( name, logo_url ),
            product_variants ( id, version, price, active, original_price, active_original_price ),
            product_leagues ( league_id )
        `)
        .in('id', ids)
        .eq("active", true);

      if (productsError) throw productsError;

      // 3. Reordenar en JS para respetar la relevancia del Fuzzy (SQL 'IN' no garantiza orden)
      const productsMap = new Map(productsData?.map((p: any) => [p.id, p]));
      const sortedProducts = ids.map((id: string) => productsMap.get(id)).filter(Boolean);

      const result = {
        data: sortedProducts.map(adaptSupabaseProductToProduct),
        count: 100 // Estimado
      };

      // Cache y retorno
      paginatedCache.set(cacheKey, { data: result, timestamp: now });
      return result;
    } else {
      // Búsqueda no arrojó resultados
      return { data: [], count: 0 };
    }
  }

  // B) Navegación Normal (Sin búsqueda o Fallback)
  // 🟢 ESTRATEGIA "SORT-IN-MEMORY" V2 (Simplificada y Robusta)

  // 1. Obtener Metadatos para Ordenamiento (ID, Nombre Equipo, Nombre Producto)
  const leagueJoinType = leagueId ? "!inner" : "left";

  let metadataQuery = supabase
    .from("products")
    .select(`
        id,
        name,
        teams!inner ( name ),
        product_leagues${leagueId ? "!inner" : ""} ( league_id )
    `)
    .eq("active", true);

  // 2. Aplicar Filtros
  if (categoryId) metadataQuery = metadataQuery.eq('category_id', categoryId);
  if (leagueId) metadataQuery = metadataQuery.eq('product_leagues.league_id', leagueId);

  // 3. Ejecutar Query Ligera
  const { data: allMetadata, error: metaError } = await metadataQuery;

  if (metaError) {
    console.error("Error fetching metadata for sort:", metaError);
    throw metaError;
  }

  // 4. Ordenamiento Estricto en Memoria
  const sortedMetadata = (allMetadata || []).sort((a: any, b: any) => {
    // Normalización de seguridad (usamos "zzz" para items sin equipo)
    const teamA = (a.teams?.name || "zzz").toLowerCase().trim();
    const teamB = (b.teams?.name || "zzz").toLowerCase().trim();

    // Nivel 1: Equipo
    const teamCompare = teamA.localeCompare(teamB);
    if (teamCompare !== 0) return teamCompare;

    // Nivel 2: Producto (Modelo)
    const nameA = (a.name || "").toLowerCase().trim();
    const nameB = (b.name || "").toLowerCase().trim();
    return nameA.localeCompare(nameB);
  });

  // 5. Paginación sobre IDs ya ordenados
  const totalCount = sortedMetadata.length;
  const pageIds = sortedMetadata
    .slice((page - 1) * limit, page * limit)
    .map((item: any) => item.id);

  // 6. Si la página está vacía
  if (pageIds.length === 0) {
    return { data: [], count: totalCount };
  }

  // 7. Fetch de Datos Completos
  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select(`
        id, name, slug, description, image_url, featured,
        category_id, league_id, team_id,
        teams ( name, logo_url ),
        product_variants ( id, version, price, active, original_price, active_original_price ),
        product_leagues ( league_id )
    `)
    .in('id', pageIds)
    .eq("active", true);

  if (productsError) throw productsError;

  // 8. Reconstrucción Estricta del Orden (Mapping)
  // Usamos un Map para acceso eficiente y respetamos el orden de 'pageIds'
  const productsMap = new Map(productsData?.map((p: any) => [p.id, p]));

  const finalSortedData = pageIds
    .map((id: string) => {
      const p = productsMap.get(id);
      return p ? adaptSupabaseProductToProduct(p) : null;
    })
    .filter((p): p is Product => p !== null);

  const result = {
    data: finalSortedData,
    count: totalCount
  };

  // Cache
  paginatedCache.set(cacheKey, { data: result, timestamp: now });

  // Limpieza simple
  if (paginatedCache.size > 100) {
    const firstKey = paginatedCache.keys().next().value;
    if (firstKey) paginatedCache.delete(firstKey);
  }

  return result;
}

/** ⚙️ Obtener configuración global (ligas, banners, etc.) */
export async function getConfig(): Promise<Config> {
  return getCached<Config>("config_v5", () =>
    fetchConfigFromSupabase()
  );
}



/** ⭐ Obtener productos destacados */
export async function getFeatured(): Promise<Product[]> {
  // 🔥 v5: Reverted to sort_order (manual curation)
  return getCached<Product[]>("featured_v5", () =>
    fetchFeaturedFromSupabase()
  );
}

/** 🖼️ Obtener Banners Home */
export async function getBanners() {
  return getCached<any[]>("banners", async () => {
    const { data, error } = await supabase
      .from("banners")
      .select("id, title, description, image_url, video_url, link_url, button_text")
      .eq("active", true)
      .eq("show_on_home", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching banners:", error);
      return [];
    }
    return data;
  });
}

/** 🔍 Obtener producto por ID o Slug (Supabase) */
export async function getProductById(idOrSlug: string): Promise<Product> {
  if (!idOrSlug) throw new Error("ID/Slug no proporcionado");

  // Detectar si es UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  let query = supabase
    .from("products")
    .select(`
    id,
    name,
    slug,
    description,
    image_url,
    featured,
    team_id,
    category_id,
    league_id,
    teams(
      name,
      logo_url
    ),
    product_variants(
      id,
      version,
      price,
      active,
      original_price,
      active_original_price
    )
      `)
    .eq("active", true);

  if (isUUID) {
    query = query.eq("id", idOrSlug);
  } else {
    query = query.ilike("slug", idOrSlug);
  }

  const { data, error } = await query.single();

  if (error) {
    console.warn(`Producto no encontrado(${idOrSlug}): `, error.message);
    throw error;
  }

  if (!data) throw new Error("Producto no encontrado");

  return adaptSupabaseProductToProduct(data);
}

/** ⚙️ Obtener opciones del producto (Legacy - Deprecated)
 * Se mantiene temporalmente por si algún componente antiguo lo usa,
 * pero devuelve objeto vacío. Usar getProductOptionsFromSupabase.
 */
export async function getProductOptions(liga: string, equipo: string): Promise<any> {
  console.warn("Using deprecated getProductOptions. Please migrate to getProductOptionsFromSupabase.");
  return {};
}
/** 🚚 Obtener zonas de envío (departamentos y municipios) */
export async function getShippingZones(): Promise<ShippingZone[]> {
  return getCached<ShippingZone[]>("shipping_zones", () =>
    fetchShippingZonesFromSupabase()
  );
}
