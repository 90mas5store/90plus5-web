import React from 'react';

interface OrderStatusBadgeProps {
    status: string;
}

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending_payment_50': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        case 'deposit_paid': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
        case 'processing': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
        case 'in_transit': 
        case 'shipped_to_hn': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'ready_for_delivery': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        case 'pending_second_payment': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        case 'shipped_to_costumer': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
        case 'completed': 
        case 'paid_full': return 'bg-green-500/20 text-green-500 border-green-500/30';
        case 'Cancelled': return 'bg-red-500/20 text-red-500 border-red-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

export const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        'pending_payment_50': '1. Pedido recibido',
        'deposit_paid': '2. Anticipo confirmado',
        'processing': '3. Pedido realizado al proveedor',
        'in_transit': '4. Producto en transito',
        'shipped_to_hn': '4. Producto en transito', // Legacy support
        'ready_for_delivery': '5. Producto listo para despachar',
        'pending_second_payment': '6. Pendiente segundo pago',
        'shipped_to_costumer': '7. Producto enviado al cliente',
        'completed': '8. Producto recibido por el cliente',
        'paid_full': '8. Producto recibido por el cliente', // Legacy support
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
