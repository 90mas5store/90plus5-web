"use client";

import { useState, useMemo, useEffect, useRef } from "react";

// Persiste en memoria durante la sesión SPA (no se resetea entre navegaciones)
const _homeAlreadyMounted = { value: false };
import { m, AnimatePresence } from "@/lib/motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import MainButton from "./ui/MainButton";
import { useCart } from "@/context/CartContext";
import { Product, Config, Category, SpecialBanner } from "@/lib/types";
import { fetchProductsByTeamIds } from "@/lib/api";
import useToastMessage from "@/hooks/useToastMessage";
import ProductCard from "./ui/ProductCard";
import { useLiveMatchesData } from "@/hooks/useLiveMatches";
import { usePrefetch, useProductPrefetch } from "@/hooks/usePrefetch";
import { usePrefersReducedMotion } from "@/hooks/useOptimization";
import SpecialEventBanner from "./ui/SpecialEventBanner";
import HomeBannerContainer from "./HomeBannerContainer";
import MatchdayHeaderBanner from "./ui/MatchdayHeaderBanner";
import MatchdayHeroTakeover from "./home/MatchdayHeroTakeover";
import StoreGeoAuthoritySection from "./home/StoreGeoAuthoritySection";

import BentoSpotlightProduct from "./home/BentoSpotlightProduct";
import { Star, Flame, Sparkles, Tag, Zap, LayoutGrid } from "lucide-react";

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
    initialBestSellers?: Product[];
    initialNewArrivals?: Product[];
    initialOnSale?: Product[];
    initialBanners: Record<string, unknown>[];
    initialSpecialBanners: SpecialBanner[];
    initialLigas: import('@/lib/types').League[];
    initialCategorias: Category[];
}

export default function HomeClient({
    initialDestacados,
    initialBestSellers = [],
    initialNewArrivals = [],
    initialOnSale = [],
    initialBanners,
    initialSpecialBanners,
    initialLigas,
    initialCategorias
}: HomeClientProps) {
    const router = useRouter();
    usePrefetch();
    const { matches: liveMatches, isLoaded: liveMatchesLoaded } = useLiveMatchesData();

    // State initialization with props
    const [destacados] = useState<Product[]>(initialDestacados || []);
    const [bestSellers] = useState<Product[]>(initialBestSellers || []);
    const [newArrivals] = useState<Product[]>(initialNewArrivals || []);
    const [onSale] = useState<Product[]>(initialOnSale || []);
    const [banners] = useState<Record<string, unknown>[]>(initialBanners || []);
    const [ligas] = useState<import('@/lib/types').League[]>(initialLigas || []);
    const [categorias] = useState<Category[]>(initialCategorias || []);

    // ⚡ Camisetas cargadas en tiempo real para todos los clubes en Matchday
    const [matchdayProducts, setMatchdayProducts] = useState<Product[]>([]);

    useEffect(() => {
        if (!liveMatchesLoaded) return;
        const teamIds = Object.keys(liveMatches).filter(Boolean);
        if (teamIds.length === 0) {
            setMatchdayProducts([]);
            return;
        }

        fetchProductsByTeamIds(teamIds).then((prods) => {
            if (prods && prods.length > 0) {
                setMatchdayProducts(prods);
            }
        });
    }, [liveMatches, liveMatchesLoaded]);

    type HomeTab = 'destacados' | 'bestsellers' | 'new' | 'onsale' | 'matchday';
    const [activeTab, setActiveTab] = useState<HomeTab>('destacados');

    type ViewMode = 'showcase' | 'grid';
    const [viewMode, setViewMode] = useState<ViewMode>('showcase');

    // State for interactions
    const [ligaSeleccionada, setLigaSeleccionada] = useState<string | null>(null);
    const prefersReducedMotion = usePrefersReducedMotion();
    const toast = useToastMessage();

    // true = primera vez que se monta en esta sesión de navegación
    const isFirstMount = useRef(!_homeAlreadyMounted.value);
    useEffect(() => {
        _homeAlreadyMounted.value = true;
    }, []);

    // Conteo de camisetas y equipos jugando hoy para badge en Matchday
    const matchdayCount = useMemo(() => {
        const uniqueMap = new Map<string, Product>();
        matchdayProducts.forEach((p) => uniqueMap.set(p.id, p));
        const allPool = [...destacados, ...bestSellers, ...newArrivals, ...onSale];
        allPool.forEach((p) => {
            if (p.team_id && liveMatches[p.team_id]) {
                uniqueMap.set(p.id, p);
            }
        });
        if (uniqueMap.size > 0) return uniqueMap.size;
        return Object.keys(liveMatches).length;
    }, [matchdayProducts, destacados, bestSellers, newArrivals, onSale, liveMatches]);

    // === Funciones de utilidad ===
    const normalize = (s: string) =>
        (s || "")
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "");

    // 🔍 Filtrado por Pestaña Activa y Liga (PRESERVANDO ORDEN ORIGINAL DE CADA TAB)
    const currentTabProducts = useMemo(() => {
        let baseList: Product[] = [];
        if (activeTab === 'destacados') {
            baseList = destacados;
        } else if (activeTab === 'bestsellers') {
            baseList = (bestSellers.length > 0 ? bestSellers : destacados).slice(0, 12);
        } else if (activeTab === 'new') {
            baseList = (newArrivals.length > 0 ? newArrivals : destacados).slice(0, 12);
        } else if (activeTab === 'onsale') {
            baseList = onSale;
        } else if (activeTab === 'matchday') {
            const uniqueMap = new Map<string, Product>();
            matchdayProducts.forEach((p) => uniqueMap.set(p.id, p));

            const allPool = [...destacados, ...bestSellers, ...newArrivals, ...onSale];
            allPool.forEach((p) => {
                if (p.team_id && liveMatches[p.team_id] && !uniqueMap.has(p.id)) {
                    uniqueMap.set(p.id, p);
                }
            });

            baseList = Array.from(uniqueMap.values());
        }

        if (!ligaSeleccionada) return baseList;

        const selectedLeagueObj = ligas.find((l) => normalize(l.nombre) === normalize(ligaSeleccionada));
        return baseList.filter((item) => {
            if (selectedLeagueObj?.id) {
                if (item.league_ids?.includes(selectedLeagueObj.id)) return true;
                if (item.league_id === selectedLeagueObj.id) return true;
            }
            const itemLiga = (item as any).liga || "";
            return normalize(itemLiga) === normalize(ligaSeleccionada);
        });
    }, [activeTab, destacados, bestSellers, newArrivals, onSale, matchdayProducts, liveMatches, ligaSeleccionada, ligas]);

    // 🚀 Precargar rutas de productos cuando estén disponibles
    useProductPrefetch(currentTabProducts.slice(0, 4));

    const TABS = [
        { id: 'destacados' as const, label: 'Selección 90+5', icon: Star },
        { id: 'bestsellers' as const, label: 'Más Vendidos', icon: Flame },
        { id: 'new' as const, label: 'Recién Agregados', icon: Sparkles },
        { id: 'onsale' as const, label: 'En Oferta', icon: Tag },
        {
            id: 'matchday' as const,
            label: 'Matchday',
            icon: Zap,
            badge: matchdayCount > 0 ? `${matchdayCount}` : undefined,
        },
    ];

    return (
        <main className="bg-background text-textLight min-h-dvh relative overflow-hidden">
            {/* 🏟️ HERO TAKEOVER (PARTIDOS EN VIVO) O HERO TRADICIONAL */}
            <h1 className="sr-only">90+5 Store | Tienda Deportiva en Tegucigalpa · Camisetas de Fútbol y Ropa Deportiva en Honduras</h1>
            {liveMatchesLoaded && Object.keys(liveMatches).length > 0 ? (
                <MatchdayHeroTakeover />
            ) : (
                <HomeBannerContainer initialBanners={banners} />
            )}

            {/* 🏆 EVENTO ESPECIAL (MUNDIAL) */}
            <SpecialEventBanner
                banners={initialSpecialBanners}
                hasMatchdayHero={liveMatchesLoaded && Object.keys(liveMatches).length > 0}
            />

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
                            setTimeout(() => {
                                const element = document.getElementById('ligas');
                                if (element) {
                                    const yOffset = -80;
                                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                    window.scrollTo({ top: y, behavior: 'smooth' });
                                }
                            }, 100);
                        }
                    }}
                />
            </div>

            {/* ⭐ CATÁLOGO PRINCIPAL CON PESTAÑAS INTELIGENTES */}
            <section id="destacados" className="py-8 md:py-14 px-4 max-w-7xl mx-auto">
                {/* Header Dinámico */}
                <div className="text-center mb-6 md:mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 text-white/60 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                        <span>Colección Oficial</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                        {ligaSeleccionada
                            ? `${activeTab === 'bestsellers' ? 'Más Vendidos de' : activeTab === 'new' ? 'Novedades de' : activeTab === 'onsale' ? 'Ofertas de' : 'Colección de'} ${ligaSeleccionada}`
                            : activeTab === 'destacados'
                            ? 'Selección 90+5'
                            : activeTab === 'bestsellers'
                            ? 'Los Más Vendidos'
                            : activeTab === 'new'
                            ? 'Recién Agregados'
                            : activeTab === 'onsale'
                            ? 'En Oferta & Liquidación'
                            : 'Matchday · En Juego Hoy'}
                    </h2>
                    <p className="text-white/50 text-xs sm:text-sm font-medium mt-1.5 max-w-md mx-auto">
                        {activeTab === 'destacados' && 'Camisetas con orden exclusivo de curaduría · Calidad garantizada · Envíos a toda Honduras'}
                        {activeTab === 'bestsellers' && 'Las camisetas favoritas y más solicitadas por nuestros clientes en todo el país'}
                        {activeTab === 'new' && 'Nuevos ingresos, drops exclusivos y camisetas recién añadidas al catálogo'}
                        {activeTab === 'onsale' && 'Precios especiales por liquidación'}
                        {activeTab === 'matchday' && 'Camisetas oficiales de los clubes y selecciones con partido en el día'}
                    </p>
                </div>

                {/* 🎚️ Barra de Controles: Pestañas + Conmutador de Experiencia (Showcase / Grilla) */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5">
                    {/* Tabs / Pestañas */}
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                                        isActive
                                            ? 'bg-white text-black shadow-lg shadow-white/10'
                                            : 'bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/5'
                                    }`}
                                >
                                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-white/60'}`} />
                                    <span>{tab.label}</span>
                                    {tab.badge && (
                                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                                            isActive ? 'bg-primary text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        }`}>
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Conmutador de Experiencia (Showcase vs Grilla) */}
                    <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-xl backdrop-blur-md self-end sm:self-auto shrink-0">
                        <button
                            onClick={() => setViewMode('showcase')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                viewMode === 'showcase'
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            title="Modo Vitrina con Bento Spotlight"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Vitrina</span>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                viewMode === 'grid'
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            title="Modo Grilla Rápida"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span>Grilla</span>
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* Caso Vacío: Matchday */}
                    {activeTab === 'matchday' && currentTabProducts.length === 0 && (
                        <m.div
                            key="empty-matchday"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4 my-6"
                        >
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                                <Zap className="w-7 h-7" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-lg font-bold text-white">No hay partidos en juego hoy</h3>
                                <p className="text-xs sm:text-sm text-gray-400">
                                    Vuelve en día de Champions o fin de semana de liga para ver en tiempo real las camisetas de los clubes disputando partidos.
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveTab('destacados')}
                                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                            >
                                Explorar Selección 90+5
                            </button>
                        </m.div>
                    )}

                    {/* Caso Vacío: En Oferta */}
                    {activeTab === 'onsale' && currentTabProducts.length === 0 && (
                        <m.div
                            key="empty-onsale"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4 my-6"
                        >
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                <Tag className="w-7 h-7" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-lg font-bold text-white">Pronto nuevas ofertas</h3>
                                <p className="text-xs sm:text-sm text-gray-400">
                                    Actualmente todas nuestras camisetas cuentan con precio regular.
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveTab('new')}
                                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                            >
                                Ver Recién Agregados
                            </button>
                        </m.div>
                    )}

                    {/* Caso con Productos Disponibles */}
                    {currentTabProducts.length > 0 && (
                        <m.div
                            key={`${activeTab}-${ligaSeleccionada || "all"}-${viewMode}`}
                            initial={isFirstMount.current ? { opacity: 0 } : false}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
                        >
                            {/* 🌟 MODO VITRINA: BENTO SPOTLIGHT EN #1 PARA TODAS LAS PESTAÑAS */}
                            {viewMode === 'showcase' ? (
                                <>
                                    <BentoSpotlightProduct
                                        product={currentTabProducts[0]}
                                        liveMatch={liveMatches[currentTabProducts[0].team_id] ?? null}
                                        onPress={() => toast.loading("Cargando personalización...")}
                                        variant={activeTab}
                                    />
                                    {currentTabProducts.slice(1).map((item, i) => (
                                        <div key={item.id} className="h-full">
                                            <ProductCard
                                                item={item}
                                                priority={false}
                                                topSeller={activeTab === 'bestsellers'}
                                                enableGlow={!prefersReducedMotion}
                                                onPress={() => {
                                                    toast.loading("Cargando personalización...");
                                                }}
                                                liveMatch={liveMatches[item.team_id] ?? null}
                                            />
                                        </div>
                                    ))}
                                </>
                            ) : (
                                currentTabProducts.map((item, i) => (
                                    <div key={item.id} className="h-full">
                                        <ProductCard
                                            item={item}
                                            priority={i === 0}
                                            topSeller={activeTab === 'bestsellers'}
                                            enableGlow={!prefersReducedMotion}
                                            onPress={() => {
                                                toast.loading("Cargando personalización...");
                                            }}
                                            liveMatch={liveMatches[item.team_id] ?? null}
                                        />
                                    </div>
                                ))
                            )}
                        </m.div>
                    )}

                    {ligaSeleccionada && (
                        <m.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-center mt-12 md:mt-16"
                        >
                            <MainButton
                                onClick={() => {
                                    const selectedLeagueObj = ligas.find((l) => normalize(l.nombre) === normalize(ligaSeleccionada));
                                    const categoryObj = selectedLeagueObj?.category_id
                                        ? categorias.find((c) => c.id === selectedLeagueObj.category_id)
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
                                className="group relative px-8 py-3.5 bg-[#E50914] hover:bg-red-700 active:scale-[0.98] text-white rounded-full font-bold text-xs sm:text-sm tracking-tight shadow-[0_8px_30px_rgba(229,9,20,0.4)] transition-all duration-200 flex items-center gap-2 cursor-pointer"
                            >
                                <span>Ver colección completa {ligaSeleccionada}</span>
                                <svg
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
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

            {/* 🏆 AUTORIDAD GEO & PROPUESTA DE VALOR (TEGUCIGALPA / HONDURAS) */}
            <StoreGeoAuthoritySection />
        </main>
    );
}
