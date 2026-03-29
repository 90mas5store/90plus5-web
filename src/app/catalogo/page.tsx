
import { Suspense } from "react";
import CatalogoContent from "./CatalogoContent";
import { CatalogPageSkeleton } from "../../components/skeletons/ProductSkeletons";
import { Metadata } from "next";
import { getConfig, getCatalogPaginated } from "../../lib/api";

// Siempre renderizar dinámico: desactiva el Data Cache de Next.js para
// los fetches de Supabase, garantizando que cada recarga trae datos frescos.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await Promise.resolve(searchParams);
  const categoriaParam = typeof params?.categoria === 'string' ? params.categoria : undefined;
  const ligaParam = typeof params?.liga === 'string' ? params.liga : undefined;

  // Resolver slug → nombre real
  const config = await getConfig();
  const normalize = (s: string) =>
    (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

  let displayName: string | undefined;

  if (ligaParam && config?.ligas) {
    const lObj = config.ligas.find(
      (l) => (l.slug && l.slug === ligaParam) || normalize(l.nombre) === normalize(ligaParam)
    );
    displayName = lObj?.nombre;
  } else if (categoriaParam && config?.categorias) {
    const cObj = config.categorias.find((c) => c.slug === categoriaParam);
    displayName = cObj?.nombre;
  }

  const titleStr = displayName
    ? `Camisetas ${displayName}`
    : 'Catálogo de Camisetas de Fútbol';

  return {
    title: `${titleStr} | 90+5 Store Honduras`,
    description: `Encuentra las equipaciones y ${titleStr} versión jugador y aficionado: Real Madrid, Barcelona, Olimpia, Motagua, Premier League y más. Envíos a todo Honduras.`,
    openGraph: {
      title: `${titleStr} | 90+5 Store`,
      description: `Más de 100 equipaciones oficiales temporada 25/26. Versión jugador y aficionado. Envíos rápidos a todo Honduras.`,
      url: "https://90mas5.store/catalogo",
    },
    alternates: {
      canonical: "https://90mas5.store/catalogo",
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
  const { categoria, liga, query } = params || {};
  const categoriaSlug = Array.isArray(categoria) ? categoria[0] : categoria;
  const ligaParam = Array.isArray(liga) ? liga[0] : liga;
  const searchTerm = Array.isArray(query) ? query[0] : query;

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

  // 4. Fetch inicial de productos (SSR)
  // Obtenemos la primera página (24 items)
  let initialProducts: import('@/lib/types').Product[] = [];
  let initialTotal = 0;

  try {
    const { data, count } = await getCatalogPaginated({
      page: 1,
      limit: 24,
      query: searchTerm,
      categoryId,
      leagueId,
    });
    initialProducts = data || [];
    initialTotal = count || 0;
  } catch (err) {
    console.error("Error fetching initial catalog data:", err);
    // Fallback silencioso, el cliente intentará de nuevo o mostrará vacío
  }

  return (
    <Suspense fallback={<CatalogPageSkeleton />}>
      <CatalogoContent
        initialConfig={config}
        initialProducts={initialProducts}
        initialTotal={initialTotal}
      />
    </Suspense>
  );
}
