"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getCatalog, getConfig } from "../../lib/api";
import dynamic from "next/dynamic";
import { Product, Config, Category, League } from "../../lib/types";

// 🏗️ Carga dinámica de componentes pesados
const CarruselDeCategoria = dynamic(() => import("../../components/catalogo/CarruselDeCategoria"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse bg-white/5 rounded-3xl" />
});

const HeroBanner = dynamic(() => import("../../components/HeroBanner"), {
  ssr: true,
});

import useToastMessage from "../../hooks/useToastMessage";
import SearchBar from "../../components/ui/SearchBar";
import ProductCard from "../../components/ui/ProductCard";
import { usePrefetch, useProductPrefetch } from "../../hooks/usePrefetch";
import { useDebounce, usePrefersReducedMotion } from "../../hooks/useOptimization";

// 🎞️ Animaciones reutilizables
const fadeInItem = (i = 0) => ({
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay: i * 0.05, duration: 0.6, ease: "easeOut" as const },
});

// Tipo extendido para manejar ligas legacy que no vienen de la DB o no tienen ID
interface ExtendedLeague {
  nombre: string;
  imagen: string | null;
  id: string | null;
  category_id?: string | null;
  slug?: string;
}

export default function CatalogoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriaParam = searchParams.get("categoria");
  const queryParam = searchParams.get("query");
  const ligaParam = searchParams.get("liga");

  const [productos, setProductos] = useState<Product[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [ligas, setLigas] = useState<ExtendedLeague[]>([]);
  const [ligaSeleccionada, setLigaSeleccionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(categoriaParam || null);
  const [searchTerm, setSearchTerm] = useState(queryParam || "");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const prefersReducedMotion = usePrefersReducedMotion();
  const toast = useToastMessage();

  // 🔄 Actualizar URL automáticamente cuando cambia el término buscado (Live Search)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearchTerm.trim()) {
      params.set("query", debouncedSearchTerm.trim());
    } else {
      params.delete("query");
    }
    // Usamos replace para no llenar el historial de navegación con cada letra
    router.replace(`/catalogo?${params.toString()}`, { scroll: false });
  }, [debouncedSearchTerm, router, searchParams]);

  // === Funciones de utilidad ===
  const normalize = (s: string | null | undefined) =>
    (s || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  // === Efectos de carga ===
  useEffect(() => {
    async function fetchAll() {
      try {
        const [prodData, cfg] = await Promise.all([getCatalog(), getConfig()]);
        setProductos(prodData || []);
        setConfig(cfg || { categorias: [], ligas: [] }); // Ensure config structure

        // Ligas vienen ahora de config.ligas con category_id
        if (cfg?.ligas?.length) {
          setLigas(cfg.ligas);
        } else {
          // Fallback legacy si no hay ligas en config (raro con la nueva API)
          const ligasFromConfig: ExtendedLeague[] = [
            ...new Set((prodData || []).map((p) => (p as any).liga).filter(Boolean)),
          ].map((l) => ({ nombre: l as string, imagen: null, id: null, category_id: null }));
          setLigas(ligasFromConfig);
        }

      } catch (err) {
        console.error("Error cargando catálogo/config:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  useEffect(() => {
    if (queryParam && queryParam !== searchTerm) setSearchTerm(queryParam);
  }, [queryParam]); // searchTerm excluded to avoid loop

  useEffect(() => {
    setCategoriaSeleccionada(categoriaParam || null);

    // Si hay parámetro de liga, intentamos seleccionarla
    if (ligaParam && ligas.length > 0) {
      // Buscamos por slug o por nombre
      const foundLeague = ligas.find(l =>
        (l.slug && l.slug === ligaParam) ||
        normalize(l.nombre) === normalize(ligaParam)
      );

      if (foundLeague) {
        setLigaSeleccionada(foundLeague.nombre);
      } else {
        setLigaSeleccionada(null);
      }
    } else {
      setLigaSeleccionada(null);
    }
  }, [categoriaParam, ligaParam, ligas]);

  // === OBJETOS SELECCIONADOS ===
  const selectedCategoryObj = useMemo(() => {
    if (!config?.categorias) return null;
    return config.categorias.find(c => c.slug === categoriaSeleccionada);
  }, [config, categoriaSeleccionada]);

  const selectedLeagueObj = useMemo(() => {
    if (!ligaSeleccionada) return null;
    // Carrusel devuelve el nombre, buscamos el objeto en la lista completa de ligas
    return ligas.find(l => normalize(l.nombre) === normalize(ligaSeleccionada));
  }, [ligas, ligaSeleccionada]);

  // === CATEGORÍAS ADYACENTES PARA PRELOAD ===
  const adjacentCategories = useMemo(() => {
    if (!config?.categorias) return [];
    const slugs = config.categorias.map(c => c.slug);
    // Siempre precargar las primeras 3 categorías para una experiencia más fluida
    return slugs.slice(0, 4);
  }, [config]);


  // === FILTRO ===
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      // 1. Filtro por Categoría
      let catMatch = true;
      if (selectedCategoryObj) {
        if (p.category_id && selectedCategoryObj.id) {
          // Match exacto por ID
          catMatch = p.category_id === selectedCategoryObj.id;
        } else {
          // Fallback por nombre (legacy)
          catMatch = normalize(p.category_id /* bug in logic? p.categoria? */ || (p as any).categoria) === normalize(selectedCategoryObj.nombre);
        }
      }

      // 2. Filtro por Liga
      let ligaMatch = true;
      if (selectedLeagueObj) {
        if (selectedLeagueObj.id) {
          // Match exacto por ID (Check multi-leagues first)
          if (p.league_ids && p.league_ids.length > 0) {
            ligaMatch = p.league_ids.includes(selectedLeagueObj.id);
          } else if (p.league_id) {
            ligaMatch = p.league_id === selectedLeagueObj.id;
          } else {
            ligaMatch = false;
          }
        } else {
          // Fallback por nombre (legacy)
          ligaMatch = normalize((p as any).liga || "") === normalize(selectedLeagueObj.nombre);
        }
      }

      // 3. Buscador
      const q = normalize(debouncedSearchTerm);
      const searchMatch =
        !q ||
        normalize(p.equipo).includes(q) ||
        normalize(p.modelo).includes(q) ||
        normalize((p as any).descripcion || "").includes(q);

      return catMatch && ligaMatch && searchMatch;
    });
  }, [productos, selectedCategoryObj, selectedLeagueObj, debouncedSearchTerm]);


  // 🚀 Hook de prefetch optimizado
  const { prefetch, navigate } = usePrefetch();
  useProductPrefetch(productosFiltrados.slice(0, 4));

  // === Navegación ===
  const handlePersonalizar = (item: Product) => {
    toast.loading("Abriendo personalización...");
    navigate(`/producto/${item.slug || item.id}`);
  };

  // === Carrusel dinámico ===
  const currentCarrusel = useMemo(() => {
    // Filtramos las ligas disponibles según la categoría seleccionada
    let ligasDisponibles = ligas;

    if (selectedCategoryObj && selectedCategoryObj.id) {
      // Filter by category_id if available
      ligasDisponibles = ligas.filter(l => l.category_id === selectedCategoryObj.id);
    }

    // Si no hay ligas para esta categoría (o en general), no mostramos carrusel
    if (!ligasDisponibles.length) return null;

    const items = ligasDisponibles.map((l) => ({
      nombre: l.nombre,
      imagen: l.imagen || "/logos/ligas/placeholder.svg",
    }));

    return {
      title: null,
      items,
    };
  }, [selectedCategoryObj, ligas]);

  const handleSearchSubmit = (e: any) => {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) {
      params.set("query", searchTerm.trim());
    } else {
      params.delete("query");
    }
    router.push(`/catalogo?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-black text-white pb-24 relative overflow-hidden">
      {/* HERO */}
      <HeroBanner
        categorySlug={categoriaSeleccionada || "catalogo"}
        className="min-h-[35vh] md:min-h-[55vh] mb-4"
        alt={selectedCategoryObj ? `Hero ${selectedCategoryObj.nombre}` : "Catálogo 90+5"}
        overlayOpacity={0.6}
        adjacentCategories={adjacentCategories}
        enableParallax={!prefersReducedMotion}
      />

      {/* BUSCADOR */}
      <div className="flex justify-center mb-6 px-4 relative z-10">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={handleSearchSubmit}
          placeholder="Buscar por equipo, modelo o estilo..."
        />
      </div>

      {/* CARRUSEL DE LIGAS (Filtrado por Categoría) */}
      {currentCarrusel && currentCarrusel.items.length > 0 && (
        <>
          <CarruselDeCategoria
            title={currentCarrusel.title}
            items={currentCarrusel.items}
            selected={ligaSeleccionada}
            onSelect={(nombre: string) =>
              setLigaSeleccionada(ligaSeleccionada === nombre ? null : nombre)
            }
          />

          {/* Mobile: Nombre de la Categoría con diseño premium */}
          <AnimatePresence>
            {selectedCategoryObj && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden flex flex-col items-center justify-center pb-6 -mt-1 relative z-10"
              >
                <motion.h2
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-black text-[#E50914] drop-shadow-[0_0_20px_rgba(229,9,20,0.6)] uppercase tracking-widest text-center"
                >
                  {selectedCategoryObj.nombre}
                </motion.h2>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 40 }}
                  className="h-1 bg-gradient-to-r from-transparent via-[#E50914] to-transparent mt-2 rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* GRID DE PRODUCTOS */}
      <section className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8 px-4 mt-8">
        {loading ? (
          <p className="text-center text-gray-400 col-span-full">
            Cargando productos...
          </p>
        ) : productosFiltrados.length === 0 ? (
          <p className="text-center text-gray-400 col-span-full py-12">
            No hay productos que coincidan con tu búsqueda.
          </p>
        ) : (
          productosFiltrados.map((item, i) => (
            <motion.div
              key={item.id}
              {...fadeInItem(i)}
              className="h-full"
            >
              <ProductCard
                item={item}
                priority={i < 4}
                onPress={handlePersonalizar}
              />
            </motion.div>
          ))
        )}
      </section>
    </main>
  );
}
