"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Trophy, ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Product } from "@/lib/types";
import TeamLogo from "@/components/TeamLogo";
import type { LiveMatchData } from "@/hooks/useLiveMatches";
import { translateTeamNameToSpanish } from "@/lib/teamNames";

interface BentoSpotlightProductProps {
    product: Product;
    liveMatch?: LiveMatchData | null;
    onPress?: (product: Product) => void;
    badgeLabel?: string;
    variant?: 'destacados' | 'bestsellers' | 'new' | 'onsale' | 'matchday';
}

const VARIANT_CONFIG = {
    bestsellers: {
        border: "border-amber-500/25 hover:border-amber-500/40",
        shadow: "hover:shadow-[0_25px_70px_rgba(245,158,11,0.15)]",
        specular: "via-amber-400/40",
        glow: "bg-amber-500/10",
        badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-300",
        badgeIcon: Trophy,
        badgeIconColor: "text-amber-400",
        priceColor: "text-amber-400",
        defaultBadge: "🏆 #1 Más Vendido en Honduras",
    },
    destacados: {
        border: "border-white/15 hover:border-white/30",
        shadow: "hover:shadow-[0_25px_70px_rgba(255,255,255,0.08)]",
        specular: "via-white/40",
        glow: "bg-primary/10",
        badgeBg: "bg-white/10 border-white/20 text-white",
        badgeIcon: Sparkles,
        badgeIconColor: "text-yellow-400",
        priceColor: "text-white",
        defaultBadge: "⭐ Selección Especial 90+5",
    },
    new: {
        border: "border-emerald-500/25 hover:border-emerald-500/40",
        shadow: "hover:shadow-[0_25px_70px_rgba(16,185,129,0.15)]",
        specular: "via-emerald-400/40",
        glow: "bg-emerald-500/10",
        badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
        badgeIcon: Sparkles,
        badgeIconColor: "text-emerald-400",
        priceColor: "text-emerald-400",
        defaultBadge: "✨ Recién Agregado · Nuevo Ingreso",
    },
    onsale: {
        border: "border-rose-500/25 hover:border-rose-500/40",
        shadow: "hover:shadow-[0_25px_70px_rgba(244,63,94,0.15)]",
        specular: "via-rose-400/40",
        glow: "bg-rose-500/10",
        badgeBg: "bg-rose-500/15 border-rose-500/30 text-rose-300",
        badgeIcon: Sparkles,
        badgeIconColor: "text-rose-400",
        priceColor: "text-rose-400",
        defaultBadge: "🏷️ Oferta Especial",
    },
    matchday: {
        border: "border-red-600/35 hover:border-red-600/50",
        shadow: "hover:shadow-[0_25px_70px_rgba(220,38,38,0.2)]",
        specular: "via-red-500/50",
        glow: "bg-red-600/15",
        badgeBg: "bg-red-500/20 border-red-500/40 text-red-300",
        badgeIcon: Zap,
        badgeIconColor: "text-red-400",
        priceColor: "text-red-400",
        defaultBadge: "⚡ En Juego Hoy · Matchday",
    },
};

export default function BentoSpotlightProduct({
    product,
    liveMatch = null,
    onPress,
    badgeLabel,
    variant = "bestsellers",
}: BentoSpotlightProductProps) {
    const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.bestsellers;
    const finalBadgeLabel = badgeLabel || config.defaultBadge;
    const BadgeIcon = config.badgeIcon;

    const {
        equipo,
        modelo,
        precio,
        imagen,
        logoEquipo,
        brand_name,
        brand_logo,
        season,
        allows_customization,
        slug,
        id,
    } = product;

    const displayName = equipo || brand_name || "Camiseta Oficial";
    const displayLogo = logoEquipo || brand_logo;
    const productHref = `/producto/${slug || id}`;

    const isLive = !!liveMatch;
    const opponent = liveMatch
        ? translateTeamNameToSpanish(liveMatch.isHome ? liveMatch.awayTeam : liveMatch.homeTeam)
        : null;

    return (
        <div className={`col-span-full lg:col-span-2 lg:row-span-2 group relative rounded-[2rem] overflow-hidden border ${config.border} bg-gradient-to-br from-[#121318]/95 via-[#0b0c10]/95 to-black/95 shadow-[0_20px_60px_rgba(0,0,0,0.7)] ${config.shadow} transition-all duration-500 flex flex-col md:flex-row min-h-[380px] sm:min-h-[420px]`}>
            {/* 🌟 Specular Top Highlight */}
            <div className={`absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent ${config.specular} to-transparent z-30 pointer-events-none`} />

            {/* Ambient Background Glow */}
            <div className={`absolute -top-24 -left-24 w-80 h-80 ${config.glow} rounded-full blur-3xl pointer-events-none`} />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            {/* 🖼️ Lado Izquierdo / Superior: Imagen con Escudo & Badges */}
            <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto min-h-[260px] md:min-h-full overflow-hidden bg-white/[0.03]">
                <Image
                    src={imagen || "/heroes/default.jpg"}
                    alt={`${displayName} ${modelo}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Gradiente inferior/lateral para contraste */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/80" />

                {/* Escudo Flotante */}
                {displayLogo && (
                    <div className="absolute top-4 left-4 z-20 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                        <TeamLogo
                            src={displayLogo}
                            alt={displayName}
                            size={44}
                            className="w-10 h-10 md:w-12 md:h-12 object-contain"
                        />
                    </div>
                )}

                {/* Matchday Live Ticker si está jugando */}
                {isLive && (
                    <div className="absolute top-4 right-4 z-20">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-[11px] font-bold backdrop-blur-md shadow-lg animate-pulse border border-white/20">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            <span>EN JUEGO {opponent ? `vs ${opponent}` : ""}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 📝 Lado Derecho / Inferior: Contenido Editorial y CTA */}
            <div className="relative w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between z-20">
                <div className="space-y-4">
                    {/* Badge de Puesto #1 */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.badgeBg} text-[11px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-sm`}>
                        <BadgeIcon className={`w-3.5 h-3.5 ${config.badgeIconColor} shrink-0`} />
                        <span>{finalBadgeLabel}</span>
                    </div>

                    {/* Información del Equipo y Modelo */}
                    <div>
                        <div className="flex items-center gap-2 text-white/50 text-xs font-bold uppercase tracking-wider mb-1">
                            <span>{displayName}</span>
                            {season && (
                                <>
                                    <span>•</span>
                                    <span className="text-white/70">{season}</span>
                                </>
                            )}
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight group-hover:text-primary transition-colors">
                            {modelo}
                        </h3>
                    </div>

                    {/* Propuestas de Valor / Características Clave */}
                    <div className="space-y-2 pt-1 text-xs text-white/80">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Versión Jugador y Aficionado disponibles</span>
                        </div>
                        {allows_customization && (
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>Personalizala con tu número y nombre favorito</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                            <span>Envío garantizado a toda Honduras</span>
                        </div>
                    </div>
                </div>

                {/* Precio y Botón de Compra / Personalización */}
                <div className="pt-6 mt-4 border-t border-white/10 flex items-center justify-between gap-4">
                    <div>
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">
                            Precio oficial
                        </span>
                        <div className="text-xl sm:text-2xl font-black text-white flex items-baseline gap-1">
                            <span className="text-sm font-bold text-amber-400">L.</span>
                            <span>{precio ? precio.toLocaleString("es-HN") : "1,200"}</span>
                        </div>
                    </div>

                    <Link
                        href={productHref}
                        onClick={onPress ? () => onPress(product) : undefined}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-primary to-red-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_25px_rgba(229,9,20,0.5)] hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <span>Personalizala</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
