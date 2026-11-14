import { describe, it, expect } from 'vitest';
import { aggregateEvents, type RawAnalyticsEvent } from '@/lib/analytics/eventsAggregator';
import { aggregateOrders, type RawAnalyticsOrder } from '@/lib/analytics/ordersAggregator';
import { buildAnalyticsSummary } from '@/lib/analytics/statsBuilder';
import { getAnalyticsDateRange, getStoreRangeDateStrings } from '@/lib/analytics/range';
import { getStoreDayEndIso, getStoreDayStartIso } from '@/lib/analytics/timezone';

describe('Analytics Engine (Fase 1)', () => {
    it('attributes traffic sources, devices, and countries per unique session (first-touch)', () => {
        const now = new Date('2026-11-13T18:00:00.000Z'); // 12:00 PM Honduras
        const events: RawAnalyticsEvent[] = [
            // Sesión 1: entra desde Instagram en móvil, luego navega internamente y compra
            {
                id: 'e1',
                event_type: 'page_view',
                path: '/catalogo',
                referrer: 'https://l.instagram.com/',
                device: 'mobile',
                session_id: 'sess_ig_1',
                country: 'HN',
                city: 'San Pedro Sula',
                created_at: '2026-11-13T17:00:00.000Z',
            },
            {
                id: 'e2',
                event_type: 'product_view',
                path: '/producto/real-madrid-local',
                referrer: 'https://90plus5.store/catalogo',
                device: 'mobile',
                session_id: 'sess_ig_1',
                metadata: { slug: 'real-madrid-local', productName: 'Real Madrid Local', teamName: 'Real Madrid' },
                created_at: '2026-11-13T17:02:00.000Z',
            },
            {
                id: 'e3',
                event_type: 'add_to_cart',
                path: '/producto/real-madrid-local',
                referrer: 'https://90plus5.store/producto/real-madrid-local',
                device: 'mobile',
                session_id: 'sess_ig_1',
                metadata: {
                    productId: 'prod-1',
                    modelo: 'Real Madrid Local',
                    talla: 'L',
                    version: 'Jugador',
                    parche: 'Champions League',
                    dorsalNombre: 'Bellingham',
                    dorsalNumero: '5',
                    cantidad: 1,
                },
                created_at: '2026-11-13T17:03:00.000Z',
            },
            {
                id: 'e4',
                event_type: 'purchase',
                path: '/checkout/done',
                referrer: 'https://90plus5.store/checkout',
                device: 'mobile',
                session_id: 'sess_ig_1',
                created_at: '2026-11-13T17:05:00.000Z',
            },
            // Sesión 2: entra directo en desktop y busca algo sin stock
            {
                id: 'e5',
                event_type: 'page_view',
                path: '/',
                referrer: null,
                device: 'desktop',
                session_id: 'sess_dir_2',
                country: 'US',
                city: 'Miami',
                created_at: '2026-11-13T17:55:00.000Z',
            },
            {
                id: 'e6',
                event_type: 'search',
                path: '/catalogo',
                referrer: 'https://90plus5.store/',
                device: 'desktop',
                session_id: 'sess_dir_2',
                metadata: { searchTerm: 'Olimpia retro', resultsCount: 0, has_results: false },
                created_at: '2026-11-13T17:56:00.000Z',
            },
        ];

        const eventsAgg = aggregateEvents(events, { host: '90plus5.store', now });

        const orders: RawAnalyticsOrder[] = [
            {
                id: 'ord-1',
                created_at: '2026-11-13T17:05:00.000Z',
                status: 'deposit_paid',
                total_amount: 1650,
                deposit_amount: 825,
                discount_amount: 150,
                shipping_department: 'Cortés',
                shipping_municipality: 'San Pedro Sula',
                payments: [{ method: 'tarjeta', provider: 'pixelpay', type: 'full', status: 'verified', amount: 1650 }],
                order_items: [
                    {
                        quantity: 1,
                        unit_price: 1650,
                        custom_name: 'Bellingham',
                        custom_number: '5',
                        products: { id: 'prod-1', slug: 'real-madrid-local', name: 'Real Madrid Local', season: 'Oficial', teams: { name: 'Real Madrid' } },
                        product_variants: { version: 'Player' },
                        sizes: { label: 'L' },
                        patches: { name: 'Champions League' },
                    },
                ],
            },
            // Cancelada: debe excluirse de ventas/AOV/conversión
            {
                id: 'ord-cancelled',
                created_at: '2026-11-13T16:00:00.000Z',
                status: 'cancelled',
                total_amount: 9999,
                deposit_amount: 4999,
                discount_amount: 0,
                shipping_department: 'Francisco Morazán',
                payments: [{ method: 'transferencia', provider: 'manual', type: 'deposit', status: 'pending', amount: 4999 }],
            },
        ];

        const ordersAgg = aggregateOrders(orders);
        const summary = buildAnalyticsSummary({
            range: 'today',
            eventsAgg,
            ordersAgg,
            recentEvents: events,
            daysToGenerate: 1,
            now,
            previousBaseline: {
                uniqueVisitors: 1,
                totalPageViews: 1,
                totalOrders: 1,
                totalRevenue: 1000,
                cartSessions: 0,
            },
            eventsCount: events.length,
            truncated: false,
        });

        // Sesión 1 no fue sobrescrita por URLs internas -> 1 sesión IG + 1 Directo = 50% c/u
        expect(summary.trafficSources).toEqual([
            { source: 'Instagram', count: 1, sessions: 1, orders: 1, conversionRate: 100, percentage: 50 },
            { source: 'Directo / Navegador', count: 1, sessions: 1, orders: 0, conversionRate: 0, percentage: 50 },
        ]);

        // Métricas financieras reales de `orders` sin canceladas y pago completo PixelPay detectado
        expect(summary.orderMetrics.totalOrders).toBe(1);
        expect(summary.orderMetrics.totalRevenue).toBe(1650);
        expect(summary.orderMetrics.pixelpayOrdersCount).toBe(1);
        expect(summary.orderMetrics.transferOrdersCount).toBe(0);
        expect(summary.orderMetrics.depositPercentage).toBe(0); // `payments.type === 'full'`
        expect(summary.orderMetrics.discountedOrdersCount).toBe(1);
        expect(summary.orderMetrics.totalDiscountAmount).toBe(150);

        // Versión Jugador y Parche unificados (Jugador + Player -> Versión Jugador)
        expect(summary.versionDemand).toEqual([
            { version: 'Versión Jugador', cartCount: 1, cartPercentage: 100, purchasedUnits: 1, purchasedPercentage: 100 },
        ]);
        expect(summary.patchDemand?.cartRate).toBe(100);
        expect(summary.patchDemand?.orderRate).toBe(100);

        // Regiones de envío reales
        expect(summary.shippingRegions).toEqual([
            { department: 'Cortés', topMunicipality: 'San Pedro Sula', orders: 1, revenue: 1650, percentage: 100 },
        ]);

        // Radar de búsqueda sin stock y cruce de producto
        expect(summary.missedSearches).toEqual([{ term: 'olimpia retro', count: 1 }]);
        expect(summary.topProducts[0]).toMatchObject({
            slug: 'real-madrid-local',
            views: 1,
            carts: 1,
            unitsSold: 1,
            orders: 1,
            conversionRate: 100,
        });

        // Deltas vs período anterior
        expect(summary.deltas?.uniqueVisitorsPct).toBe(100);
        expect(summary.deltas?.totalRevenuePct).toBe(65);
    });

    it('keeps date bounds anchored to America/Tegucigalpa (UTC-6) late at night', () => {
        // 2026-11-14T04:30:00Z = 2026-11-13 22:30 hora Honduras (UTC-6)
        const lateNightHonduras = new Date('2026-11-14T04:30:00.000Z');
        const { startStr, endStr } = getStoreRangeDateStrings('today', lateNightHonduras);
        expect(startStr).toBe('2026-11-13');
        expect(endStr).toBe('2026-11-13');

        expect(getStoreDayStartIso('2026-11-13')).toBe('2026-11-13T06:00:00.000Z');
        expect(getStoreDayEndIso('2026-11-13')).toBe('2026-11-14T05:59:59.999Z');

        const range7d = getAnalyticsDateRange('7d', lateNightHonduras);
        expect(range7d.daysToGenerate).toBe(7);
        expect(range7d.prevStartDate).not.toBeNull();
        expect(range7d.prevEndDate).not.toBeNull();
    });
});

