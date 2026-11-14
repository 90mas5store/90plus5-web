'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    AccountingOrder,
    OrderMetrics,
    PresetKey,
    AccountingTotals,
    ProductProfitItem,
} from './types';
import {
    computeMetrics,
    exportToCSV,
    getPresetDates,
    parseBankFromNotes,
    VERIFIED,
} from './accountingUtils';

export function useAccountingData() {
    const [preset, setPreset] = useState<PresetKey>('30d');
    const [dates, setDates] = useState(() => getPresetDates('30d'));
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all']);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<OrderMetrics[] | null>(null);

    const toggleStatus = (value: string) => {
        if (value === 'all') {
            setSelectedStatuses(['all']);
            return;
        }
        let next = selectedStatuses.includes('all') ? [] : [...selectedStatuses];
        next = next.includes(value) ? next.filter((s) => s !== value) : [...next, value];
        setSelectedStatuses(next.length === 0 ? ['all'] : next);
    };

    const handlePresetChange = (newPreset: PresetKey) => {
        setPreset(newPreset);
        if (newPreset !== 'custom') {
            const nextDates = getPresetDates(newPreset);
            setDates(nextDates);
        } else {
            setShowAdvancedFilters(true);
        }
    };

    const calculate = useCallback(async () => {
        if (!dates.start || !dates.end) return;
        setLoading(true);
        setError(null);
        try {
            const statusParam = selectedStatuses.includes('all') ? 'all' : selectedStatuses.join(',');
            const params = new URLSearchParams({
                startDate: dates.start,
                endDate: dates.end,
                status: statusParam,
            });
            const res = await fetch(`/api/admin/reports/accounting?${params}`);
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.error || `HTTP ${res.status}`);
            }
            const data: AccountingOrder[] = await res.json();
            setMetrics(data.map(computeMetrics));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [dates.start, dates.end, selectedStatuses]);

    // Cálculo automático inicial y ante cualquier cambio de período o filtro
    useEffect(() => {
        calculate();
    }, [calculate]);

    // Totales agregados
    const totals: AccountingTotals = useMemo(() => {
        return (metrics ?? []).reduce(
            (acc, m) => ({
                revenue: acc.revenue + m.revenue,
                productRevenue: acc.productRevenue + m.productRevenue,
                discountAmount: acc.discountAmount + m.discountAmount,
                shippingRevenue: acc.shippingRevenue + m.shippingRevenue,
                productCost: acc.productCost + m.productCost,
                shippingCost: acc.shippingCost + m.shippingCost,
                totalCost: acc.totalCost + m.totalCost,
                grossProfit: acc.grossProfit + m.grossProfit,
            }),
            {
                revenue: 0,
                productRevenue: 0,
                discountAmount: 0,
                shippingRevenue: 0,
                productCost: 0,
                shippingCost: 0,
                totalCost: 0,
                grossProfit: 0,
            }
        );
    }, [metrics]);

    const overallMargin = totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : 0;

    const ordersWithMissingCosts = useMemo(
        () => (metrics ?? []).filter((m) => m.missingCosts).length,
        [metrics]
    );

    // Pagos verificados agrupados por banco + método
    const { paymentEntries, totalVerified } = useMemo(() => {
        const map: Record<string, { amount: number; count: number }> = {};
        for (const m of metrics ?? []) {
            for (const p of m.order.payments || []) {
                if (!VERIFIED.includes(p.status)) continue;
                const key = parseBankFromNotes(p.notes, p.method);
                if (!map[key]) map[key] = { amount: 0, count: 0 };
                map[key].amount += p.amount ?? 0;
                map[key].count += 1;
            }
        }
        const entries = Object.entries(map).sort((a, b) => b[1].amount - a[1].amount);
        const total = entries.reduce((s, [, v]) => s + v.amount, 0);
        return { paymentEntries: entries, totalVerified: total };
    }, [metrics]);

    // Rentabilidad por producto (Top 15)
    const productEntries: ProductProfitItem[] = useMemo(() => {
        const map: Record<string, { units: number; revenue: number; cost: number; profit: number }> = {};
        for (const m of metrics ?? []) {
            for (const item of m.order.order_items || []) {
                const team = (item.products?.teams as { name: string } | null)?.name || '';
                const pname = item.products?.name || 'Desconocido';
                const key = team ? `${team} — ${pname}` : pname;
                if (!map[key]) map[key] = { units: 0, revenue: 0, cost: 0, profit: 0 };
                const rev = (item.unit_price ?? 0) * item.quantity;
                const cost = (item.product_variants?.cost ?? 0) * item.quantity;
                map[key].units += item.quantity;
                map[key].revenue += rev;
                map[key].cost += cost;
                map[key].profit += rev - cost;
            }
        }
        return Object.entries(map)
            .map(([name, v]) => ({
                name,
                ...v,
                margin: v.revenue > 0 ? (v.profit / v.revenue) * 100 : 0,
            }))
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 15);
    }, [metrics]);

    const handleExport = () => {
        if (metrics) {
            exportToCSV(metrics, dates.start, dates.end);
        }
    };

    return {
        preset,
        dates,
        setDates,
        selectedStatuses,
        showAdvancedFilters,
        setShowAdvancedFilters,
        loading,
        error,
        metrics,
        totals,
        overallMargin,
        ordersWithMissingCosts,
        paymentEntries,
        totalVerified,
        productEntries,
        toggleStatus,
        handlePresetChange,
        calculate,
        handleExport,
    };
}

