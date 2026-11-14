'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAnalyticsData } from '@/components/admin/analytics/useAnalyticsData';
import AnalyticsToolbar from '@/components/admin/analytics/AnalyticsToolbar';
import AnalyticsKpiGrid from '@/components/admin/analytics/AnalyticsKpiGrid';
import AnalyticsTrafficTrendCard from '@/components/admin/analytics/AnalyticsTrafficTrendCard';
import AnalyticsFunnelCard from '@/components/admin/analytics/AnalyticsFunnelCard';
import AnalyticsCatalogMatrixCard from '@/components/admin/analytics/AnalyticsCatalogMatrixCard';
import AnalyticsSoccerInsightsCard from '@/components/admin/analytics/AnalyticsSoccerInsightsCard';
import AnalyticsSearchInsightsCard from '@/components/admin/analytics/AnalyticsSearchInsightsCard';
import AnalyticsAcquisitionCard from '@/components/admin/analytics/AnalyticsAcquisitionCard';
import AnalyticsGeoCard from '@/components/admin/analytics/AnalyticsGeoCard';
import AnalyticsLiveFeedCard from '@/components/admin/analytics/AnalyticsLiveFeedCard';

interface AdminAnaliticasPageProps {
    embedded?: boolean;
}

export default function AdminAnaliticasPage({ embedded = false }: AdminAnaliticasPageProps) {
    const {
        range,
        setRange,
        activeView,
        setActiveView,
        loading,
        data,
        bestSellers,
        kitShares,
        refresh,
    } = useAnalyticsData('7d');

    return (
        <div className={embedded ? 'space-y-4 sm:space-y-5' : 'space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-20'}>
            <AnalyticsToolbar
                embedded={embedded}
                range={range}
                onRangeChange={setRange}
                activeView={activeView}
                onViewChange={setActiveView}
                loading={loading}
                onRefresh={refresh}
                data={data}
                bestSellers={bestSellers}
                kitShares={kitShares}
            />

            {data?.tableNeedsMigration && (
                <div className="p-4 rounded-2xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white">
                            Habilitar tabla de eventos en Supabase
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                            Ejecuta <code>supabase/migrations/20260831_analytics_events.sql</code> y{' '}
                            <code>20261113_analytics_geolocation.sql</code> en el SQL Editor para guardar eventos de navegación. Las métricas de pedidos reales ya están activas.
                        </p>
                    </div>
                </div>
            )}

            {/* VISTA 1: RESUMEN & EMBUDO */}
            {activeView === 'overview' && (
                <div className="space-y-4 sm:space-y-5">
                    <AnalyticsKpiGrid data={data} loading={loading} />
                    <AnalyticsTrafficTrendCard
                        viewsTrend={data?.viewsTrend || []}
                        hourlyData={data?.hourlyDistribution || []}
                        loading={loading}
                    />
                    <AnalyticsFunnelCard
                        funnel={data?.conversionFunnel || []}
                        loading={loading}
                    />
                </div>
            )}

            {/* VISTA 2: CATÁLOGO & DEMANDA */}
            {activeView === 'catalog' && (
                <div className="space-y-4 sm:space-y-5">
                    <AnalyticsCatalogMatrixCard
                        topProducts={data?.topProducts || []}
                        bestSellers={bestSellers}
                        kitShares={kitShares}
                        loading={loading}
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        <AnalyticsSoccerInsightsCard
                            sizes={data?.sizeDemand || []}
                            versions={data?.versionDemand || []}
                            patches={data?.patchDemand}
                            players={data?.playerDemand || []}
                            loading={loading}
                        />
                        <AnalyticsSearchInsightsCard
                            missedSearches={data?.missedSearches || []}
                            topSearches={data?.topSearches || []}
                        />
                    </div>
                </div>
            )}

            {/* VISTA 3: AUDIENCIA & TRÁFICO */}
            {activeView === 'audience' && (
                <div className="space-y-4 sm:space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        <AnalyticsAcquisitionCard
                            trafficSources={data?.trafficSources || []}
                            deviceBreakdown={data?.deviceBreakdown || []}
                            matchdayMetrics={data?.matchdayMetrics}
                        />
                        <AnalyticsGeoCard
                            shippingRegions={data?.shippingRegions || []}
                            countries={data?.topCountries || []}
                            cities={data?.topCities || []}
                            loading={loading}
                        />
                    </div>
                    <AnalyticsLiveFeedCard
                        recentEvents={data?.recentEvents || []}
                        loading={loading}
                    />
                </div>
            )}
        </div>
    );
}
