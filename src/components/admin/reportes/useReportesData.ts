'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopBuyer, BestSellerItem, ShareStatItem } from './types';

export function useReportesData() {
    // Fechas y Filtro de Estados
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all']);

    // Estados de Métricas
    const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
    const [loadingBuyers, setLoadingBuyers] = useState(false);

    const [bestSellers, setBestSellers] = useState<BestSellerItem[]>([]);
    const [loadingBest, setLoadingBest] = useState(false);

    const [shareStats, setShareStats] = useState<ShareStatItem[]>([]);
    const [loadingShares, setLoadingShares] = useState(false);

    // 📥 Cargar Top Compradores
    const loadTopBuyers = useCallback(async () => {
        setLoadingBuyers(true);
        try {
            const res = await fetch('/api/admin/reports/top-buyers');
            if (!res.ok) throw new Error('Error al cargar compradores');
            const data: TopBuyer[] = await res.json();
            setTopBuyers(data);
        } catch {
            console.error('Error al analizar compradores');
        } finally {
            setLoadingBuyers(false);
        }
    }, []);

    // 📥 Cargar Más Vendidos
    const loadBestSellers = useCallback(async (start?: string, end?: string, statuses?: string[]) => {
        const s = start ?? startDate;
        const e = end ?? endDate;
        const st = statuses ?? selectedStatuses;
        if (!s || !e) return;

        setLoadingBest(true);
        try {
            const statusParam = st.includes('all') ? 'all' : st.join(',');
            const params = new URLSearchParams({ startDate: s, endDate: e, status: statusParam });
            const res = await fetch(`/api/admin/reports/best-sellers?${params}`);
            if (!res.ok) throw new Error('Error al obtener datos');
            const sorted = await res.json();
            setBestSellers(sorted);
        } catch {
            console.error('Error al calcular más vendidos');
        } finally {
            setLoadingBest(false);
        }
    }, [startDate, endDate, selectedStatuses]);

    // 📥 Cargar Presumes de Kits
    const loadShareStats = useCallback(async (start?: string, end?: string) => {
        const s = start ?? startDate;
        const e = end ?? endDate;
        if (!s || !e) return;

        setLoadingShares(true);
        try {
            const params = new URLSearchParams({ startDate: s, endDate: e });
            const res = await fetch(`/api/admin/reports/shares?${params}`);
            if (!res.ok) throw new Error('Error al cargar presumes');
            const data = await res.json();

            const map = new Map<string, ShareStatItem>();
            for (const row of data || []) {
                const key = `${row.team_name || ''}::${row.product_name}::${row.season || ''}`;
                const existing = map.get(key) || {
                    product_name: row.product_name,
                    team_name: row.team_name,
                    season: row.season,
                    count: 0,
                };
                existing.count++;
                map.set(key, existing);
            }
            const sorted = Array.from(map.values())
                .sort((a, b) => b.count - a.count)
                .slice(0, 15);
            setShareStats(sorted);
        } catch {
            console.error('Error al cargar presumes');
        } finally {
            setLoadingShares(false);
        }
    }, [startDate, endDate]);

    // Inicialización de Fechas y Datos Iniciales
    useEffect(() => {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const endStr = today.toISOString().split('T')[0];
        const startStr = lastMonth.toISOString().split('T')[0];

        setEndDate(endStr);
        setStartDate(startStr);

        loadTopBuyers();
        loadBestSellers(startStr, endStr, ['all']);
        loadShareStats(startStr, endStr);
    }, [loadTopBuyers, loadBestSellers, loadShareStats]);

    const toggleStatus = (value: string) => {
        if (value === 'all') {
            setSelectedStatuses(['all']);
            return;
        }
        let newStatuses = selectedStatuses.includes('all') ? [] : [...selectedStatuses];
        newStatuses = newStatuses.includes(value)
            ? newStatuses.filter((s) => s !== value)
            : [...newStatuses, value];
        const finalStatuses = newStatuses.length === 0 ? ['all'] : newStatuses;
        setSelectedStatuses(finalStatuses);
    };

    const setPreset = (preset: 'today' | 'week' | 'month' | 'all') => {
        const today = new Date();
        const end = today.toISOString().split('T')[0];
        let start = new Date();
        if (preset === 'today') start = today;
        if (preset === 'week') start.setDate(start.getDate() - 7);
        if (preset === 'month') start.setMonth(start.getMonth() - 1);
        if (preset === 'all') start = new Date('2024-01-01');
        const startStr = start.toISOString().split('T')[0];
        setStartDate(startStr);
        setEndDate(end);

        loadBestSellers(startStr, end, selectedStatuses);
        loadShareStats(startStr, end);
    };

    return {
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        selectedStatuses,
        toggleStatus,
        setPreset,
        topBuyers,
        loadingBuyers,
        loadTopBuyers,
        bestSellers,
        loadingBest,
        loadBestSellers,
        shareStats,
        loadingShares,
        loadShareStats,
    };
}
