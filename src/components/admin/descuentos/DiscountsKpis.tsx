'use client';

import React from 'react';

interface DiscountsKpisProps {
    activeCount: number;
    totalCodes: number;
    totalRedemptions: number;
    totalSaved: number;
    avgPct: number;
}

export default function DiscountsKpis({
    activeCount,
    totalCodes,
    totalRedemptions,
    totalSaved,
    avgPct,
}: DiscountsKpisProps) {
    const cards = [
        {
            label: 'Cupones Activos',
            dotColor: 'bg-emerald-400',
            value: `${activeCount}`,
            sub: `De ${totalCodes} registrados`,
        },
        {
            label: 'Canjes Totales',
            dotColor: 'bg-blue-400',
            value: `${totalRedemptions}`,
            sub: 'Aplicados en checkout',
        },
        {
            label: 'Ahorro Otorgado',
            dotColor: 'bg-amber-400',
            value: `L ${totalSaved.toLocaleString('es-HN', { maximumFractionDigits: 0 })}`,
            sub: 'Descuento acumulado',
        },
        {
            label: 'Tasa Promedio',
            dotColor: 'bg-purple-400',
            value: `${avgPct.toFixed(1)}%`,
            sub: 'Porcentaje medio activo',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
                >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                        <span>{card.label}</span>
                        <span className={`w-2 h-2 rounded-full ${card.dotColor}`} />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-2">
                        {card.value}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 truncate">{card.sub}</p>
                </div>
            ))}
        </div>
    );
}

