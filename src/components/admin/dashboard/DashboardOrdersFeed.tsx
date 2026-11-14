'use client';

import React from 'react';
import Link from 'next/link';
import {
    ChevronRight,
    MessageCircle,
    User,
    ArrowRight,
    Package,
} from 'lucide-react';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import { formatDate, HONDURAS_TIMEZONE } from '@/lib/utils';

export interface DashboardOrder {
    id: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    status: string;
    total_amount: number;
    created_at: string;
}

interface DashboardOrdersFeedProps {
    orders: DashboardOrder[];
}

export default function DashboardOrdersFeed({ orders }: DashboardOrdersFeedProps) {
    const displayOrders = orders.slice(0, 6);

    const getWhatsAppUrl = (phone?: string, name?: string, id?: string, status?: string) => {
        if (!phone) return null;
        const cleanPhone = phone.replace(/\D/g, '');
        const fullPhone = cleanPhone.startsWith('504') ? cleanPhone : `504${cleanPhone}`;
        const ref = id ? id.slice(0, 8).toUpperCase() : '';

        let msg = `Hola ${name || ''}! Te saludamos de 90+5 Store sobre tu orden #${ref}.`;
        if (status === 'pending_payment_50') {
            msg = `Hola ${name || ''}! Te saludamos de 90+5 Store sobre tu orden #${ref}. Nos gustaría confirmar si ya realizaste tu comprobante de anticipo del 50%.`;
        } else if (status === 'deposit_paid' || status === 'payment_verified') {
            msg = `Hola ${name || ''}! Tu anticipo para la orden #${ref} está confirmado. Ya estamos gestionando tu pedido con el proveedor. ¡Te avisamos en cuanto llegue a Honduras!`;
        } else if (status === 'ready_for_delivery' || status === 'pending_second_payment') {
            msg = `¡Buenas noticias ${name || ''}! Tu camiseta de la orden #${ref} ya está lista en Honduras. Para proceder con el despacho a tu dirección, puedes realizar el 50% restante.`;
        }

        return `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
    };

    return (
        <section aria-label="Bandeja de pedidos recientes" className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-neutral-400" />
                    <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                        Bandeja de Entrada Reciente
                    </h2>
                </div>

                <Link
                    href="/admin/orders"
                    className="text-xs font-semibold text-primary hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                    <span>Ver todos ({orders.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {displayOrders.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#0a0c10]/60 border border-white/[0.08] text-neutral-500 text-xs">
                    No hay pedidos recientes registrados hoy.
                </div>
            ) : (
                <div className="space-y-2">
                    {displayOrders.map((order) => {
                        const ref = order.id.slice(0, 8).toUpperCase();
                        const waUrl = getWhatsAppUrl(order.customer_phone, order.customer_name, order.id, order.status);

                        return (
                            <div
                                key={order.id}
                                className="p-3 sm:p-3.5 rounded-2xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center font-mono text-[11px] font-bold text-neutral-300 shrink-0">
                                        #{ref.slice(0, 4)}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs sm:text-sm font-bold text-white truncate">
                                                {order.customer_name}
                                            </span>
                                            <OrderStatusBadge status={order.status} />
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-0.5">
                                            <span className="font-mono">#{ref}</span>
                                            <span suppressHydrationWarning>
                                                {formatDate(order.created_at, false, HONDURAS_TIMEZONE)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                                    <span className="text-xs sm:text-sm font-black font-mono text-white">
                                        L {order.total_amount.toLocaleString('es-HN')}
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        {waUrl && (
                                            <a
                                                href={waUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1 border border-emerald-500/20 active:scale-[0.98] transition-all"
                                                title="Contactar al cliente por WhatsApp"
                                            >
                                                <MessageCircle className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">WhatsApp</span>
                                            </a>
                                        )}

                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                            title="Ver detalle del pedido"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
