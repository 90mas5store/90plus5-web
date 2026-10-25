"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Sparkles, Trophy, ShieldCheck, Truck, ArrowLeft } from "lucide-react";
import { getLeagueLogoUrl } from "@/lib/leagueLogos";

interface CatalogHeroProProps {
    categorySlug?: string | null;
    leagueSlug?: string | null;
    categoryName?: string;
    leagueName?: string;
    teamName?: string | null;
    brandName?: string | null;
    totalProducts?: number;
    leagueLogo?: string | null;
    onClearLeague?: () => void;
    onClearFilter?: () => void;
}

export default function CatalogHeroPro({
    categorySlug,
    leagueSlug,
    categoryName,
    leagueName,
    teamName,
    brandName,
    totalProducts,
    leagueLogo,
    onClearLeague,
    onClearFilter,
}: CatalogHeroProProps) {
    const isFiltered = Boolean(teamName || leagueName || brandName || categorySlug);

    // Determinar título dinámico limpio
    const heroTitle = useMemo(() => {
        if (teamName) return teamName;
        if (leagueName) return leagueName;
        if (brandName) return `Colección ${brandName}`;
        if (categoryName) return categoryName;
        return "Catálogo Oficial";
    }, [teamName, leagueName, brandName, categoryName]);

    const activeLogo = useMemo(() => {
        if (leagueName || leagueSlug) {
            return getLeagueLogoUrl(leagueSlug, leagueName, leagueLogo);
        }
        return null;
    }, [leagueName, leagueSlug, leagueLogo]);

    return (
        <header className="relative w-full overflow-hidden border-b border-white/[0.08] bg-gradient-to-b from-[#0c0e14] via-[#07080a] to-[#07080a]">
            {/* 🌟 Specular Highlight (Bisel de luz física en borde superior) */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Resplandor ambiental suave de fondo */}
            <div
                className="absolute -top-24 left-1/2 -translate-x-1/2 w-[450px] h-[200px] bg-primary/10 blur-[80px] rounded-full pointer-events-none"
                aria-hidden="true"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 relative z-10">
                {isFiltered ? (
                    /* VISTA CON FILTRO ACTIVO (Compacta, limpia, sin botones duplicados) */
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 sm:gap-4">
                            {/* Logo del Equipo / Liga */}
                            {activeLogo ? (
                                <div className="relative w-11 h-11 sm:w-13 sm:h-13 shrink-0 rounded-xl bg-white/[0.06] border border-white/10 p-2 flex items-center justify-center shadow-md backdrop-blur-md">
                                    <Image
                                        src={activeLogo}
                                        alt={heroTitle}
                                        width={36}
                                        height={36}
                                        className="object-contain w-full h-full filter drop-shadow-sm"
                                        priority
                                    />
                                </div>
                            ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <Trophy className="w-5 h-5" />
                                </div>
                            )}

                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                                    {heroTitle}
                                </h1>
                                <p className="text-xs text-white/50 font-medium">
                                    {typeof totalProducts === "number" ? `${totalProducts} prendas oficiales disponibles` : "Colección oficial"}
                                </p>
                            </div>
                        </div>

                        {/* Enlace único para volver a todas las ligas */}
                        {(onClearLeague || onClearFilter) && (
                            <button
                                onClick={onClearLeague || onClearFilter}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white text-xs font-semibold backdrop-blur-md transition-all active:scale-95 cursor-pointer shrink-0"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Ver todas las ligas</span>
                                <span className="sm:hidden">Todas</span>
                            </button>
                        )}
                    </div>
                ) : (
                    /* VISTA PRINCIPAL (Catálogo Completo) */
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                <span>Colección Oficial & Novedades</span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                                Camisetas de Fútbol & Indumentaria
                            </h1>

                            <p className="mt-1.5 text-xs sm:text-sm text-white/60 font-medium max-w-xl">
                                Versión Jugador y Aficionado bajo pedido con dorsales y parches oficiales. Envíos seguros a toda Honduras.
                            </p>
                        </div>

                        {/* Especificaciones de confianza limpias (Sin cajas ni píldoras, pura tipografía Apple) */}
                        <div className="flex flex-row lg:flex-col flex-wrap gap-x-5 gap-y-2 text-xs text-white/70 py-1">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="font-bold text-white">Calidad 1:1 Oficial <span className="font-normal text-white/40">· Jugador & Fan</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="font-bold text-white">Dorsal & Parches <span className="font-normal text-white/40">· Tipografía oficial</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="font-bold text-white">Envíos a Honduras <span className="font-normal text-white/40">· Cargo Expreso</span></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
