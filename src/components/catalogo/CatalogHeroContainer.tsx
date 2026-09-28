"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronRight, Sparkles, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { m as motion, AnimatePresence } from "@/lib/motion";

interface Props {
    categorySlug?: string | null;
    leagueSlug?: string | null;
    categoryName?: string;
    leagueName?: string;
    adjacentCategories?: string[];
    prefersReducedMotion?: boolean;
    imagePositionDesktop?: string;
    imagePositionMobile?: string;
    totalProducts?: number;
    leagueLogo?: string | null;
    categoryIcon?: string | null;
    teamName?: string | null;
    brandName?: string | null;
    onClearFilter?: () => void;
    onClearLeague?: () => void;
}

// Slugs que tienen imagen confirmada en /public/heroes/
const KNOWN_HERO_SLUGS = [
    'mundial2026',
    'mundial-2026',
    'mundial',
    'futbol',
    'retro',
    'streetwear-retro',
    'tenis',
    'formula1',
    'home',
    'default',
    'uefa',
];

export default function CatalogHeroContainer({
    categorySlug,
    leagueSlug,
    categoryName,
    leagueName,
    prefersReducedMotion = false,
    imagePositionDesktop = '50% 40%',
    imagePositionMobile = '50% 50%',
    totalProducts,
    leagueLogo,
    categoryIcon,
    teamName,
    brandName,
    onClearFilter,
    onClearLeague,
}: Props) {
    const [dynamicBannerUrl, setDynamicBannerUrl] = useState<string | null>(null);
    const supabase = createClient();

    const cleanCategorySlug = categorySlug?.toLowerCase().trim();
    const normalizedHeroSlug = cleanCategorySlug === 'mundial-2026' || cleanCategorySlug === 'mundial'
        ? 'mundial2026'
        : cleanCategorySlug;

    // Buscar si existe un banner promocional cargado por el admin para esta categoría o el catálogo general
    useEffect(() => {
        let mounted = true;

        async function findCategoryBanner() {
            let targetLink = "/catalogo";
            if (categorySlug) targetLink += `?categoria=${categorySlug}`;

            try {
                let query = supabase
                    .from("banners")
                    .select("image_url, link_url")
                    .eq("active", true)
                    .order("sort_order", { ascending: true })
                    .limit(1);

                if (targetLink === "/catalogo") {
                    query = query.eq("link_url", "/catalogo");
                } else {
                    query = query.ilike("link_url", `%${targetLink}%`);
                }

                const { data } = await query;

                if (!mounted) return;

                if (data && data.length > 0 && data[0].image_url) {
                    setDynamicBannerUrl(data[0].image_url);
                } else {
                    setDynamicBannerUrl(null);
                }
            } catch {
                // Silencioso en caso de error de red
            }
        }

        findCategoryBanner();
        return () => { mounted = false; };
    }, [categorySlug, supabase]);

    // Resolver la imagen de fondo estable (Banner admin > Hero local de categoría > Fallback catálogo total)
    const backgroundImage = useMemo(() => {
        if (dynamicBannerUrl) return dynamicBannerUrl;
        if (normalizedHeroSlug && KNOWN_HERO_SLUGS.includes(normalizedHeroSlug)) {
            return `/heroes/${normalizedHeroSlug}.jpg`;
        }
        // En el Catálogo Total (sin categoría seleccionada), usar hero general home.jpg
        return '/heroes/home.jpg';
    }, [dynamicBannerUrl, normalizedHeroSlug]);

    const isFiltered = Boolean(categorySlug || leagueSlug || teamName || brandName);

    // Jerarquía de visualización: El elemento más específico tiene prioridad absoluta
    // Equipo > Liga > Marca > Categoría > Catálogo Oficial
    const displayTitle = teamName
        ? teamName
        : leagueName
            ? leagueName
            : brandName
                ? brandName
                : categoryName
                    ? categoryName
                    : "Catálogo";

    // Logo / Emblema: Si hay liga seleccionada, mostrar el escudo de la liga. Si no, el de la categoría
    const activeLogo = leagueName ? (leagueLogo || categoryIcon) : (categoryIcon || leagueLogo);

    return (
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-1 pb-3 sm:pb-4">
            {/* Contenedor Híbrido: Altura constante, banner de categoría fijo + degradado oscuro inferior */}
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-[0_16px_45px_rgba(0,0,0,0.85)] ring-1 ring-white/5 bg-neutral-950 min-h-[180px] sm:min-h-[210px] md:min-h-[240px] flex flex-col justify-end">
                
                {/* 1️⃣ Capa de Imagen de Fondo (Se mantiene fija y estable) */}
                <div className="absolute inset-0 pointer-events-none select-none">
                    <style dangerouslySetInnerHTML={{ __html: `
                        .catalog-hero-bg { object-position: ${imagePositionMobile}; }
                        @media (min-width: 768px) { .catalog-hero-bg { object-position: ${imagePositionDesktop}; } }
                    ` }} />
                    <Image
                        key={backgroundImage}
                        src={backgroundImage}
                        alt={categoryName || "Catálogo 90+5"}
                        fill
                        priority
                        className="object-cover catalog-hero-bg filter brightness-[0.70] contrast-[1.05] transition-opacity duration-500"
                        sizes="(max-width: 768px) 100vw, 1280px"
                    />
                </div>

                {/* 2️⃣ Degradado Oscuro Cinemático (Apple Scrim & Ambient Glow) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/25 backdrop-blur-[1.5px] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_-20%,rgba(229,9,20,0.18),transparent_70%)] pointer-events-none" />
                {/* Specular hairline superior */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                {/* 3️⃣ Context Header Integrado en la base del Banner */}
                <div className="relative z-10 px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 md:py-5">
                    {/* 🧭 Breadcrumbs contextuales con navegación jerárquica */}
                    <nav className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/60 mb-2 sm:mb-2.5 tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" aria-label="Ruta de navegación">
                        <Link
                            href="/"
                            className="hover:text-white transition-colors duration-150 flex items-center gap-1 active:scale-95"
                        >
                            <span>Inicio</span>
                        </Link>
                        <ChevronRight size={12} className="text-white/40 flex-shrink-0" />
                        <Link
                            href="/catalogo"
                            onClick={(e) => {
                                if (isFiltered && onClearFilter) {
                                    e.preventDefault();
                                    onClearFilter();
                                }
                            }}
                            className={`transition-colors duration-150 active:scale-95 ${!isFiltered ? 'text-white font-medium' : 'hover:text-white text-white/80'}`}
                        >
                            Catálogo
                        </Link>
                        {categoryName && (
                            <>
                                <ChevronRight size={12} className="text-white/40 flex-shrink-0" />
                                {leagueName || teamName ? (
                                    <Link
                                        href={`/catalogo?categoria=${encodeURIComponent(categorySlug || '')}`}
                                        onClick={(e) => {
                                            if (onClearLeague) {
                                                e.preventDefault();
                                                onClearLeague();
                                            }
                                        }}
                                        className="hover:text-white text-white/80 transition-colors duration-150 active:scale-95"
                                    >
                                        {categoryName}
                                    </Link>
                                ) : (
                                    <span className="text-white font-medium">
                                        {categoryName}
                                    </span>
                                )}
                            </>
                        )}
                        {leagueName && (
                            <>
                                <ChevronRight size={12} className="text-white/40 flex-shrink-0" />
                                <span className={teamName ? 'text-white/60' : 'text-white font-semibold'}>
                                    {leagueName}
                                </span>
                            </>
                        )}
                        {teamName && (
                            <>
                                <ChevronRight size={12} className="text-white/40 flex-shrink-0" />
                                <span className="text-red-400 font-semibold truncate max-w-[150px] sm:max-w-none">
                                    {teamName}
                                </span>
                            </>
                        )}
                    </nav>

                    {/* 🏷️ Fila de Identidad y Acciones */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            {/* Medallón de Logo con efecto Glassmorphism */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeLogo || 'default-icon'}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={prefersReducedMotion ? { duration: 0.1 } : { type: "spring", damping: 24, stiffness: 350 }}
                                    className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-black/40 border border-white/20 backdrop-blur-xl p-2 sm:p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex items-center justify-center ring-1 ring-white/10"
                                >
                                    {activeLogo ? (
                                        <Image
                                            src={activeLogo}
                                            alt={displayTitle}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-contain filter drop-shadow-md"
                                            loading="eager"
                                            unoptimized
                                        />
                                    ) : (
                                        <Sparkles size={20} className="text-red-500/90" />
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Tipografía Display de Apple animada suavemente al cambiar de liga/categoría */}
                            <div className="min-w-0">
                                <AnimatePresence mode="wait">
                                    <motion.h2
                                        key={displayTitle}
                                        initial={{ opacity: 0, y: 3 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -3 }}
                                        transition={prefersReducedMotion ? { duration: 0.15 } : { type: "spring", damping: 26, stiffness: 350 }}
                                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-[-0.03em] leading-tight truncate drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
                                    >
                                        {displayTitle}
                                    </motion.h2>
                                </AnimatePresence>

                                <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-1.5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/40 border border-white/15 text-[11px] sm:text-xs font-medium text-white/90 backdrop-blur-md shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        {totalProducts !== undefined
                                            ? `${totalProducts} ${totalProducts === 1 ? 'prenda' : 'prendas'}`
                                            : 'Colección disponible'}
                                    </span>
                                    {teamName && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-[11px] font-semibold text-red-300">
                                            Equipo filtrado
                                        </span>
                                    )}
                                    {leagueName && categoryName && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/15 text-[11px] font-medium text-white/80">
                                            {categoryName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Botón de Acción Rápida (Reset) si hay filtro activo */}
                        {isFiltered && (
                            <div className="flex-shrink-0 self-start sm:self-center">
                                {leagueName && categoryName && onClearLeague ? (
                                    <button
                                        onClick={onClearLeague}
                                        className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] active:scale-95 text-xs font-medium text-white border border-white/20 backdrop-blur-md transition-all duration-150 shadow-md cursor-pointer"
                                        title={`Quitar filtro de ${leagueName}`}
                                    >
                                        <X size={12} className="text-white/70 group-hover:text-white transition-colors" />
                                        <span>Ver todo {categoryName}</span>
                                    </button>
                                ) : onClearFilter ? (
                                    <button
                                        onClick={onClearFilter}
                                        className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] active:scale-95 text-xs font-medium text-white border border-white/20 backdrop-blur-md transition-all duration-150 shadow-md cursor-pointer"
                                        title="Limpiar filtros"
                                    >
                                        <X size={12} className="text-white/70 group-hover:text-white transition-colors" />
                                        <span>Limpiar filtros</span>
                                    </button>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
