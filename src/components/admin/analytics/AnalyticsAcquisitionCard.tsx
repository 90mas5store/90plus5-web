'use client';

import React from 'react';
import { Globe, Radio, Smartphone } from 'lucide-react';
import type {
    AnalyticsDeviceStat,
    AnalyticsMatchdayMetrics,
    AnalyticsTrafficSourceStat,
} from '@/lib/analytics/types';

interface AnalyticsAcquisitionCardProps {
    trafficSources: AnalyticsTrafficSourceStat[];
    deviceBreakdown: AnalyticsDeviceStat[];
    matchdayMetrics?: AnalyticsMatchdayMetrics;
}

export default function AnalyticsAcquisitionCard({
    trafficSources = [],
    deviceBreakdown = [],
    matchdayMetrics,
}: AnalyticsAcquisitionCardProps) {
    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent space-y-6">
            {/* Canales de Adquisición */}
            <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-4">
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                            <Globe className="w-4 h-4" />
                        </span>
                        <div>
                            <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                                Canales de Adquisición & Conversión
                            </h2>
                            <p className="text-xs text-neutral-400">
                                Atribución por sesión única (primer origen externo / UTM)
                            </p>
                        </div>
                    </div>
                </div>

                {trafficSources.length > 0 ? (
                    <div className="space-y-3">
                        {trafficSources.map((src) => (
                            <div key={src.source} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs gap-2">
                                    <span className="font-bold text-white truncate">{src.source}</span>
                                    <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                                        <span className="text-neutral-300">
                                            {src.sessions} ses. ({src.percentage}%)
                                        </span>
                                        {src.orders > 0 && (
                                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                                                {src.orders} ped. · {src.conversionRate}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                        style={{ width: `${Math.max(src.percentage, 4)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-neutral-500 text-center py-4">
                        Sin fuentes de tráfico registradas en este período.
                    </p>
                )}
            </div>

            {/* Dispositivos + Matchday */}
            <div className="pt-4 border-t border-white/[0.06] space-y-4">
                <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <Smartphone className="w-4 h-4" />
                    </span>
                    <div>
                        <h3 className="text-sm font-black text-white tracking-tight">
                            Dispositivos por Visitante Único
                        </h3>
                        <p className="text-xs text-neutral-400">
                            Distribución de pantallas y cierre de pedidos
                        </p>
                    </div>
                </div>

                {deviceBreakdown.length > 0 ? (
                    <div className="space-y-2.5">
                        {deviceBreakdown.map((dev) => (
                            <div key={dev.device} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-neutral-200">{dev.device}</span>
                                    <div className="flex items-center gap-2 font-mono text-[11px]">
                                        <span className="text-neutral-400">
                                            {dev.sessions} ({dev.percentage}%)
                                        </span>
                                        {dev.orders > 0 && (
                                            <span className="text-white font-bold">
                                                · {dev.conversionRate}% conv.
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div
                                        className="h-full bg-white/75 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.max(dev.percentage, 4)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-neutral-500 text-center py-3">
                        Sin datos de dispositivos aún.
                    </p>
                )}

                {matchdayMetrics && (
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                                <Radio className="w-3.5 h-3.5" />
                            </span>
                            <div>
                                <p className="text-xs font-extrabold text-white">Interacción Matchday En Vivo</p>
                                <p className="text-[11px] text-neutral-400">
                                    Clics en estadísticas de partido y camisetas en cancha
                                </p>
                            </div>
                        </div>
                        <div className="text-right font-mono shrink-0">
                            <span className="text-sm font-black text-white block">
                                {matchdayMetrics.totalClicks} clics
                            </span>
                            <span className="text-[10px] text-neutral-500">
                                {matchdayMetrics.uniqueUsers} aficionados
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
