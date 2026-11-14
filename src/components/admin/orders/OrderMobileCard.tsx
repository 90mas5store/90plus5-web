'use client';

import React from 'react';
import Link from 'next/link';
import {
    MessageCircle,
    ChevronRight,
    MapPin,
    User,
    Calendar,
} from 'lucide-react';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import { formatDate, HONDURAS_TIMEZONE } from '@/lib/utils';

export interface OrderMobileData {
    id: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    shipping_municipality?: string;
    shipping_department?: string;
    status: string;
    total_amount: number;
    created_at: string;
}

interface OrderMobileCardProps {
    order: OrderMobileData;
}

export default function OrderMobileCard({ order }: OrderMobileCardProps) {
    const cleanPhone = order.customer_phone?.replace(/\D/g, '') || '';
    const fullPhone = cleanPhone.startsWith('504') ? cleanPhone : `504${cleanPhone}`;
    const ref = order.id.slice(0, 8).toUpperCase();

    let whatsappMsg = `Hola ${order.customer_name || ''}! Te saludamos de 90+5 Store sobre tu orden #${ref}.`;
    if (order.status === 'pending_payment_50') {
        whatsappMsg = `Hola ${order.customer_name || ''}! Te saludamos de 90+5 Store sobre tu orden #${ref}. Nos gustaría confirmar si ya realizaste tu comprobante de anticipo del 50%.`;
    } else if (order.status === 'deposit_paid' || order.status === 'payment_verified') {
        whatsappMsg = `Hola ${order.customer_name || ''}! Tu anticipo para la orden #${ref} está confirmado. Ya estamos gestionando tu pedido con el proveedor. ¡Te avisamos en cuanto llegue a Honduras!`;
    } else if (order.status === 'ready_for_delivery' || order.status === 'pending_second_payment') {
        whatsappMsg = `¡Buenas noticias ${order.customer_name || ''}! Tu camiseta de la orden #${ref} ya está lista en Honduras. Para proceder con el despacho a tu dirección, puedes realizar el 50% restante.`;
    }

    const whatsappUrl = cleanPhone ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(whatsappMsg)}` : null;

    const locationText = [order.shipping_municipality, order.shipping_department]
        .filter(Boolean)
        .join(', ');

    return (
        <div className="p-3.5 hover:bg-white/[0.02] active:bg-white/[0.04] transition-all space-y-2 border-b border-white/5">
            {/* Fila 1: ID, Estado y Fecha */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-white text-xs">
                        #{ref}
                    </span>
                    <OrderStatusBadge status={order.status} />
                </div>
                <span className="text-[10px] text-gray-500 font-mono shrink-0" suppressHydrationWarning>
                    {formatDate(order.created_at, false, HONDURAS_TIMEZONE)}
                </span>
            </div>

            {/* Fila 2: Cliente y Ubicación */}
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{order.customer_name}</span>
                    </div>
                    {locationText && (
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                            <span className="truncate">{locationText}</span>
                        </div>
                    )}
                </div>

                <div className="text-right shrink-0">
                    <span className="text-sm font-black text-emerald-400 font-mono block">
                        L {order.total_amount?.toLocaleString('es-HN') ?? 0}
                    </span>
                </div>
            </div>

            {/* Fila 3: Acciones Táctiles para Teléfono */}
            <div className="flex items-center gap-2 pt-1">
                {whatsappUrl && (
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 active:scale-[0.98] text-xs font-bold transition-all"
                        title="Contactar al aficionado por WhatsApp"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                    </a>
                )}

                <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.08] text-neutral-300 hover:text-white active:scale-[0.98] text-xs font-bold transition-all"
                >
                    <span>Ver Orden</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}

