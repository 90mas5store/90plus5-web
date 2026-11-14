'use client';

import React from 'react';
import { DollarSign, Calendar, Download, RefreshCw } from 'lucide-react';
import { formatPeriodDisplay } from './accountingUtils';

interface AccountingHeaderProps {
    startDate: string;
    endDate: string;
    hasData: boolean;
    loading: boolean;
    onExport: () => void;
    onRefresh: () => void;
}

export default function AccountingHeader({
    startDate,
    endDate,
    hasData,
    loading,
    onExport,
    onRefresh,
}: AccountingHeaderProps) {
    return (
        <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <DollarSign className="w-5 h-5" />
                </span>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                            Contabilidad & Finanzas
                        </h1>
                        {/* INDICADOR PERMANENTE DEL PERÍODO EVALUADO */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-neutral-300 font-mono">
                            <Calendar className="w-3 h-3 text-primary" />
                            {formatPeriodDisplay(startDate, endDate)}
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                        Estado de resultados en tiempo real · Descuentos · Costos directos · Márgenes y pagos por banco.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                {hasData && (
                    <button
                        type="button"
                        onClick={onExport}
                        className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Exportar CSV</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] transition-all cursor-pointer disabled:opacity-50"
                    title="Actualizar contabilidad"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
                </button>
            </div>
        </div>
    );
}

