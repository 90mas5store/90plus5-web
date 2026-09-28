"use client";

import { useState, useMemo, useEffect, useRef } from "react";

// Persiste en memoria durante la sesión SPA (no se resetea entre navegaciones)
const _homeAlreadyMounted = { value: false };
import { m, AnimatePresence } from "@/lib/motion";
import { Product, SpecialBanner } from "@/lib/types";
import { fetchProductsByTeamIds } from "@/lib/api";
import useToastMessage from "@/hooks/useToastMessage";
import ProductCard from "./ui/ProductCard";
import { useLiveMatchesData } from "@/hooks/useLiveMatches";
import { usePrefetch, useProductPrefetch } from "@/hooks/usePrefetch";
import { usePrefersReducedMotion } from "@/hooks/useOptimization";
import SpecialEventBanner from "./ui/SpecialEventBanner";
import HomeBannerContainer from "./HomeBannerContainer";
import MatchdayHeroTakeover from "./home/MatchdayHeroTakeover";
import StoreGeoAuthoritySection from "./home/StoreGeoAuthoritySection";

import BentoSpotlightProduct from "./home/BentoSpotlightProduct";
import { Star, Flame, Sparkles, Tag, Zap, LayoutGrid } from "lucide-react";

interface HomeClientProps {
    initialDestacados: Product[];
    initialBestSellers?: Product[];
    initialNewArrivals?: Product[];
    initialOnSale?: Product[];
    initialBanners: Record<string, unknown>[];
    initialSpecialBanners: SpecialBanner[];
    initialLigas?: import('@/lib/types').League[];
    initialCategorias?: import('@/lib/types').Category[];
}

export default function HomeClient({
    initialDestacados,
    initialBestSellers = [],
    initialNewArrivals = [],
    initialOnSale = [],
    initialBanners,
    initialSpecialBanners
}: HomeClientProps) {
    usePrefetch();
    const { matches: liveMatches, isLoaded: liveMatchesLoaded } = useLiveMatchesData();

    // State initialization with props
    const [destacados] = useState<Product[]>(initialDestacados || []);
    const [bestSellers] = useState<Product[]>(initialBestSellers || []);
    const [newArrivals] = useState<Product[]>(initialNewArrivals || []);
    const [onSale] = useState<Product[]>(initialOnSale || []);
    const [banners] = useState<Record<string, unknown>[]>(initialBanners || []);

    // ⚡ Prendas cargadas en tiempo real para todos los clubes en Matchday
    const [matchdayProducts, setMatchdayProducts] = useState<Product[]>([]);

    useEffect(() => {
        if (!liveMatchesLoaded) return;
        const ids = new Set<string>();
        Object.entries(liveMatches).forEach(([key, match]) => {
            if (match.homeTeamId) ids.add(match.homeTeamId);
            if (match.awayTeamId) ids.add(match.awayTeamId);
            if (key) ids.add(key);
        });
        const teamIds = Array.from(ids);
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

    const prefersReducedMotion = usePrefersReducedMotion();
    const toast = useToastMessage();

    // true = primera vez que se monta en esta sesión de navegación
    const isFirstMount = useRef(!_homeAlreadyMounted.value);
    useEffect(() => {
        _homeAlreadyMounted.value = true;
    }, []);

    // Conteo de prendas y equipos jugando hoy para badge en Matchday
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

    // 🔍 Filtrado por Pestaña Activa (PRESERVANDO ORDEN ORIGINAL DE CADA TAB)
    const currentTabProducts = useMemo(() => {
        if (activeTab === 'destacados') {
            return destacados;
        } else if (activeTab === 'bestsellers') {
            return (bestSellers.length > 0 ? bestSellers : destacados).slice(0, 12);
        } else if (activeTab === 'new') {
            return (newArrivals.length > 0 ? newArrivals : destacados).slice(0, 12);
        } else if (activeTab === 'onsale') {
            return onSale;
        } else if (activeTab === 'matchday') {
            const uniqueMap = new Map<string, Product>();
            matchdayProducts.forEach((p) => uniqueMap.set(p.id, p));

            const allPool = [...destacados, ...bestSellers, ...newArrivals, ...onSale];
            allPool.forEach((p) => {
                if (p.team_id && liveMatches[p.team_id] && !uniqueMap.has(p.id)) {
                    uniqueMap.set(p.id, p);
                }
            });

            return Array.from(uniqueMap.values());
        }
        return destacados;
    }, [activeTab, destacados, bestSellers, newArrivals, onSale, matchdayProducts, liveMatches]);

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

            {/* ⭐ CATÁLOGO PRINCIPAL CON PESTAÑAS INTELIGENTES */}
            <section id="destacados" className="pt-2 md:pt-4 pb-8 md:pb-12 px-4 max-w-7xl mx-auto">
                {/* Header Dinámico */}
                <div className="text-center mb-6 md:mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 text-white/60 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                        <span>Colección Oficial</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                        {activeTab === 'destacados'
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
                        {activeTab === 'destacados' && 'Prendas destacadas y piezas exclusivas · Calidad garantizada · Envíos a toda Honduras'}
                        {activeTab === 'bestsellers' && 'Las prendas favoritas y más pedidas en todo el país'}
                        {activeTab === 'new' && 'Nuevos ingresos, drops exclusivos y prendas recién añadidas'}
                        {activeTab === 'onsale' && 'Precios especiales por liquidación'}
                        {activeTab === 'matchday' && 'Prendas oficiales de los clubes y selecciones que juegan hoy'}
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
                                    Volvé en día de Champions o fin de semana de liga para ver en vivo las prendas de los clubes que están jugando.
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveTab('destacados')}
                                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                            >
                                Mirá la Selección 90+5
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
                                    Por ahora todas nuestras prendas tienen precio regular.
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveTab('new')}
                                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                            >
                                Mirá lo recién agregado
                            </button>
                        </m.div>
                    )}

                    {/* Caso con Productos Disponibles */}
                    {currentTabProducts.length > 0 && (
                        <m.div
                            key={`${activeTab}-${viewMode}`}
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
                </AnimatePresence>
            </section>

            {/* 🏆 AUTORIDAD GEO & PROPUESTA DE VALOR (TEGUCIGALPA / HONDURAS) */}
            <StoreGeoAuthoritySection />
        </main>
    );
}
