'use client';

import React from 'react';
import { TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { BestSellerItem } from './types';

interface BestSellersSectionProps {
    bestSellers: BestSellerItem[];
    loading: boolean;
    onRefresh: () => void;
}

export default function BestSellersSection({
    bestSellers,
    loading,
    onRefresh,
}: BestSellersSectionProps) {
    return (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Productos Más Vendidos
                </h2>
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                    {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Refrescar
                </button>
            </div>

            {bestSellers.length === 0 ? (
                <p className="text-sm text-gray-600 italic text-center py-6">
                    No hay datos en el rango seleccionado.
                </p>
            ) : (
                <div className="space-y-2">
                    {bestSellers.map((item, idx) => {
                        const maxRevenue = bestSellers[0]?.revenue || 1;
                        const barWidth = Math.round((item.revenue / maxRevenue) * 100);
                        return (
                            <div
                                key={`${item.team_name}-${item.name}-${item.season}-${idx}`}
                                className="flex items-center gap-3"
                            >
                                <span className="text-xs font-bold text-gray-600 w-5 text-right shrink-0">
                                    {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                            {item.team_name && (
                                                <span className="text-xs font-bold text-primary tracking-wider uppercase shrink-0">
                                                    {item.team_name}
                                                </span>
                                            )}
                                            <span className="text-sm text-white font-medium truncate">{item.name}</span>
                                            {item.season && (
                                                <span className="text-[10px] font-bold text-gray-300 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/10 shrink-0">
                                                    {item.season}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0 ml-2">
                                            <span className="text-xs text-gray-500">{item.units} uds.</span>
                                            <span className="text-xs font-bold text-white">
                                                L {item.revenue.toLocaleString('es-HN')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
