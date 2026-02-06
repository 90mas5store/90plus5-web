"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/motion";
import { getCatalogPaginated, getConfig } from "../../lib/api";
import dynamic from "next/dynamic";
import { Product, Config, Category, League } from "../../lib/types";

// 🏗️ Carga dinámica de componentes pesados
const CarruselDeCategoria = dynamic(() => import("../../components/catalogo/CarruselDeCategoria"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse bg-white/5 rounded-3xl" />
});

const CatalogHeroContainer = dynamic(() => import("../../components/catalogo/CatalogHeroContainer"), {
  ssr: true,
  loading: () => <div className="h-[35vh] md:h-[55vh] w-full bg-neutral-900 animate-pulse mb-4" />
});

import useToastMessage from "../../hooks/useToastMessage";
import SearchBar from "../../components/ui/SearchBar";
import ProductCard from "../../components/ui/ProductCard";
import MainButton from "../../components/ui/MainButton"; // Reutilizamos botón consistente
import { usePrefetch, useProductPrefetch } from "../../hooks/usePrefetch";
import { useDebounce, usePrefersReducedMotion } from "../../hooks/useOptimization";
import { ArrowDown } from "lucide-react";

// 🎞️ Animaciones reutilizables
const fadeInItem = (i = 0) => ({
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay: i * 0.05, duration: 0.6, ease: "easeOut" as const },
});

// Tipo extendido para manejar ligas legacy
interface ExtendedLeague {
  nombre: string;
  imagen: string | null;
  id: string | null;
  category_id?: string | null;
  slug?: string;
}

interface CatalogoContentProps {
  initialConfig?: Config | null;
  initialProducts?: Product[];
  initialTotal?: number;
}

export default function CatalogoContent({
  initialConfig = null,
  initialProducts = [],
  initialTotal = 0
}: CatalogoContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriaParam = searchParams.get("categoria");
  const queryParam = searchParams.get("query");
  const ligaParam = searchParams.get("liga");

  // === ESTADOS ===
  const [productos, setProductos] = useState<Product[]>(initialProducts);
  const [totalProducts, setTotalProducts] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const PRODUCTS_PER_PAGE = 24;

  const [config, setConfig] = useState<Config | null>(initialConfig);
  const [ligas, setLigas] = useState<ExtendedLeague[]>(initialConfig?.ligas || []);
  const [ligaSeleccionada, setLigaSeleccionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialProducts.length); // Solo loading si no hay datos iniciales
  const [loadingMore, setLoadingMore] = useState(false); // Estado para "Cargar más"

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(categoriaParam || null);
  const [searchTerm, setSearchTerm] = useState(queryParam || "");
  const debouncedSearchTerm = useDebounce(searchTerm, 400); // 400ms delay
  const prefersReducedMotion = usePrefersReducedMotion();
  const toast = useToastMessage();

  // Flag para evitar doble fetch en mount
  const isFirstMount = useRef(true);
  // Ref para scroll automático
  const contentRef = useRef<HTMLDivElement>(null);
  // Flag para saber si debemos hacer scroll (solo al seleccionar liga)
  const shouldScrollOnFilter = useRef(false);

  // 🔄 Actualizar URL (Live Search)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearchTerm.trim()) {
      params.set("query", debouncedSearchTerm.trim());
    } else {
      params.delete("query");
    }
    router.replace(`/catalogo?${params.toString()}`, { scroll: false });
  }, [debouncedSearchTerm, router, searchParams]);

  // === Funciones de normalización ===
  const normalize = (s: string | null | undefined) =>
    (s || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  // === Carga Inicial de Configuración (Solo si no viene del server) ===
  useEffect(() => {
    if (initialConfig) return; // ✅ Skip si ya tenemos config

    async function fetchConfigData() {
      try {
        const cfg = await getConfig();
        setConfig(cfg || { categorias: [], ligas: [] });

        if (cfg?.ligas?.length) {
          setLigas(cfg.ligas);
        }
      } catch (err) {
        console.error("Error cargando configuración:", err);
      }
    }
    fetchConfigData();
  }, [initialConfig]);

  // === Sincronización de URL con Estados ===
  useEffect(() => {
    setCategoriaSeleccionada(categoriaParam || null);

    if (ligaParam && ligas.length > 0) {
      const foundLeague = ligas.find(l =>
        (l.slug && l.slug === ligaParam) ||
        normalize(l.nombre) === normalize(ligaParam)
      );
      setLigaSeleccionada(foundLeague ? foundLeague.nombre : null);
    } else {
      setLigaSeleccionada(null);
    }
  }, [categoriaParam, ligaParam, ligas]);

  // === OBJETOS SELECCIONADOS (Memoizados) ===
  const selectedCategoryObj = useMemo(() => {
    if (!config?.categorias) return null;
    return config.categorias.find(c => c.slug === categoriaSeleccionada);
  }, [config, categoriaSeleccionada]);

  const selectedLeagueObj = useMemo(() => {
    if (!ligaSeleccionada) return null;
    const lObj = ligas.find(l => normalize(l.nombre) === normalize(ligaSeleccionada));
    // Fallback para ligas en URL que aun no cargan su objeto
    if (!lObj && ligaParam && normalize(ligaParam) === normalize(ligaSeleccionada)) {
      return { id: null, nombre: ligaParam, imagen: null, slug: ligaParam } as any;
    }
    return lObj;
  }, [ligas, ligaSeleccionada, ligaParam]);

  // === CARGA DE PRODUCTOS (Server-Side Filtered & Paginated) ===

  // Función helper para fetchear
  const fetchProducts = useCallback(async (pageNum: number, isAppend: boolean) => {
    // 🛡️ Prevenimos fetch prematuro si la config no ha cargado y hay filtros en URL
    if (!config && (categoriaParam || ligaParam)) return;

    // 🛡️ Si la config ya cargó, pero el slug de la URL no coincide con nada, es un 404 implícito -> No traemos nada
    if (config && categoriaParam && !selectedCategoryObj) {
      setProductos([]);
      setTotalProducts(0);
      setLoading(false);
      return;
    }

    try {
      if (!isAppend) setLoading(true);
      else setLoadingMore(true);

      const { data, count } = await getCatalogPaginated({
        page: pageNum,
        limit: PRODUCTS_PER_PAGE,
        query: debouncedSearchTerm,
        categoryId: selectedCategoryObj?.id,
        leagueId: selectedLeagueObj?.id,
      });

      if (isAppend) {
        setProductos(prev => [...prev, ...data]);
      } else {
        setProductos(data);
        // 🎯 Scroll SOLO cuando se selecciona una liga
        if (shouldScrollOnFilter.current && contentRef.current) {
          const yOffset = -85; // Offset para dejar visible el carrusel de ligas
          const element = contentRef.current;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
          shouldScrollOnFilter.current = false; // Reset
        }
      }

      setTotalProducts(count);
    } catch (error) {
      console.error("Error cargando productos paginados:", error);
      toast.error("Error al cargar productos.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFirstMount.current = false;
    }
  }, [debouncedSearchTerm, selectedCategoryObj, selectedLeagueObj, toast, config, categoriaParam, ligaParam]);

  // Efecto Principal: Disparar Fetch cuando cambian filtros o page
  // NOTA: Separamos la lógica de "Cambio de Filtro" vs "Cambio de Página"

  // 1. Cuando cambian filtros: Resetear a Pág 1
  useEffect(() => {
    // 🛡️ Skip fetch inicial si ya tenemos datos del servidor que coinciden con los params
    // Esto es complejo de validar perfectamente, pero asumimos que si hay initialProducts y es el primer render, no hacemos fetch.
    if (isFirstMount.current && initialProducts.length > 0) {
      // Ya tenemos datos, solo marcamos que ya no es el primer mount
      // PERO: Si los params de URL cambiaron respecto a lo que trajo el server (edge case), deberíamos fetchear.
      // Por simplicidad, asumimos que el server respondió a la URL actual.
      // isFirstMount se setea false en el bloque 'finally' de fetchProducts, o aquí.
      isFirstMount.current = false;
      return;
    }

    setPage(1);
    fetchProducts(1, false);
  }, [debouncedSearchTerm, selectedCategoryObj, selectedLeagueObj]);
  // Omitimos fetchProducts de deps para evitar loop, usamos refs si es necesario o deps estables

  // 2. Función para cargar más (botón)
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  // === Categorías Preload ===
  const adjacentCategories = useMemo(() => {
    if (!config?.categorias) return [];
    return config.categorias.map(c => c.slug).slice(0, 4);
  }, [config]);

  // 🚀 Hook de prefetch
  const { navigate } = usePrefetch();
  useProductPrefetch(productos.slice(0, 4));

  const handlePersonalizar = (item: Product) => {
    toast.loading("Abriendo personalización...");
    navigate(`/producto/${item.slug || item.id}`);
  };

  // === Carrusel Dinámico ===
  const currentCarrusel = useMemo(() => {
    let ligasDisponibles = ligas;
    if (selectedCategoryObj && selectedCategoryObj.id) {
      ligasDisponibles = ligas.filter(l => l.category_id === selectedCategoryObj.id);
    }
    if (!ligasDisponibles.length) return null;

    return {
      title: null,
      items: ligasDisponibles.map((l) => ({
        nombre: l.nombre,
        imagen: l.imagen || "/logos/ligas/placeholder.svg",
      })),
    };
  }, [selectedCategoryObj, ligas]);

  const handleSearchSubmit = (e: any) => {
    e?.preventDefault();
    // El efecto del debounce ya se encarga de fetchear
  };

  return (
    <main className="min-h-screen bg-black text-white pb-24 relative overflow-hidden">
      {/* HERO */}
      <CatalogHeroContainer
        categorySlug={categoriaSeleccionada}
        leagueSlug={ligaParam}
        categoryName={selectedCategoryObj?.nombre || ligaSeleccionada || undefined}
        adjacentCategories={adjacentCategories}
        prefersReducedMotion={prefersReducedMotion}
      />

      {/* BUSCADOR */}
      <div
        ref={contentRef}
        className="flex justify-center mb-6 px-4 relative z-10"
      >
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={handleSearchSubmit}
          placeholder="Buscar por equipo, modelo o estilo..."
        />
      </div>

      {/* CARRUSEL DE LIGAS */}
      {currentCarrusel && currentCarrusel.items.length > 0 && (
        <>
          <CarruselDeCategoria
            title={currentCarrusel.title}
            items={currentCarrusel.items}
            selected={ligaSeleccionada}
            onSelect={(nombre: string) => {
              const nuevaLiga = ligaSeleccionada === nombre ? null : nombre;
              setLigaSeleccionada(nuevaLiga);

              // 🎯 Activar scroll SOLO al seleccionar liga
              if (nuevaLiga) {
                shouldScrollOnFilter.current = true;
              }

              // Actualizamos URL manualmente para UX perfecto
              const params = new URLSearchParams(searchParams.toString());
              if (nuevaLiga) {
                const lObj = ligas.find(l => normalize(l.nombre) === normalize(nuevaLiga));
                params.set('liga', lObj?.slug || nuevaLiga);
              } else {
                params.delete('liga');
              }

              // 🎯 Usar replace en lugar de push
              router.replace(`/catalogo?${params.toString()}`, { scroll: false });

              // El scroll lo manejará fetchProducts automáticamente
            }}
          />

          {/* TITULO CATEGORIA */}
          <AnimatePresence mode="wait">
            {selectedCategoryObj && (
              <motion.div
                key={selectedCategoryObj.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden flex flex-col items-center justify-center pb-6 -mt-1 relative z-10"
              >
                <motion.h2 className="text-2xl font-black text-[#E50914] drop-shadow-[0_0_20px_rgba(229,9,20,0.6)] uppercase tracking-widest text-center">
                  {selectedCategoryObj.nombre}
                </motion.h2>
                <div className="h-1 w-10 bg-gradient-to-r from-transparent via-[#E50914] to-transparent mt-2 rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* GRID DE PRODUCTOS */}
      <section className="max-w-7xl mx-auto px-4 mt-8">

        {/* Loading Skeleton Inicial */}
        {loading && productos.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No encontramos productos con esos filtros.</p>
            <button
              onClick={() => { setSearchTerm(''); setLigaSeleccionada(null); }}
              className="text-[#E50914] hover:underline"
            >
              Borrar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
              {productos.map((item, i) => (
                <div
                  key={`${item.id}-${i}`}
                  className="h-full"
                  style={{ animationDelay: `${(i % PRODUCTS_PER_PAGE) * 50}ms` }}
                >
                  <ProductCard
                    item={item}
                    priority={i < 4}
                    onPress={handlePersonalizar}
                  />
                </div>
              ))}
            </div>

            {/* Botón Cargar Más */}
            {productos.length < totalProducts && (
              <div className="flex justify-center mt-12 pb-8">
                <MainButton
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  isLoading={loadingMore}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold uppercase tracking-widest text-sm backdrop-blur-md transition-all flex items-center gap-2"
                >
                  {loadingMore ? 'Cargando...' : 'Cargar más camisetas'}
                  {!loadingMore && <ArrowDown className="w-4 h-4" />}
                </MainButton>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
