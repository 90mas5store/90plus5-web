
import { Suspense } from "react";
import CatalogoContent from "./CatalogoContent";
import { CatalogPageSkeleton } from "../../components/skeletons/ProductSkeletons";
import { Metadata } from "next";
import { getConfig, getCatalogPaginated } from "../../lib/api";
import { createAdminClient } from "../../lib/supabase/admin";
import { SITE_URL, SITE_CONFIG, SOCIAL_LINKS } from "@/lib/config/site";

// Siempre renderizar dinámico: desactiva el Data Cache de Next.js para
// los fetches de Supabase, garantizando que cada recarga trae datos frescos.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await Promise.resolve(searchParams);
  const categoriaParam = typeof params?.categoria === 'string' ? params.categoria : undefined;
  const ligaParam = typeof params?.liga === 'string' ? params.liga : undefined;
  const equipoParam = typeof params?.equipo === 'string' ? params.equipo : typeof params?.team === 'string' ? params.team : undefined;
  const marcaParam = typeof params?.marca === 'string' ? params.marca : typeof params?.brand === 'string' ? params.brand : undefined;
  const queryParam = typeof params?.query === 'string' ? params.query : typeof params?.q === 'string' ? params.q : undefined;

  // Resolver slug → nombre real
  const config = await getConfig();
  const normalize = (s: string) =>
    (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

  let displayName: string | undefined;
  let customTitle: string | undefined;
  let customDesc: string | undefined;

  if (equipoParam) {
    try {
      const adminClient = createAdminClient();
      const { data: teamObj } = await adminClient
        .from('teams')
        .select('name')
        .or(`slug.eq.${equipoParam},name.ilike.%${equipoParam}%`)
        .limit(1)
        .maybeSingle();
      if (teamObj?.name) {
        displayName = teamObj.name;
        customTitle = `Camisetas de ${displayName} en Honduras | ${SITE_CONFIG.name}`;
        customDesc = `Compra camisetas oficiales de ${displayName} en Honduras. Versión jugador y aficionado temporada 25/26, personalización oficial y envíos a todo el país.`;
      }
    } catch { /* fallback */ }
  } else if (marcaParam && config?.marcas) {
    const mObj = config.marcas.find(
      (m) => (m.slug && m.slug === marcaParam) || normalize(m.name) === normalize(marcaParam)
    );
    if (mObj?.name) {
      displayName = mObj.name;
      customTitle = `Ropa Deportiva y Camisetas ${displayName} en Honduras | ${SITE_CONFIG.name}`;
      customDesc = `Explora la colección oficial de ${displayName} en Honduras. Envíos express a Tegucigalpa, San Pedro Sula y todo el país.`;
    }
  } else if (ligaParam && config?.ligas) {
    const lObj = config.ligas.find(
      (l) => (l.slug && l.slug === ligaParam) || normalize(l.nombre) === normalize(ligaParam)
    );
    displayName = lObj?.nombre;
  } else if (categoriaParam && config?.categorias) {
    const cObj = config.categorias.find((c) => c.slug === categoriaParam);
    displayName = cObj?.nombre;
  } else if (queryParam) {
    displayName = `Resultados para "${queryParam}"`;
  }

  const titleStr = displayName || 'Catálogo';
  const finalTitle = customTitle || `${titleStr} | ${SITE_CONFIG.name} Honduras`;
  const finalDesc = customDesc || `Explora nuestra colección de ${titleStr}: versión jugador y aficionado. Real Madrid, Barcelona, Olimpia, Motagua y más. Envíos a todo Honduras.`;

  // Canonical dinámico: páginas filtradas tienen su propio canonical para SEO por keyword
  const canonicalUrl = equipoParam
    ? `${SITE_URL}/catalogo?equipo=${encodeURIComponent(equipoParam)}`
    : marcaParam
    ? `${SITE_URL}/catalogo?marca=${encodeURIComponent(marcaParam)}`
    : ligaParam
    ? `${SITE_URL}/catalogo?liga=${encodeURIComponent(ligaParam)}`
    : categoriaParam
    ? `${SITE_URL}/catalogo?categoria=${encodeURIComponent(categoriaParam)}`
    : `${SITE_URL}/catalogo`;

  return {
    title: finalTitle,
    description: finalDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      locale: SITE_CONFIG.locale,
      title: finalTitle,
      description: finalDesc,
      url: canonicalUrl,
      images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: `${titleStr} - ${SITE_CONFIG.name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDesc,
      images: ['/og-image.jpg'],
      creator: SOCIAL_LINKS.twitterHandle,
    },
  };
}

// Next.js 15+ searchParams es una Promise, pero en 14 es objeto.
// Asumimos Next 14 basado en el contexto, pero lo manejamos de forma segura.
type Props = {
  searchParams: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CatalogoPage({ searchParams }: Props) {
  // 1. Obtener la configuración global primero (Cacheada)
  const config = await getConfig();

  // 2. Parsear parámetros de búsqueda
  const params = await Promise.resolve(searchParams);
  const getSingleParam = (key: string) => {
    const val = params?.[key];
    return Array.isArray(val) ? val[0] : val;
  };

  const categoriaSlug = getSingleParam("categoria") || getSingleParam("category");
  const ligaParam = getSingleParam("liga") || getSingleParam("league");
  const searchTerm = getSingleParam("query") || getSingleParam("q");
  const temporadaParam = getSingleParam("temporada") || getSingleParam("season");
  const generoParam = getSingleParam("genero") || getSingleParam("gender");
  const precioParam = getSingleParam("precio") || getSingleParam("price");
  const ordenParam = (getSingleParam("orden") || getSingleParam("sortBy") || getSingleParam("sort")) as import('../../components/catalogo/CatalogFilterPanel').SortOption | undefined;
  const equipoParam = getSingleParam("equipo") || getSingleParam("team");
  const marcaParam = getSingleParam("marca") || getSingleParam("brand");

  // 3. Resolver Slugs a IDs
  // Normalización simple para coincidir con la lógica del cliente
  const normalize = (s: string) =>
    (s || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  let categoryId: string | undefined;
  if (categoriaSlug && config?.categorias) {
    const cat = config.categorias.find((c) => c.slug === categoriaSlug);
    if (cat) categoryId = cat.id;
  }

  let leagueId: string | undefined;
  if (ligaParam && config?.ligas) {
    // Intentar match por slug exacto primero
    let lObj = config.ligas.find((l) => l.slug && l.slug === ligaParam);

    // Si no, match por nombre normalizado (legacy)
    if (!lObj) {
      const normalizedParam = normalize(ligaParam);
      lObj = config.ligas.find((l) => normalize(l.nombre) === normalizedParam);
    }

    if (lObj) leagueId = lObj.id;
  }

  let teamId: string | undefined;
  if (equipoParam) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (UUID_REGEX.test(equipoParam)) {
      teamId = equipoParam;
    } else {
      try {
        const adminClient = createAdminClient();
        const { data: t } = await adminClient
          .from('teams')
          .select('id')
          .or(`slug.eq.${equipoParam},name.ilike.%${equipoParam}%`)
          .limit(1)
          .maybeSingle();
        if (t?.id) teamId = t.id;
      } catch { /* fallback */ }
    }
  }

  let brandId: string | undefined;
  if (marcaParam && config?.marcas) {
    const mObj = config.marcas.find(
      (m) => (m.slug && m.slug === marcaParam) || normalize(m.name) === normalize(marcaParam) || m.id === marcaParam
    );
    if (mObj) brandId = mObj.id;
  }

  // Parsear precios si existen
  let priceMin: number | undefined;
  let priceMax: number | undefined;
  if (precioParam) {
    const [min, max] = precioParam.split("-").map(Number);
    if (!isNaN(min)) priceMin = min;
    if (!isNaN(max)) priceMax = max;
  }

  // 4. Fetch inicial de productos (SSR) + top sellers en paralelo
  let initialProducts: import('@/lib/types').Product[] = [];
  let initialTotal = 0;
  let topSellerIds: string[] = [];

  const [catalogResult] = await Promise.all([
    getCatalogPaginated({
      page: 1,
      limit: 24,
      query: searchTerm,
      categoryId,
      leagueId,
      teamId: teamId || equipoParam,
      brandId: brandId || marcaParam,
      gender: generoParam,
      season: temporadaParam,
      sortBy: ordenParam,
      priceMin,
      priceMax,
    }).catch((err) => { console.error("Error fetching catalog:", err); return { data: [], count: 0 }; }),
    // Query top 5 products by sales in last 30 days
    (async () => {
      try {
        const adminClient = createAdminClient();
        const { data: salesData } = await adminClient
          .from('order_items')
          .select('product_id')
          .not('product_id', 'is', null);
        if (salesData) {
          const counts = new Map<string, number>();
          for (const row of salesData) {
            if (row.product_id) counts.set(row.product_id, (counts.get(row.product_id) || 0) + 1);
          }
          topSellerIds = [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id]) => id);
        }
      } catch { /* silent fail */ }
    })(),
  ]);

  initialProducts = catalogResult.data || [];
  initialTotal = catalogResult.count || 0;

  return (
    <Suspense fallback={<CatalogPageSkeleton />}>
      <CatalogoContent
        initialConfig={config}
        initialProducts={initialProducts}
        initialTotal={initialTotal}
        topSellerIds={topSellerIds}
      />
    </Suspense>
  );
}
