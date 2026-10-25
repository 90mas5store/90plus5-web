"use client";

import { useMemo } from "react";
import { Product, SpecialBanner, League, Category } from "@/lib/types";
import { usePrefetch, useProductPrefetch } from "@/hooks/usePrefetch";
import { HeroShowcaseSettings } from "@/lib/heroSettings";
import { MarqueeBarSettings } from "@/lib/marqueeSettings";
import { HomeStylesSettings } from "@/lib/homeStylesSettings";

// Componentes modulares del nuevo Home
import HomeTrustBar from "./home/HomeTrustBar";
import HomeHeroCommerce from "./home/HomeHeroCommerce";
import HomeLeagueNav from "./home/HomeLeagueNav";
import HomeProductCarousel from "./home/HomeProductCarousel";
import MatchdayLiveSection from "./home/MatchdayLiveSection";
import HomeEditorialBento from "./home/HomeEditorialBento";
import HomeNewArrivalsGrid from "./home/HomeNewArrivalsGrid";
import HomeTrustAndLocal from "./home/HomeTrustAndLocal";

interface HomeClientProps {
    initialDestacados: Product[];
    initialBestSellers?: Product[];
    initialNewArrivals?: Product[];
    initialOnSale?: Product[];
    initialBanners: Record<string, unknown>[];
    initialSpecialBanners: SpecialBanner[];
    initialLigas?: League[];
    initialCategorias?: Category[];
    initialHeroSettings?: HeroShowcaseSettings;
    initialMarqueeSettings?: MarqueeBarSettings;
    initialStylesSettings?: HomeStylesSettings;
}

export default function HomeClient({
    initialDestacados = [],
    initialBestSellers = [],
    initialNewArrivals = [],
    initialOnSale = [],
    initialBanners = [],
    initialSpecialBanners = [],
    initialLigas = [],
    initialCategorias = [],
    initialHeroSettings,
    initialMarqueeSettings,
    initialStylesSettings,
}: HomeClientProps) {
    // Precarga de rutas críticas para navegación instantánea
    usePrefetch();

    // Pool de productos para Matchday y vitrinas
    const allProducts = useMemo(() => {
        const map = new Map<string, Product>();
        [...initialDestacados, ...initialBestSellers, ...initialNewArrivals, ...initialOnSale].forEach((p) => {
            if (p?.id) map.set(p.id, p);
        });
        return Array.from(map.values());
    }, [initialDestacados, initialBestSellers, initialNewArrivals, initialOnSale]);

    // Precargar imágenes de los primeros productos visibles
    useProductPrefetch(initialDestacados.slice(0, 4));

    return (
        <main className="bg-[#07080a] text-white min-h-dvh relative overflow-hidden selection:bg-primary selection:text-white">
            {/* Título semántico accesible */}
            <h1 className="sr-only">
                90+5 Store | Tienda Deportiva en Tegucigalpa · Camisetas de Fútbol en Honduras
            </h1>

            {/* 1. MARQUESINA SLIM DE AVISOS (CIERRE DE PEDIDOS, ENVÍOS, DORSAL) */}
            <HomeTrustBar settings={initialMarqueeSettings} />

            {/* 2. HERO PRINCIPAL 90+5 + CARRUSEL DE BANNERS EDITORIALES */}
            <HomeHeroCommerce
                specialBanners={initialSpecialBanners}
                banners={initialBanners}
                heroSettings={initialHeroSettings}
            />

            {/* 3. ACCESO RÁPIDO POR COMPETICIÓN / LIGA */}
            <HomeLeagueNav ligas={initialLigas} />

            {/* 4. DESTACADOS (SELECCIÓN 90+5) & MÁS VENDIDOS (CONMUTADOR DE PESTAÑAS) */}
            <HomeProductCarousel
                destacados={initialDestacados}
                bestSellers={initialBestSellers}
            />

            {/* 5. MATCHDAY LIVE HUB (Solo visible en días con partidos) */}
            <MatchdayLiveSection allProducts={allProducts} />

            {/* 6. GUÍA DE ESTILOS Y VERSIONES (JUGADOR, RETRO, AFICIONADO) */}
            <HomeEditorialBento settings={initialStylesSettings} />

            {/* 7. NOVEDADES & RECIÉN LLEGADOS */}
            <HomeNewArrivalsGrid
                products={initialNewArrivals.length > 0 ? initialNewArrivals : initialDestacados}
            />

            {/* 8. CONFIANZA LOCAL & WHATSAPP DIRECTO */}
            <HomeTrustAndLocal />
        </main>
    );
}
