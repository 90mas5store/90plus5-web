'use client';

import React, { useState } from 'react';
import { Globe, MapPin, Truck } from 'lucide-react';
import type {
    AnalyticsCityStat,
    AnalyticsCountryStat,
    AnalyticsShippingRegionStat,
} from '@/lib/analytics/types';
import { getCountryFlag } from '@/lib/analytics/geo';

interface AnalyticsGeoCardProps {
    shippingRegions?: AnalyticsShippingRegionStat[];
    countries: AnalyticsCountryStat[];
    cities: AnalyticsCityStat[];
    loading?: boolean;
}

export default function AnalyticsGeoCard({
    shippingRegions = [],
    countries = [],
    cities = [],
}: AnalyticsGeoCardProps) {
    const [tab, setTab] = useState<'shipping' | 'countries' | 'cities'>('shipping');

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06] mb-4">
                <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        {tab === 'shipping' ? (
                            <Truck className="w-4 h-4" />
                        ) : tab === 'countries' ? (
                            <Globe className="w-4 h-4" />
                        ) : (
                            <MapPin className="w-4 h-4" />
                        )}
                    </span>
                    <div>
                        <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                            {tab === 'shipping'
                                ? 'Departamentos de Compra (Pedidos Reales)'
                                : tab === 'countries'
                                    ? 'Países de Navegación (IP)'
                                    : 'Ciudades Detectadas (IP)'}
                        </h2>
                        <p className="text-xs text-neutral-400">
                            {tab === 'shipping'
                                ? 'Ubicación exacta declarada en los envíos de órdenes confirmadas'
                                : tab === 'countries'
                                    ? 'Visitantes únicos locales y desde la diáspora'
                                    : 'Nodos territoriales de conexión por visitante único'}
                        </p>
                    </div>
                </div>

                <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setTab('shipping')}
                        className={`cursor-pointer transition-all ${
                            tab === 'shipping'
                                ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                        }`}
                    >
                        Envíos ({shippingRegions.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('countries')}
                        className={`cursor-pointer transition-all ${
                            tab === 'countries'
                                ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                        }`}
                    >
                        Países ({countries.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('cities')}
                        className={`cursor-pointer transition-all ${
                            tab === 'cities'
                                ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                        }`}
                    >
                        Ciudades ({cities.length})
                    </button>
                </div>
            </div>

            {tab === 'shipping' ? (
                shippingRegions.length > 0 ? (
                    <div className="space-y-3">
                        {shippingRegions.map((reg) => (
                            <div key={reg.department} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs gap-2">
                                    <div className="min-w-0 truncate">
                                        <span className="font-bold text-white">{reg.department}</span>
                                        {reg.topMunicipality && (
                                            <span className="text-[11px] text-neutral-400 ml-1.5">
                                                · {reg.topMunicipality}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                                        <span className="text-white font-bold">
                                            {reg.orders} {reg.orders === 1 ? 'pedido' : 'pedidos'} ({reg.percentage}%)
                                        </span>
                                        <span className="text-neutral-400">
                                            L {reg.revenue.toLocaleString('es-HN')}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                        style={{ width: `${Math.max(reg.percentage, 4)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-neutral-500 text-center py-8">
                        Sin envíos registrados en este período.
                    </p>
                )
            ) : tab === 'countries' ? (
                countries.length > 0 ? (
                    <div className="space-y-3">
                        {countries.map((country) => (
                            <div key={country.code} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-white flex items-center gap-2">
                                        <span className="text-base leading-none">{country.flag}</span>
                                        <span>{country.name}</span>
                                        <span className="text-[10px] text-neutral-500 font-mono">({country.code})</span>
                                    </span>
                                    <span className="text-neutral-300 font-mono text-[11px]">
                                        {country.count} ({country.percentage}%)
                                    </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                        style={{ width: `${Math.max(country.percentage, 4)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-neutral-500 text-center py-8">
                        Sin datos geográficos de países aún.
                    </p>
                )
            ) : cities.length > 0 ? (
                <div className="space-y-2">
                    {cities.map((item, idx) => (
                        <div
                            key={`${item.city}-${idx}`}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] transition-all"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-base leading-none shrink-0">{getCountryFlag(item.country)}</span>
                                <span className="text-xs sm:text-sm font-semibold text-white truncate">
                                    {item.city}
                                </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] text-neutral-300 border border-white/[0.08] text-[11px] font-bold font-mono shrink-0">
                                {item.count} ({item.percentage}%)
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-neutral-500 text-center py-8">
                    Sin datos de ciudades registradas aún.
                </p>
            )}
        </div>
    );
}
