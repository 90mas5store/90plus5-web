'use client';

import TeamLogo from '@/components/TeamLogo';
import { CustomizerProduct, SelectedOption } from '@/types/productCustomizer';
import type { LiveMatchData } from '@/hooks/useLiveMatches';
import { Sparkles, Trophy, Zap } from 'lucide-react';

interface ProductHeaderInfoProps {
    producto: CustomizerProduct;
    precioConRecargo: number;
    precioOriginalActual: { price: number; active: boolean } | null;
    tallaSeleccionada: SelectedOption | null;
    liveMatch: LiveMatchData | null;
    showLiveBanner: boolean;
    isMobile?: boolean;
}

export default function ProductHeaderInfo({
    producto,
    precioConRecargo,
    precioOriginalActual,
    tallaSeleccionada,
    liveMatch,
    showLiveBanner,
    isMobile = false,
}: ProductHeaderInfoProps) {
    const hasDiscount =
        precioOriginalActual?.active &&
        precioOriginalActual.price > precioConRecargo &&
        precioConRecargo > 0;

    const discountAmount = hasDiscount
        ? precioOriginalActual.price - precioConRecargo
        : 0;

    const discountPercent = hasDiscount
        ? Math.round((discountAmount / precioOriginalActual.price) * 100)
        : 0;

    // Mobile view
    if (isMobile) {
        return (
            <div className="flex lg:hidden flex-col gap-3 pt-2">
                <div className="flex items-start gap-3.5">
                    {producto.logoEquipo && (
                        <div className="shrink-0 transition-transform duration-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                            <TeamLogo src={producto.logoEquipo} alt={producto.equipo} size={50} />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-black tracking-tight text-white leading-tight">
                                {producto.equipo}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className="text-xs font-bold text-primary tracking-wider uppercase">
                                {producto.modelo}
                            </span>
                            {producto.season && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/[0.08] backdrop-blur-md text-white/80 border border-white/10">
                                    {producto.season}
                                </span>
                            )}
                        </div>
                    </div>

                    {showLiveBanner && (
                        <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide text-white backdrop-blur-md shadow-md border ${
                                    liveMatch?.isFinished
                                        ? 'bg-amber-600/85 border-amber-400/40 shadow-[0_0_12px_rgba(217,119,6,0.5)]'
                                        : liveMatch?.isUpcoming
                                        ? 'bg-blue-600/85 border-blue-400/40 shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                                        : 'bg-red-600/90 border-red-400/40 shadow-[0_0_14px_rgba(229,9,20,0.6)] animate-pulse'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    liveMatch?.isFinished ? 'bg-amber-300' : liveMatch?.isUpcoming ? 'bg-blue-300' : 'bg-white animate-ping'
                                }`} />
                                <span>{liveMatch?.isFinished ? 'FINAL' : liveMatch?.isUpcoming ? 'PRÓXIMO' : 'EN VIVO'}</span>
                            </span>
                            {liveMatch && (
                                <span className="text-[9px] font-mono font-bold text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 whitespace-nowrap shadow-sm">
                                    {liveMatch.homeAbbr || liveMatch.homeTeam.slice(0, 3)} {liveMatch.isUpcoming ? 'vs' : `${liveMatch.homeScore}-${liveMatch.awayScore}`} {liveMatch.awayAbbr || liveMatch.awayTeam.slice(0, 3)}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Precio en Cápsula Apple con Tabular Nums */}
                <div className="flex items-baseline gap-2.5 flex-wrap pt-1">
                    {precioConRecargo > 0 ? (
                        <>
                            <div className="inline-flex items-baseline gap-1 text-3xl font-black text-white tracking-tight">
                                <span className="text-xl font-bold text-amber-400">L</span>
                                <span className="font-mono tabular-nums">
                                    {precioConRecargo.toLocaleString('es-HN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                            {hasDiscount && (
                                <div className="flex items-center gap-2">
                                    <span className="text-white/40 line-through text-sm font-mono tabular-nums">
                                        L {precioOriginalActual.price.toLocaleString('es-HN')}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                                        {discountPercent}% OFF
                                    </span>
                                </div>
                            )}
                            {tallaSeleccionada?.additional_cost ? (
                                <span className="text-[11px] text-amber-400/90 font-mono font-medium">
                                    (+L{tallaSeleccionada.additional_cost} talla {tallaSeleccionada.label})
                                </span>
                            ) : null}
                        </>
                    ) : (
                        <span className="text-2xl font-bold text-white">Consultar precio</span>
                    )}
                </div>

                {/* Breve descripción editorial */}
                {producto.descripcion && (
                    <div className="p-3 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] text-white/70 text-xs leading-relaxed">
                        {producto.descripcion}
                    </div>
                )}
            </div>
        );
    }

    // Desktop view
    return (
        <div className="hidden lg:flex flex-col gap-4">
            <div className="flex items-start gap-4">
                {producto.logoEquipo && (
                    <div className="shrink-0 transition-transform duration-300 drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)] hover:scale-105">
                        <TeamLogo src={producto.logoEquipo} alt={producto.equipo} size={64} />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
                            {producto.equipo}
                        </h1>
                        {showLiveBanner && (
                            <span
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-tight text-white backdrop-blur-md shadow-md border ${
                                    liveMatch?.isFinished
                                        ? 'bg-amber-600/85 border-amber-400/40 shadow-[0_0_12px_rgba(217,119,6,0.5)]'
                                        : liveMatch?.isUpcoming
                                        ? 'bg-blue-600/85 border-blue-400/40 shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                                        : 'bg-red-600/90 border-red-400/40 shadow-[0_0_16px_rgba(229,9,20,0.6)] animate-pulse'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${
                                    liveMatch?.isFinished ? 'bg-amber-300' : liveMatch?.isUpcoming ? 'bg-blue-300' : 'bg-white animate-ping'
                                }`} />
                                <span>{liveMatch?.isFinished ? 'FINAL' : liveMatch?.isUpcoming ? 'PRÓXIMO' : 'EN VIVO'}</span>
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap mt-2">
                        <span className="text-sm font-bold text-primary tracking-wider uppercase">
                            {producto.modelo}
                        </span>
                        {producto.season && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/[0.08] backdrop-blur-md text-white/80 border border-white/10">
                                {producto.season}
                            </span>
                        )}
                    </div>

                    {/* Live Match Info Ticker */}
                    {liveMatch && (
                        <div
                            className={`mt-3 inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-black/60 backdrop-blur-xl border text-xs font-bold text-white shadow-lg ${
                                liveMatch.isFinished
                                    ? 'border-amber-500/40'
                                    : liveMatch.isUpcoming
                                    ? 'border-blue-500/40'
                                    : 'border-red-500/40 shadow-[0_0_15px_rgba(229,9,20,0.25)]'
                            }`}
                        >
                            <span className="text-white font-bold">{liveMatch.homeAbbr || liveMatch.homeTeam}</span>
                            {liveMatch.isUpcoming ? (
                                <>
                                    <span className="text-blue-400 font-bold">vs</span>
                                    <span className="text-white font-bold">{liveMatch.awayAbbr || liveMatch.awayTeam}</span>
                                    <span className="text-blue-300 text-[11px] font-semibold bg-blue-500/20 px-2 py-0.5 rounded-full">
                                        {liveMatch.startTime || 'Próximamente'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="font-mono text-amber-400 text-sm font-black px-1">
                                        {liveMatch.homeScore} - {liveMatch.awayScore}
                                    </span>
                                    <span className="text-white font-bold">{liveMatch.awayAbbr || liveMatch.awayTeam}</span>
                                    {liveMatch.isFinished ? (
                                        <span className="text-amber-300 text-[10px] font-bold bg-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                                            Final
                                        </span>
                                    ) : liveMatch.isHalftime ? (
                                        <span className="text-amber-400 text-[10px] font-bold bg-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                                            Entretiempo
                                        </span>
                                    ) : (
                                        (liveMatch.displayClock || liveMatch.minute) && (
                                            <span className="text-white/60 font-mono text-[11px]">
                                                {liveMatch.displayClock || `${liveMatch.minute}'`}
                                            </span>
                                        )
                                    )}
                                </>
                            )}
                            {liveMatch.leagueName && (
                                <span className="text-white/40 text-[11px] font-medium border-l border-white/20 pl-2.5">
                                    {liveMatch.leagueName}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Precio con Precisión Numérica Apple */}
            <div className="flex items-baseline gap-3 flex-wrap pt-2">
                {precioConRecargo > 0 ? (
                    <>
                        <div className="inline-flex items-baseline gap-1.5 text-4xl xl:text-5xl font-black text-white tracking-tight">
                            <span className="text-2xl font-bold text-amber-400">L</span>
                            <span className="font-mono tabular-nums">
                                {precioConRecargo.toLocaleString('es-HN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>
                        {hasDiscount && (
                            <div className="flex items-center gap-2">
                                <span className="text-white/40 line-through text-lg font-mono tabular-nums">
                                    L {precioOriginalActual.price.toLocaleString('es-HN')}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                                    AHORRÁS L {discountAmount.toLocaleString('es-HN')} ({discountPercent}% OFF)
                                </span>
                            </div>
                        )}
                        {tallaSeleccionada?.additional_cost ? (
                            <span className="text-xs text-amber-400/90 font-mono font-medium">
                                (+L{tallaSeleccionada.additional_cost} adicional por talla {tallaSeleccionada.label})
                            </span>
                        ) : null}
                    </>
                ) : (
                    <span className="text-3xl font-bold text-white tracking-wide">Consultar</span>
                )}
            </div>

            {/* Editorial Glass Card */}
            {producto.descripcion && (
                <div className="p-3.5 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] text-white/70 text-xs xl:text-sm leading-relaxed">
                    {producto.descripcion}
                </div>
            )}
        </div>
    );
}

