'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { BestSellerItem } from '@/components/admin/reportes/types';
import { getStoreRangeDateStrings } from '@/lib/analytics/range';

interface AnalyticsBestSellersCardProps {
    range: 'today' | '7d' | '30d' | 'all';
}

export default function AnalyticsBestSellersCard({ range }: AnalyticsBestSellersCardProps) {
    const [bestSellers, setBestSellers] = useState<BestSellerItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadBestSellers = useCallback(async () => {
        setLoading(true);
        try {
            const { startStr, endStr } = getStoreRangeDateStrings(range);
            const res = await fetch(`/api/admin/reports/best-sellers?startDate=${startStr}&endDate=${endStr}&status=all`);
            if (!res.ok) throw new Error('Error');
            const data = await res.json();
            setBestSellers(data || []);
        } catch {
            console.error('Error al cargar más vendidos');
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        loadBestSellers();
    }, [loadBestSellers]);

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                    <span className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                    <div>
                        <h2 className="text-sm sm:text-base font-extrabold text-white">
                            Camisetas Más Vendidas
                        </h2>
                        <p className="text-[11px] sm:text-xs text-neutral-400">
                            Unidades facturadas en pedidos completados o en proceso
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={loadBestSellers}
                    disabled={loading}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-white/5 disabled:opacity-50 transition-colors cursor-pointer"
                    title="Actualizar ventas"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading ? (
                <div className="py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                </div>
            ) : bestSellers.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-6">
                    Sin ventas registradas en este período.
                </p>
            ) : (
                <div className="space-y-2">
                    {bestSellers.slice(0, 8).map((item, idx) => {
                        const maxUnits = bestSellers[0]?.units || 1;
                        const barWidth = Math.round((item.units / maxUnits) * 100);

                        return (
                            <div
                                key={`${item.team_name}-${item.name}-${idx}`}
                                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] space-y-1.5"
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[11px] font-mono text-neutral-500 font-bold w-4">
                                            #{idx + 1}
                                        </span>
                                        <div className="min-w-0 truncate">
                                            {item.team_name && (
                                                <span className="text-[10px] font-bold text-primary mr-1.5 uppercase tracking-wider">
                                                    {item.team_name}
                                                </span>
                                            )}
                                            <span className="font-semibold text-white truncate">
                                                {item.name}
                                            </span>
                                            {item.season && (
                                                <span className="text-[9px] font-mono text-neutral-400 ml-1.5 bg-white/5 px-1.5 py-0.2 rounded">
                                                    {item.season}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 shrink-0 ml-2">
                                        <span className="font-mono text-emerald-400 font-bold text-[11px]">
                                            {item.units} {item.units === 1 ? 'ud.' : 'uds.'}
                                        </span>
                                        <span className="font-mono text-neutral-400 text-[11px] hidden sm:inline">
                                            L {item.revenue.toLocaleString('es-HN')}
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

