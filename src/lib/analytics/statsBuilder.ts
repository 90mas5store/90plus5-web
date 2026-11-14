import type {
    AnalyticsCityStat,
    AnalyticsCountryStat,
    AnalyticsDeltas,
    AnalyticsDeviceStat,
    AnalyticsFunnelStep,
    AnalyticsHourlyStat,
    AnalyticsMissedSearch,
    AnalyticsPatchSummary,
    AnalyticsPlayerStat,
    AnalyticsProductStat,
    AnalyticsRange,
    AnalyticsShippingRegionStat,
    AnalyticsSizeStat,
    AnalyticsSummary,
    AnalyticsTrafficSourceStat,
    AnalyticsVersionStat,
} from './types';
import { getCountryFlag, getCountryName } from './geo';
import { getRecentDaysInStoreTz } from './timezone';
import { normalizeProductKey, type EventsAggregation, type RawAnalyticsEvent } from './eventsAggregator';
import type { OrdersAggregation } from './ordersAggregator';

export interface PreviousPeriodBaseline {
    uniqueVisitors: number;
    totalPageViews: number;
    totalOrders: number;
    totalRevenue: number;
    cartSessions: number;
}

export interface BuildAnalyticsSummaryParams {
    range: AnalyticsRange;
    eventsAgg: EventsAggregation;
    ordersAgg: OrdersAggregation;
    recentEvents: RawAnalyticsEvent[];
    daysToGenerate: number;
    now: Date;
    seasonLookup?: Map<string, string>;
    previousBaseline?: PreviousPeriodBaseline | null;
    eventsCount: number;
    truncated: boolean;
}

function calcPctDelta(current: number, previous: number | null | undefined): number | null {
    if (previous === null || previous === undefined) return null;
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
}

function roundRate(num: number, den: number): number {
    if (den <= 0) return 0;
    return Math.min(Math.round((num / den) * 1000) / 10, 100);
}

export function buildAnalyticsSummary(params: BuildAnalyticsSummaryParams): AnalyticsSummary {
    const {
        range,
        eventsAgg,
        ordersAgg,
        recentEvents,
        daysToGenerate,
        now,
        seasonLookup,
        previousBaseline,
        eventsCount,
        truncated,
    } = params;

    const uniqueVisitorCount = eventsAgg.uniqueSessions.size;
    const totalOrders = ordersAgg.totalOrders;
    const conversionRate = uniqueVisitorCount > 0
        ? Math.min(Number(((totalOrders / uniqueVisitorCount) * 100).toFixed(2)), 100)
        : 0;
    const cartRate = roundRate(eventsAgg.sessionsWithCart.size, uniqueVisitorCount);

    // Embudo de conversión de 5 pasos
    const step1Count = uniqueVisitorCount;
    const step2Count = eventsAgg.sessionsWithProductView.size;
    const step3Count = eventsAgg.sessionsWithCart.size;
    const step4Count = eventsAgg.sessionsWithCheckout.size;
    const step5Count = Math.max(totalOrders, eventsAgg.sessionsWithPurchase.size);

    const checkoutAbandonmentRate = step4Count > 0
        ? Math.max(0, Math.round(((step4Count - step5Count) / step4Count) * 100))
        : 0;

    const conversionFunnel: AnalyticsFunnelStep[] = [
        {
            id: 'visit',
            name: '1. Visita Tienda',
            description: 'Navegación en catálogo o inicio',
            count: step1Count,
            percentage: 100,
            dropOffPercentage: step1Count > 0 ? Math.max(0, Math.round(((step1Count - step2Count) / step1Count) * 100)) : 0,
        },
        {
            id: 'product',
            name: '2. Detalle Camiseta',
            description: 'Interés en fichas de producto',
            count: step2Count,
            percentage: step1Count > 0 ? Math.round((step2Count / step1Count) * 100) : 0,
            dropOffPercentage: step2Count > 0 ? Math.max(0, Math.round(((step2Count - step3Count) / step2Count) * 100)) : 0,
        },
        {
            id: 'cart',
            name: '3. Añadido al Carrito',
            description: 'Intención de compra real',
            count: step3Count,
            percentage: step1Count > 0 ? Math.round((step3Count / step1Count) * 100) : 0,
            dropOffPercentage: step3Count > 0 ? Math.max(0, Math.round(((step3Count - step4Count) / step3Count) * 100)) : 0,
        },
        {
            id: 'checkout',
            name: '4. Checkout Iniciado',
            description: 'Ingreso al proceso de pago',
            count: step4Count,
            percentage: step1Count > 0 ? Math.round((step4Count / step1Count) * 100) : 0,
            dropOffPercentage: checkoutAbandonmentRate,
        },
        {
            id: 'order',
            name: '5. Pedido Confirmado',
            description: 'Conversión final exitosa',
            count: step5Count,
            percentage: step1Count > 0 ? Math.round((step5Count / step1Count) * 100) : 0,
            dropOffPercentage: 0,
        },
    ];

    // Deltas comparativos vs período previo
    let deltas: AnalyticsDeltas = {
        uniqueVisitorsPct: null,
        totalPageViewsPct: null,
        conversionRatePct: null,
        totalOrdersPct: null,
        totalRevenuePct: null,
        cartRatePct: null,
    };

    if (previousBaseline) {
        const prevConversionRate = previousBaseline.uniqueVisitors > 0
            ? Math.min((previousBaseline.totalOrders / previousBaseline.uniqueVisitors) * 100, 100)
            : 0;
        const prevCartRate = roundRate(previousBaseline.cartSessions, previousBaseline.uniqueVisitors);

        deltas = {
            uniqueVisitorsPct: calcPctDelta(uniqueVisitorCount, previousBaseline.uniqueVisitors),
            totalPageViewsPct: calcPctDelta(eventsAgg.totalPageViews, previousBaseline.totalPageViews),
            conversionRatePct: calcPctDelta(conversionRate, prevConversionRate),
            totalOrdersPct: calcPctDelta(totalOrders, previousBaseline.totalOrders),
            totalRevenuePct: calcPctDelta(ordersAgg.totalRevenue, previousBaseline.totalRevenue),
            cartRatePct: calcPctDelta(cartRate, prevCartRate),
        };
    }

    // Tendencia diaria (tráfico + pedidos + facturación)
    const recentDateStrings = getRecentDaysInStoreTz(daysToGenerate, now);
    const viewsTrend = recentDateStrings.map((dateStr) => {
        const evDay = eventsAgg.dailyMap.get(dateStr);
        const ordDay = ordersAgg.dailyMap.get(dateStr);
        return {
            date: dateStr,
            views: evDay ? evDay.views : 0,
            visitors: evDay ? evDay.visitors.size : 0,
            orders: ordDay ? ordDay.orders : 0,
            revenue: ordDay ? Math.round(ordDay.revenue) : 0,
        };
    });

    // Cruce de Top Productos (Vistas + Carrito + Ventas Reales)
    const allProductSlugs = new Set<string>([
        ...eventsAgg.productMap.keys(),
        ...ordersAgg.productSalesBySlug.keys(),
    ]);

    const cartsBySlug = new Map<string, number>();
    for (const [productId, count] of eventsAgg.cartByProductId.entries()) {
        const slug = ordersAgg.slugByProductId.get(productId);
        if (slug) cartsBySlug.set(slug, (cartsBySlug.get(slug) || 0) + count);
    }
    for (const [normName, count] of eventsAgg.cartByProductName.entries()) {
        const slug = ordersAgg.slugByProductName.get(normName);
        if (slug && !cartsBySlug.has(slug)) {
            cartsBySlug.set(slug, count);
        }
    }

    const topProducts: AnalyticsProductStat[] = Array.from(allProductSlugs)
        .map((slug) => {
            const viewData = eventsAgg.productMap.get(slug);
            const normName = normalizeProductKey(viewData?.name || slug);
            const saleData = ordersAgg.productSalesBySlug.get(slug) || ordersAgg.productSalesByName.get(normName);
            const views = viewData?.views || 0;
            const carts = cartsBySlug.get(slug) || eventsAgg.cartByProductName.get(normName) || 0;
            const unitsSold = saleData?.unitsSold || 0;
            const ordersCount = saleData?.orderIds.size || 0;
            const revenue = Math.round(saleData?.revenue || 0);

            return {
                slug,
                name: viewData?.name || saleData?.name || slug,
                teamName: viewData?.teamName || saleData?.teamName || null,
                season: seasonLookup?.get(slug) || viewData?.season || saleData?.season || null,
                imageUrl: viewData?.imageUrl || null,
                views,
                carts,
                unitsSold,
                orders: ordersCount,
                revenue,
                conversionRate: views > 0 ? roundRate(ordersCount, views) : 0,
            };
        })
        .sort((a, b) => (b.views - a.views) || (b.unitsSold - a.unitsSold))
        .slice(0, 15);

    // Atribución por sesión única: Fuentes, Dispositivos, Países, Ciudades
    const sourceStatsMap = new Map<string, { sessions: number; orders: number }>();
    const deviceStatsMap = new Map<string, { sessions: number; orders: number }>();
    const countryCountMap = new Map<string, number>();
    const cityCountMap = new Map<string, { country: string; count: number }>();

    for (const [sessId, info] of eventsAgg.sessions.entries()) {
        const converted = eventsAgg.sessionsWithPurchase.has(sessId) ? 1 : 0;

        const srcEntry = sourceStatsMap.get(info.source) || { sessions: 0, orders: 0 };
        srcEntry.sessions++;
        srcEntry.orders += converted;
        sourceStatsMap.set(info.source, srcEntry);

        const devEntry = deviceStatsMap.get(info.device) || { sessions: 0, orders: 0 };
        devEntry.sessions++;
        devEntry.orders += converted;
        deviceStatsMap.set(info.device, devEntry);

        if (info.country) {
            countryCountMap.set(info.country, (countryCountMap.get(info.country) || 0) + 1);
        }
        if (info.city) {
            const cKey = `${info.city}__${info.country || 'HN'}`;
            const cur = cityCountMap.get(cKey);
            cityCountMap.set(cKey, {
                country: info.country || 'HN',
                count: (cur?.count || 0) + 1,
            });
        }
    }

    const totalSessionsForBreakdown = eventsAgg.sessions.size || 1;
    const trafficSources: AnalyticsTrafficSourceStat[] = Array.from(sourceStatsMap.entries())
        .map(([source, stat]) => ({
            source,
            count: stat.sessions,
            sessions: stat.sessions,
            orders: stat.orders,
            conversionRate: roundRate(stat.orders, stat.sessions),
            percentage: Math.round((stat.sessions / totalSessionsForBreakdown) * 100),
        }))
        .sort((a, b) => b.sessions - a.sessions);

    const deviceBreakdown: AnalyticsDeviceStat[] = Array.from(deviceStatsMap.entries())
        .map(([device, stat]) => ({
            device,
            count: stat.sessions,
            sessions: stat.sessions,
            orders: stat.orders,
            conversionRate: roundRate(stat.orders, stat.sessions),
            percentage: Math.round((stat.sessions / totalSessionsForBreakdown) * 100),
        }))
        .sort((a, b) => b.sessions - a.sessions);

    const totalCountries = Array.from(countryCountMap.values()).reduce((a, b) => a + b, 0) || 1;
    const topCountries: AnalyticsCountryStat[] = Array.from(countryCountMap.entries())
        .map(([code, count]) => ({
            code,
            name: getCountryName(code),
            flag: getCountryFlag(code),
            count,
            percentage: Math.round((count / totalCountries) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    const totalCities = Array.from(cityCountMap.values()).reduce((a, b) => a + b.count, 0) || 1;
    const topCities: AnalyticsCityStat[] = Array.from(cityCountMap.entries())
        .map(([key, stat]) => ({
            city: key.split('__')[0],
            country: stat.country,
            count: stat.count,
            percentage: Math.round((stat.count / totalCities) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    // Regiones de envío reales (de pedidos)
    const shippingRegions: AnalyticsShippingRegionStat[] = Array.from(ordersAgg.shippingRegions.values())
        .map((r) => {
            const topMunicipality = Array.from(r.municipalityCounts.entries())
                .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
            return {
                department: r.department,
                topMunicipality,
                orders: r.orders,
                revenue: Math.round(r.revenue),
                percentage: ordersAgg.totalOrders > 0 ? Math.round((r.orders / ordersAgg.totalOrders) * 100) : 0,
            };
        })
        .sort((a, b) => (b.orders - a.orders) || (b.revenue - a.revenue))
        .slice(0, 10);

    // Tallas (Carrito vs Compradas)
    const allSizes = new Set<string>([
        ...eventsAgg.sizeMap.keys(),
        ...ordersAgg.purchasedSizeMap.keys(),
    ]);
    const totalCartSizes = Array.from(eventsAgg.sizeMap.values()).reduce((a, b) => a + b, 0) || 1;
    const totalPurchasedSizes = Array.from(ordersAgg.purchasedSizeMap.values()).reduce((a, b) => a + b, 0) || 1;

    const sizeDemand: AnalyticsSizeStat[] = Array.from(allSizes)
        .map((size) => {
            const cartCount = eventsAgg.sizeMap.get(size) || 0;
            const purchasedCount = ordersAgg.purchasedSizeMap.get(size) || 0;
            return {
                size,
                count: cartCount,
                percentage: eventsAgg.sizeMap.size > 0 ? Math.round((cartCount / totalCartSizes) * 100) : 0,
                purchasedCount,
                purchasedPercentage: ordersAgg.purchasedSizeMap.size > 0
                    ? Math.round((purchasedCount / totalPurchasedSizes) * 100)
                    : 0,
            };
        })
        .sort((a, b) => (b.purchasedCount - a.purchasedCount) || (b.count - a.count));

    // Versiones (Jugador vs Aficionado)
    const allVersions = new Set<string>([
        ...eventsAgg.versionMap.keys(),
        ...ordersAgg.purchasedVersionMap.keys(),
    ]);
    const totalCartVersions = Array.from(eventsAgg.versionMap.values()).reduce((a, b) => a + b, 0) || 1;
    const totalPurchasedVersions = Array.from(ordersAgg.purchasedVersionMap.values()).reduce((a, b) => a + b, 0) || 1;

    const versionDemand: AnalyticsVersionStat[] = Array.from(allVersions)
        .map((version) => {
            const cartCount = eventsAgg.versionMap.get(version) || 0;
            const purchasedUnits = ordersAgg.purchasedVersionMap.get(version) || 0;
            return {
                version,
                cartCount,
                cartPercentage: eventsAgg.versionMap.size > 0 ? Math.round((cartCount / totalCartVersions) * 100) : 0,
                purchasedUnits,
                purchasedPercentage: ordersAgg.purchasedVersionMap.size > 0
                    ? Math.round((purchasedUnits / totalPurchasedVersions) * 100)
                    : 0,
            };
        })
        .sort((a, b) => (b.purchasedUnits - a.purchasedUnits) || (b.cartCount - a.cartCount));

    // Parches
    const patchDemand: AnalyticsPatchSummary = {
        withPatchCartCount: eventsAgg.patchCounts.withPatch,
        totalCartCount: eventsAgg.patchCounts.total,
        cartRate: roundRate(eventsAgg.patchCounts.withPatch, eventsAgg.patchCounts.total),
        withPatchOrderUnits: ordersAgg.purchasedPatchCounts.withPatchUnits,
        totalOrderUnits: ordersAgg.purchasedPatchCounts.totalUnits,
        orderRate: roundRate(ordersAgg.purchasedPatchCounts.withPatchUnits, ordersAgg.purchasedPatchCounts.totalUnits),
    };

    // Dorsales / Jugadores (Carrito + Pedidos reales)
    const mergedPlayers = new Map<string, AnalyticsPlayerStat>();
    for (const [key, val] of eventsAgg.playerMap.entries()) {
        mergedPlayers.set(key, { name: val.name, number: val.number, count: val.count, purchasedCount: 0 });
    }
    for (const [key, val] of ordersAgg.purchasedPlayerMap.entries()) {
        const existing = mergedPlayers.get(key);
        if (existing) {
            existing.purchasedCount += val.count;
        } else {
            mergedPlayers.set(key, { name: val.name, number: val.number, count: 0, purchasedCount: val.count });
        }
    }
    const playerDemand: AnalyticsPlayerStat[] = Array.from(mergedPlayers.values())
        .sort((a, b) => (b.purchasedCount - a.purchasedCount) || (b.count - a.count))
        .slice(0, 10);

    // Horario 24h
    const hourlyDistribution: AnalyticsHourlyStat[] = Array.from({ length: 24 }).map((_, h) => ({
        hour: h,
        label: `${String(h).padStart(2, '0')}:00`,
        views: eventsAgg.hourlyViews[h] || 0,
        orders: ordersAgg.hourlyOrders[h] || 0,
        revenue: Math.round(ordersAgg.hourlyRevenue[h] || 0),
    }));

    // Búsquedas
    const topSearches = Array.from(eventsAgg.searchMap.entries())
        .map(([term, count]) => ({ term, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const missedSearches: AnalyticsMissedSearch[] = Array.from(eventsAgg.missedSearchMap.entries())
        .map(([term, count]) => ({ term, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const revenuePerVisitor = uniqueVisitorCount > 0
        ? Math.round(ordersAgg.totalRevenue / uniqueVisitorCount)
        : 0;

    return {
        range,
        totalPageViews: eventsAgg.totalPageViews,
        uniqueVisitors: uniqueVisitorCount,
        totalProductViews: eventsAgg.totalProductViews,
        totalSearches: eventsAgg.totalSearches,
        totalCarts: eventsAgg.totalCarts,
        totalOrders,
        totalMatchdayClicks: eventsAgg.totalMatchdayClicks,
        conversionRate,
        cartRate,
        checkoutAbandonmentRate,
        realtimeActiveVisitors: eventsAgg.realtimeSessions.size,
        deltas,
        conversionFunnel,
        viewsTrend,
        topProducts,
        topSearches,
        missedSearches,
        trafficSources,
        deviceBreakdown,
        topCountries,
        topCities,
        shippingRegions,
        sizeDemand,
        versionDemand,
        patchDemand,
        playerDemand,
        hourlyDistribution,
        orderMetrics: {
            totalRevenue: Math.round(ordersAgg.totalRevenue),
            averageOrderValue: ordersAgg.averageOrderValue,
            totalOrders,
            depositPercentage: ordersAgg.depositPercentage,
            pixelpayOrdersCount: ordersAgg.pixelpayOrdersCount,
            transferOrdersCount: ordersAgg.transferOrdersCount,
            discountedOrdersCount: ordersAgg.discountedOrdersCount,
            discountUsageRate: ordersAgg.discountUsageRate,
            totalDiscountAmount: Math.round(ordersAgg.totalDiscountAmount),
            revenuePerVisitor,
        },
        matchdayMetrics: {
            totalClicks: eventsAgg.totalMatchdayClicks,
            uniqueUsers: eventsAgg.matchdaySessions.size,
        },
        trackingHealth: {
            hasEvents: eventsCount > 0,
            eventsCount,
            truncated,
        },
        recentEvents: recentEvents.slice(0, 20).map((ev) => {
            const geoMeta = (ev.metadata?.geo && typeof ev.metadata.geo === 'object'
                ? ev.metadata.geo
                : {}) as Record<string, unknown>;
            return {
                id: ev.id,
                event_type: ev.event_type,
                path: ev.path,
                referrer: ev.referrer ?? null,
                device: ev.device || 'desktop',
                country: (ev.country || (geoMeta.country as string | undefined)) ?? null,
                city: (ev.city || (geoMeta.city as string | undefined)) ?? null,
                metadata: ev.metadata || undefined,
                created_at: ev.created_at,
            };
        }),
    };
}

export function getEmptySummary(range: AnalyticsRange = '7d'): AnalyticsSummary {
    return {
        range,
        totalPageViews: 0,
        uniqueVisitors: 0,
        totalProductViews: 0,
        totalSearches: 0,
        totalCarts: 0,
        totalOrders: 0,
        totalMatchdayClicks: 0,
        conversionRate: 0,
        cartRate: 0,
        checkoutAbandonmentRate: 0,
        realtimeActiveVisitors: 0,
        deltas: {
            uniqueVisitorsPct: null,
            totalPageViewsPct: null,
            conversionRatePct: null,
            totalOrdersPct: null,
            totalRevenuePct: null,
            cartRatePct: null,
        },
        conversionFunnel: [],
        viewsTrend: [],
        topProducts: [],
        topSearches: [],
        missedSearches: [],
        trafficSources: [],
        deviceBreakdown: [],
        topCountries: [],
        topCities: [],
        shippingRegions: [],
        sizeDemand: [],
        versionDemand: [],
        patchDemand: {
            withPatchCartCount: 0,
            totalCartCount: 0,
            cartRate: 0,
            withPatchOrderUnits: 0,
            totalOrderUnits: 0,
            orderRate: 0,
        },
        playerDemand: [],
        hourlyDistribution: [],
        orderMetrics: {
            totalRevenue: 0,
            averageOrderValue: 0,
            totalOrders: 0,
            depositPercentage: 0,
            pixelpayOrdersCount: 0,
            transferOrdersCount: 0,
            discountedOrdersCount: 0,
            discountUsageRate: 0,
            totalDiscountAmount: 0,
            revenuePerVisitor: 0,
        },
        matchdayMetrics: {
            totalClicks: 0,
            uniqueUsers: 0,
        },
        trackingHealth: {
            hasEvents: false,
            eventsCount: 0,
            truncated: false,
        },
        recentEvents: [],
    };
}

