'use client';

import React from 'react';
import { Download, FileJson } from 'lucide-react';
import type { AnalyticsRange, AnalyticsSummary } from '@/lib/analytics/types';
import type { BestSellerItem, ShareStatItem } from '@/components/admin/reportes/types';
import { getStoreRangeDateStrings } from '@/lib/analytics/range';
import useToastMessage from '@/hooks/useToastMessage';

interface AnalyticsExportButtonProps {
    data: AnalyticsSummary | null;
    range: AnalyticsRange;
    bestSellers?: BestSellerItem[];
    kitShares?: ShareStatItem[];
}

const RANGE_LABELS: Record<AnalyticsRange, string> = {
    today: 'Hoy (UTC-6)',
    '7d': 'Últimos 7 Días (UTC-6)',
    '30d': 'Últimos 30 Días (UTC-6)',
    all: 'Histórico Completo',
};

function triggerBlobDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export default function AnalyticsExportButton({
    data,
    range,
    bestSellers = [],
    kitShares = [],
}: AnalyticsExportButtonProps) {
    const toast = useToastMessage();

    const handleExportJson = () => {
        if (!data) {
            toast.error('No hay datos disponibles para exportar');
            return;
        }

        const { startStr, endStr } = getStoreRangeDateStrings(range);
        const now = new Date();
        const payload = {
            meta: {
                store: '90+5 Store',
                range,
                rangeLabel: RANGE_LABELS[range] || range,
                periodStart: startStr,
                periodEnd: endStr,
                timezone: 'America/Tegucigalpa (UTC-6)',
                exportedAtIso: now.toISOString(),
                exportedAtLocal: now.toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' }),
            },
            kpis: {
                uniqueVisitors: data.uniqueVisitors,
                totalPageViews: data.totalPageViews,
                totalProductViews: data.totalProductViews,
                totalSearches: data.totalSearches,
                totalCarts: data.totalCarts,
                totalOrders: data.orderMetrics.totalOrders,
                conversionRate: data.conversionRate,
                cartRate: data.cartRate ?? 0,
                checkoutAbandonmentRate: data.checkoutAbandonmentRate ?? 0,
                realtimeActiveVisitors: data.realtimeActiveVisitors,
                deltas: data.deltas ?? null,
            },
            orderMetrics: data.orderMetrics,
            conversionFunnel: data.conversionFunnel,
            trends: {
                daily: data.viewsTrend,
                hourlyUtc6: data.hourlyDistribution,
            },
            catalogAndDemand: {
                topProducts: data.topProducts,
                bestSellers,
                kitShares,
                sizeDemand: data.sizeDemand,
                versionDemand: data.versionDemand ?? [],
                patchDemand: data.patchDemand ?? null,
                playerDemand: data.playerDemand,
                topSearches: data.topSearches,
                missedSearches: data.missedSearches,
            },
            audienceAndTraffic: {
                trafficSources: data.trafficSources,
                deviceBreakdown: data.deviceBreakdown,
                shippingRegions: data.shippingRegions ?? [],
                topCountries: data.topCountries,
                topCities: data.topCities,
                matchdayMetrics: data.matchdayMetrics,
                recentEvents: data.recentEvents,
            },
        };

        const jsonString = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        triggerBlobDownload(blob, `analiticas_90plus5_${range}_${endStr}.json`);
        toast.celebrate(`¡Archivo JSON (${RANGE_LABELS[range]}) descargado!`);
    };

    const handleExportCsv = () => {
        if (!data) {
            toast.error('No hay datos disponibles para exportar');
            return;
        }

        const { startStr, endStr } = getStoreRangeDateStrings(range);
        const lines: string[] = [];

        lines.push('Reporte de Analíticas 90+5 Store');
        lines.push(`Período seleccionado,${RANGE_LABELS[range] || range} (${startStr} a ${endStr})`);
        lines.push(`Fecha de exportación,${new Date().toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' })} (UTC-6)`);
        lines.push('');

        lines.push('--- MÉTRICAS PRINCIPALES ---');
        lines.push(`Visitantes Únicos,${data.uniqueVisitors}`);
        lines.push(`Vistas de Página,${data.totalPageViews}`);
        lines.push(`Vistas de Fichas de Camisetas,${data.totalProductViews}`);
        lines.push(`Productos Añadidos al Carrito,${data.totalCarts}`);
        lines.push(`Pedidos Válidos,${data.orderMetrics.totalOrders}`);
        lines.push(`Facturación del Período (L),${data.orderMetrics.totalRevenue}`);
        lines.push(`Ticket Promedio AOV (L),${data.orderMetrics.averageOrderValue}`);
        lines.push(`Tasa de Conversión Global,${data.conversionRate}%`);
        lines.push(`Tasa de Adición al Carrito,${data.cartRate ?? 0}%`);
        lines.push(`Abandono de Checkout,${data.checkoutAbandonmentRate ?? 0}%`);
        lines.push('');

        if (data.conversionFunnel.length > 0) {
            lines.push('--- EMBUDO DE CONVERSIÓN ---');
            lines.push('Etapa,Sesiones,Porcentaje,Tasa de Fuga');
            data.conversionFunnel.forEach((step) => {
                lines.push(`"${step.name}",${step.count},${step.percentage}%,${step.dropOffPercentage}%`);
            });
            lines.push('');
        }

        if (data.topProducts.length > 0) {
            lines.push('--- RENDIMIENTO DE CAMISETAS (VISTAS Y CONVERSIÓN) ---');
            lines.push('Posición,Camiseta,Equipo,Temporada,Vistas,Carritos,Unidades Vendidas,Pedidos,Ingresos (L),Conversión %');
            data.topProducts.forEach((prod, idx) => {
                lines.push(
                    `${idx + 1},"${prod.name}","${prod.teamName || 'N/A'}","${prod.season || 'Oficial'}",${prod.views},${prod.carts},${prod.unitsSold},${prod.orders},${prod.revenue},${prod.conversionRate}%`
                );
            });
            lines.push('');
        }

        if (data.versionDemand && data.versionDemand.length > 0) {
            lines.push('--- DEMANDA POR VERSIÓN ---');
            lines.push('Versión,Unidades Compradas,% Comprado,Unidades Carrito,% Carrito');
            data.versionDemand.forEach((v) => {
                lines.push(`"${v.version}",${v.purchasedUnits},${v.purchasedPercentage}%,${v.cartCount},${v.cartPercentage}%`);
            });
            lines.push('');
        }

        if (data.sizeDemand.length > 0) {
            lines.push('--- DEMANDA POR TALLAS ---');
            lines.push('Talla,Unidades Compradas,% Comprado,Unidades Carrito,% Carrito');
            data.sizeDemand.forEach((s) => {
                lines.push(`"${s.size}",${s.purchasedCount},${s.purchasedPercentage}%,${s.count},${s.percentage}%`);
            });
            lines.push('');
        }

        if (data.trafficSources.length > 0) {
            lines.push('--- FUENTES DE TRÁFICO (POR SESIÓN ÚNICA) ---');
            lines.push('Canal,Sesiones,Participación %,Pedidos,Conversión %');
            data.trafficSources.forEach((src) => {
                lines.push(`"${src.source}",${src.sessions},${src.percentage}%,${src.orders},${src.conversionRate}%`);
            });
            lines.push('');
        }

        if (data.shippingRegions && data.shippingRegions.length > 0) {
            lines.push('--- DEPARTAMENTOS DE COMPRA (ENVÍOS REALES) ---');
            lines.push('Departamento,Municipio Principal,Pedidos,Ingresos (L),Participación %');
            data.shippingRegions.forEach((reg) => {
                lines.push(`"${reg.department}","${reg.topMunicipality || 'Varios'}",${reg.orders},${reg.revenue},${reg.percentage}%`);
            });
            lines.push('');
        }

        if (data.missedSearches.length > 0) {
            lines.push('--- RADAR DE DEMANDA (BÚSQUEDAS SIN STOCK) ---');
            lines.push('Término Buscado,Frecuencia');
            data.missedSearches.forEach((item) => {
                lines.push(`"${item.term}",${item.count}`);
            });
            lines.push('');
        }

        const csvContent = '\uFEFF' + lines.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerBlobDownload(blob, `analiticas_90plus5_${range}_${endStr}.csv`);
        toast.celebrate(`¡Reporte CSV (${RANGE_LABELS[range]}) descargado!`);
    };

    return (
        <div className="inline-flex items-center gap-1.5">
            <button
                type="button"
                onClick={handleExportJson}
                disabled={!data}
                className="bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Descargar JSON (${RANGE_LABELS[range] || range})`}
            >
                <FileJson className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>JSON</span>
            </button>

            <button
                type="button"
                onClick={handleExportCsv}
                disabled={!data}
                className="bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Descargar CSV / Excel (${RANGE_LABELS[range] || range})`}
            >
                <Download className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>CSV</span>
            </button>
        </div>
    );
}
