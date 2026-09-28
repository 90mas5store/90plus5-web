"use client";

import Link from "next/link";
import { Shirt, ArrowRight } from "lucide-react";
import ProductImage from "../../components/ProductImage";
import TeamLogo from "../../components/TeamLogo";
import { Product } from "../../lib/types";
import type { LiveMatchData } from "../../hooks/useLiveMatches";
import { translateTeamNameToSpanish, translateTeamAbbr } from "@/lib/teamNames";

interface ProductCardProps {
    item: Product;
    priority?: boolean;
    onPress?: (item: Product) => void;
    enableGlow?: boolean;
    topSeller?: boolean;
    liveMatch?: LiveMatchData | null;
}

export default function ProductCard({ item, priority = false, onPress, enableGlow = true, topSeller = false, liveMatch = null }: ProductCardProps) {
    const {
        equipo,
        modelo,
        precio,
        imagen,
        logoEquipo,
        brand_name,
        brand_logo,
        trending_until,
        season,
    } = item;

    const displayName = equipo || brand_name || '';
    const displayLogo = logoEquipo || brand_logo || undefined;

    // isLive: partido en curso via API, O activación manual admin
    const isLive = !!liveMatch || (trending_until ? new Date(trending_until) > new Date() : false);

    // Datos del marcador cuando viene de la API
    const rawOpponent = liveMatch ? (liveMatch.isHome ? liveMatch.awayTeam : liveMatch.homeTeam) : null;
    const opponent = rawOpponent ? translateTeamNameToSpanish(rawOpponent) : null;
    const rawOpponentAbbr = liveMatch
        ? (liveMatch.isHome ? liveMatch.awayAbbr : liveMatch.homeAbbr) || (rawOpponent ? rawOpponent.slice(0, 3).toUpperCase() : null)
        : null;
    const opponentAbbr = rawOpponent ? translateTeamAbbr(rawOpponent, rawOpponentAbbr) : null;
    const ourScore = liveMatch ? (liveMatch.isHome ? liveMatch.homeScore : liveMatch.awayScore) : null;
    const theirScore = liveMatch ? (liveMatch.isHome ? liveMatch.awayScore : liveMatch.homeScore) : null;

    const productHref = `/producto/${item.slug || item.id}`;

    return (
        <Link
            href={productHref}
            onClick={onPress ? () => onPress(item) : undefined}
            aria-label={`Ver ${displayName} ${modelo}`}
            className={`group relative bg-[#0b0c10]/95 rounded-[1.6rem] md:rounded-[1.9rem] overflow-hidden border border-white/[0.08]
            hover:border-white/20 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 ease-out cursor-pointer aspect-[4/5]
            shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)]
            ${enableGlow ? 'hover:shadow-[0_12px_36px_rgba(229,9,20,0.25)]' : ''}
            w-full text-left block select-none`}
        >
            {/* 🌟 Specular Highlight (Bisel de luz física en borde superior - §12 Apple Design) */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent z-20 pointer-events-none" />

            {/* 🖼️ Main Image */}
            <div className="absolute inset-0">
                <ProductImage
                    src={imagen}
                    alt={`${displayName} ${modelo}`}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    priority={priority}
                />

                {/* Gradiente cinemático inferior — legibilidad del texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-95 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Gradiente superior suave */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />
                {/* Vignette lateral sutil */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.45) 100%)' }} />
                {/* Sutil tint primario en hover */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>

            {/* 🏷️ Escudo del Club — Flotante, limpio, sin contenedor artificial, con sombra física Apple (§12) */}
            {displayLogo && (
                <div className="absolute top-3.5 left-3.5 z-20 transition-transform duration-300 ease-out group-hover:scale-110 pointer-events-none">
                    <TeamLogo
                        src={displayLogo}
                        alt={displayName}
                        size={32}
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                    />
                </div>
            )}

            {/* 🔥 Badges estilo Apple Capsule: MATCHDAY / TOP */}
            {(isLive || topSeller) && (
                <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-20 flex flex-col gap-1 items-end">
                    {isLive && liveMatch && (
                        <>
                            <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold tracking-tight text-white backdrop-blur-md shadow-md border ${
                                liveMatch.isFinished
                                    ? 'bg-amber-600/80 border-amber-400/30 shadow-[0_0_12px_rgba(217,119,6,0.4)]'
                                    : liveMatch.isUpcoming
                                        ? 'bg-blue-600/80 border-blue-400/30 shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                                        : 'bg-red-600/85 border-red-400/40 shadow-[0_0_14px_rgba(229,9,20,0.5)] animate-pulse'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    liveMatch.isFinished ? 'bg-amber-300' : liveMatch.isUpcoming ? 'bg-blue-300' : 'bg-white animate-ping'
                                }`} />
                                <span>{liveMatch.isFinished ? 'FINAL' : liveMatch.isUpcoming ? 'PRÓXIMO' : 'EN VIVO'}</span>
                            </span>
                            {opponentAbbr && !liveMatch.isManual && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md text-white/90 border border-white/15 whitespace-nowrap shadow-sm">
                                    {liveMatch.isUpcoming
                                        ? `vs ${opponentAbbr} · ${liveMatch.startTime || 'Hoy'}`
                                        : `vs ${opponentAbbr} · ${ourScore}-${theirScore}`
                                    }
                                </span>
                            )}
                            {/* Micro-detalle de goles */}
                            {liveMatch.events && liveMatch.events.some(e => e.type === 'goal') && (
                                <span className="hidden group-hover:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-neutral-900/90 text-red-200 border border-red-500/30 shadow-md backdrop-blur-md">
                                    <span>⚽</span>
                                    <span className="truncate max-w-[130px]">
                                        {liveMatch.events
                                            .filter(e => e.type === 'goal')
                                            .slice(0, 2)
                                            .map(g => `${g.playerName.split(' ').pop()} ${g.minute}`)
                                            .join(', ')}
                                    </span>
                                </span>
                            )}
                        </>
                    )}
                    {isLive && !liveMatch && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold bg-red-600/85 backdrop-blur-md text-white border border-red-400/40 shadow-[0_0_12px_rgba(229,9,20,0.5)] animate-pulse">
                            ⚡ MATCHDAY
                        </span>
                    )}
                    {!isLive && topSeller && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold bg-amber-500/90 backdrop-blur-md text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                            🔥 TOP
                        </span>
                    )}
                </div>
            )}

            {/* 📝 Content Wrapper — Posicionamiento estático sin saltos ni descolocaciones (§7 Spatial Consistency) */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4 pb-3 sm:pb-4 flex flex-col justify-end">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-white leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] line-clamp-1">
                    {displayName}
                </h3>
                <p className="text-white/70 text-[10px] sm:text-xs font-medium tracking-normal mt-0.5 line-clamp-1">
                    {modelo}
                </p>
                {season && (
                    <p className="text-white/45 text-[9px] sm:text-[10px] font-mono font-medium mt-0.5">
                        {season}
                    </p>
                )}

                {/* Fila inferior: Precio en Cápsula y Botón "Personalizar" con emergencia fluida al hover */}
                <div className="mt-2.5 flex items-center justify-between gap-1.5 sm:gap-2 h-7 sm:h-8">
                    {/* Cápsula de Precio Apple con Números Tabulares: Siempre en la misma fila sin partirse */}
                    <div className="inline-flex items-center shrink-0 whitespace-nowrap px-2 sm:px-2.5 py-1 bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-full shadow-sm">
                        <span className="text-white font-mono font-bold text-[10.5px] sm:text-xs md:text-sm tabular-nums tracking-tight whitespace-nowrap flex items-center gap-1">
                            <span>L</span>
                            <span>{precio.toLocaleString("es-HN")}</span>
                        </span>
                    </div>

                    {/* Botón Personalizar Apple Style: Emerge suavemente en el hover sin desplazar el texto, con háptica táctil */}
                    <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10.5px] sm:text-xs font-bold shadow-[0_4px_16px_rgba(229,9,20,0.45)] border-t border-white/30 backdrop-blur-md
                        opacity-90 max-sm:opacity-100 sm:opacity-0 sm:translate-y-1.5 sm:group-hover:opacity-100 sm:group-hover:translate-y-0
                        transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer shrink-0">
                        <Shirt className="w-3 h-3 shrink-0" />
                        <span className="tracking-tight">Personalizala</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200 shrink-0 hidden sm:inline-block" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
