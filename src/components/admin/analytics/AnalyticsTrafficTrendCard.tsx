'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, Clock, Eye, Loader2 } from 'lucide-react';
import type { AnalyticsHourlyStat, AnalyticsSummary } from '@/lib/analytics/types';

interface AnalyticsTrafficTrendCardProps {
    viewsTrend: AnalyticsSummary['viewsTrend'];
    hourlyData: AnalyticsHourlyStat[];
    loading: boolean;
}

export default function AnalyticsTrafficTrendCard({
    viewsTrend = [],
    hourlyData = [],
    loading,
}: AnalyticsTrafficTrendCardProps) {
    const [mode, setMode] = useState<'daily' | 'hourly'>('daily');

    const peakHour = useMemo(() => {
        if (!hourlyData || hourlyData.length === 0) return null;
        const sorted = [...hourlyData].sort((a, b) => b.views - a.views);
        return sorted[0]?.views > 0 ? sorted[0] : null;
    }, [hourlyData]);

    const maxHourlyViews = useMemo(() => {
        if (!hourlyData || hourlyData.length === 0) return 1;
        return Math.max(...hourlyData.map((h) => h.views), 1);
    }, [hourlyData]);

    const maxDailyViews = useMemo(() => {
        if (!viewsTrend || viewsTrend.length === 0) return 1;
        return Math.max(...viewsTrend.map((d) => d.views), 1);
    }, [viewsTrend]);

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            {/* Subheader homologado */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06] mb-4">
                <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        {mode === 'daily' ? <Calendar className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </span>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight">
                                {mode === 'daily' ? 'Evolución Diaria de Tráfico & Pedidos' : 'Mapa Horario de 24 Horas (UTC-6)'}
                            </h2>
                            {mode === 'hourly' && peakHour && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    Pico {peakHour.label} ({peakHour.views})
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-neutral-400">
                            {mode === 'daily'
                                ? 'Comparativa diaria de páginas vistas, visitantes únicos y órdenes cerradas'
                                : 'Concentración de visitas y compras a lo largo del día en hora de Honduras'}
                        </p>
                    </div>
                </div>

                <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setMode('daily')}
                        className={`cursor-pointer transition-all ${
                            mode === 'daily'
                                ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                        }`}
                    >
                        Por Día
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('hourly')}
                        className={`cursor-pointer transition-all ${
                            mode === 'hourly'
                                ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                        }`}
                    >
                        Mapa 24h
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-44 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                </div>
            ) : mode === 'daily' ? (
                viewsTrend.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-end gap-4 text-[11px] text-neutral-400">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Vistas
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-white/40 inline-block" /> Visitantes
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-white inline-block" /> Pedidos
                            </span>
                        </div>

                        <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 pt-8 pb-2 px-1 border-b border-white/[0.06] overflow-x-auto">
                            {viewsTrend.map((item, idx) => {
                                const hasViews = item.views > 0;
                                const hasVisitors = item.visitors > 0;
                                const ordersCount = item.orders ?? 0;
                                const heightPercent = hasViews ? Math.max(Math.round((item.views / maxDailyViews) * 100), 10) : 3;
                                const visitorHeightPercent = hasVisitors ? Math.max(Math.round((item.visitors / maxDailyViews) * 100), 7) : 3;

                                return (
                                    <div
                                        key={idx}
                                        className="flex-1 max-w-[48px] min-w-[24px] flex flex-col items-center gap-1.5 h-full justify-end group relative"
                                    >
                                        <div className="absolute -top-16 bg-[#0a0c10] border border-white/15 px-2.5 py-1.5 rounded-xl text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-2xl">
                                            <p className="font-bold text-white">{item.date}</p>
                                            <p className="text-primary font-mono">{item.views} vistas</p>
                                            <p className="text-neutral-300 font-mono">{item.visitors} visitantes</p>
                                            {ordersCount > 0 && (
                                                <p className="text-white font-mono font-bold">
                                                    {ordersCount} {ordersCount === 1 ? 'pedido' : 'pedidos'} (L {(item.revenue ?? 0).toLocaleString('es-HN')})
                                                </p>
                                            )}
                                        </div>

                                        {ordersCount > 0 && (
                                            <span className="px-1.5 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.15] text-[9px] font-mono font-bold text-white">
                                                {ordersCount}p
                                            </span>
                                        )}

                                        <div className="w-full flex items-end justify-center gap-0.5 h-full">
                                            <div
                                                className={`w-1/2 rounded-t-sm sm:rounded-t-md transition-all group-hover:brightness-125 ${
                                                    hasViews ? 'bg-primary' : 'bg-white/[0.04]'
                                                }`}
                                                style={{ height: `${heightPercent}%` }}
                                            />
                                            <div
                                                className={`w-1/2 rounded-t-sm sm:rounded-t-md transition-all group-hover:brightness-125 ${
                                                    hasVisitors ? 'bg-white/30' : 'bg-white/[0.04]'
                                                }`}
                                                style={{ height: `${visitorHeightPercent}%` }}
                                            />
                                        </div>

                                        <span className="text-[9px] sm:text-[10px] font-mono text-neutral-500 truncate w-full text-center">
                                            {item.date.slice(5)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="h-36 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.08] rounded-2xl">
                        <Eye className="w-6 h-6 text-neutral-600 mb-2" />
                        <p className="text-xs font-bold text-neutral-300">Sin actividad registrada en este período</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                            Las visitas y pedidos aparecerán aquí conforme naveguen los clientes.
                        </p>
                    </div>
                )
            ) : hourlyData.length === 24 ? (
                <div>
                    <div className="h-36 flex items-end justify-between gap-0.5 sm:gap-1 pt-6 px-1 border-b border-white/[0.06] relative overflow-x-auto">
                        {hourlyData.map((h) => {
                            const isPeak = peakHour && peakHour.hour === h.hour && h.views > 0;
                            const hasViews = h.views > 0;
                            const heightPercent = hasViews ? Math.max(Math.round((h.views / maxHourlyViews) * 100), 10) : 0;

                            return (
                                <div
                                    key={h.hour}
                                    className="flex-1 min-w-[14px] max-w-[36px] h-full flex items-end justify-center group relative cursor-pointer"
                                >
                                    <div className="absolute -top-14 bg-[#0a0c10] border border-white/15 px-2.5 py-1 rounded-xl text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-2xl">
                                        <p className="font-bold text-white">{h.label}</p>
                                        <p className="text-neutral-300 font-mono">{h.views} visitas</p>
                                        {h.orders > 0 && (
                                            <p className="text-primary font-mono font-bold">{h.orders} pedidos</p>
                                        )}
                                    </div>

                                    <div
                                        className={`w-full rounded-t-sm transition-all duration-300 group-hover:brightness-125 ${
                                            isPeak
                                                ? 'bg-primary'
                                                : h.orders > 0
                                                    ? 'bg-white/75'
                                                    : hasViews
                                                        ? 'bg-white/25'
                                                        : 'h-1 bg-white/[0.06]'
                                        }`}
                                        style={{ height: hasViews ? `${heightPercent}%` : '3px' }}
                                    />
                                </div>
                            );
                        })}
                    </div>

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
                                                isPeak ? 'text-primary font-bold' : 'text-neutral-400'
                                            }`}
                                        >
                                            {h.hour}h
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-neutral-700 leading-none select-none">·</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-3 pt-2.5 border-t border-white/[0.06] flex-wrap gap-2">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/30" /> Tráfico general
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80" /> Horas con pedidos
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Hora pico de visitas
                        </span>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
