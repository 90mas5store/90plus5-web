"use client";

import { useState, useMemo } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import MainButton from "./ui/MainButton";
import { useCart } from "@/context/CartContext";
import { Product, Config, Category } from "@/lib/types";
import useToastMessage from "@/hooks/useToastMessage";
import SearchBar from "./ui/SearchBar";
import ProductCard from "./ui/ProductCard";
import { usePrefetch, useProductPrefetch } from "@/hooks/usePrefetch";
import { useDebounce, usePrefersReducedMotion } from "@/hooks/useOptimization";
import SpecialEventBanner from "./ui/SpecialEventBanner";
import HomeBannerContainer from "./HomeBannerContainer";

// 🏗️ Carga dinámica de componentes pesados
const CarruselDeCategoria = dynamic(() => import("./catalogo/CarruselDeCategoria"), {
    ssr: false,
    loading: () => <div className="h-40 animate-pulse bg-white/5 rounded-3xl" />
});

// 🎞️ Animaciones coherentes con Catálogo
const fadeInItem = (i = 0) => ({
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.97 },
    transition: { delay: i * 0.05, duration: 0.5, ease: "easeOut" as const },
});

interface HomeClientProps {
    initialDestacados: Product[];
    initialBanners: any[];
    initialLigas: any[]; // Processed leagues
    initialCategorias: Category[];
}

export default function HomeClient({
    initialDestacados,
    initialBanners,
    initialLigas,
    initialCategorias
}: HomeClientProps) {
    const router = useRouter();
    const { navigate } = usePrefetch();

    // State initialization with props
    const [destacados] = useState<Product[]>(initialDestacados || []);
    const [banners] = useState<any[]>(initialBanners || []);
    const [ligas] = useState<any[]>(initialLigas || []);
    const [categorias] = useState<Category[]>(initialCategorias || []);

    // State for interactions
    const [ligaSeleccionada, setLigaSeleccionada] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 400); // Kept for consistency if needed, though search is direct
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

    // 🔍 Filtrado por liga (PRESERVANDO ORDEN ORIGINAL)
    const destacadosFiltrados = useMemo(() => {
        if (!ligaSeleccionada) return destacados;

        const selectedLeagueObj = ligas.find(l => normalize(l.nombre) === normalize(ligaSeleccionada));

        // Filtrar SIN alterar el orden original (sort_order del servidor)
        return destacados.filter((item) => {
            // 1. Intentar match por ID (Soporte Multi-Liga)
            if (selectedLeagueObj?.id) {
                if (item.league_ids?.includes(selectedLeagueObj.id)) return true;
                if (item.league_id === selectedLeagueObj.id) return true;
            }

            // 2. Fallback: Match por nombre de liga (legacy o si falta ID)
            const itemLiga = (item as any).liga || "";
            return normalize(itemLiga) === normalize(ligaSeleccionada);
        });
        // ✅ NO aplicamos .sort() aquí - respetamos el orden que viene del servidor
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
        <main className="bg-background text-textLight min-h-screen relative overflow-hidden">

            {/* 🏟️ HERO */}
            <h1 className="sr-only">90+5 Store - La Mejor Tienda de Camisetas de Fútbol en Honduras</h1>
            <HomeBannerContainer initialBanners={banners} />

            <LazyMotion features={domAnimation}>

                {/* 🔍 BUSCADOR */}
                <section className="flex justify-center -mt-4 md:-mt-6 mb-6 md:mb-8 px-4 z-20 relative">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        onSearch={handleSearch}
                        placeholder="Buscar por equipo, modelo o jugador..."
                    />
                </section>

                {/* 🏆 EVENTO ESPECIAL (MUNDIAL) */}
                <SpecialEventBanner />

                {/* 🏆 LIGAS */}
                <div id="ligas">
                    <CarruselDeCategoria
                        title="Ligas disponibles"
                        items={ligas.map((l) => ({
                            nombre: l.nombre,
                            imagen: l.imagen || "/logos/ligas/placeholder.svg",
                        }))}
                        selected={ligaSeleccionada}
                        onSelect={(nombre: string) => {
                            const nuevaLiga = ligaSeleccionada === nombre ? null : nombre;
                            setLigaSeleccionada(nuevaLiga);

                            // 🎯 Scroll automático suave al seleccionar liga
                            if (nuevaLiga) {
                                console.log('🎯 Ejecutando scroll a ligas...', nuevaLiga);
                                setTimeout(() => {
                                    const element = document.getElementById('ligas');
                                    console.log('📍 Elemento ligas encontrado:', element);
                                    if (element) {
                                        const yOffset = -80; // Offset para dejar visible el título y carrusel
                                        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                        window.scrollTo({ top: y, behavior: 'smooth' });
                                    }
                                }, 100);
                            }
                        }}
                    />
                </div>

                {/* ⭐ DESTACADOS */}
                <section id="destacados" className="py-6 md:py-10 px-4 max-w-7xl mx-auto">
                    <h2 className="text-center text-3xl md:text-4xl font-bold text-primary mb-6 md:mb-8 drop-shadow-[0_0_20px_rgba(229,9,20,0.4)]">
                        {ligaSeleccionada
                            ? `Destacados de ${ligaSeleccionada}`
                            : "Destacados 90+5"}
                    </h2>


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
                                <div
                                    key={item.id}
                                    className="h-full animate-in fade-in zoom-in-95 fill-mode-both duration-500"
                                    style={{ animationDelay: `${i * 50}ms` }}
                                >
                                    <ProductCard
                                        item={item}
                                        priority={i < 4}
                                        enableGlow={!prefersReducedMotion}
                                        onPress={(product) => {
                                            toast.loading("Cargando personalización...");
                                            navigate(`/producto/${product.slug || product.id}`);
                                        }}
                                    />
                                </div>
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
                                        aria-hidden="true"
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

                </section>
            </LazyMotion>
        </main>
    );
}
