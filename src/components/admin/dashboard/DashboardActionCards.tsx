'use client';

import React from 'react';
import Link from 'next/link';
import {
    ReceiptText,
    Factory,
    Coins,
    Truck,
    ArrowRight,
} from 'lucide-react';

interface DashboardActionCardsProps {
    pendingPaymentCount: number;
    depositPaidCount: number;
    readyDeliveryCount: number;
    inTransitCount: number;
}

export default function DashboardActionCards({
    pendingPaymentCount,
    depositPaidCount,
    readyDeliveryCount,
    inTransitCount,
}: DashboardActionCardsProps) {
    const cards = [
        {
            id: 'pending_payment',
            title: 'Por Verificar',
            count: pendingPaymentCount,
            subtitle: 'Transferencias recibidas',
            actionText: 'Revisar',
            href: '/admin/orders?status=pending_payment_50',
            icon: ReceiptText,
            dotColor: 'bg-rose-500',
            hasPending: pendingPaymentCount > 0,
        },
        {
            id: 'deposit_paid',
            title: 'Listas para Fábrica',
            count: depositPaidCount,
            subtitle: 'Anticipos confirmados',
            actionText: 'Ver lista',
            href: '/admin/orders?status=deposit_paid',
            icon: Factory,
            dotColor: 'bg-amber-400',
            hasPending: depositPaidCount > 0,
        },
        {
            id: 'ready_delivery',
            title: 'Por Cobrar 50%',
            count: readyDeliveryCount,
            subtitle: 'Saldo antes de entrega',
            actionText: 'Cobrar',
            href: '/admin/orders?status=ready_for_delivery',
            icon: Coins,
            dotColor: 'bg-purple-400',
            hasPending: readyDeliveryCount > 0,
        },
        {
            id: 'in_transit',
            title: 'En Tránsito',
            count: inTransitCount,
            subtitle: 'Viajando a Honduras',
            actionText: 'Rastrear',
            href: '/admin/orders?status=in_transit',
            icon: Truck,
            dotColor: 'bg-sky-400',
            hasPending: inTransitCount > 0,
        },
    ];

    return (
        <section aria-label="Urgencias operativas">
            <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Acciones Operativas
                </span>
                <span className="text-[11px] text-neutral-500 font-mono">
                    Flujo de pedidos
                </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                {cards.map((card) => {
                    const IconComponent = card.icon;
                    return (
                        <Link
                            key={card.id}
                            href={card.href}
                            className="relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all active:scale-[0.98] group overflow-hidden"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-1 mb-2">
                                    <div className="p-2 rounded-xl bg-white/[0.04] text-neutral-300 group-hover:text-white transition-colors shrink-0">
                                        <IconComponent className="w-4 h-4" />
                                    </div>
                                    {card.hasPending && (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-neutral-300 font-medium">
                                            <span className={`w-1.5 h-1.5 rounded-full ${card.dotColor}`} />
                                            Activo
                                        </span>
                                    )}
                                </div>

                                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                                    {card.count}
                                </div>
                                <h3 className="text-xs sm:text-sm font-bold text-neutral-200 truncate mt-1">
                                    {card.title}
                                </h3>
                                <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                                    {card.subtitle}
                                </p>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-neutral-400 group-hover:text-white">
                                <span>{card.actionText}</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
