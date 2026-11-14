'use client';

import React from 'react';
import {
    Activity,
    BarChart3,
    Clock,
    Globe,
    RefreshCw,
    ShoppingBag,
} from 'lucide-react';
import type { AnalyticsRange, AnalyticsSummary } from '@/lib/analytics/types';
import type { BestSellerItem, ShareStatItem } from '@/components/admin/reportes/types';
import type { AnalyticsSubView } from './useAnalyticsData';
import AnalyticsExportButton from './AnalyticsExportButton';

interface AnalyticsToolbarProps {
    embedded?: boolean;
    range: AnalyticsRange;
    onRangeChange: (range: AnalyticsRange) => void;
    activeView: AnalyticsSubView;
    onViewChange: (view: AnalyticsSubView) => void;
    loading: boolean;
    onRefresh: () => void;
    data: AnalyticsSummary | null;
    bestSellers: BestSellerItem[];
    kitShares: ShareStatItem[];
}

const RANGE_OPTIONS: { key: AnalyticsRange; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: '7d', label: '7 Días' },
    { key: '30d', label: '30 Días' },
    { key: 'all', label: 'Histórico' },
];

const VIEW_TABS: { id: AnalyticsSubView; label: string; shortLabel: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: 'Resumen & Embudo', shortLabel: 'Resumen', icon: BarChart3 },
    { id: 'catalog', label: 'Catálogo & Demanda', shortLabel: 'Catálogo', icon: ShoppingBag },
    { id: 'audience', label: 'Audiencia & Tráfico', shortLabel: 'Audiencia', icon: Globe },
];

export default function AnalyticsToolbar({
    embedded = false,
    range,
    onRangeChange,
    activeView,
    onViewChange,
    loading,
    onRefresh,
    data,
    bestSellers,
    kitShares,
}: AnalyticsToolbarProps) {
    const activeVisitors = data?.realtimeActiveVisitors ?? 0;

    return (
        <div className="space-y-4">
            {/* Encabezado completo solo cuando se visita /admin/analiticas directamente */}
            {!embedded && (
                <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                                    Inteligencia & Analíticas
                                </h1>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    {activeVisitors} en vivo
                                </span>
                                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold text-neutral-400">
                                    <Clock className="w-3 h-3" /> UTC-6
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                                Embudo de conversión, rendimiento de catálogo, tallas y adquisición de clientes en tiempo real.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Barra unificada de Sub-vistas, Rango de Tiempo y Exportación (JSON / CSV) */}
            <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Izquierda: Selector de Sub-vista + Estado en vivo cuando está embebido */}
                <div className="flex items-center justify-between lg:justify-start gap-2.5 flex-wrap">
                    <div
                        role="tablist"
                        aria-label="Vistas de analíticas"
                        className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] overflow-x-auto no-scrollbar max-w-full"
                    >
                        {VIEW_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeView === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => onViewChange(tab.id)}
                                    className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                                        isActive
                                            ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                            : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5 shrink-0" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.shortLabel}</span>
                                </button>
                            );
                        })}
                    </div>

                    {embedded && (
                        <div className="inline-flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                {activeVisitors} en vivo
                            </span>
                            <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-neutral-400">
                                UTC-6
                            </span>
                        </div>
                    )}
                </div>

                {/* Derecha: Filtro de Rango + Descarga JSON/CSV + Refresh */}
                <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                    <div
                        role="group"
                        aria-label="Rango de tiempo"
                        className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] overflow-x-auto"
                    >
                        {RANGE_OPTIONS.map((opt) => {
                            const isActive = range === opt.key;
                            return (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => onRangeChange(opt.key)}
                                    className={`whitespace-nowrap cursor-pointer transition-all ${
                                        isActive
                                            ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                            : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <AnalyticsExportButton
                            data={data}
                            range={range}
                            bestSellers={bestSellers}
                            kitShares={kitShares}
                        />

                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={loading}
                            aria-label="Actualizar datos de analíticas"
                            className="bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] rounded-xl p-2 text-xs transition-all cursor-pointer disabled:opacity-50"
                            title="Actualizar datos"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-white' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
