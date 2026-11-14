import React from 'react';

interface OrderStatusBadgeProps {
    status: string;
    className?: string;
}

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending_payment_50': return 'bg-white/[0.05] text-neutral-300 border-white/10';
        case 'deposit_paid':
        case 'payment_verified': return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
        case 'processing': return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
        case 'in_transit':
        case 'shipped_to_hn':
        case 'in_customs': return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
        case 'ready_for_delivery': return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
        case 'pending_second_payment': return 'bg-orange-500/10 text-orange-300 border-orange-500/20';
        case 'shipped_to_costumer': return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
        case 'completed':
        case 'paid_full': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
        case 'Cancelled':
        case 'cancelled': return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
        default: return 'bg-white/[0.05] text-neutral-400 border-white/10';
    }
};

export const getStatusDotColor = (status: string) => {
    switch (status) {
        case 'pending_payment_50': return 'bg-neutral-400';
        case 'deposit_paid':
        case 'payment_verified': return 'bg-cyan-400';
        case 'processing': return 'bg-amber-400';
        case 'in_transit':
        case 'shipped_to_hn':
        case 'in_customs': return 'bg-sky-400';
        case 'ready_for_delivery': return 'bg-purple-400';
        case 'pending_second_payment': return 'bg-orange-400';
        case 'shipped_to_costumer': return 'bg-indigo-400';
        case 'completed':
        case 'paid_full': return 'bg-emerald-400';
        case 'Cancelled':
        case 'cancelled': return 'bg-rose-400';
        default: return 'bg-neutral-400';
    }
};

export const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        'pending_payment_50': 'Por verificar',
        'deposit_paid': 'Anticipo confirmado',
        'payment_verified': 'Anticipo confirmado',
        'processing': 'En proveedor',
        'in_transit': 'En tránsito',
        'shipped_to_hn': 'En tránsito',
        'in_customs': 'En aduana',
        'ready_for_delivery': 'Listo para entrega',
        'pending_second_payment': 'Pendiente saldo 50%',
        'shipped_to_costumer': 'Enviado al cliente',
        'completed': 'Entregado',
        'paid_full': 'Entregado',
        'Cancelled': 'Cancelado',
        'cancelled': 'Cancelado',
    };
    return labels[status] || status;
};

export default function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap transition-colors ${getStatusColor(
                status
            )} ${className}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDotColor(status)}`} />
            <span className="truncate">{getStatusLabel(status)}</span>
        </span>
    );
}
