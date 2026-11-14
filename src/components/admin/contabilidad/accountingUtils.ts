import { AccountingOrder, OrderMetrics, PresetKey } from './types';

export const SHIPPING_COST = 120;

export const STATUS_OPTIONS = [
    { value: 'pending_payment_50', label: '1. Pedido recibido', dotColor: 'bg-rose-500' },
    { value: 'deposit_paid', label: '2. Anticipo confirmado', dotColor: 'bg-amber-400' },
    { value: 'processing', label: '3. En proveedor', dotColor: 'bg-yellow-400' },
    { value: 'in_transit', label: '4. En tránsito', dotColor: 'bg-cyan-400' },
    { value: 'ready_for_delivery', label: '5. Listo despachar', dotColor: 'bg-purple-400' },
    { value: 'pending_second_payment', label: '6. Pend. 2do pago', dotColor: 'bg-orange-400' },
    { value: 'shipped_to_costumer', label: '7. Enviado cliente', dotColor: 'bg-blue-400' },
    { value: 'completed', label: '8. Completado', dotColor: 'bg-emerald-400' },
    { value: 'Cancelled', label: 'Cancelado', dotColor: 'bg-neutral-500' },
];

export const STATUS_LABEL: Record<string, string> = {
    pending_payment_50: 'Pedido recibido',
    deposit_paid: 'Anticipo confirmado',
    processing: 'En proveedor',
    in_transit: 'En tránsito',
    ready_for_delivery: 'Listo despachar',
    pending_second_payment: 'Pend. 2do pago',
    shipped_to_costumer: 'Enviado cliente',
    completed: 'Completado',
    paid_full: 'Completado',
    shipped_to_hn: 'En tránsito',
    Cancelled: 'Cancelado',
};

export const VERIFIED = ['verified', 'succeeded', 'completed'];

export function parseBankFromNotes(notes: string | null, method: string | null): string {
    if (notes) {
        const match = notes.match(/Banco:\s*([^|]+)/i);
        if (match) return match[1].trim();
    }
    return method || 'Sin especificar';
}

export function fmt(n: number): string {
    return `L ${Math.round(n).toLocaleString('es-HN')}`;
}

export function fmtPct(n: number): string {
    return `${n.toFixed(1)}%`;
}

export function getPresetDates(preset: PresetKey): { start: string; end: string } {
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    const startObj = new Date();

    if (preset === 'today') {
        return { start: end, end };
    } else if (preset === '7d') {
        startObj.setDate(now.getDate() - 7);
        return { start: startObj.toISOString().split('T')[0], end };
    } else if (preset === '30d') {
        startObj.setDate(now.getDate() - 30);
        return { start: startObj.toISOString().split('T')[0], end };
    } else if (preset === 'month') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: firstDayOfMonth.toISOString().split('T')[0], end };
    } else if (preset === 'year') {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: firstDayOfYear.toISOString().split('T')[0], end };
    }
    return { start: end, end };
}

export function formatPeriodDisplay(startStr: string, endStr: string): string {
    if (!startStr || !endStr) return '';
    try {
        const [sy, sm, sd] = startStr.split('-').map(Number);
        const [ey, em, ed] = endStr.split('-').map(Number);
        const s = new Date(sy, sm - 1, sd);
        const e = new Date(ey, em - 1, ed);
        const sFmt = s.toLocaleDateString('es-HN', {
            day: 'numeric',
            month: 'short',
            year: sy !== ey ? 'numeric' : undefined,
        });
        const eFmt = e.toLocaleDateString('es-HN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
        return `${sFmt} – ${eFmt}`;
    } catch {
        return `${startStr} al ${endStr}`;
    }
}

export function computeMetrics(order: AccountingOrder): OrderMetrics {
    const productRevenue = order.subtotal ?? 0;
    const discountAmount = order.discount_amount ?? 0;
    const revenue = order.total_amount ?? 0;
    const shippingRevenue = Math.max(0, revenue + discountAmount - productRevenue);

    let productCost = 0;
    let missingCosts = false;
    for (const item of order.order_items || []) {
        const cost = item.product_variants?.cost;
        if (cost == null) {
            missingCosts = true;
            continue;
        }
        productCost += cost * item.quantity;
    }

    const shippingCost = shippingRevenue > 0 ? SHIPPING_COST : 0;
    const totalCost = productCost + shippingCost;
    const grossProfit = revenue - totalCost;
    const marginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const verifiedPaid = (order.payments || [])
        .filter((p) => VERIFIED.includes(p.status))
        .reduce((s, p) => s + (p.amount ?? 0), 0);

    return {
        order,
        revenue,
        productRevenue,
        discountAmount,
        shippingRevenue,
        productCost,
        shippingCost,
        totalCost,
        grossProfit,
        marginPct,
        verifiedPaid,
        missingCosts,
    };
}

export function exportToCSV(metrics: OrderMetrics[], startDate: string, endDate: string) {
    if (!metrics || metrics.length === 0) return;

    const headers = [
        'ID Pedido',
        'Fecha',
        'Cliente',
        'Estado',
        'Subtotal Productos (L)',
        'Descuento Aplicado (L)',
        'Envío Cobrado (L)',
        'Ingreso Neto Total (L)',
        'Costo Productos (L)',
        'Costo Logístico Envío (L)',
        'Costo Total (L)',
        'Ganancia Bruta (L)',
        'Margen (%)',
        'Cobrado Verificado (L)',
        'Banco / Método',
    ];

    const rows = metrics.map((m) => {
        const verifiedPays = (m.order.payments || []).filter((p) => VERIFIED.includes(p.status));
        const banks =
            [...new Set(verifiedPays.map((p) => parseBankFromNotes(p.notes, p.method)))].join(' | ') || 'N/A';

        return [
            m.order.id.slice(0, 8).toUpperCase(),
            new Date(m.order.created_at).toLocaleDateString('es-HN'),
            `"${m.order.customer_name.replace(/"/g, '""')}"`,
            `"${STATUS_LABEL[m.order.status] || m.order.status}"`,
            m.productRevenue.toFixed(2),
            m.discountAmount.toFixed(2),
            m.shippingRevenue.toFixed(2),
            m.revenue.toFixed(2),
            m.productCost.toFixed(2),
            m.shippingCost.toFixed(2),
            m.totalCost.toFixed(2),
            m.grossProfit.toFixed(2),
            m.marginPct.toFixed(1),
            m.verifiedPaid.toFixed(2),
            `"${banks.replace(/"/g, '""')}"`,
        ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_contabilidad_${startDate}_al_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

