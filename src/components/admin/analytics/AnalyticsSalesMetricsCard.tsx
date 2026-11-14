'use client';

import React from 'react';
import { DollarSign, CreditCard, Banknote, PieChart, ShieldCheck } from 'lucide-react';
import { AnalyticsOrderMetrics } from '@/lib/analytics/types';

interface AnalyticsSalesMetricsCardProps {
    metrics?: AnalyticsOrderMetrics;
    loading?: boolean;
}

export default function AnalyticsSalesMetricsCard({ metrics, loading }: AnalyticsSalesMetricsCardProps) {
    if (!metrics) return null;

    const totalOrders = metrics.totalOrders || 0;
    const pixelpayPercent = totalOrders > 0 ? Math.round((metrics.pixelpayOrdersCount / totalOrders) * 100) : 0;
    const transferPercent = totalOrders > 0 ? Math.round((metrics.transferOrdersCount / totalOrders) * 100) : 0;

    return (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-neutral-900/70 p-3.5 sm:p-5 md:p-6 backdrop-blur-xl shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-6">
                <div className="flex items-center gap-2">
                    <span className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                    <div>
                        <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-white tracking-tight">
                            Métricas Financieras & Métodos de Pago
                        </h2>
                        <p className="text-[11px] sm:text-xs text-gray-400">
                            Ticket promedio, modalidades de anticipo y canales de cobro
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid de 4 Bloques Financieros */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-5">
                {/* Facturación Total en el período */}
                <div className="p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5 sm:mb-1 truncate">
                        Facturación Total
                    </span>
                    <div className="text-base sm:text-xl md:text-2xl font-black text-emerald-400 font-mono truncate">
                        L. {metrics.totalRevenue.toLocaleString()}
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 sm:mt-1 block truncate">
                        {totalOrders} {totalOrders === 1 ? 'pedido' : 'pedidos'}
                    </span>
                </div>

                {/* Ticket Promedio (AOV) */}
                <div className="p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5 sm:mb-1 truncate">
                        Ticket Promedio
                    </span>
                    <div className="text-base sm:text-xl md:text-2xl font-black text-white font-mono truncate">
                        L. {metrics.averageOrderValue.toLocaleString()}
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 sm:mt-1 block truncate">Por aficionado</span>
                </div>

                {/* Modalidad de Anticipo (50%) */}
                <div className="p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5 sm:mb-1 truncate">
                        Anticipo (50%)
                    </span>
                    <div className="text-base sm:text-xl md:text-2xl font-black text-amber-400 font-mono">
                        {metrics.depositPercentage}%
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 sm:mt-1 block truncate">
                        Abono inicial 50%
                    </span>
                </div>

                {/* Tarjeta vs Transferencia */}
                <div className="p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5 sm:mb-1 truncate">
                        Tarjeta PixelPay
                    </span>
                    <div className="text-base sm:text-xl md:text-2xl font-black text-blue-400 font-mono">
                        {pixelpayPercent}%
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 sm:mt-1 block truncate">
                        {transferPercent}% transferencia
                    </span>
                </div>
            </div>

            {/* Barra Comparativa de Canales de Cobro */}
            <div className="p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <CreditCard className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-400" />
                        <span className="text-gray-300 font-bold truncate">PixelPay ({metrics.pixelpayOrdersCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Banknote className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-400" />
                        <span className="text-gray-300 font-bold truncate">Transferencia ({metrics.transferOrdersCount})</span>
                    </div>
                </div>
                <div className="w-full h-1.5 sm:h-2 rounded-full bg-white/10 overflow-hidden flex">
                    <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${totalOrders > 0 ? pixelpayPercent : 50}%` }}
                        title={`PixelPay: ${pixelpayPercent}%`}
                    />
                    <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${totalOrders > 0 ? transferPercent : 50}%` }}
                        title={`Transferencia: ${transferPercent}%`}
                    />
                </div>
            </div>
        </div>
    );
}

