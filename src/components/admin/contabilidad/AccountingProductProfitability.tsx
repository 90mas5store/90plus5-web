'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ProductProfitItem } from './types';
import { fmt, fmtPct } from './accountingUtils';

interface AccountingProductProfitabilityProps {
    productEntries: ProductProfitItem[];
}

export default function AccountingProductProfitability({
    productEntries,
}: AccountingProductProfitabilityProps) {
    if (productEntries.length === 0) return null;

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            <div className="flex items-center gap-2 pb-3.5 border-b border-white/[0.06] mb-4">
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <TrendingUp className="w-4 h-4" />
                </span>
                <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-white">
                        Rentabilidad por Camiseta (Top 15)
                    </h2>
                    <p className="text-[11px] text-neutral-400">
                        Camisetas ordenadas por utilidad bruta generada en el período
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/20">
                <table className="w-full text-xs sm:text-sm min-w-[620px] border-collapse">
                    <thead>
                        <tr className="text-[10px] sm:text-xs uppercase font-bold text-neutral-400 bg-white/[0.02] border-b border-white/[0.06]">
                            <th className="text-left px-4 py-3">Camiseta</th>
                            <th className="text-right px-4 py-3">Uds.</th>
                            <th className="text-right px-4 py-3">Ingresos</th>
                            <th className="text-right px-4 py-3">Costo</th>
                            <th className="text-right px-4 py-3">Ganancia</th>
                            <th className="text-right px-4 py-3">Margen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {productEntries.map((p) => (
                            <tr key={p.name} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3 text-white font-medium text-xs">{p.name}</td>
                                <td className="px-4 py-3 text-right text-neutral-400 font-mono">{p.units}</td>
                                <td className="px-4 py-3 text-right text-emerald-400 font-mono font-medium">{fmt(p.revenue)}</td>
                                <td className="px-4 py-3 text-right text-rose-400 font-mono font-medium">{fmt(p.cost)}</td>
                                <td className={`px-4 py-3 text-right font-mono font-bold ${p.profit >= 0 ? 'text-white' : 'text-rose-400'}`}>
                                    {fmt(p.profit)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span
                                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                            p.margin >= 30
                                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                                : p.margin >= 15
                                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                                        }`}
                                    >
                                        {fmtPct(p.margin)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

