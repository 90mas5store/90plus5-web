'use client';

import React, { useState } from 'react';
import { SearchX, Copy, Check, Sparkles } from 'lucide-react';
import { AnalyticsMissedSearch } from '@/lib/analytics/types';
import useToastMessage from '@/hooks/useToastMessage';

interface AnalyticsDemandRadarProps {
    missedSearches: AnalyticsMissedSearch[];
    loading?: boolean;
}

export default function AnalyticsDemandRadar({ missedSearches, loading }: AnalyticsDemandRadarProps) {
    const toast = useToastMessage();
    const [copied, setCopied] = useState(false);

    const handleCopyList = () => {
        if (!missedSearches || missedSearches.length === 0) return;

        const textList = missedSearches
            .map((item, idx) => `${idx + 1}. ${item.term} (${item.count} búsquedas)`)
            .join('\n');

        const message = `📋 *Demanda Solicitada en 90+5 Store (Sin Stock)*:\n${textList}`;
        navigator.clipboard.writeText(message);
        setCopied(true);
        toast.celebrate('¡Lista copiada al portapapeles!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-neutral-900/70 p-3.5 sm:p-5 md:p-6 backdrop-blur-xl shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col justify-between">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <SearchX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </span>
                        <div>
                            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                                Radar de Demanda (Sin Stock)
                            </h2>
                            <p className="text-[11px] sm:text-xs text-gray-400">
                                Búsquedas con 0 resultados (Equipos o jugadores buscados)
                            </p>
                        </div>
                    </div>

                    {missedSearches && missedSearches.length > 0 && (
                        <button
                            onClick={handleCopyList}
                            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 text-[11px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer"
                            title="Copiar lista para enviar a proveedor"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400">Copiado</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Copiar Lista</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Lista de Demandas */}
                {missedSearches && missedSearches.length > 0 ? (
                    <div className="space-y-1.5 sm:space-y-2 mt-2">
                        {missedSearches.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-rose-500/[0.04] border border-rose-500/15 hover:border-rose-500/35 transition-all group"
                            >
                                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                    <span className="w-4 sm:w-5 text-center text-xs font-bold text-rose-400/80 font-mono">
                                        #{idx + 1}
                                    </span>
                                    <span className="text-xs sm:text-sm font-semibold text-rose-100 truncate">
                                        &quot;{item.term}&quot;
                                    </span>
                                </div>
                                <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] sm:text-xs font-bold font-mono shrink-0">
                                    {item.count} {item.count === 1 ? 'búsqueda' : 'búsquedas'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 sm:p-8 text-center border border-dashed border-white/10 rounded-xl sm:rounded-2xl my-2">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mx-auto mb-2 opacity-80" />
                        <p className="text-xs text-gray-300 font-bold">¡Inventario 100% alineado con las búsquedas!</p>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
                            No se registran búsquedas sin stock en este período. Cuando un aficionado busque un club o jugador no disponible, aparecerá aquí automáticamente.
                        </p>
                    </div>
                )}
            </div>

            {/* Footer con micro-tip */}
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/5 flex items-center justify-between text-[10px] sm:text-[11px] text-gray-400">
                <span>Total de peticiones insatisfechas:</span>
                <span className="font-mono font-bold text-white">
                    {missedSearches?.reduce((acc, curr) => acc + curr.count, 0) || 0}
                </span>
            </div>
        </div>
    );
}

