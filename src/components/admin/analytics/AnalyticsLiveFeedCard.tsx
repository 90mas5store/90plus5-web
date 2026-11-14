'use client';

import React, { useMemo, useState } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import type { AnalyticsSummary } from '@/lib/analytics/types';
import { getCountryFlag } from '@/lib/analytics/geo';

interface AnalyticsLiveFeedCardProps {
    recentEvents: AnalyticsSummary['recentEvents'];
    loading: boolean;
}

const BADGE_CONFIG: Record<string, { label: string; isHighlight?: boolean }> = {
    page_view: { label: 'Vista' },
    product_view: { label: 'Camiseta' },
    search: { label: 'Búsqueda' },
    add_to_cart: { label: 'Carrito', isHighlight: true },
    whatsapp_click: { label: 'WhatsApp', isHighlight: true },
    matchday_click: { label: 'Matchday' },
    checkout_start: { label: 'Checkout', isHighlight: true },
    purchase: { label: 'Compra', isHighlight: true },
};

export default function AnalyticsLiveFeedCard({
    recentEvents = [],
    loading,
}: AnalyticsLiveFeedCardProps) {
    const [filter, setFilter] = useState<'all' | 'commerce' | 'search'>('all');

    const filteredEvents = useMemo(() => {
        if (filter === 'commerce') {
            return recentEvents.filter((ev) =>
                ev.event_type === 'add_to_cart' ||
                ev.event_type === 'whatsapp_click' ||
                ev.event_type === 'checkout_start' ||
                ev.event_type === 'purchase' ||
                ev.event_type === 'product_view'
            );
        }
        if (filter === 'search') {
            return recentEvents.filter(
                (ev) => ev.event_type === 'search' || ev.event_type === 'matchday_click'
            );
        }
        return recentEvents;
    }, [recentEvents, filter]);

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06] mb-4">
                <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <Activity className="w-4 h-4" />
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                                Pulso de Actividad Reciente
                            </h2>
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        </div>
                        <p className="text-xs text-neutral-400">
                            Últimos eventos capturados en tiempo real (hora local UTC-6)
                        </p>
                    </div>
                </div>

                <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`cursor-pointer transition-all ${
                            filter === 'all'
                                ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                        }`}
                    >
                        Todos
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('commerce')}
                        className={`cursor-pointer transition-all ${
                            filter === 'commerce'
                                ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                        }`}
                    >
                        Intención & Compra
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('search')}
                        className={`cursor-pointer transition-all ${
                            filter === 'search'
                                ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                        }`}
                    >
                        Búsqueda & Matchday
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                </div>
            ) : filteredEvents.length > 0 ? (
                <div className="divide-y divide-white/[0.05] max-h-72 overflow-y-auto pr-1">
                    {filteredEvents.map((ev) => {
                        const badge = BADGE_CONFIG[ev.event_type] || {
                            label: ev.event_type,
                            isHighlight: false,
                        };
                        const timeFormatted = new Date(ev.created_at).toLocaleTimeString('es-HN', {
                            timeZone: 'America/Tegucigalpa',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        });
                        const geoText = [
                            ev.country ? getCountryFlag(ev.country) : null,
                            ev.city || null,
                        ]
                            .filter(Boolean)
                            .join(' ');

                        const isWhatsApp = ev.event_type === 'whatsapp_click';
                        const meta = (ev.metadata && typeof ev.metadata === 'object' ? ev.metadata : {}) as Record<string, unknown>;
                        const metaDetail = isWhatsApp || ev.event_type === 'add_to_cart' || ev.event_type === 'product_view'
                            ? [
                                meta.teamName || meta.equipo,
                                meta.productName || meta.modelo,
                                meta.version ? `(${meta.version}${meta.talla ? ` · ${meta.talla}` : ''})` : meta.talla ? `(${meta.talla})` : null,
                            ]
                                .filter(Boolean)
                                .join(' ')
                            : ev.event_type === 'search' && meta.searchTerm
                                ? `"${meta.searchTerm}"`
                                : null;

                        return (
                            <div
                                key={ev.id}
                                className="py-2.5 flex items-center justify-between gap-3 text-xs"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                            isWhatsApp
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : badge.isHighlight
                                                    ? 'bg-primary/10 text-primary border-primary/20'
                                                    : 'bg-white/[0.05] text-neutral-300 border-white/[0.08]'
                                        }`}
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${
                                                isWhatsApp
                                                    ? 'bg-emerald-400'
                                                    : badge.isHighlight
                                                        ? 'bg-primary'
                                                        : 'bg-white/40'
                                            }`}
                                        />
                                        {badge.label}
                                    </span>
                                    <span className="font-mono text-neutral-200 truncate">
                                        {metaDetail ? `${metaDetail} (${ev.path})` : ev.path}
                                    </span>
                                    {geoText && (
                                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-neutral-400 shrink-0">
                                            {geoText}
                                        </span>
                                    )}
                                </div>
                                <span className="text-neutral-500 shrink-0 font-mono text-[11px]">
                                    {timeFormatted}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-xs text-neutral-500 text-center py-6">
                    No hay eventos recientes para este filtro.
                </p>
            )}
        </div>
    );
}
