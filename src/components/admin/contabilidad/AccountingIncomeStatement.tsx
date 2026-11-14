'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { AccountingTotals } from './types';
import { fmt, fmtPct } from './accountingUtils';

interface AccountingIncomeStatementProps {
    totals: AccountingTotals;
    overallMargin: number;
}

function ResultRow({
    label,
    value,
    negative,
    colorClass,
    bold,
}: {
    label: string;
    value: number;
    negative?: boolean;
    colorClass: string;
    bold?: boolean;
}) {
    const display = negative ? `— ${fmt(value)}` : fmt(value);
    return (
        <div className={`flex items-center justify-between ${bold ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
            <span className={bold ? 'font-bold text-white' : 'text-neutral-400'}>{label}</span>
            <span className={`font-mono ${bold ? 'font-black' : 'font-semibold'} ${colorClass}`}>{display}</span>
        </div>
    );
}

export default function AccountingIncomeStatement({
    totals,
    overallMargin,
}: AccountingIncomeStatementProps) {
    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            <div className="flex items-center gap-2 pb-3.5 border-b border-white/[0.06] mb-4">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Package className="w-4 h-4" />
                </span>
                <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-white">
                        Estado de Resultados
                    </h2>
                    <p className="text-[11px] text-neutral-400">
                        Desglose de ingresos vs costos operativos directos
                    </p>
                </div>
            </div>

            <div className="space-y-2.5">
                <ResultRow label="Ingresos brutos por productos" value={totals.productRevenue} colorClass="text-emerald-400" />
                {totals.discountAmount > 0 && (
                    <ResultRow label="— Descuentos y cupones aplicados" value={totals.discountAmount} negative colorClass="text-amber-400" />
                )}
                <ResultRow label="Ingresos cobrados por envíos" value={totals.shippingRevenue} colorClass="text-emerald-300" />

                <div className="border-t border-white/[0.06] pt-2.5">
                    <ResultRow label="Total Ingresos Netos" value={totals.revenue} colorClass="text-white" bold />
                </div>

                <div className="pt-2 space-y-2">
                    <ResultRow label="— Costo de camisetas (COGS)" value={totals.productCost} negative colorClass="text-rose-400" />
                    <ResultRow label="— Costo logístico de envíos" value={totals.shippingCost} negative colorClass="text-rose-300" />
                </div>

                <div className="border-t border-white/[0.06] pt-2.5">
                    <ResultRow label="Total Costos Directos" value={totals.totalCost} negative colorClass="text-rose-400" bold />
                </div>

                <div className="border-t-2 border-white/[0.12] pt-4 mt-3">
                    <div className="flex items-center justify-between">
                        <span className="font-black text-white text-base sm:text-lg">Ganancia Bruta</span>
                        <span className={`font-black text-lg sm:text-xl font-mono ${totals.grossProfit >= 0 ? 'text-white' : 'text-rose-400'}`}>
                            {fmt(totals.grossProfit)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-neutral-400">Margen bruto sobre ventas</span>
                        <span className={`text-xs sm:text-sm font-bold font-mono ${overallMargin >= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {fmtPct(overallMargin)}
                        </span>
                    </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 mt-4 text-[11px] text-neutral-400 space-y-1">
                    <p>• Costo logístico estimado: L 120 por pedido con envío.</p>
                    <p>• Los montos reflejan órdenes completadas o en curso dentro del período activo.</p>
                </div>
            </div>
        </div>
    );
}

