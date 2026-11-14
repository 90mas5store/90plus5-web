'use client';

import React, { useState } from 'react';
import {
    AlertTriangle,
    Clock,
    Eye,
    Flame,
    Loader2,
    Share2,
    TrendingUp,
} from 'lucide-react';
import type { AnalyticsProductStat } from '@/lib/analytics/types';
import type { BestSellerItem, ShareStatItem } from '@/components/admin/reportes/types';

interface AnalyticsCatalogMatrixCardProps {
    topProducts: AnalyticsProductStat[];
    bestSellers: BestSellerItem[];
    kitShares: ShareStatItem[];
    loading: boolean;
}

function formatRelativeTime(dateStr?: string): string {
    if (!dateStr) return 'Recientemente';
    const date = new Date(dateStr);
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-HN', { day: 'numeric', month: 'short' });
}

export default function AnalyticsCatalogMatrixCard({
    topProducts,
    bestSellers,
    kitShares,
    loading,
}: AnalyticsCatalogMatrixCardProps) {
    const [tab, setTab] = useState<'sales' | 'views' | 'shares'>('sales');

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06] mb-4">
                <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        {tab === 'sales' ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : tab === 'views' ? (
                            <Flame className="w-4 h-4" />
                        ) : (
                            <Share2 className="w-4 h-4" />
                        )}
                    </span>
                    <div>
                        <h2 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight">
                            Matriz de Rendimiento de Camisetas
                        </h2>
                        <p className="text-xs text-neutral-400">
                            {tab === 'sales'
                                ? 'Unidades facturadas e ingresos por camiseta en el período'
                                : tab === 'views'
                                    ? 'Cruce de fichas más vistas frente a carritos y conversión real'
                                    : 'Camisetas más compartidas por aficionados (viralidad)'}
                        </p>
                    </div>
                </div>

                <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] overflow-x-auto self-start md:self-auto">
                    <button
                        type="button"
                        onClick={() => setTab('sales')}
                        className={`whitespace-nowrap cursor-pointer transition-all ${
                            tab === 'sales'
                                ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                        }`}
                    >
                        Más Vendidas ({bestSellers.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('views')}
                        className={`whitespace-nowrap cursor-pointer transition-all ${
                            tab === 'views'
                                ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                        }`}
                    >
                        Vistas & Conversión ({topProducts.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('shares')}
                        className={`whitespace-nowrap cursor-pointer transition-all ${
                            tab === 'shares'
                                ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                        }`}
                    >
                        Viralidad ({kitShares.length})
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-10 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                </div>
            ) : tab === 'sales' ? (
                bestSellers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {bestSellers.slice(0, 10).map((item, idx) => {
                            const maxUnits = bestSellers[0]?.units || 1;
                            const barWidth = Math.max(Math.round((item.units / maxUnits) * 100), 6);

                            return (
                                <div
                                    key={`${item.team_name}-${item.name}-${idx}`}
                                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] space-y-2 transition-all"
                                >
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-[11px] font-mono text-neutral-500 font-bold w-5 shrink-0">
                                                #{idx + 1}
                                            </span>
                                            <div className="min-w-0 truncate">
                                                {item.team_name && (
                                                    <span className="text-[10px] font-bold text-neutral-400 mr-1.5 uppercase tracking-wider">
                                                        {item.team_name}
                                                    </span>
                                                )}
                                                <span className="font-bold text-white truncate">{item.name}</span>
                                                {item.season && (
                                                    <span className="text-[10px] font-mono text-neutral-300 ml-1.5 bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded">
                                                        {item.season}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="font-mono text-white font-bold text-xs">
                                                {item.units} {item.units === 1 ? 'ud.' : 'uds.'}
                                            </span>
                                            <span className="font-mono text-neutral-400 text-[11px]">
                                                L {item.revenue.toLocaleString('es-HN')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-500"
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-neutral-500 text-center py-8">
                        Sin ventas facturadas registradas en este período.
                    </p>
                )
            ) : tab === 'views' ? (
                topProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {topProducts.slice(0, 10).map((prod, idx) => {
                            const maxViews = topProducts[0]?.views || 1;
                            const widthPercent = Math.max(Math.round((prod.views / maxViews) * 100), 6);
                            const needsAttention = prod.views >= 5 && prod.unitsSold === 0;

                            return (
                                <div
                                    key={prod.slug || idx}
                                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] space-y-2 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 min-w-0">
                                            <span className="text-[11px] font-mono text-neutral-500 font-bold w-5 shrink-0 mt-0.5">
                                                #{idx + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-xs font-bold text-white truncate">{prod.name}</span>
                                                    {prod.season && (
                                                        <span className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono font-semibold text-neutral-300">
                                                            {prod.season}
                                                        </span>
                                                    )}
                                                    {needsAttention && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                                                            <AlertTriangle className="w-2.5 h-2.5" />
                                                            Sin ventas
                                                        </span>
                                                    )}
                                                </div>
                                                {prod.teamName && (
                                                    <span className="text-[10px] text-neutral-400 block truncate">
                                                        {prod.teamName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div className="flex items-center justify-end gap-2 font-mono text-xs">
                                                <span className="text-white font-bold inline-flex items-center gap-1">
                                                    <Eye className="w-3 h-3 text-neutral-400" />
                                                    {prod.views}
                                                </span>
                                                <span className="text-neutral-300 font-bold">
                                                    {prod.unitsSold} uds.
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-mono text-neutral-400 block">
                                                {prod.carts} carrito · {prod.conversionRate}% conv.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-500"
                                            style={{ width: `${widthPercent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-neutral-500 text-center py-8">
                        Sin vistas de fichas de producto en este período.
                    </p>
                )
            ) : kitShares.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {kitShares.map((item, idx) => {
                        const maxCount = kitShares[0]?.count || 1;
                        const barWidth = Math.max(Math.round((item.count / maxCount) * 100), 6);

                        return (
                            <div
                                key={`${item.team_name}-${item.product_name}-${idx}`}
                                className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] space-y-2 transition-all"
                            >
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[11px] font-mono text-neutral-500 font-bold w-5 shrink-0">
                                            #{idx + 1}
                                        </span>
                                        <div className="min-w-0 truncate">
                                            {item.team_name && (
                                                <span className="text-[10px] font-bold text-neutral-400 mr-1.5 uppercase tracking-wider">
                                                    {item.team_name}
                                                </span>
                                            )}
                                            <span className="font-bold text-white truncate">{item.product_name}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="font-mono font-bold text-white text-xs">
                                            {item.count} {item.count === 1 ? 'vez' : 'veces'}
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>

                                {item.last_shared_at && (
                                    <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                                        <Clock className="w-3 h-3 text-neutral-500" />
                                        <span>Último presume: {formatRelativeTime(item.last_shared_at)}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-xs text-neutral-500 text-center py-8">
                    Sin presumes de kits registrados en este período.
                </p>
            )}
        </div>
    );
}
