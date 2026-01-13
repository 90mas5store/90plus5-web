import React from 'react';

interface OrderStatusBadgeProps {
    status: string;
}

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'paid_full': return 'bg-green-500/20 text-green-500 border-green-500/30';
        case 'ready_for_delivery': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
        case 'deposit_paid': return 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30';
        case 'pending_payment_50': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
        case 'Cancelled': return 'bg-red-500/20 text-red-500 border-red-500/30';
        case 'completed': return 'bg-green-500/20 text-green-500 border-green-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

export const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        'pending_payment_50': 'Esperando Anticipo',
        'deposit_paid': 'Anticipo Pagado',
        'ready_for_delivery': 'Listo para Entrega',
        'paid_full': 'Completado',
        'completed': 'Completado',
        'Cancelled': 'Cancelado'
    };
    return labels[status] || status;
};

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-wide whitespace-nowrap ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
        </span>
    );
}
