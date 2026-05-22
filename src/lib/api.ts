import { Product, Brand, Config, ShippingZone, SupabaseRawProduct } from "./types";
import { supabase } from "./supabase/client";

export type SortOption =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "top_sellers"
  | "alphabetical";

export interface CatalogParams {
  page?: number;
  limit?: number;
  query?: string;
  categoryId?: string;
  leagueId?: string;
  teamId?: string;
  brandId?: string;
  gender?: string;
  sortBy?: SortOption;
  priceMin?: number;
  priceMax?: number;
  topSellerIds?: string[];
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
            brand_id,
            teams (
            name,
            logo_url
          ),
            brands (
            name,
            slug,
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
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching catalog from Supabase:", error);
    throw error;
  }

  // Adaptar estructura de Supabase al formato interno
  //  NO aplicamos sort - respetamos el orden de la BD (sort_order)
  return (data || []).map(adaptSupabaseProductToProduct);
}

export function adaptSupabaseProductToProduct(raw: SupabaseRawProduct): Product {
  const variants = raw.product_variants || [];

  const basePrice =
    variants.length > 0
      ? Math.min(...variants.filter(v => v.active).map(v => v.price))
      : 0;

  const teams = Array.isArray(raw.teams) ? raw.teams[0] : raw.teams;
  const brand = Array.isArray(raw.brands) ? raw.brands[0] : raw.brands ?? null;

  return {
    id: raw.id,
    slug: raw.slug,
    equipo: teams?.name ?? "",
    logoEquipo: teams?.logo_url ?? undefined,
    modelo: raw.name,
    precio: basePrice,
    imagen: raw.image_url,
    destacado: raw.featured ?? false,
    team_id: raw.team_id,
    category_id: raw.category_id,
    league_id: raw.league_id,
    league_ids: raw.product_leagues?.map(pl => pl.league_id) || (raw.league_id ? [raw.league_id] : []),
    brand_id: raw.brand_id ?? null,
    brand_name: brand?.name ?? null,
    brand_logo: brand?.logo_url ?? null,
    sort_order: raw.sort_order || 0,
    trending_until: raw.trending_until ?? null,
    product_variants: variants.map(v => ({
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
    brand_id,
    trending_until,
    teams(
      id,
      name,
      logo_url
    ),
    brands(
      name,
      slug,
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
    .order("sort_order", { ascending: true });

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
      .select("id,name,slug,order_index,icon_url,hero_image_position_desktop,hero_image_position_mobile")
      .eq("active", true)
      .order("order_index", { ascending: true }),

    supabase
      .from("leagues")
      .select("id,name,slug,image_url,category_id,hero_image_position_desktop,hero_image_position_mobile")
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
  const adaptedCategorias = (categories ?? []).map((cat: Record<string, unknown>) => ({
    id: cat.id,
    nombre: cat.name,
    slug: cat.slug,
    order: cat.order_index,
    icon_url: cat.icon_url,
    hero_image_position_desktop: cat.hero_image_position_desktop,
    hero_image_position_mobile: cat.hero_image_position_mobile,
  }));

  // 3️⃣ Adaptamos ligas al shape que espera el frontend
  const adaptedLigas = (leagues ?? []).map((league: Record<string, unknown>) => ({
    id: league.id,
    nombre: league.name,
    slug: league.slug,
    imagen: league.image_url ?? "",
    category_id: league.category_id,
    hero_image_position_desktop: league.hero_image_position_desktop,
    hero_image_position_mobile: league.hero_image_position_mobile,
  }));

  // 4️⃣ Traemos marcas
  const { data: brands, error: brandError } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url, sort_order")
    .eq("active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (brandError) {
    console.error("Error fetching brands:", brandError);
  }

  const adaptedMarcas: Brand[] = (brands ?? []).map((b: Record<string, unknown>) => ({
    id: b.id as string,
    name: b.name as string,
    slug: b.slug as string,
    logo_url: (b.logo_url as string) ?? null,
    sort_order: (b.sort_order as number) ?? 0,
  }));

  // 5️⃣ Devolvemos EXACTAMENTE el Config esperado
  return {
    categorias: adaptedCategorias,
    ligas: adaptedLigas,
    marcas: adaptedMarcas,
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


export async function getProductOptionsFromSupabase(productId: string) {
  // Cadena A (variants → variant_sizes → sizes) y Cadena B (product_patches → patches)
  // son independientes — corren en paralelo para reducir latencia.

  async function fetchVariantsChain() {
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select("id, version")
      .eq("product_id", productId)
      .eq("active", true);

    if (variantsError) throw variantsError;

    const versionesMap: Record<string, string> = {};
    (variants ?? []).forEach(v => {
      if (!versionesMap[v.version]) {
        versionesMap[v.version] = v.id;
      }
    });

    const versiones = Object.entries(versionesMap).map(([label, id]) => ({ id, label }));
    const variantIds = (variants ?? []).map(v => v.id);

    let tallas: { id: string; label: string }[] = [];
    const variantSizesMap: Record<string, string[]> = {};

    if (variantIds.length > 0) {
      const { data: variantSizes, error: vsError } = await supabase
        .from("variant_sizes")
        .select("variant_id, size_id")
        .in("variant_id", variantIds)
        .eq("active", true);

      if (vsError) throw vsError;

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

    return { versiones, tallas, variantSizesMap };
  }

  async function fetchPatchesChain() {
    const { data: productPatches, error: ppError } = await supabase
      .from("product_patches")
      .select("patch_id")
      .eq("product_id", productId);

    if (ppError) throw ppError;

    const patchIds = [...new Set(productPatches.map(pp => pp.patch_id))];

    if (patchIds.length === 0) return [];

    const { data: patches, error: patchesError } = await supabase
      .from("patches")
      .select("id, name")
      .in("id", patchIds)
      .eq("active", true);

    if (patchesError) throw patchesError;

    return patches.map(p => ({ id: p.id, label: p.name }));
  }

  const [variantsResult, parches] = await Promise.all([
    fetchVariantsChain(),
    fetchPatchesChain(),
  ]);

  return {
    versiones: variantsResult.versiones,
    tallas: variantsResult.tallas,
    parches,
    variantSizesMap: variantsResult.variantSizesMap,
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
  [key: string]: unknown;
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
    const cachedRaw = store.getItem(`cache_${key}`);
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
    paginatedCache.clear(); // 🧹 Limpiar también el cache de getCatalogPaginated
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
    store.setItem(`cache_${key}`, JSON.stringify({ data, timestamp: now }));
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
const paginatedCache = new Map<string, { data: { data: Product[]; count: number }, timestamp: number }>();

/** 🚀 Obtener catálogo paginado (Nuevo - Escalable) 
 *  Ahora con caché en memoria de 60s para navegación instantánea
 */
export async function getCatalogPaginated(params: CatalogParams): Promise<{ data: Product[]; count: number }> {
  const {
    page = 1,
    limit = 24,
    query: searchQuery,
    categoryId,
    leagueId,
    teamId,
    brandId,
    gender,
    sortBy = "relevance",
    priceMin,
    priceMax,
    topSellerIds = [],
  } = params;

  // 1️⃣ Revisar Caché (solo en el navegador — el servidor no puede limpiar este cache desde el cliente)
  const isClient = typeof window !== 'undefined';
  const cacheKey = JSON.stringify(params) + "_v10_sorted"; // 🔥 v10: Force cache refresh
  const now = Date.now();

  if (isClient) {
    const cached = paginatedCache.get(cacheKey);
    if (cached && (now - cached.timestamp < 60 * 1000)) { // 1 minuto de vida
      return cached.data;
    }
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
      const ids = fuzzyIds.map((item: Record<string, unknown>) => item.id);

      let fuzzyQuery = supabase
        .from("products")
        .select(`
            id, name, slug, description, image_url, featured,
            category_id, league_id, team_id, brand_id, trending_until,
            teams ( name, logo_url ),
            brands ( name, slug, logo_url ),
            product_variants ( id, version, price, active, original_price, active_original_price ),
            product_leagues ( league_id )
        `)
        .in('id', ids)
        .eq("active", true);

      if (teamId) fuzzyQuery = fuzzyQuery.eq('team_id', teamId);
      if (brandId) fuzzyQuery = fuzzyQuery.eq('brand_id', brandId);

      const { data: productsData, error: productsError } = await fuzzyQuery;

      if (productsError) throw productsError;

      // 3. Reordenar en JS para respetar la relevancia del Fuzzy (SQL 'IN' no garantiza orden)
      const productsMap = new Map(productsData?.map(p => [p.id, p]));
      const sortedProducts = ids.map((id: string) => productsMap.get(id)).filter(Boolean);

      const result = {
        data: sortedProducts.map(adaptSupabaseProductToProduct),
        count: 100 // Estimado
      };

      // Cache y retorno (solo cliente)
      if (isClient) paginatedCache.set(cacheKey, { data: result, timestamp: now });
      return result;
    } else {
      // Búsqueda no arrojó resultados
      return { data: [], count: 0 };
    }
  }

  // B) Navegación Normal (Sin búsqueda o Fallback)
  // 🟢 ESTRATEGIA "SORT-IN-MEMORY" V2 (Simplificada y Robusta)

  // 0. Pre-filtrado por género: obtener IDs elegibles
  let genderFilterIds: Set<string> | null = null;

  // Filtro por género: productos con tallas de ese género
  if (gender) {
    const { data: genderSizes } = await supabase
      .from("sizes")
      .select("id")
      .eq("gender", gender)
      .eq("active", true);

    if (genderSizes && genderSizes.length > 0) {
      const sizeIds = genderSizes.map((s: { id: string }) => s.id);
      const { data: variantSizes } = await supabase
        .from("variant_sizes")
        .select("variant_id")
        .in("size_id", sizeIds)
        .eq("active", true);

      if (variantSizes && variantSizes.length > 0) {
        const variantIds = [...new Set(variantSizes.map((vs: { variant_id: string }) => vs.variant_id))];
        const { data: variantProducts } = await supabase
          .from("product_variants")
          .select("product_id")
          .in("id", variantIds)
          .eq("active", true);

        genderFilterIds = new Set((variantProducts || []).map((v: { product_id: string }) => v.product_id));
      } else {
        genderFilterIds = new Set(); // No hay productos con ese género
      }
    } else {
      genderFilterIds = new Set();
    }
  }

  // 1. Obtener Metadatos para Ordenamiento (ID, Nombre Equipo, Nombre Producto)

  let metadataQuery = supabase
    .from("products")
    .select(`
        id,
        name,
        team_id,
        brand_id,
        teams ( name ),
        brands ( name ),
        product_leagues${leagueId ? "!inner" : ""} ( league_id )
    `)
    .eq("active", true);

  // 2. Aplicar Filtros básicos
  if (categoryId) metadataQuery = metadataQuery.eq('category_id', categoryId);
  if (leagueId) metadataQuery = metadataQuery.eq('product_leagues.league_id', leagueId);
  if (teamId) metadataQuery = metadataQuery.eq('team_id', teamId);
  if (brandId) metadataQuery = metadataQuery.eq('brand_id', brandId);

  // 3. Ejecutar Query Ligera
  const { data: allMetadata, error: metaError } = await metadataQuery;

  if (metaError) {
    console.error("Error fetching metadata for sort:", metaError);
    throw metaError;
  }

  // 3.5 Aplicar filtro de género en memoria
  let filteredMetadata = allMetadata || [];
  if (genderFilterIds) {
    filteredMetadata = filteredMetadata.filter((item) => genderFilterIds!.has(item.id as string));
  }

  // 4. Ordenamiento en Memoria
  // Para "relevance" y "alphabetical" se ordena aquí.
  // Para precio/novedad/top_sellers se reordena después del fetch completo.
  const needsPostSort = ["price_asc", "price_desc", "newest", "top_sellers"].includes(sortBy);

  const sortedMetadata = needsPostSort
    ? filteredMetadata // Se ordenará después con datos completos
    : filteredMetadata.sort((a, b) => {
        const teamsA = Array.isArray(a.teams) ? a.teams[0] : a.teams;
        const teamsB = Array.isArray(b.teams) ? b.teams[0] : b.teams;
        const brandsA = Array.isArray(a.brands) ? a.brands[0] : a.brands;
        const brandsB = Array.isArray(b.brands) ? b.brands[0] : b.brands;
        const groupA = (teamsA?.name || brandsA?.name || "zzz").toLowerCase().trim();
        const groupB = (teamsB?.name || brandsB?.name || "zzz").toLowerCase().trim();

        const groupCompare = groupA.localeCompare(groupB);
        if (groupCompare !== 0) return groupCompare;

        const nameA = (a.name || "").toLowerCase().trim();
        const nameB = (b.name || "").toLowerCase().trim();
        return nameA.localeCompare(nameB);
      });

  // 5. Paginación
  const totalCount = sortedMetadata.length;

  // Para sorts que necesitan datos completos (precio/novedad/top), traemos todos los IDs
  // y paginamos DESPUÉS de ordenar. Para alfabético/relevancia, paginamos aquí.
  const fetchIds = needsPostSort
    ? sortedMetadata.map(item => item.id as string)
    : sortedMetadata.slice((page - 1) * limit, page * limit).map(item => item.id as string);

  // 6. Si no hay IDs
  if (fetchIds.length === 0) {
    return { data: [], count: totalCount };
  }

  // 7. Fetch de Datos Completos (en batches si es necesario)
  // Supabase tiene límite en .in(), así que si needsPostSort y hay muchos, fetcheamos por lotes
  const allProducts: SupabaseRawProduct[] = [];
  const batchSize = 200;
  for (let i = 0; i < fetchIds.length; i += batchSize) {
    const batchIds = fetchIds.slice(i, i + batchSize);
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select(`
          id, name, slug, description, image_url, featured,
          category_id, league_id, team_id, brand_id, trending_until,
          teams ( name, logo_url ),
          brands ( name, slug, logo_url ),
          product_variants ( id, version, price, active, original_price, active_original_price ),
          product_leagues ( league_id )
      `)
      .in('id', batchIds)
      .eq("active", true);

    if (productsError) throw productsError;
    if (productsData) allProducts.push(...(productsData as SupabaseRawProduct[]));
  }

  // 8. Adaptar y ordenar
  let adaptedProducts = allProducts.map(adaptSupabaseProductToProduct);

  // 8.1 Filtro por precio
  if (priceMin !== undefined || priceMax !== undefined) {
    adaptedProducts = adaptedProducts.filter((p) => {
      if (priceMin !== undefined && p.precio < priceMin) return false;
      if (priceMax !== undefined && p.precio > priceMax) return false;
      return true;
    });
  }

  // 8.2 Ordenamiento post-fetch
  if (needsPostSort) {
    switch (sortBy) {
      case "price_asc":
        adaptedProducts.sort((a, b) => a.precio - b.precio);
        break;
      case "price_desc":
        adaptedProducts.sort((a, b) => b.precio - a.precio);
        break;
      case "newest":
        // Productos más recientes primero (por sort_order inverso como proxy)
        adaptedProducts.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));
        break;
      case "top_sellers":
        // Ordenar por presencia en topSellerIds primero, luego el resto
        adaptedProducts.sort((a, b) => {
          const aIsTop = topSellerIds.includes(a.id) ? 0 : 1;
          const bIsTop = topSellerIds.includes(b.id) ? 0 : 1;
          if (aIsTop !== bIsTop) return aIsTop - bIsTop;
          // Dentro de top sellers, mantener el ranking
          if (aIsTop === 0 && bIsTop === 0) {
            return topSellerIds.indexOf(a.id) - topSellerIds.indexOf(b.id);
          }
          return 0;
        });
        break;
    }
  } else {
    // Para relevance/alphabetical, reconstruir el orden del metadata
    const orderMap = new Map<string, number>(fetchIds.map((id, idx) => [id, idx]));
    adaptedProducts.sort((a, b) => {
      const posA: number = orderMap.get(a.id) ?? 999;
      const posB: number = orderMap.get(b.id) ?? 999;
      return posA - posB;
    });
  }

  // 8.3 Paginar si fue un post-sort (traímos todo y ahora cortamos)
  const finalCount = adaptedProducts.length;
  const finalSortedData = needsPostSort
    ? adaptedProducts.slice((page - 1) * limit, page * limit)
    : adaptedProducts;

  const result = {
    data: finalSortedData,
    count: (priceMin || priceMax) ? finalCount : totalCount,
  };

  // Cache (solo cliente)
  if (isClient) {
    paginatedCache.set(cacheKey, { data: result, timestamp: now });
  }

  // Limpieza simple
  if (paginatedCache.size > 100) {
    const firstKey = paginatedCache.keys().next().value;
    if (firstKey) paginatedCache.delete(firstKey);
  }

  return result;
}

/** 🏟️ Obtener equipos que tienen productos activos en una liga
 *  Usa product_leagues para soportar equipos en múltiples ligas
 *  (ej: FC Barcelona aparece en LaLiga Y en UCL)
 */
export async function getTeamsByLeague(leagueId: string): Promise<{ id: string; name: string; logo_url: string | null }[]> {
  const { data, error } = await supabase
    .from('products')
    .select('team_id, teams!inner(id, name, logo_url), product_leagues!inner(league_id)')
    .eq('product_leagues.league_id', leagueId)
    .eq('active', true)
    .not('team_id', 'is', null);

  if (error) {
    console.error('Error fetching teams by league:', error);
    return [];
  }

  // Deduplicar por team_id
  const seen = new Set<string>();
  const teams: { id: string; name: string; logo_url: string | null }[] = [];

  for (const row of data || []) {
    const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;
    if (team && !seen.has(team.id)) {
      seen.add(team.id);
      teams.push({ id: team.id, name: team.name, logo_url: team.logo_url });
    }
  }

  return teams.sort((a, b) => a.name.localeCompare(b.name));
}

/** 🏟️ Obtener equipos que tienen productos activos en una categoría */
export async function getTeamsByCategory(categoryId: string): Promise<{ id: string; name: string; logo_url: string | null }[]> {
  const { data, error } = await supabase
    .from('products')
    .select('team_id, teams!inner(id, name, logo_url)')
    .eq('category_id', categoryId)
    .eq('active', true)
    .not('team_id', 'is', null);

  if (error) {
    console.error('Error fetching teams by category:', error);
    return [];
  }

  const seen = new Set<string>();
  const teams: { id: string; name: string; logo_url: string | null }[] = [];

  for (const row of data || []) {
    const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;
    if (team && !seen.has(team.id)) {
      seen.add(team.id);
      teams.push({ id: team.id, name: team.name, logo_url: team.logo_url });
    }
  }

  return teams.sort((a, b) => a.name.localeCompare(b.name));
}

/** 🏷️ Obtener marcas que tienen productos activos en una categoría */
export async function getBrandsByCategory(categoryId: string): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('products')
    .select('brand_id, brands!inner(id, name, slug, logo_url)')
    .eq('category_id', categoryId)
    .eq('active', true)
    .not('brand_id', 'is', null);

  if (error) {
    console.error('Error fetching brands by category:', error);
    return [];
  }

  const seen = new Set<string>();
  const brands: Brand[] = [];

  for (const row of data || []) {
    const brand = Array.isArray(row.brands) ? row.brands[0] : row.brands;
    if (brand && !seen.has(brand.id)) {
      seen.add(brand.id);
      brands.push({ id: brand.id, name: brand.name, slug: brand.slug, logo_url: brand.logo_url });
    }
  }

  return brands.sort((a, b) => a.name.localeCompare(b.name));
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
    brand_id,
    teams(
      name,
      logo_url
    ),
    brands(
      name,
      slug,
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

/** 🚚 Obtener zonas de envío (departamentos y municipios) */
export async function getShippingZones(): Promise<ShippingZone[]> {
  return getCached<ShippingZone[]>("shipping_zones", () =>
    fetchShippingZonesFromSupabase()
  );
}
