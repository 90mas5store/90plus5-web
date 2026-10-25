"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowDown, Trophy, Star, Flame, Globe, Sparkles, Shirt, ShieldCheck, Truck, LayoutGrid } from "lucide-react";
import type { SpecialBanner } from "@/lib/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    globe: Globe,
    trophy: Trophy,
    star: Star,
    flame: Flame,
};

interface CollectionHeroProps {
    banner: SpecialBanner;
    totalProducts: number;
    onExploreClick?: () => void;
}

export default function CollectionHero({ banner, totalProducts, onExploreClick }: CollectionHeroProps) {
    const [canLoadVideo, setCanLoadVideo] = useState(false);
    const [videoFailed, setVideoFailed] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth >= 768) {
            const timer = setTimeout(() => setCanLoadVideo(true), 600);
            return () => clearTimeout(timer);
        }
    }, []);

    const BadgeIcon = ICON_MAP[banner.badge_secondary_icon] || Trophy;

    const posMobile = banner.image_position_mobile || "50% 20%";
    const posDesktop = banner.image_position_desktop || "50% 50%";

    return (
        <section
            aria-label={`Catálogo de Colección ${banner.title}`}
            className="relative w-full overflow-hidden bg-[#07080a] h-[78vh] min-h-[500px] max-h-[700px] sm:h-auto sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px] flex items-end justify-center border-b border-white/[0.08]"
            style={{
                // @ts-expect-error CSS variable for responsive objectPosition
                "--hero-pos-mob": posMobile,
                "--hero-pos-desk": posDesktop,
            }}
        >
            {/* 🌟 Specular Top-Edge Hairline (Bisel de luz física superior - Apple Design) */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-30" />

            {/* 🧭 Navegación Superior / Breadcrumb Diferenciado de Catálogo */}
            <div className="absolute top-3.5 left-3.5 sm:top-5 sm:left-6 z-30 flex items-center gap-2">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 text-white/80 hover:text-white text-xs font-semibold backdrop-blur-md transition-all active:scale-95 shadow-md group"
                >
                    <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
                    <span>Inicio</span>
                </Link>
                <Link
                    href="/catalogo"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 text-white/80 hover:text-white text-xs font-semibold backdrop-blur-md transition-all active:scale-95 shadow-md"
                >
                    <span>Catálogo Completo</span>
                </Link>
            </div>

            {/* 🏷️ Indicador de Modo Catálogo (Esquina Superior Derecha) */}
            <div className="absolute top-3.5 right-3.5 sm:top-5 sm:right-6 z-30 flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-xs text-white/90 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white uppercase tracking-wider text-[10px] sm:text-[11px]">Catálogo de Colección</span>
                    <span className="text-white/30 hidden sm:inline">·</span>
                    <span className="text-white/70 hidden sm:inline font-mono text-[11px]">{totalProducts} prendas</span>
                </div>
            </div>

            {/* ================= FONDO MULTIMEDIA EDGE-TO-EDGE ================= */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* 1. Capa Ambiental de Respaldo (Blur 3xl) */}
                {banner.background_image_url && (
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <Image
                            src={banner.background_image_url}
                            alt=""
                            fill
                            sizes="33vw"
                            priority={false}
                            aria-hidden="true"
                            className="w-full h-full object-cover blur-3xl scale-125 opacity-55 brightness-95 saturate-150"
                        />
                    </div>
                )}

                {/* 2. Capa Principal Zoom-to-Fill (Video o Imagen completa edge-to-edge) */}
                {banner.background_video_url && canLoadVideo && !videoFailed ? (
                    <video
                        key={`hero-video-${banner.id}`}
                        src={banner.background_video_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="none"
                        poster={banner.background_image_url || undefined}
                        className="w-full h-full min-w-full min-h-full object-cover opacity-90 brightness-[0.92] contrast-105 scale-[1.03] [object-position:var(--hero-pos-mob)] md:[object-position:var(--hero-pos-desk)]"
                        style={{ objectFit: "cover" }}
                        onError={() => setVideoFailed(true)}
                    />
                ) : banner.background_image_url ? (
                    <Image
                        src={banner.background_image_url}
                        alt={banner.title}
                        fill
                        priority
                        sizes="100vw"
                        className="min-w-full min-h-full object-cover opacity-90 sm:opacity-95 brightness-[0.94] contrast-[1.04] scale-[1.04] sm:scale-[1.02] transition-transform duration-700 [object-position:var(--hero-pos-mob)] md:[object-position:var(--hero-pos-desk)]"
                        style={{ objectFit: "cover" }}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#121319] via-[#090a0e] to-black" />
                )}

                {/* 3. Viñetas Direccionales Apple: degradado inferior para alojar la consola horizontal */}
                <div className="absolute bottom-0 inset-x-0 h-[65%] bg-gradient-to-t from-[#07080a] via-[#07080a]/85 to-transparent pointer-events-none z-20" />
                <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#07080a]/60 to-transparent pointer-events-none z-20" />
            </div>

            {/* Acentos de luz ambiental */}
            <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[160px] pointer-events-none" />

            {/* ================= CONSOLA HORIZONTAL DE CATÁLOGO (Diferenciación del Home) ================= */}
            <div className="relative z-20 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-5 sm:pb-8 pt-20 w-full">
                <div className="w-full rounded-2xl sm:rounded-3xl bg-black/70 md:bg-black/60 border border-white/15 border-t-white/30 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-4 sm:p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
                    
                    {/* LADO IZQUIERDO: Título, Badge de Catálogo, Logo y Descripción */}
                    <div className="max-w-2xl flex flex-col items-start text-left">
                        {/* Píldora de Catálogo y Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-2.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-white font-bold text-[10px] sm:text-[11px] uppercase tracking-wider shadow-sm">
                                <Sparkles className="w-3 h-3 text-primary fill-primary" />
                                <span>Catálogo Especial</span>
                            </span>

                            {banner.badge_primary_text && (
                                <span className="px-2.5 py-0.5 bg-white/10 text-white border border-white/15 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
                                    {banner.badge_primary_text}
                                </span>
                            )}

                            {banner.badge_secondary_text && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-black/60 border border-[#FFD700]/30 text-[#FFD700] rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase backdrop-blur-md">
                                    <BadgeIcon className="w-3 h-3 fill-current" />
                                    <span>{banner.badge_secondary_text}</span>
                                </span>
                            )}
                        </div>

                        {/* Título de la Colección con Logo */}
                        <div className="flex items-center gap-3 sm:gap-4 mb-2">
                            {banner.logo_url && (
                                <div className="relative h-11 w-10 sm:h-14 sm:w-14 shrink-0 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                                    <Image
                                        src={banner.logo_url}
                                        alt=""
                                        fill
                                        sizes="56px"
                                        className="object-contain"
                                    />
                                </div>
                            )}
                            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-[1.05] drop-shadow-md">
                                {banner.title}
                            </h1>
                        </div>

                        {/* Subtítulo */}
                        {banner.subtitle && (
                            <p className="text-xs sm:text-sm md:text-base text-white/80 font-normal leading-relaxed line-clamp-2 md:line-clamp-none">
                                {banner.subtitle}
                            </p>
                        )}
                    </div>

                    {/* LADO DERECHO (Desktop) / INFERIOR: Botón de exploración directa y garantías */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/10">
                        {/* Botón de Salto Directo a las 4 prendas por fila */}
                        <button
                            onClick={onExploreClick}
                            className="inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3 rounded-xl sm:rounded-2xl bg-white text-black font-extrabold text-xs sm:text-sm hover:bg-neutral-100 transition-all shadow-xl shadow-white/10 active:scale-95 group text-center cursor-pointer"
                        >
                            <LayoutGrid size={15} className="text-primary shrink-0" />
                            <span>Ver Colección ({totalProducts})</span>
                            <ArrowDown size={14} className="group-hover:translate-y-0.5 transition-transform shrink-0" />
                        </button>

                        {/* Chips de especificaciones de catálogo */}
                        <div className="flex items-center justify-center lg:justify-end gap-3 text-[10.5px] sm:text-xs text-white/60">
                            <span className="flex items-center gap-1">
                                <Shirt size={12} className="text-primary" />
                                <span>Versión Jugador & Fan</span>
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                                <ShieldCheck size={12} className="text-emerald-400" />
                                <span>Dorsal oficial</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
