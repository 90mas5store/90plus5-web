"use client";

// 🚀 Optimización: Revalidación cada hora (ISR) en lugar de force-dynamic
// export const revalidate = 3600; 
// Nota: En "use client" no se puede exportar revalidate directamente en la misma página si es toda cliente.
// Pero como es una SPA con fetch client-side, la caché depende de la API.
// Sin embargo, para mejorar el SEO inicial, lo ideal sería que fuera Server Component.
// Por ahora, mantendremos "use client" pero quitamos "force-dynamic" y confiamos en la caché de la API.

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getFeatured, getConfig } from "../lib/api";
import MainButton from "../components/ui/MainButton";
import { Shirt, ArrowRight } from "lucide-react";

// 🏗️ Carga dinámica de componentes pesados
const CarruselDeCategoria = dynamic(() => import("../components/catalogo/CarruselDeCategoria"), {
    ssr: false,
    loading: () => <div className="h-40 animate-pulse bg-white/5 rounded-3xl" />
});

import HeroBanner from "../components/HeroBanner";
import { useCart } from "../context/CartContext";
import { Product, Config, Category } from "../lib/types";
import useToastMessage from "@/hooks/useToastMessage";
import SearchBar from "../components/ui/SearchBar";
import ProductCard from "../components/ui/ProductCard";
import { ProductGridSkeleton } from "../components/skeletons/ProductSkeletons";
import { usePrefetch, useProductPrefetch } from "../hooks/usePrefetch";
import { useDebounce, usePrefersReducedMotion } from "../hooks/useOptimization";



// 🎞️ Animaciones coherentes con Catálogo
const fadeInItem = (i = 0) => ({
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.97 },
    transition: { delay: i * 0.05, duration: 0.5, ease: "easeOut" as const },
});

const glowHover = {
    whileHover: {
        boxShadow: "0 0 22px rgba(229,9,20,0.25)",
        borderColor: "rgba(229,9,20,0.45)",
        transition: { duration: 0.3, ease: "easeOut" as const },
    },
};

export default function Home() {
    const router = useRouter();
    const { addItem } = useCart();
    const { prefetch, navigate } = usePrefetch();

    const [destacados, setDestacados] = useState<Product[]>([]);
    const [ligas, setLigas] = useState<any[]>([]);
    const [categorias, setCategorias] = useState<Category[]>([]);
    const [ligaSeleccionada, setLigaSeleccionada] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 400);
    const prefersReducedMotion = usePrefersReducedMotion();
    const toast = useToastMessage();

    // 🚀 Precargar rutas de productos cuando estén disponibles
    useProductPrefetch(destacados.slice(0, 4));

    // === Funciones de utilidad ===
    const normalize = (s: string) =>
        (s || "")
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "");

    // 🚀 Cargar destacados + config
    useEffect(() => {
        async function fetchData() {
            try {
                const [featuredData, configData] = await Promise.all([
                    getFeatured(),
                    getConfig(),
                ]);
                setDestacados(featuredData || []);
                if (configData?.ligas?.length) {
                    setLigas(configData.ligas);
                } else {
                    // Fallback legacy
                    const ligasUnicas = [
                        ...new Set(
                            (featuredData || []).map((p) => (p as any).liga).filter(Boolean)
                        ),
                    ].map((l) => ({ nombre: l as string, imagen: null, id: null }));
                    setLigas(ligasUnicas);
                }

                if (configData?.categorias?.length) {
                    setCategorias(configData.categorias);
                }
            } catch (error) {
                console.error("Error cargando datos del Home:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // 🔍 Filtrado por liga
    const destacadosFiltrados = useMemo(() => {
        if (!ligaSeleccionada) return destacados;

        const selectedLeagueObj = ligas.find(l => normalize(l.nombre) === normalize(ligaSeleccionada));

        return destacados.filter((item) => {
            // 1. Intentar match por ID (Soporte Multi-Liga)
            if (selectedLeagueObj?.id) {
                if (item.league_ids?.includes(selectedLeagueObj.id)) return true;
                if (item.league_id === selectedLeagueObj.id) return true;
            }

            // 2. Fallback: Match por nombre de liga (legacy o si falta ID)
            // Normalizamos ambos lados para asegurar coincidencia
            const itemLiga = (item as any).liga || "";
            return normalize(itemLiga) === normalize(ligaSeleccionada);
        });
    }, [destacados, ligaSeleccionada, ligas]);

    // 🔎 Buscar
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/catalogo?query=${encodeURIComponent(searchTerm.trim())}`);
        } else {
            router.push(`/catalogo`);
        }
    };

    return (
        <LazyMotion features={domAnimation}>
            <main className="bg-background text-textLight min-h-screen relative overflow-hidden">
                {/* 🏟️ HERO - Solo imagen/video personalizable */}
                <HeroBanner
                    categorySlug="home"
                    minHeight="45vh"
                    alt="90+5 Store Hero"
                    overlayOpacity={0.6}
                    enableParallax={!prefersReducedMotion}
                />

                {/* 🔍 BUSCADOR */}
                <section className="flex justify-center -mt-4 md:-mt-6 mb-6 md:mb-8 px-4 z-20 relative">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        onSearch={handleSearch}
                        placeholder="Buscar por equipo, modelo o jugador..."
                    />
                </section>

                {/* 🏆 LIGAS */}
                <div id="ligas">
                    <CarruselDeCategoria
                        title="Ligas disponibles"
                        items={ligas.map((l) => ({
                            nombre: l.nombre,
                            imagen: l.imagen || "/logos/ligas/placeholder.svg",
                        }))}
                        selected={ligaSeleccionada}
                        onSelect={(nombre: string) =>
                            setLigaSeleccionada(ligaSeleccionada === nombre ? null : nombre)
                        }
                    />
                </div>

                {/* ⭐ DESTACADOS */}
                <section id="destacados" className="py-6 md:py-10 px-4 max-w-7xl mx-auto">
                    <h2 className="text-center text-3xl md:text-4xl font-bold text-primary mb-6 md:mb-8 drop-shadow-[0_0_20px_rgba(229,9,20,0.4)]">
                        {ligaSeleccionada
                            ? `Destacados de ${ligaSeleccionada}`
                            : "Destacados 90+5"}
                    </h2>

                    {loading ? (
                        <p className="text-center text-textMuted">Cargando productos...</p>
                    ) : (
                        <AnimatePresence mode="wait">
                            <m.div
                                key={ligaSeleccionada || "all"}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
                            >
                                {destacadosFiltrados.map((item, i) => (
                                    <m.div
                                        key={item.id}
                                        {...fadeInItem(i)}
                                        className="h-full" // Ensure height consistency
                                    >
                                        <ProductCard
                                            item={item}
                                            priority={i < 4} // First 4 items get priority loading
                                            enableGlow={!prefersReducedMotion}
                                            onPress={(product) => {
                                                toast.loading("Cargando personalización...");
                                                navigate(`/producto/${product.slug || product.id}`);
                                            }}
                                        />
                                    </m.div>
                                ))}
                            </m.div>

                            {ligaSeleccionada && (
                                <m.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-center mt-16"
                                >
                                    <MainButton
                                        onClick={() => {
                                            const selectedLeagueObj = ligas.find(l => normalize(l.nombre) === normalize(ligaSeleccionada));
                                            const categoryObj = selectedLeagueObj?.category_id
                                                ? categorias.find(c => c.id === selectedLeagueObj.category_id)
                                                : null;

                                            const catSlug = categoryObj?.slug;
                                            const leagueSlug = selectedLeagueObj?.slug || encodeURIComponent(ligaSeleccionada || "");

                                            let url = "/catalogo";
                                            if (catSlug) {
                                                url += `?categoria=${catSlug}&liga=${leagueSlug}`;
                                            } else {
                                                url += `?query=${encodeURIComponent(ligaSeleccionada || "")}`;
                                            }

                                            router.push(url);
                                        }}
                                        className="group relative px-8 py-4 bg-gradient-to-r from-[#E50914] to-[#b00710] text-white rounded-full font-bold tracking-wider uppercase text-sm shadow-[0_0_20px_rgba(229,9,20,0.4)] hover:shadow-[0_0_35px_rgba(229,9,20,0.6)] hover:scale-105 transition-all duration-300 flex items-center gap-2"
                                    >
                                        <span>Ver colección completa {ligaSeleccionada}</span>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="group-hover:translate-x-1 transition-transform"
                                        >
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
                                        </svg>
                                    </MainButton>
                                </m.div>
                            )}

                        </AnimatePresence>
                    )}
                </section>
            </main>
        </LazyMotion>
    );
}
