export type AnalyticsRange = 'today' | '7d' | '30d' | 'all';

export type AnalyticsEventType =
    | 'page_view'
    | 'product_view'
    | 'search'
    | 'add_to_cart'
    | 'whatsapp_click'
    | 'matchday_click'
    | 'checkout_start'
    | 'purchase';

export interface AnalyticsEventPayload {
    event_type: AnalyticsEventType;
    path: string;
    referrer?: string | null;
    device?: 'mobile' | 'desktop' | 'tablet';
    session_id?: string;
    metadata?: Record<string, unknown>;
    country?: string | null;
    city?: string | null;
    region?: string | null;
}

export interface AnalyticsCountryStat {
    code: string;
    name: string;
    flag: string;
    count: number;
    percentage: number;
}

export interface AnalyticsCityStat {
    city: string;
    country: string;
    count: number;
    percentage: number;
}

export interface AnalyticsShippingRegionStat {
    department: string;
    topMunicipality?: string | null;
    orders: number;
    revenue: number;
    percentage: number;
}

export interface AnalyticsFunnelStep {
    id: 'visit' | 'product' | 'whatsapp' | 'cart' | 'checkout' | 'order';
    name: string;
    description: string;
    count: number;
    percentage: number;
    dropOffPercentage: number;
}

export interface AnalyticsWhatsAppClickItem {
    id: string;
    slug: string;
    productName: string;
    teamName?: string | null;
    version?: string | null;
    size?: string | null;
    patch?: string | null;
    dorsal?: string | null;
    price?: number;
    device: string;
    country?: string | null;
    city?: string | null;
    created_at: string;
}

export interface AnalyticsMissedSearch {
    term: string;
    count: number;
}

export interface AnalyticsSizeStat {
    size: string;
    count: number; // añadidos al carrito
    percentage: number;
    purchasedCount: number; // unidades confirmadas en pedidos
    purchasedPercentage: number;
}

export interface AnalyticsVersionStat {
    version: string;
    cartCount: number;
    cartPercentage: number;
    purchasedUnits: number;
    purchasedPercentage: number;
}

export interface AnalyticsPatchSummary {
    withPatchCartCount: number;
    totalCartCount: number;
    cartRate: number;
    withPatchOrderUnits: number;
    totalOrderUnits: number;
    orderRate: number;
}

export interface AnalyticsPlayerStat {
    name: string;
    number?: string | null;
    count: number; // carrito
    purchasedCount: number; // pedidos confirmados
}

export interface AnalyticsHourlyStat {
    hour: number; // 0..23 (hora local UTC-6)
    label: string; // "14:00"
    views: number;
    orders: number;
    revenue?: number;
}

export interface AnalyticsOrderMetrics {
    totalRevenue: number;
    averageOrderValue: number;
    totalOrders: number;
    depositPercentage: number;
    pixelpayOrdersCount: number;
    transferOrdersCount: number;
    discountedOrdersCount: number;
    discountUsageRate: number;
    totalDiscountAmount: number;
    revenuePerVisitor: number;
}

export interface AnalyticsMatchdayMetrics {
    totalClicks: number;
    uniqueUsers: number;
}

export interface AnalyticsDeltas {
    uniqueVisitorsPct: number | null;
    totalPageViewsPct: number | null;
    conversionRatePct: number | null;
    totalOrdersPct: number | null;
    totalRevenuePct: number | null;
    cartRatePct: number | null;
}

export interface AnalyticsProductStat {
    slug: string;
    name: string;
    teamName?: string | null;
    season?: string | null;
    imageUrl?: string | null;
    views: number;
    carts: number;
    unitsSold: number;
    orders: number;
    revenue: number;
    conversionRate: number;
}

export interface AnalyticsTrafficSourceStat {
    source: string;
    count: number; // sesiones atribuidas (retrocompatible con .count)
    sessions: number;
    orders: number;
    conversionRate: number;
    percentage: number;
}

export interface AnalyticsDeviceStat {
    device: string;
    count: number; // sesiones únicas atribuidas
    sessions: number;
    orders: number;
    conversionRate: number;
    percentage: number;
}

export interface AnalyticsTrackingHealth {
    hasEvents: boolean;
    eventsCount: number;
    truncated: boolean;
}

export interface AnalyticsSummary {
    range?: AnalyticsRange;
    totalPageViews: number;
    uniqueVisitors: number;
    totalProductViews: number;
    totalSearches: number;
    totalCarts: number;
    totalWhatsAppClicks?: number;
    totalOrders?: number;
    totalMatchdayClicks: number;
    conversionRate: number;
    cartRate?: number;
    checkoutAbandonmentRate?: number;
    realtimeActiveVisitors: number;
    deltas?: AnalyticsDeltas;
    conversionFunnel: AnalyticsFunnelStep[];
    whatsappClicks?: AnalyticsWhatsAppClickItem[];
    viewsTrend: {
        date: string;
        views: number;
        visitors: number;
        orders?: number;
        revenue?: number;
    }[];
    topProducts: AnalyticsProductStat[];
    topSearches: {
        term: string;
        count: number;
    }[];
    missedSearches: AnalyticsMissedSearch[];
    trafficSources: AnalyticsTrafficSourceStat[];
    deviceBreakdown: AnalyticsDeviceStat[];
    topCountries: AnalyticsCountryStat[];
    topCities: AnalyticsCityStat[];
    shippingRegions?: AnalyticsShippingRegionStat[];
    sizeDemand: AnalyticsSizeStat[];
    versionDemand?: AnalyticsVersionStat[];
    patchDemand?: AnalyticsPatchSummary;
    playerDemand: AnalyticsPlayerStat[];
    hourlyDistribution: AnalyticsHourlyStat[];
    orderMetrics: AnalyticsOrderMetrics;
    matchdayMetrics: AnalyticsMatchdayMetrics;
    trackingHealth?: AnalyticsTrackingHealth;
    recentEvents: {
        id: string;
        event_type: AnalyticsEventType;
        path: string;
        referrer?: string | null;
        device: string;
        country?: string | null;
        city?: string | null;
        metadata?: Record<string, unknown>;
        created_at: string;
    }[];
    tableNeedsMigration?: boolean;
}
