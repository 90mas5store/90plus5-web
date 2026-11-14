'use client';

import React from 'react';
import { fmt, fmtPct } from './accountingUtils';
import { AccountingTotals } from './types';

interface AccountingKpiCardsProps {
    totals: AccountingTotals;
    overallMargin: number;
    ordersCount: number;
    loading: boolean;
}

function KPICard({
    label,
    value,
    sub,
    indicatorColor = 'bg-emerald-400',
}: {
    label: string;
    value: string;
    sub: string;
    indicatorColor?: string;
}) {
    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 truncate pr-2">
                    {label}
                </span>
                <span className={`w-2 h-2 rounded-full ${indicatorColor} shrink-0`} />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-2">
                {value}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 truncate">{sub}</div>
        </div>
    );
}

export default function AccountingKpiCards({
    totals,
    overallMargin,
    ordersCount,
    loading,
}: AccountingKpiCardsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
            <KPICard
                label="Ingresos Netos"
                value={loading ? '...' : fmt(totals.revenue)}
                sub={`${ordersCount} pedidos en el período`}
                indicatorColor="bg-emerald-400"
            />
            <KPICard
                label="Descuentos Otorgados"
                value={loading ? '...' : fmt(totals.discountAmount)}
                sub="Promociones y cupones"
                indicatorColor="bg-amber-400"
            />
            <KPICard
                label="Costos Directos"
                value={loading ? '...' : fmt(totals.totalCost)}
                sub="COGS camisetas + logística"
                indicatorColor="bg-rose-400"
            />
            <KPICard
                label="Ganancia Bruta"
                value={loading ? '...' : fmt(totals.grossProfit)}
                sub={`Margen: ${loading ? '...' : fmtPct(overallMargin)}`}
                indicatorColor={totals.grossProfit >= 0 ? 'bg-emerald-400' : 'bg-rose-500'}
            />
        </div>
    );
}

