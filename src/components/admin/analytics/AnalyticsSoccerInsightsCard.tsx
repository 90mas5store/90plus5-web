'use client';

import React, { useState } from 'react';
import { Award, Layers, Shirt, Sparkles, UserCheck } from 'lucide-react';
import type {
    AnalyticsPatchSummary,
    AnalyticsPlayerStat,
    AnalyticsSizeStat,
    AnalyticsVersionStat,
} from '@/lib/analytics/types';

interface AnalyticsSoccerInsightsCardProps {
    sizes: AnalyticsSizeStat[];
    versions?: AnalyticsVersionStat[];
    patches?: AnalyticsPatchSummary;
    players: AnalyticsPlayerStat[];
    loading?: boolean;
}

export default function AnalyticsSoccerInsightsCard({
    sizes = [],
    versions = [],
    patches,
    players = [],
}: AnalyticsSoccerInsightsCardProps) {
    const [tab, setTab] = useState<'sizes' | 'versions' | 'players'>('sizes');

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col justify-between">
            <div>
                {/* Subheader con controles segmentados Apple */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06] mb-4">
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                            {tab === 'sizes' ? (
                                <Shirt className="w-4 h-4" />
                            ) : tab === 'versions' ? (
                                <Layers className="w-4 h-4" />
                            ) : (
                                <UserCheck className="w-4 h-4" />
                            )}
                        </span>
                        <div>
                            <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                                {tab === 'sizes'
                                    ? 'Curva de Tallas (Compras vs Carrito)'
                                    : tab === 'versions'
                                        ? 'Versión & Parches Oficiales'
                                        : 'Dorsales & Jugadores Top'}
                            </h2>
                            <p className="text-xs text-neutral-400">
                                {tab === 'sizes'
                                    ? 'Unidades reales facturadas frente a intención de carrito'
                                    : tab === 'versions'
                                        ? 'Proporción Versión Jugador vs Aficionado y uso de parches'
                                        : 'Futbolistas y nombres personalizados más solicitados'}
                            </p>
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setTab('sizes')}
                            className={`cursor-pointer transition-all ${
                                tab === 'sizes'
                                    ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                    : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                            }`}
                        >
                            Tallas
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('versions')}
                            className={`cursor-pointer transition-all ${
                                tab === 'versions'
                                    ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                    : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                            }`}
                        >
                            Versión
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('players')}
                            className={`cursor-pointer transition-all ${
                                tab === 'players'
                                    ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                    : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                            }`}
                        >
                            Dorsales
                        </button>
                    </div>
                </div>

                {/* Contenido según pestaña */}
                {tab === 'sizes' ? (
                    sizes.length > 0 ? (
                        <div className="space-y-3">
                            {sizes.map((item) => {
                                const widthPct = Math.max(item.purchasedPercentage || item.percentage, 5);
                                return (
                                    <div key={item.size} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-white flex items-center gap-2">
                                                <span className="w-7 h-6 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center font-mono text-[11px] font-black text-white">
                                                    {item.size}
                                                </span>
                                                <span className="text-neutral-300">Talla {item.size}</span>
                                            </span>
                                            <div className="flex items-center gap-2.5 font-mono text-[11px]">
                                                <span className="text-white font-bold">
                                                    {item.purchasedCount} vendidas ({item.purchasedPercentage}%)
                                                </span>
                                                <span className="text-neutral-500">
                                                    · {item.count} carrito
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-500"
                                                style={{ width: `${widthPct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-neutral-500 text-center py-8">
                            Sin datos de tallas registradas en este período.
                        </p>
                    )
                ) : tab === 'versions' ? (
                    <div className="space-y-4">
                        {versions.length > 0 ? (
                            <div className="space-y-3">
                                {versions.map((v) => {
                                    const widthPct = Math.max(v.purchasedPercentage || v.cartPercentage, 6);
                                    return (
                                        <div
                                            key={v.version}
                                            className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2"
                                        >
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-extrabold text-white">{v.version}</span>
                                                <div className="flex items-center gap-2.5 font-mono text-[11px]">
                                                    <span className="text-white font-bold">
                                                        {v.purchasedUnits} uds. ({v.purchasedPercentage}%)
                                                    </span>
                                                    <span className="text-neutral-400">
                                                        · {v.cartCount} carrito
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                                    style={{ width: `${widthPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-neutral-500 text-center py-4">
                                Sin desglose de versiones en este período.
                            </p>
                        )}

                        {patches && (
                            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                                        <Award className="w-4 h-4" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-extrabold text-white">Parches de Competición</p>
                                        <p className="text-[11px] text-neutral-400">
                                            {patches.withPatchOrderUnits} de {patches.totalOrderUnits} camisetas vendidas llevan parche
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right font-mono shrink-0">
                                    <span className="text-base font-black text-white block">
                                        {patches.orderRate}%
                                    </span>
                                    <span className="text-[10px] text-neutral-500">
                                        {patches.cartRate}% en carrito
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : players.length > 0 ? (
                    <div className="space-y-2">
                        {players.map((p, idx) => (
                            <div
                                key={`${p.name}-${p.number}-${idx}`}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-5 text-center text-xs font-black text-neutral-500 font-mono">
                                        #{idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold text-white truncate block">
                                            {p.name}
                                        </span>
                                        {p.number && (
                                            <span className="text-[10px] text-neutral-400 font-mono">
                                                Dorsal #{p.number}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                                    {p.purchasedCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                                            {p.purchasedCount} vend.
                                        </span>
                                    )}
                                    <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-neutral-300 border border-white/[0.08] font-bold">
                                        {p.count} carr.
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center border border-dashed border-white/[0.08] rounded-2xl">
                        <Sparkles className="w-5 h-5 text-neutral-400 mx-auto mb-2 opacity-80" />
                        <p className="text-xs text-neutral-300 font-bold">Sin dorsales personalizados aún</p>
                        <p className="text-[11px] text-neutral-500 mt-1">
                            Los jugadores y nombres personalizados aparecerán aquí automáticamente.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] text-neutral-400 flex items-center justify-between">
                <span>
                    {tab === 'sizes'
                        ? 'Talla líder en ventas:'
                        : tab === 'versions'
                            ? 'Versión preferida:'
                            : 'Dorsal #1:'}
                </span>
                <span className="font-mono font-bold text-white">
                    {tab === 'sizes'
                        ? sizes[0]
                            ? `Talla ${sizes[0].size} (${sizes[0].purchasedCount} vend. / ${sizes[0].count} carr.)`
                            : 'Sin datos'
                        : tab === 'versions'
                            ? versions[0]
                                ? `${versions[0].version} (${versions[0].purchasedPercentage || versions[0].cartPercentage}%)`
                                : 'Sin datos'
                            : players[0]
                                ? `${players[0].name} (${players[0].purchasedCount || players[0].count})`
                                : 'Sin datos'}
                </span>
            </div>
        </div>
    );
}
