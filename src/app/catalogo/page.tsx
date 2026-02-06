
import { Suspense } from "react";
import CatalogoContent from "./CatalogoContent";
import { CatalogPageSkeleton } from "../../components/skeletons/ProductSkeletons";
import { Metadata } from "next";
import { getConfig, getCatalogPaginated } from "../../lib/api";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explora nuestra colección completa de camisetas y equipaciones.",
};

// Next.js 15+ searchParams es una Promise, pero en 14 es objeto.
// Asumimos Next 14 basado en el contexto, pero lo manejamos de forma segura.
type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function CatalogoPage({ searchParams }: Props) {
  // 1. Obtener la configuración global primero (Cacheada)
  const config = await getConfig();

  // 2. Parsear parámetros de búsqueda
  const { categoria, liga, query } = searchParams;
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
  let initialProducts: any[] = [];
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
