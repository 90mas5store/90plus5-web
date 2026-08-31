export type AnalyticsEventType =
    | 'page_view'
    | 'product_view'
    | 'search'
    | 'add_to_cart'
    | 'matchday_click'
    | 'checkout_start';

export interface AnalyticsEventPayload {
    event_type: AnalyticsEventType;
    path: string;
    referrer?: string | null;
    device?: 'mobile' | 'desktop' | 'tablet';
    session_id?: string;
    metadata?: Record<string, any>;
}

export interface AnalyticsSummary {
    totalPageViews: number;
    uniqueVisitors: number;
    totalProductViews: number;
    totalSearches: number;
    totalCarts: number;
    totalMatchdayClicks: number;
    conversionRate: number;
    viewsTrend: { date: string; views: number; visitors: number }[];
    topProducts: {
        slug: string;
        name: string;
        teamName?: string | null;
        imageUrl?: string | null;
        views: number;
    }[];
    topSearches: {
        term: string;
        count: number;
    }[];
    trafficSources: {
        source: string;
        count: number;
        percentage: number;
    }[];
    deviceBreakdown: {
        device: string;
        count: number;
        percentage: number;
    }[];
    recentEvents: {
        id: string;
        event_type: AnalyticsEventType;
        path: string;
        referrer?: string | null;
        device: string;
        metadata?: Record<string, any>;
        created_at: string;
    }[];
    tableNeedsMigration?: boolean;
}
