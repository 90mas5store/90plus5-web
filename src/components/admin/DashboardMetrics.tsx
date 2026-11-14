'use client';

import React from 'react';
import { ShoppingBag, DollarSign, TrendingUp, Sparkles } from 'lucide-react';

interface DashboardMetricsProps {
    todayOrders: number;
    todaySales: number;
    todayAvgTicket?: number;
}

export default function DashboardMetrics({
    todayOrders,
    todaySales,
    todayAvgTicket,
}: DashboardMetricsProps) {
    const avg = todayAvgTicket ?? (todayOrders > 0 ? todaySales / todayOrders : 0);

    const metrics = [
        {
            label: 'Pedidos Hoy',
            value: todayOrders.toString(),
            sub: todayOrders === 1 ? '1 orden recibida' : `${todayOrders} órdenes recibidas`,
            icon: ShoppingBag,
            highlight: todayOrders > 0,
        },
        {
            label: 'Ventas de Hoy',
            value: `L ${Math.round(todaySales).toLocaleString('es-HN')}`,
            sub: 'Facturación del día',
            icon: DollarSign,
            highlight: todaySales > 0,
        },
        {
            label: 'Ticket Promedio',
            value: `L ${Math.round(avg).toLocaleString('es-HN')}`,
            sub: 'Promedio por orden',
            icon: TrendingUp,
            highlight: false,
        },
    ];

    return (
        <section aria-label="Métricas del día">
            <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Pulso del Día (Hora Honduras)
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                {metrics.map((m) => {
                    const Icon = m.icon;
                    return (
                        <div
                            key={m.label}
                            className="p-3.5 sm:p-4 rounded-2xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/15 transition-all relative overflow-hidden group"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <span className="text-[11px] font-medium text-neutral-400 block">
                                        {m.label}
                                    </span>
                                    <span className="text-xl sm:text-2xl font-black text-white tracking-tight block mt-1">
                                        {m.value}
                                    </span>
                                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                                        {m.sub}
                                    </span>
                                </div>
                                <div className="p-2 rounded-xl bg-white/[0.04] text-neutral-300 group-hover:text-primary transition-colors shrink-0">
                                    <Icon className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
