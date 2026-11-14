import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAnalyticsDateRange, isCancelledStatus } from '@/lib/analytics/range';
import { aggregateEvents, normalizeProductKey, type RawAnalyticsEvent } from '@/lib/analytics/eventsAggregator';
import { FOOTBALL_ALIASES } from '@/constants/footballAliases';
import { aggregateOrders, type RawAnalyticsOrder } from '@/lib/analytics/ordersAggregator';
import {
    buildAnalyticsSummary,
    getEmptySummary,
    type PreviousPeriodBaseline,
} from '@/lib/analytics/statsBuilder';

export const dynamic = 'force-dynamic';

const MAX_EVENTS_LIMIT = 25000;

export async function GET(request: NextRequest) {
    try {
        const supabaseUser = await createClient();
        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { data: isAdmin } = await supabaseUser.rpc('is_admin');
        if (!isAdmin) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const now = new Date();
        const {
            range,
            startDate,
            endDate,
            prevStartDate,
            prevEndDate,
            daysToGenerate,
        } = getAnalyticsDateRange(request.nextUrl.searchParams.get('range'), now);

        const adminDb = createAdminClient();
        const startIso = startDate.toISOString();
        const endIso = endDate.toISOString();

        const [eventsRes, ordersRes, prevEventsRes, prevOrdersRes, catalogProdsRes] = await Promise.all([
            adminDb
                .from('analytics_events')
                .select('*')
                .gte('created_at', startIso)
                .lte('created_at', endIso)
                .order('created_at', { ascending: false })
                .limit(MAX_EVENTS_LIMIT),
            adminDb
                .from('orders')
                .select(`
                    id,
                    created_at,
                    status,
                    total_amount,
                    deposit_amount,
                    discount_amount,
                    shipping_department,
                    shipping_municipality,
                    order_items (
                        quantity,
                        unit_price,
                        personalization_type,
                        custom_name,
                        custom_number,
                        products (id, slug, name, season, teams (name)),
                        product_variants (version),
                        sizes (label),
                        patches (name),
                        players (name, number)
                    ),
                    payments:payments!payments_order_id_fkey (method, provider, status, amount, type)
                `)
                .gte('created_at', startIso)
                .lte('created_at', endIso),
            prevStartDate && prevEndDate
                ? adminDb
                    .from('analytics_events')
                    .select('event_type, session_id')
                    .gte('created_at', prevStartDate.toISOString())
                    .lte('created_at', prevEndDate.toISOString())
                    .limit(MAX_EVENTS_LIMIT)
                : Promise.resolve({ data: null, error: null }),
            prevStartDate && prevEndDate
                ? adminDb
                    .from('orders')
                    .select('status, total_amount')
                    .gte('created_at', prevStartDate.toISOString())
                    .lte('created_at', prevEndDate.toISOString())
                : Promise.resolve({ data: null, error: null }),
            adminDb
                .from('products')
                .select('slug, season, name, active, teams (name)'),
        ]);

        const isMissingEventsTable = Boolean(
            eventsRes.error &&
            (eventsRes.error.code === 'PGRST205' || eventsRes.error.message?.includes('schema cache'))
        );

        if (eventsRes.error) {
            console.warn('[admin/analytics/stats] analytics_events warning:', eventsRes.error.message);
        }
        if (ordersRes.error) {
            console.warn('[admin/analytics/stats] orders query warning:', ordersRes.error.message);
        }

        const events = (eventsRes.data || []) as RawAnalyticsEvent[];
        const orders = (ordersRes.data || []) as RawAnalyticsOrder[];

        if (events.length === 0 && orders.length === 0) {
            return NextResponse.json({
                ...getEmptySummary(range),
                ...(isMissingEventsTable ? { tableNeedsMigration: true } : {}),
            });
        }

        // Construir índice del catálogo para enriquecer temporadas y validar búsquedas históricas sin resultsCount
        const seasonLookup = new Map<string, string>();
        const searchableCatalogStrings: string[] = [];
        const dbProds = (catalogProdsRes?.data || []) as Array<{
            slug?: string | null;
            season?: string | null;
            name?: string | null;
            active?: boolean | null;
            teams?: { name?: string | null } | Array<{ name?: string | null }> | null;
        }>;

        for (const p of dbProds) {
            if (p.slug && p.season) {
                seasonLookup.set(p.slug, p.season);
            }
            if (p.active !== false) {
                if (p.name) searchableCatalogStrings.push(normalizeProductKey(p.name));
                const teamObj = Array.isArray(p.teams) ? p.teams[0] : p.teams;
                if (teamObj?.name) searchableCatalogStrings.push(normalizeProductKey(teamObj.name));
            }
        }
        for (const alias of FOOTBALL_ALIASES) {
            const targetNorm = normalizeProductKey(alias.targetTeam);
            if (searchableCatalogStrings.some((s) => s.includes(targetNorm))) {
                searchableCatalogStrings.push(normalizeProductKey(alias.alias));
            }
        }

        // Si un evento histórico de 'search' no traía resultsCount (bug antiguo en móvil), verificar contra el catálogo actual
        if (searchableCatalogStrings.length > 0) {
            for (const ev of events) {
                if (ev.event_type === 'search' && ev.metadata && typeof ev.metadata === 'object') {
                    const meta = ev.metadata as Record<string, unknown>;
                    if (meta.resultsCount === undefined && typeof meta.searchTerm === 'string') {
                        const q = normalizeProductKey(meta.searchTerm);
                        if (q.length >= 2) {
                            const matched = searchableCatalogStrings.some((text) => text.includes(q) || q.includes(text));
                            if (!matched) {
                                meta.has_results = false;
                                meta.resultsCount = 0;
                            }
                        }
                    }
                }
            }
        }

        const eventsAgg = aggregateEvents(events, {
            host: request.nextUrl.host,
            now,
        });
        const ordersAgg = aggregateOrders(orders);

        let previousBaseline: PreviousPeriodBaseline | null = null;
        if (prevStartDate && prevEndDate) {
            const prevEvents = (prevEventsRes.data || []) as { event_type?: string; session_id?: string | null }[];
            const prevOrders = (prevOrdersRes.data || []) as { status?: string | null; total_amount?: number | null }[];

            const prevVisitors = new Set<string>();
            const prevCartSessions = new Set<string>();
            let prevPageViews = 0;

            for (const ev of prevEvents) {
                if (ev.session_id) {
                    prevVisitors.add(ev.session_id);
                    if (ev.event_type === 'add_to_cart') prevCartSessions.add(ev.session_id);
                }
                if (ev.event_type === 'page_view') prevPageViews++;
            }

            let prevValidOrders = 0;
            let prevRevenue = 0;
            for (const o of prevOrders) {
                if (isCancelledStatus(o.status)) continue;
                prevValidOrders++;
                prevRevenue += Number(o.total_amount) || 0;
            }

            previousBaseline = {
                uniqueVisitors: prevVisitors.size,
                totalPageViews: prevPageViews,
                totalOrders: prevValidOrders,
                totalRevenue: prevRevenue,
                cartSessions: prevCartSessions.size,
            };
        }

        const summary = buildAnalyticsSummary({
            range,
            eventsAgg,
            ordersAgg,
            recentEvents: events,
            daysToGenerate,
            now,
            seasonLookup,
            previousBaseline,
            eventsCount: events.length,
            truncated: events.length >= MAX_EVENTS_LIMIT,
        });

        if (isMissingEventsTable) {
            summary.tableNeedsMigration = true;
        }

        return NextResponse.json(summary);
    } catch (err: unknown) {
        console.error('[admin/analytics/stats] Error:', err);
        return NextResponse.json({ error: 'Error al procesar analíticas' }, { status: 500 });
    }
}
