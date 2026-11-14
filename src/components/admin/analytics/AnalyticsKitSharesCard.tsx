'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Share2, Clock, Loader2, RefreshCw, Flame } from 'lucide-react';
import { ShareStatItem } from '@/components/admin/reportes/types';
import { getStoreRangeDateStrings } from '@/lib/analytics/range';

interface AnalyticsKitSharesCardProps {
    range: 'today' | '7d' | '30d' | 'all';
}

function formatRelativeTime(dateStr?: string): string {
    if (!dateStr) return 'Recientemente';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-HN', { day: 'numeric', month: 'short' });
}

export default function AnalyticsKitSharesCard({ range }: AnalyticsKitSharesCardProps) {
    const [shares, setShares] = useState<ShareStatItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadShares = useCallback(async () => {
        setLoading(true);
        try {
            const { startStr, endStr } = getStoreRangeDateStrings(range);
            const res = await fetch(`/api/admin/reports/shares?startDate=${startStr}&endDate=${endStr}`);
            if (!res.ok) throw new Error('Error');
            const data = await res.json();

            const map = new Map<string, ShareStatItem>();
            for (const row of data || []) {
                const key = `${row.team_name || ''}::${row.product_name}::${row.season || ''}`;
                const existing = map.get(key) || {
                    product_name: row.product_name,
                    team_name: row.team_name,
                    season: row.season,
                    count: 0,
                    last_shared_at: row.created_at,
                };
                existing.count++;
                if (row.created_at && (!existing.last_shared_at || new Date(row.created_at) > new Date(existing.last_shared_at))) {
                    existing.last_shared_at = row.created_at;
                }
                map.set(key, existing);
            }
            const sorted = Array.from(map.values())
                .sort((a, b) => b.count - a.count)
                .slice(0, 8);
            setShares(sorted);
        } catch {
            console.error('Error al cargar presumes de kit');
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        loadShares();
    }, [loadShares]);

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                    <span className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                    <div>
                        <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                            Presumes de Kit (Viralidad)
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                        </h2>
                        <p className="text-[11px] sm:text-xs text-neutral-400">
                            Camisetas compartidas por aficionados con fecha del último presumido
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={loadShares}
                    disabled={loading}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-white/5 disabled:opacity-50 transition-colors cursor-pointer"
                    title="Actualizar presumes"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading ? (
                <div className="py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                </div>
            ) : shares.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-6">
                    Sin presumes de kits registrados en este período.
                </p>
            ) : (
                <div className="space-y-2">
                    {shares.map((item, idx) => {
                        const maxCount = shares[0]?.count || 1;
                        const barWidth = Math.round((item.count / maxCount) * 100);

                        return (
                            <div
                                key={`${item.team_name}-${item.product_name}-${idx}`}
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
                                                {item.product_name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 ml-2">
                                        <span className="font-mono font-bold text-white text-[11px]">
                                            {item.count} {item.count === 1 ? 'vez' : 'veces'}
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>

                                {item.last_shared_at && (
                                    <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                                        <Clock className="w-3 h-3 text-neutral-500" />
                                        <span>Última vez: {formatRelativeTime(item.last_shared_at)}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

