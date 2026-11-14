'use client';

import React, { useMemo } from 'react';
import { Clock, Zap } from 'lucide-react';
import { AnalyticsHourlyStat } from '@/lib/analytics/types';

interface AnalyticsHourlyHeatmapProps {
    hourlyData?: AnalyticsHourlyStat[];
    loading?: boolean;
}

export default function AnalyticsHourlyHeatmap({ hourlyData, loading }: AnalyticsHourlyHeatmapProps) {
    const peakHour = useMemo(() => {
        if (!hourlyData || hourlyData.length === 0) return null;
        const sorted = [...hourlyData].sort((a, b) => b.views - a.views);
        return sorted[0]?.views > 0 ? sorted[0] : null;
    }, [hourlyData]);

    const maxViews = useMemo(() => {
        if (!hourlyData) return 1;
        return Math.max(...hourlyData.map((h) => h.views), 1);
    }, [hourlyData]);

    return (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-neutral-900/70 p-3.5 sm:p-5 md:p-6 backdrop-blur-xl shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </span>
                        <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-white tracking-tight">
                            Mapa Horario de 24 Horas
                        </h2>
                    </div>
                    <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                        Picos de tráfico y pedidos en hora de Honduras (UTC-6)
                    </p>
                </div>

                {peakHour && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] sm:text-xs font-bold text-amber-300 self-start sm:self-auto">
                        <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" />
                        <span>Pico: {peakHour.label} ({peakHour.views} visitas)</span>
                    </div>
                )}
            </div>

            {/* Gráfica de 24 Barras Horarias */}
            {hourlyData && hourlyData.length === 24 ? (
                <div>
                    {/* Área Gráfica: Todas las columnas ancladas al mismo nivel base (items-end) */}
                    <div className="h-40 sm:h-44 flex items-end justify-between gap-0.5 sm:gap-1 pt-14 px-1 border-b border-white/10 relative">
                        {hourlyData.map((h) => {
                            const isPeak = peakHour && peakHour.hour === h.hour && h.views > 0;
                            const hasViews = h.views > 0;
                            const heightPercent = hasViews ? Math.max(Math.round((h.views / maxViews) * 100), 10) : 0;
                            const tooltipAlignClass =
                                h.hour <= 2
                                    ? 'left-0'
                                    : h.hour >= 21
                                        ? 'right-0'
                                        : 'left-1/2 -translate-x-1/2';

                            return (
                                <div
                                    key={h.hour}
                                    className="flex-1 min-w-0 max-w-[36px] h-full flex items-end justify-center group relative cursor-pointer"
                                >
                                    {/* Tooltip Hover estilo Apple Glass */}
                                    <div
                                        className={`absolute bottom-full mb-2 ${tooltipAlignClass} bg-[#0d1017]/95 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl text-[11px] leading-snug text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-[0_10px_30px_rgba(0,0,0,0.85)]`}
                                    >
                                        <p className="font-extrabold text-white mb-0.5">{h.label}</p>
                                        <p className="text-amber-400 font-mono">{h.views} visitas</p>
                                        {h.orders > 0 && (
                                            <p className="text-emerald-400 font-mono mt-0.5">{h.orders} compras</p>
                                        )}
                                    </div>

                                    {/* Barra: Nace exactamente del suelo común */}
                                    <div
                                        className={`w-full rounded-t-sm transition-all duration-300 group-hover:brightness-125 ${
                                            isPeak
                                                ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                                                : hasViews
                                                ? 'bg-gradient-to-t from-white/20 to-white/70 group-hover:from-white/40 group-hover:to-white'
                                                : 'h-1 bg-white/10'
                                        }`}
                                        style={{ height: hasViews ? `${heightPercent}%` : '3px' }}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Fila Fija de Etiquetas Horarias: Independiente de la altura de las barras */}
                    <div className="flex justify-between gap-1 px-1 pt-2">
                        {hourlyData.map((h) => {
                            const isMajorTick = h.hour % 3 === 0;
                            const isPeak = peakHour && peakHour.hour === h.hour && h.views > 0;

                            return (
                                <div
                                    key={h.hour}
                                    className="flex-1 min-w-[14px] max-w-[36px] h-4 flex items-center justify-center text-center"
                                >
                                    {isMajorTick ? (
                                        <span
                                            className={`text-[10px] font-mono leading-none ${
                                                isPeak ? 'text-amber-300 font-bold' : 'text-gray-400 font-medium'
                                            }`}
                                        >
                                            {h.hour}h
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-gray-700 leading-none select-none">
                                            ·
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Franjas del Día */}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-4 pt-2 border-t border-white/5">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60" /> Madrugada (00h - 06h)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" /> Mediodía (12h - 15h)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" /> Noche Pico (18h - 23h)
                        </span>
                    </div>
                </div>
            ) : (
                <div className="p-8 text-center text-xs text-gray-500 border border-dashed border-white/10 rounded-2xl">
                    Cargando distribución horaria...
                </div>
            )}
        </div>
    );
}
