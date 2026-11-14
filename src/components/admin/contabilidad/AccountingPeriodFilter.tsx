'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import { PresetKey } from './types';
import { STATUS_OPTIONS } from './accountingUtils';

interface AccountingPeriodFilterProps {
    preset: PresetKey;
    startDate: string;
    endDate: string;
    selectedStatuses: string[];
    showAdvancedFilters: boolean;
    onPresetChange: (preset: PresetKey) => void;
    onStartDateChange: (val: string) => void;
    onEndDateChange: (val: string) => void;
    onToggleStatus: (val: string) => void;
}

export default function AccountingPeriodFilter({
    preset,
    startDate,
    endDate,
    selectedStatuses,
    showAdvancedFilters,
    onPresetChange,
    onStartDateChange,
    onEndDateChange,
    onToggleStatus,
}: AccountingPeriodFilterProps) {
    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-5 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs sm:text-sm font-bold text-white">
                        Período de Evaluación
                    </span>
                </div>

                {/* BOTONERA SEGMENTADA APPLE */}
                <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] overflow-x-auto max-w-full">
                    {(
                        [
                            { key: 'today', label: 'Hoy' },
                            { key: '7d', label: '7 Días' },
                            { key: '30d', label: '30 Días' },
                            { key: 'month', label: 'Este Mes' },
                            { key: 'year', label: 'Año Actual' },
                            { key: 'custom', label: 'Personalizado' },
                        ] as const
                    ).map((tab) => {
                        const isActive = preset === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => onPresetChange(tab.key)}
                                className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                                    isActive
                                        ? 'bg-white text-black shadow-xs'
                                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* FILTROS AVANZADOS / PERSONALIZADOS */}
            {(preset === 'custom' || showAdvancedFilters) && (
                <div className="pt-3 border-t border-white/[0.06] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                                Desde
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => onStartDateChange(e.target.value)}
                                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-white/30 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                                Hasta
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => onEndDateChange(e.target.value)}
                                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-white/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* FILTRO DE ESTADOS */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                Estados a Incluir en la Contabilidad
                            </label>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                onClick={() => onToggleStatus('all')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
                                    selectedStatuses.includes('all')
                                        ? 'bg-white text-black shadow-xs'
                                        : 'bg-white/[0.04] text-neutral-400 border border-white/[0.06] hover:text-white'
                                }`}
                            >
                                Todos los estados
                            </button>
                            {STATUS_OPTIONS.map((opt) => {
                                const isSelected = selectedStatuses.includes(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => onToggleStatus(opt.value)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer active:scale-[0.98] ${
                                            isSelected
                                                ? 'bg-white/10 text-white border border-white/20 font-bold'
                                                : 'bg-white/[0.04] text-neutral-400 border border-white/[0.06] hover:text-white'
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                                        <span>{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

