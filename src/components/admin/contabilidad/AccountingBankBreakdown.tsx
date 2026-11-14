'use client';

import React from 'react';
import { CreditCard, Building2 } from 'lucide-react';
import { fmt } from './accountingUtils';

interface AccountingBankBreakdownProps {
    paymentEntries: [string, { amount: number; count: number }][];
    totalVerified: number;
    totalRevenue: number;
}

export default function AccountingBankBreakdown({
    paymentEntries,
    totalVerified,
    totalRevenue,
}: AccountingBankBreakdownProps) {
    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            <div className="flex items-center gap-2 pb-3.5 border-b border-white/[0.06] mb-4">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CreditCard className="w-4 h-4" />
                </span>
                <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-white">
                        Cobros Verificados por Banco
                    </h2>
                    <p className="text-[11px] text-neutral-400">
                        Distribución real de fondos ingresados a tus cuentas bancarias
                    </p>
                </div>
            </div>

            {paymentEntries.length === 0 ? (
                <p className="text-xs text-neutral-500 italic py-8 text-center">
                    Sin pagos verificados registrados en este período.
                </p>
            ) : (
                <div className="space-y-3.5">
                    {paymentEntries.map(([key, val]) => {
                        const barWidth = totalVerified > 0 ? (val.amount / totalVerified) * 100 : 0;
                        return (
                            <div key={key} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                        <span className="text-white font-semibold truncate">{key}</span>
                                        <span className="text-[10px] text-neutral-400 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded font-mono">
                                            {val.count} pago{val.count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <span className="text-white font-mono font-bold ml-2 shrink-0">
                                        {fmt(val.amount)}
                                    </span>
                                </div>
                                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}

                    <div className="pt-3.5 border-t border-white/[0.06] space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
                                Total Verificado en Cuentas
                            </span>
                            <span className="text-white font-black font-mono text-sm">
                                {fmt(totalVerified)}
                            </span>
                        </div>
                        {totalRevenue - totalVerified > 1 && (
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                                    Pendiente de Cobro (2do Pago)
                                </span>
                                <span className="font-black text-amber-400 font-mono text-sm">
                                    {fmt(totalRevenue - totalVerified)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

