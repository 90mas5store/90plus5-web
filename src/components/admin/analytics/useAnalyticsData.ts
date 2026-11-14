'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AnalyticsRange, AnalyticsSummary } from '@/lib/analytics/types';
import type { BestSellerItem, ShareStatItem } from '@/components/admin/reportes/types';
import { getStoreRangeDateStrings } from '@/lib/analytics/range';
import useToastMessage from '@/hooks/useToastMessage';

export type AnalyticsSubView = 'overview' | 'catalog' | 'audience';

function aggregateShareRows(rows: Array<{
    product_name: string;
    team_name?: string | null;
    season?: string | null;
    created_at?: string;
}>): ShareStatItem[] {
    const map = new Map<string, ShareStatItem>();
    for (const row of rows || []) {
        const key = `${row.team_name || ''}::${row.product_name}::${row.season || ''}`;
        const existing = map.get(key) || {
            product_name: row.product_name,
            team_name: row.team_name ?? null,
            season: row.season ?? null,
            count: 0,
            last_shared_at: row.created_at,
        };
        existing.count++;
        if (
            row.created_at &&
            (!existing.last_shared_at || new Date(row.created_at) > new Date(existing.last_shared_at))
        ) {
            existing.last_shared_at = row.created_at;
        }
        map.set(key, existing);
    }
    return Array.from(map.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}

export function useAnalyticsData(initialRange: AnalyticsRange = '7d') {
    const toast = useToastMessage();
    const [range, setRange] = useState<AnalyticsRange>(initialRange);
    const [activeView, setActiveView] = useState<AnalyticsSubView>('overview');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsSummary | null>(null);
    const [bestSellers, setBestSellers] = useState<BestSellerItem[]>([]);
    const [kitShares, setKitShares] = useState<ShareStatItem[]>([]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const { startStr, endStr } = getStoreRangeDateStrings(range);

            const [statsRes, sellersRes, sharesRes] = await Promise.allSettled([
                fetch(`/api/admin/analytics/stats?range=${range}`),
                fetch(`/api/admin/reports/best-sellers?startDate=${startStr}&endDate=${endStr}&status=all`),
                fetch(`/api/admin/reports/shares?startDate=${startStr}&endDate=${endStr}`),
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
                const statsJson: AnalyticsSummary = await statsRes.value.json();
                setData(statsJson);
            } else {
                toast.error('Error al cargar estadísticas principales');
            }

            if (sellersRes.status === 'fulfilled' && sellersRes.value.ok) {
                const sellersJson: BestSellerItem[] = await sellersRes.value.json();
                setBestSellers(sellersJson || []);
            } else {
                setBestSellers([]);
            }

            if (sharesRes.status === 'fulfilled' && sharesRes.value.ok) {
                const sharesRaw = await sharesRes.value.json();
                setKitShares(aggregateShareRows(sharesRaw || []));
            } else {
                setKitShares([]);
            }
        } catch (err) {
            console.error('[useAnalyticsData] Error:', err);
            toast.error('Error al cargar analíticas');
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    return {
        range,
        setRange,
        activeView,
        setActiveView,
        loading,
        data,
        bestSellers,
        kitShares,
        refresh: loadAll,
    };
}

