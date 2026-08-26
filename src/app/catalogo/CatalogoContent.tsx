"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/motion";
import { getCatalogPaginated, getConfig, getTeamsByLeague, getTeamsByCategory, getBrandsByCategory } from "../../lib/api";
import dynamic from "next/dynamic";
import { Product, Brand, Config, Category, League } from "../../lib/types";

// 🏗️ Carga dinámica de componentes pesados
const CarruselDeCategoria = dynamic(() => import("../../components/catalogo/CarruselDeCategoria"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse bg-white/5 rounded-3xl" />
});

const EquipoFilter = dynamic(() => import("../../components/catalogo/EquipoFilter"), {
  ssr: false,
});

const CatalogHeroContainer = dynamic(() => import("../../components/catalogo/CatalogHeroContainer"), {
  ssr: true,
  loading: () => <div className="h-[35dvh] md:h-[55dvh] w-full bg-neutral-900 animate-pulse mb-4" />
});

import CatalogFilterPanel, { CatalogFilters, DEFAULT_FILTERS, SortOption } from "../../components/catalogo/CatalogFilterPanel";
import useToastMessage from "../../hooks/useToastMessage";
import ProductCard from "../../components/ui/ProductCard";
import { useLiveMatches } from "../../hooks/useLiveMatches";
import MatchdayHeaderBanner from "../../components/ui/MatchdayHeaderBanner";
import MainButton from "../../components/ui/MainButton"; // Reutilizamos botón consistente
import { usePrefetch, useProductPrefetch } from "../../hooks/usePrefetch";
import { usePrefersReducedMotion } from "../../hooks/useOptimization";
import { ArrowDown, Filter, X, RotateCcw } from "lucide-react";

const PRICE_LABEL_MAP: Record<string, string> = {
  "0-800": "Hasta L 800",
  "800-1200": "L 800 - 1,200",
  "1200-99999": "L 1,200+",
};

const SORT_LABEL_MAP: Record<string, string> = {
  relevance: "Relevancia",
  price_asc: "Precio: Menor a Mayor",
  price_desc: "Precio: Mayor a Menor",
  newest: "Novedad",
  top_sellers: "Lo Más Vendido",
  alphabetical: "A - Z",
};

// 🎞️ Animaciones reutilizables
const fadeInItem = (i = 0) => ({
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay: i * 0.05, duration: 0.6, ease: "easeOut" as const },
});

function extractSeasonYear(season: string): number {
    // Handle '2024/25' format - extract first year
    const match = season.match(/^(\d{4})/);
    return match ? parseInt(match[1]) : 0;
}

// Tipo extendido para manejar ligas legacy
interface ExtendedLeague {
  nombre: string;
  imagen: string | null;
  id: string | null;
  category_id?: string | null;
  slug?: string;
  hero_image_position_desktop?: string;
  hero_image_position_mobile?: string;
}

interface CatalogoContentProps {
  initialConfig?: Config | null;
  initialProducts?: Product[];
  initialTotal?: number;
  topSellerIds?: string[];
}

export default function CatalogoContent({
  initialConfig = null,
  initialProducts = [],
  initialTotal = 0,
  topSellerIds = [],
}: CatalogoContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriaParam = searchParams.get("categoria") || searchParams.get("category");
  const liveMatches = useLiveMatches();
  const queryParam = searchParams.get("query") || searchParams.get("q");
  const ligaParam = searchParams.get("liga") || searchParams.get("league");
  const equipoParam = searchParams.get("equipo") || searchParams.get("team");
  const marcaParam = searchParams.get("marca") || searchParams.get("brand");
  const temporadaParam = searchParams.get("temporada") || searchParams.get("season");
  const generoParam = searchParams.get("genero") || searchParams.get("gender");
  const precioParam = searchParams.get("precio") || searchParams.get("price");
  const ordenParam = (searchParams.get("orden") || searchParams.get("sortBy") || searchParams.get("sort")) as SortOption | null;

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
  // === Equipos por liga ===
  const [teams, setTeams] = useState<{ id: string; name: string; logo_url: string | null }[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(equipoParam || null);
  // === Marcas por categoría ===
  const [categoryBrands, setCategoryBrands] = useState<Brand[]>([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<string | null>(marcaParam || null);
  // === Filtros avanzados ===
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>({
    gender: generoParam || null,
    priceRange: precioParam || null,
    season: temporadaParam || null,
    sortBy: ordenParam || "relevance",
  });
  const prefersReducedMotion = usePrefersReducedMotion();
  const toast = useToastMessage();

  // Ref para scroll automático
  const contentRef = useRef<HTMLDivElement>(null);
  // Flag para saber si debemos hacer scroll (solo al seleccionar liga)
  const shouldScrollOnFilter = useRef(false);
  // Track previous query to detect changes
  const prevQueryRef = useRef(queryParam);

  // 🔄 Reset filtros cuando llega una nueva búsqueda desde el header
  useEffect(() => {
    if (queryParam !== prevQueryRef.current) {
      prevQueryRef.current = queryParam;
      if (queryParam) {
        setLigaSeleccionada(null);
        setEquipoSeleccionado(null);
        setMarcaSeleccionada(null);
        setCatalogFilters(DEFAULT_FILTERS);
        // Limpiar liga de la URL si existía
        const params = new URLSearchParams(searchParams.toString());
        if (params.has("liga")) {
          params.delete("liga");
          router.replace(`/catalogo?${params.toString()}`, { scroll: false });
        }
      }
    }
  }, [queryParam, searchParams, router]);

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
        setConfig(cfg || { categorias: [], ligas: [], marcas: [] });

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
      return { id: null, nombre: ligaParam, imagen: null, slug: ligaParam } as ExtendedLeague;
    }
    return lObj;
  }, [ligas, ligaSeleccionada, ligaParam]);

  // Helper para sincronizar el estado completo con la URL del navegador
  const syncUrlWithFilters = useCallback((overrides?: {
    categoria?: string | null;
    liga?: string | null;
    equipo?: string | null;
    marca?: string | null;
    temporada?: string | null;
    genero?: string | null;
    precio?: string | null;
    orden?: string | null;
    query?: string | null;
  }) => {
    const params = new URLSearchParams();

    const cat = overrides && 'categoria' in overrides ? overrides.categoria : categoriaSeleccionada;
    const lig = overrides && 'liga' in overrides ? overrides.liga : (selectedLeagueObj?.slug || ligaSeleccionada);
    const eq = overrides && 'equipo' in overrides ? overrides.equipo : equipoSeleccionado;
    const mar = overrides && 'marca' in overrides ? overrides.marca : marcaSeleccionada;
    const temp = overrides && 'temporada' in overrides ? overrides.temporada : catalogFilters.season;
    const gen = overrides && 'genero' in overrides ? overrides.genero : catalogFilters.gender;
    const pr = overrides && 'precio' in overrides ? overrides.precio : catalogFilters.priceRange;
    const ord = overrides && 'orden' in overrides ? overrides.orden : catalogFilters.sortBy;
    const q = overrides && 'query' in overrides ? overrides.query : queryParam;

    if (q) params.set("query", q);
    if (cat) params.set("categoria", cat);
    if (lig) params.set("liga", lig);
    if (eq) params.set("equipo", eq);
    if (mar) params.set("marca", mar);
    if (temp) params.set("temporada", temp);
    if (gen) params.set("genero", gen);
    if (pr) params.set("precio", pr);
    if (ord && ord !== "relevance") params.set("orden", ord);

    const newQueryString = params.toString();
    const currentQueryString = searchParams.toString();
    if (newQueryString !== currentQueryString) {
      const newPath = newQueryString ? `/catalogo?${newQueryString}` : "/catalogo";
      router.replace(newPath, { scroll: false });
    }
  }, [router, searchParams, categoriaSeleccionada, selectedLeagueObj?.slug, ligaSeleccionada, equipoSeleccionado, marcaSeleccionada, catalogFilters, queryParam]);

  // Categorías que muestran filtro de género
  // Sin categoría (catálogo general) = mostrar género
  // Tenis, Streetwear = mostrar género
  // Futbol, Mundial, Retro = NO mostrar género
  const showGenderFilter = useMemo(() => {
    if (!categoriaSeleccionada) return true; // Catálogo general
    const slug = categoriaSeleccionada.toLowerCase();
    const genderCategories = ["tenis", "streetwear", "lifestyle", "running"];
    return genderCategories.some(gc => slug.includes(gc));
  }, [categoriaSeleccionada]);

  const [knownSeasons, setKnownSeasons] = useState<string[]>([]);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      const set = new Set<string>();
      initialProducts.forEach(p => { if (p.season) set.add(p.season); });
      setKnownSeasons(Array.from(set));
    }
  }, [initialProducts]);

  useEffect(() => {
    if (productos.length > 0) {
      setKnownSeasons(prev => {
        const set = new Set(prev);
        productos.forEach(p => { if (p.season) set.add(p.season); });
        return Array.from(set);
      });
    }
  }, [productos]);

  const availableSeasons = useMemo(() => {
    const seasons = new Set<string>(knownSeasons);
    productos.forEach(p => {
      if (p.season) seasons.add(p.season);
    });
    return Array.from(seasons).sort((a, b) => extractSeasonYear(b) - extractSeasonYear(a));
  }, [knownSeasons, productos]);

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

      // Parsear rango de precio si existe
      let priceMin: number | undefined;
      let priceMax: number | undefined;
      if (catalogFilters.priceRange) {
        const [min, max] = catalogFilters.priceRange.split("-").map(Number);
        priceMin = min;
        priceMax = max;
      }

      const { data, count } = await getCatalogPaginated({
        page: pageNum,
        limit: PRODUCTS_PER_PAGE,
        query: queryParam || "",
        categoryId: selectedCategoryObj?.id,
        leagueId: selectedLeagueObj?.id,
        teamId: equipoSeleccionado ?? undefined,
        brandId: marcaSeleccionada ?? undefined,
        gender: catalogFilters.gender ?? undefined,
        season: catalogFilters.season ?? undefined,
        sortBy: catalogFilters.sortBy,
        priceMin,
        priceMax,
        topSellerIds,
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
    }
  }, [queryParam, selectedCategoryObj, selectedLeagueObj, equipoSeleccionado, marcaSeleccionada, catalogFilters, toast, config, categoriaParam, ligaParam]);

  // Efecto Principal: Disparar Fetch cuando cambian filtros
  // Siempre fetchea en mount para garantizar datos frescos (evita stale data del Router Cache)
  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  // fetchProducts omitted: its extra deps (config, toast, etc.) would cause unwanted re-runs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParam, selectedCategoryObj, selectedLeagueObj, equipoSeleccionado, marcaSeleccionada, catalogFilters]);

  // 2. Función para cargar más (botón)
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  // === Cargar equipos y marcas: por liga si hay liga, por categoría si no ===
  useEffect(() => {
    if (selectedLeagueObj?.id) {
      setEquipoSeleccionado(null);
      setMarcaSeleccionada(null);
      setCategoryBrands([]);
      getTeamsByLeague(selectedLeagueObj.id).then(setTeams);
    } else if (selectedCategoryObj?.id) {
      setEquipoSeleccionado(null);
      setMarcaSeleccionada(null);
      getTeamsByCategory(selectedCategoryObj.id).then(setTeams);
      getBrandsByCategory(selectedCategoryObj.id).then(setCategoryBrands);
    } else {
      setTeams([]);
      setCategoryBrands([]);
      setEquipoSeleccionado(null);
      setMarcaSeleccionada(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeagueObj?.id, selectedCategoryObj?.id]);

  // === Categorías Preload ===
  const adjacentCategories = useMemo(() => {
    if (!config?.categorias) return [];
    return config.categorias.map(c => c.slug).slice(0, 4);
  }, [config]);

  // 🚀 Hook de prefetch
  usePrefetch();
  useProductPrefetch(productos.slice(0, 4));

  const handlePersonalizar = () => {
    toast.loading("Abriendo personalización...");
  };

  // === Carrusel Dinámico (ligas O marcas) ===
  const currentCarrusel = useMemo(() => {
    let ligasDisponibles = ligas;
    if (selectedCategoryObj && selectedCategoryObj.id) {
      ligasDisponibles = ligas.filter(l => l.category_id === selectedCategoryObj.id);
    }

    // Si hay ligas disponibles, mostrar ligas en el carrusel
    if (ligasDisponibles.length > 0) {
      return {
        type: "liga" as const,
        title: null,
        items: ligasDisponibles.map((l) => ({
          nombre: l.nombre,
          imagen: l.imagen || "/logos/ligas/placeholder.svg",
        })),
      };
    }

    // Si no hay ligas pero sí marcas, mostrar marcas en el carrusel
    if (categoryBrands.length > 0) {
      return {
        type: "brand" as const,
        title: null,
        items: categoryBrands.map((b) => ({
          nombre: b.name,
          imagen: b.logo_url || "/logos/ligas/placeholder.svg",
          id: b.id,
        })),
      };
    }

    return null;
  }, [selectedCategoryObj, ligas, categoryBrands]);

  return (
    <main className="min-h-dvh bg-black text-white pb-24 relative overflow-hidden">
      {/* 🔴 PARTIDO EN VIVO / MATCHDAY BANNER */}
      <MatchdayHeaderBanner />
      {/* SEO: h1 visible para crawlers y screen readers */}
      <h1 className="sr-only">
        {selectedCategoryObj?.nombre || ligaSeleccionada
          ? `Camisetas de Fútbol — ${selectedCategoryObj?.nombre || ligaSeleccionada}`
          : "Catálogo de Camisetas de Fútbol en Honduras"}
      </h1>

      {/* HERO */}
      <CatalogHeroContainer
        categorySlug={categoriaSeleccionada}
        leagueSlug={ligaParam}
        categoryName={selectedCategoryObj?.nombre || ligaSeleccionada || undefined}
        adjacentCategories={adjacentCategories}
        prefersReducedMotion={prefersReducedMotion}
        imagePositionDesktop={
          selectedCategoryObj?.hero_image_position_desktop ||
          selectedLeagueObj?.hero_image_position_desktop
        }
        imagePositionMobile={
          selectedCategoryObj?.hero_image_position_mobile ||
          selectedLeagueObj?.hero_image_position_mobile
        }
      />

      {/* FILTROS AVANZADOS (Panel desplegable) */}
      <div ref={contentRef}></div>
      <CatalogFilterPanel
        showGender={showGenderFilter}
        filters={catalogFilters}
        availableSeasons={availableSeasons}
        onFiltersChange={(newFilters) => {
          setCatalogFilters(newFilters);
          shouldScrollOnFilter.current = false;
          syncUrlWithFilters({
            temporada: newFilters.season,
            genero: newFilters.gender,
            precio: newFilters.priceRange,
            orden: newFilters.sortBy,
          });
        }}
      />

      {/* CARRUSEL DE LIGAS O MARCAS */}
      {currentCarrusel && currentCarrusel.items.length > 0 && (
        <>
          <CarruselDeCategoria
            title={currentCarrusel.title}
            items={currentCarrusel.items}
            selected={currentCarrusel.type === "brand"
              ? categoryBrands.find(b => b.id === marcaSeleccionada)?.name ?? null
              : ligaSeleccionada
            }
            onSelect={(nombre: string) => {
              if (currentCarrusel.type === "brand") {
                // Selección de marca
                const brand = categoryBrands.find(b => b.name === nombre);
                const brandId = brand?.id ?? null;
                const newBrand = marcaSeleccionada === brandId ? null : brandId;
                setMarcaSeleccionada(newBrand);
                setEquipoSeleccionado(null);
                shouldScrollOnFilter.current = false;
                syncUrlWithFilters({ marca: newBrand, equipo: null });
              } else {
                // Selección de liga
                const nuevaLiga = ligaSeleccionada === nombre ? null : nombre;
                setLigaSeleccionada(nuevaLiga);

                if (nuevaLiga) {
                  shouldScrollOnFilter.current = true;
                }

                const lObj = ligas.find(l => normalize(l.nombre) === normalize(nuevaLiga));
                syncUrlWithFilters({ liga: lObj?.slug || nuevaLiga || null, equipo: null, marca: null });
              }
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

      {/* FILTRO DE EQUIPOS — siempre visible si hay equipos (por categoría o por liga) */}
      {teams.length >= 2 && (
        <EquipoFilter
          teams={teams}
          selected={equipoSeleccionado}
          onSelect={(id) => {
            const newEq = equipoSeleccionado === id ? null : id;
            setEquipoSeleccionado(newEq);
            setMarcaSeleccionada(null);
            shouldScrollOnFilter.current = false;
            syncUrlWithFilters({ equipo: newEq, marca: null });
          }}
          leagueName={ligaSeleccionada ?? undefined}
        />
      )}

      {/* FILTRO DE MARCAS — solo como chips si el carrusel muestra ligas (no marcas) */}
      {categoryBrands.length >= 2 && !ligaSeleccionada && currentCarrusel?.type !== "brand" && (
        <div className="px-4 pb-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Marcas
            </span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {categoryBrands.map((brand) => {
              const isSelected = marcaSeleccionada === brand.id;
              return (
                <button
                  key={brand.id}
                  onClick={() => {
                    const newBrand = marcaSeleccionada === brand.id ? null : brand.id;
                    setMarcaSeleccionada(newBrand);
                    setEquipoSeleccionado(null);
                    syncUrlWithFilters({ marca: newBrand, equipo: null });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {brand.logo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brand.logo_url} alt="" className="w-5 h-5 object-contain" />
                  )}
                  {brand.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* BARRA DE FILTROS ACTIVOS CON ELIMINACIÓN RÁPIDA (1-CLIC) */}
      {Boolean(
        queryParam ||
        categoriaSeleccionada ||
        ligaSeleccionada ||
        equipoSeleccionado ||
        marcaSeleccionada ||
        catalogFilters.season ||
        catalogFilters.gender ||
        catalogFilters.priceRange ||
        (catalogFilters.sortBy && catalogFilters.sortBy !== "relevance")
      ) && (
        <div className="max-w-7xl mx-auto px-4 mt-6 mb-2">
          <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-2xl bg-neutral-900/80 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 mr-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Filtros activos:</span>
            </div>

            {queryParam && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50914]/15 border border-[#E50914]/40 text-white text-xs font-medium shadow-[0_0_10px_rgba(229,9,20,0.15)] animate-in fade-in zoom-in-95 duration-200">
                <span>Búsqueda: &quot;{queryParam}&quot;</span>
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("query");
                    params.delete("q");
                    router.replace(params.toString() ? `/catalogo?${params.toString()}` : "/catalogo", { scroll: false });
                  }}
                  className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
                  title="Eliminar búsqueda"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategoryObj && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50914]/15 border border-[#E50914]/40 text-white text-xs font-medium shadow-[0_0_10px_rgba(229,9,20,0.15)] animate-in fade-in zoom-in-95 duration-200">
                <span>Categoría: {selectedCategoryObj.nombre}</span>
                <button
                  onClick={() => {
                    setCategoriaSeleccionada(null);
                    syncUrlWithFilters({ categoria: null });
                  }}
                  className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
                  title="Eliminar filtro categoría"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedLeagueObj && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50914]/15 border border-[#E50914]/40 text-white text-xs font-medium shadow-[0_0_10px_rgba(229,9,20,0.15)] animate-in fade-in zoom-in-95 duration-200">
                <span>Liga: {selectedLeagueObj.nombre}</span>
                <button
                  onClick={() => {
                    setLigaSeleccionada(null);
                    syncUrlWithFilters({ liga: null });
                  }}
                  className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
                  title="Eliminar filtro liga"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {equipoSeleccionado && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50914]/15 border border-[#E50914]/40 text-white text-xs font-medium shadow-[0_0_10px_rgba(229,9,20,0.15)] animate-in fade-in zoom-in-95 duration-200">
                <span>Equipo: {teams.find(t => t.id === equipoSeleccionado)?.name || equipoSeleccionado}</span>
                <button
                  onClick={() => {
                    setEquipoSeleccionado(null);
                    syncUrlWithFilters({ equipo: null });
                  }}
                  className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
                  title="Eliminar filtro equipo"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {marcaSeleccionada && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50914]/15 border border-[#E50914]/40 text-white text-xs font-medium shadow-[0_0_10px_rgba(229,9,20,0.15)] animate-in fade-in zoom-in-95 duration-200">
                <span>Marca: {categoryBrands.find(b => b.id === marcaSeleccionada)?.name || marcaSeleccionada}</span>
                <button
                  onClick={() => {
                    setMarcaSeleccionada(null);
                    syncUrlWithFilters({ marca: null });
                  }}
                  className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
                  title="Eliminar filtro marca"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {catalogFilters.season && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50914]/15 border border-[#E50914]/40 text-white text-xs font-medium shadow-[0_0_10px_rgba(229,9,20,0.15)] animate-in fade-in zoom-in-95 duration-200">
                <span>Temporada: {catalogFilters.season}</span>
                <button
                  onClick={() => {
                    const newF = { ...catalogFilters, season: null };
                    setCatalogFilters(newF);
                    syncUrlWithFilters({ temporada: null });
                  }}
                  className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
                  title="Eliminar filtro temporada"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {catalogFilters.gender && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50914]/15 border border-[#E50914]/40 text-white text-xs font-medium shadow-[0_0_10px_rgba(229,9,20,0.15)] animate-in fade-in zoom-in-95 duration-200">
                <span>Género: {catalogFilters.gender === 'man' ? 'Hombre' : catalogFilters.gender === 'woman' ? 'Mujer' : 'Niños'}</span>
                <button
                  onClick={() => {
                    const newF = { ...catalogFilters, gender: null };
                    setCatalogFilters(newF);
                    syncUrlWithFilters({ genero: null });
                  }}
                  className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
                  title="Eliminar filtro género"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {catalogFilters.priceRange && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50914]/15 border border-[#E50914]/40 text-white text-xs font-medium shadow-[0_0_10px_rgba(229,9,20,0.15)] animate-in fade-in zoom-in-95 duration-200">
                <span>Precio: {PRICE_LABEL_MAP[catalogFilters.priceRange] || catalogFilters.priceRange}</span>
                <button
                  onClick={() => {
                    const newF = { ...catalogFilters, priceRange: null };
                    setCatalogFilters(newF);
                    syncUrlWithFilters({ precio: null });
                  }}
                  className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
                  title="Eliminar filtro precio"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {catalogFilters.sortBy !== "relevance" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50914]/15 border border-[#E50914]/40 text-white text-xs font-medium shadow-[0_0_10px_rgba(229,9,20,0.15)] animate-in fade-in zoom-in-95 duration-200">
                <span>Orden: {SORT_LABEL_MAP[catalogFilters.sortBy] || catalogFilters.sortBy}</span>
                <button
                  onClick={() => {
                    const newF = { ...catalogFilters, sortBy: "relevance" as const };
                    setCatalogFilters(newF);
                    syncUrlWithFilters({ orden: "relevance" });
                  }}
                  className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
                  title="Eliminar orden"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={() => {
                setLigaSeleccionada(null);
                setEquipoSeleccionado(null);
                setMarcaSeleccionada(null);
                setCatalogFilters(DEFAULT_FILTERS);
                router.replace("/catalogo", { scroll: false });
              }}
              className="ml-auto text-xs font-bold text-[#E50914] hover:underline flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-[#E50914]/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Limpiar todos
            </button>
          </div>
        </div>
      )}

      {/* GRID DE PRODUCTOS */}
      <section className="max-w-7xl mx-auto px-4 mt-8">

        {/* Loading Skeleton Inicial */}
        {loading && productos.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No encontramos productos con esos filtros.</p>
            <button
              onClick={() => {
                setLigaSeleccionada(null);
                setEquipoSeleccionado(null);
                setMarcaSeleccionada(null);
                setCatalogFilters(DEFAULT_FILTERS);
                router.replace('/catalogo', { scroll: false });
              }}
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
                  key={item.id}
                  className="h-full"
                >
                  <ProductCard
                    item={item}
                    priority={i < 4}
                    onPress={handlePersonalizar}
                    topSeller={topSellerIds.includes(item.id)}
                    liveMatch={liveMatches[item.team_id] ?? null}
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
