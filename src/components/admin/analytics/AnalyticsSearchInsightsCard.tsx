'use client';

import React, { useState } from 'react';
import { Check, Copy, Search, SearchX, Sparkles } from 'lucide-react';
import type { AnalyticsMissedSearch } from '@/lib/analytics/types';
import useToastMessage from '@/hooks/useToastMessage';

interface AnalyticsSearchInsightsCardProps {
    missedSearches: AnalyticsMissedSearch[];
    topSearches: { term: string; count: number }[];
}

export default function AnalyticsSearchInsightsCard({
    missedSearches = [],
    topSearches = [],
}: AnalyticsSearchInsightsCardProps) {
    const toast = useToastMessage();
    const [tab, setTab] = useState<'missed' | 'all'>('missed');
    const [copied, setCopied] = useState(false);

    const handleCopyMissed = () => {
        if (missedSearches.length === 0) return;
        const textList = missedSearches
            .map((item, idx) => `${idx + 1}. ${item.term} (${item.count} búsquedas)`)
            .join('\n');
        const message = `📋 *Demanda Solicitada en 90+5 Store (Sin Stock)*:\n${textList}`;
        navigator.clipboard.writeText(message);
        setCopied(true);
        toast.celebrate('¡Lista copiada para enviar a proveedor!');
        setTimeout(() => setCopied(false), 2000);
    };

    const totalMissedCount = missedSearches.reduce((acc, curr) => acc + curr.count, 0);
    const totalAllCount = topSearches.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col justify-between">
            <div>
                {/* Subheader con tabs Apple */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06] mb-4">
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                            {tab === 'missed' ? <SearchX className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                        </span>
                        <div>
                            <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                                {tab === 'missed' ? 'Radar de Demanda (Sin Stock)' : 'Términos Más Buscados'}
                            </h2>
                            <p className="text-xs text-neutral-400">
                                {tab === 'missed'
                                    ? 'Clubes o jugadores buscados con 0 resultados en catálogo'
                                    : 'Lo que los aficionados escriben en el buscador de la tienda'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06]">
                            <button
                                type="button"
                                onClick={() => setTab('missed')}
                                className={`cursor-pointer transition-all ${
                                    tab === 'missed'
                                        ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                        : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                                }`}
                            >
                                Sin Stock ({missedSearches.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab('all')}
                                className={`cursor-pointer transition-all ${
                                    tab === 'all'
                                        ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                        : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                                }`}
                            >
                                Todas ({topSearches.length})
                            </button>
                        </div>

                        {tab === 'missed' && missedSearches.length > 0 && (
                            <button
                                type="button"
                                onClick={handleCopyMissed}
                                className="bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                title="Copiar lista para enviar a proveedor"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-white" />
                                        <span className="text-white">Copiado</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                                        <span className="hidden sm:inline">Copiar</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {tab === 'missed' ? (
                    missedSearches.length > 0 ? (
                        <div className="space-y-2">
                            {missedSearches.map((item, idx) => (
                                <div
                                    key={`${item.term}-${idx}`}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] transition-all"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="w-5 text-center text-xs font-bold text-neutral-500 font-mono">
                                            #{idx + 1}
                                        </span>
                                        <span className="text-xs sm:text-sm font-semibold text-white truncate">
                                            &quot;{item.term}&quot;
                                        </span>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold font-mono shrink-0">
                                        {item.count} {item.count === 1 ? 'búsqueda' : 'búsquedas'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center border border-dashed border-white/[0.08] rounded-2xl">
                            <Sparkles className="w-5 h-5 text-neutral-400 mx-auto mb-2 opacity-80" />
                            <p className="text-xs text-neutral-300 font-bold">Catálogo alineado con la demanda</p>
                            <p className="text-[11px] text-neutral-500 mt-1">
                                No se registraron búsquedas con 0 resultados en este período.
                            </p>
                        </div>
                    )
                ) : topSearches.length > 0 ? (
                    <div className="space-y-2">
                        {topSearches.map((search, idx) => (
                            <div
                                key={`${search.term}-${idx}`}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] transition-all"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-5 text-center text-xs font-bold text-neutral-500 font-mono">
                                        #{idx + 1}
                                    </span>
                                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                                        &quot;{search.term}&quot;
                                    </span>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] text-neutral-300 border border-white/[0.08] text-[11px] font-bold font-mono shrink-0">
                                    {search.count} {search.count === 1 ? 'vez' : 'veces'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-neutral-500 text-center py-8">
                        Sin búsquedas registradas en este período.
                    </p>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-400">
                <span>
                    {tab === 'missed' ? 'Búsquedas sin stock acumuladas:' : 'Búsquedas totales en top:'}
                </span>
                <span className="font-mono font-bold text-white">
                    {tab === 'missed' ? totalMissedCount : totalAllCount}
                </span>
            </div>
        </div>
    );
}
