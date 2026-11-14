'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import type { AnalyticsSummary } from '@/lib/analytics/types';

interface AnalyticsKpiGridProps {
    data: AnalyticsSummary | null;
    loading: boolean;
}

function DeltaBadge({ value }: { value: number | null | undefined }) {
    if (value === null || value === undefined) return null;
    const isPositive = value > 0;
    const isNeutral = value === 0;

    if (isNeutral) {
        return (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/[0.04] text-neutral-400 border border-white/[0.08] text-[10px] font-mono font-bold">
                0%
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                isPositive
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-white/[0.05] text-neutral-400 border-white/[0.08]'
            }`}
        >
            {isPositive ? (
                <TrendingUp className="w-2.5 h-2.5" />
            ) : (
                <TrendingDown className="w-2.5 h-2.5" />
            )}
            {isPositive ? `+${value}%` : `${value}%`}
        </span>
    );
}

export default function AnalyticsKpiGrid({ data, loading }: AnalyticsKpiGridProps) {
    const uniqueVisitors = data?.uniqueVisitors ?? 0;
    const totalPageViews = data?.totalPageViews ?? 0;
    const pagesPerVisit = uniqueVisitors > 0 ? (totalPageViews / uniqueVisitors).toFixed(1) : '0.0';

    const conversionRate = data?.conversionRate ?? 0;
    const cartRate = data?.cartRate ?? 0;
    const checkoutAbandonment = data?.checkoutAbandonmentRate ?? 0;

    const totalOrders = data?.orderMetrics.totalOrders ?? 0;
    const aov = data?.orderMetrics.averageOrderValue ?? 0;
    const rpv = data?.orderMetrics.revenuePerVisitor ?? 0;

    const pixelpayCount = data?.orderMetrics.pixelpayOrdersCount ?? 0;
    const pixelpayPct = totalOrders > 0 ? Math.round((pixelpayCount / totalOrders) * 100) : 0;
    const depositPct = data?.orderMetrics.depositPercentage ?? 0;
    const discountRate = data?.orderMetrics.discountUsageRate ?? 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Visitantes Únicos */}
            <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between gap-2">
                    <span className="truncate">Visitantes Únicos</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <DeltaBadge value={data?.deltas?.uniqueVisitorsPct} />
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-2">
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
                    ) : (
                        uniqueVisitors.toLocaleString('es-HN')
                    )}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 truncate">
                    {totalPageViews.toLocaleString('es-HN')} vistas · {pagesPerVisit} págs/sesión
                </p>
            </div>

            {/* 2. Conversión Global */}
            <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between gap-2">
                    <span className="truncate">Conversión Global</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <DeltaBadge value={data?.deltas?.conversionRatePct} />
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-2">
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
                    ) : (
                        `${conversionRate}%`
                    )}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 truncate">
                    {cartRate}% al carrito · {checkoutAbandonment}% fuga pago
                </p>
            </div>

            {/* 3. Pedidos & Ticket Promedio */}
            <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between gap-2">
                    <span className="truncate">Pedidos & Ticket</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <DeltaBadge value={data?.deltas?.totalOrdersPct} />
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    </div>
                </div>
                <div className="flex items-baseline justify-between gap-2 mt-2">
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
                        ) : (
                            totalOrders.toLocaleString('es-HN')
                        )}
                    </div>
                    <span className="text-xs font-mono font-bold text-neutral-300 truncate">
                        AOV L {aov.toLocaleString('es-HN')}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-[11px] text-neutral-500 truncate">
                        L {rpv.toLocaleString('es-HN')} ingreso/visita
                    </span>
                    <Link
                        href="/admin/contabilidad"
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-neutral-300 hover:text-white transition-colors shrink-0"
                    >
                        Contabilidad
                        <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* 4. Preferencia de Pago & Cupones */}
            <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between gap-2">
                    <span className="truncate">Cobro & Promociones</span>
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                </div>
                <div className="flex items-baseline justify-between gap-2 mt-2">
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
                        ) : (
                            `${pixelpayPct}%`
                        )}
                    </div>
                    <span className="text-xs font-semibold text-neutral-400 truncate">
                        Tarjeta PixelPay
                    </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 truncate">
                    {depositPct}% anticipo 50% · {discountRate}% usó cupón
                </p>
            </div>
        </div>
    );
}
