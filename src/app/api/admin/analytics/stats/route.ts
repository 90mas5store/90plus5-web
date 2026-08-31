import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AnalyticsSummary } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';

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

        const range = request.nextUrl.searchParams.get('range') || '7d'; // 'today', '7d', '30d', 'all'
        const now = new Date();
        let startDate: Date;

        if (range === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (range === '30d') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (range === 'all') {
            startDate = new Date(0);
        } else {
            // Default: 7d
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        const adminDb = createAdminClient();

        // 1. Consultar eventos en el rango
        const { data: events, error: eventsError } = await adminDb
            .from('analytics_events')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false })
            .limit(5000);

        if (eventsError) {
            console.warn('[admin/analytics/stats] Error querying analytics_events:', eventsError.message);
            const isMissingTable = eventsError.code === 'PGRST205' || eventsError.message?.includes('schema cache');
            return NextResponse.json({
                ...getEmptySummary(),
                tableNeedsMigration: isMissingTable,
            });
        }

        if (!events || events.length === 0) {
            return NextResponse.json(getEmptySummary());
        }

        // 2. Procesar métricas
        let totalPageViews = 0;
        let totalProductViews = 0;
        let totalSearches = 0;
        let totalCarts = 0;
        let totalMatchdayClicks = 0;
        const uniqueSessions = new Set<string>();

        const dailyMap = new Map<string, { views: number; visitors: Set<string> }>();
        const productMap = new Map<string, { name: string; teamName?: string | null; imageUrl?: string | null; views: number }>();
        const searchMap = new Map<string, number>();
        const sourceMap = new Map<string, number>();
        const deviceMap = new Map<string, number>();

        for (const ev of events) {
            const sess = ev.session_id || 'anon';
            uniqueSessions.add(sess);

            // Desglose por tipo de evento
            if (ev.event_type === 'page_view') totalPageViews++;
            if (ev.event_type === 'product_view') totalProductViews++;
            if (ev.event_type === 'search') totalSearches++;
            if (ev.event_type === 'add_to_cart') totalCarts++;
            if (ev.event_type === 'matchday_click') totalMatchdayClicks++;

            // Agrupación Diaria
            const dateKey = ev.created_at ? ev.created_at.split('T')[0] : 'Hoy';
            if (!dailyMap.has(dateKey)) {
                dailyMap.set(dateKey, { views: 0, visitors: new Set() });
            }
            const dayObj = dailyMap.get(dateKey)!;
            dayObj.views++;
            dayObj.visitors.add(sess);

            // Productos más vistos
            if (ev.event_type === 'product_view' && ev.metadata) {
                const slug = ev.metadata.slug || ev.path.replace('/producto/', '') || 'producto';
                const name = ev.metadata.productName || slug;
                const teamName = ev.metadata.teamName || null;
                const imageUrl = ev.metadata.imageUrl || null;

                if (!productMap.has(slug)) {
                    productMap.set(slug, { name, teamName, imageUrl, views: 0 });
                }
                productMap.get(slug)!.views++;
            }

            // Búsquedas
            if (ev.event_type === 'search' && ev.metadata?.searchTerm) {
                const term = String(ev.metadata.searchTerm).trim().toLowerCase();
                if (term) {
                    searchMap.set(term, (searchMap.get(term) || 0) + 1);
                }
            }

            // Fuentes de Tráfico (Referrer / UTM)
            const rawRef = ev.referrer || '';
            let source = 'Directo / Navegador';
            if (rawRef.includes('instagram.com') || rawRef.includes('ig') || ev.metadata?.utm_source === 'instagram') {
                source = 'Instagram';
            } else if (rawRef.includes('facebook.com') || rawRef.includes('fb') || ev.metadata?.utm_source === 'facebook') {
                source = 'Facebook';
            } else if (rawRef.includes('tiktok.com') || ev.metadata?.utm_source === 'tiktok') {
                source = 'TikTok';
            } else if (rawRef.includes('google.com')) {
                source = 'Google';
            } else if (rawRef && !rawRef.includes(request.nextUrl.host)) {
                try {
                    const parsedUrl = new URL(rawRef);
                    source = parsedUrl.hostname.replace('www.', '');
                } catch {
                    source = 'Otros Enlaces';
                }
            }
            sourceMap.set(source, (sourceMap.get(source) || 0) + 1);

            // Dispositivo
            const dev = ev.device || 'desktop';
            deviceMap.set(dev, (deviceMap.get(dev) || 0) + 1);
        }

        // Consultar pedidos completados en el período para tasa de conversión
        const { count: orderCount } = await adminDb
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startDate.toISOString());

        const totalOrders = orderCount || 0;
        const uniqueVisitorCount = uniqueSessions.size || 0;
        // Evitar tasas irreales cuando la tabla de analíticas es más nueva que la tabla de órdenes
        const rawConversion = uniqueVisitorCount > 0 ? (totalOrders / uniqueVisitorCount) * 100 : 0;
        const conversionRate = Math.min(Number(rawConversion.toFixed(1)), 100);

        // Generar línea de tiempo completa para el rango seleccionado (rellenando días con 0)
        const daysToGenerate = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 14 : 14;
        const viewsTrend: { date: string; views: number; visitors: number }[] = [];
        
        for (let i = daysToGenerate - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = d.toISOString().split('T')[0];
            const found = dailyMap.get(dateStr);
            viewsTrend.push({
                date: dateStr,
                views: found ? found.views : 0,
                visitors: found ? found.visitors.size : 0,
            });
        }

        // Top 10 Productos
        const topProducts = Array.from(productMap.entries())
            .map(([slug, data]) => ({
                slug,
                name: data.name,
                teamName: data.teamName,
                imageUrl: data.imageUrl,
                views: data.views,
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10);

        // Top 10 Búsquedas
        const topSearches = Array.from(searchMap.entries())
            .map(([term, count]) => ({ term, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Fuentes de Tráfico ordenadas con porcentaje
        const totalSourceEvents = Array.from(sourceMap.values()).reduce((a, b) => a + b, 0) || 1;
        const trafficSources = Array.from(sourceMap.entries())
            .map(([source, count]) => ({
                source,
                count,
                percentage: Math.round((count / totalSourceEvents) * 100),
            }))
            .sort((a, b) => b.count - a.count);

        // Dispositivos ordenados con porcentaje
        const totalDevEvents = Array.from(deviceMap.values()).reduce((a, b) => a + b, 0) || 1;
        const deviceBreakdown = Array.from(deviceMap.entries())
            .map(([device, count]) => ({
                device: device === 'mobile' ? 'Móvil' : device === 'tablet' ? 'Tablet' : 'Computadora',
                count,
                percentage: Math.round((count / totalDevEvents) * 100),
            }))
            .sort((a, b) => b.count - a.count);

        const summary: AnalyticsSummary = {
            totalPageViews,
            uniqueVisitors: uniqueSessions.size,
            totalProductViews,
            totalSearches,
            totalCarts,
            totalMatchdayClicks,
            conversionRate: Number(conversionRate.toFixed(2)),
            viewsTrend,
            topProducts,
            topSearches,
            trafficSources,
            deviceBreakdown,
            recentEvents: events.slice(0, 20),
        };

        return NextResponse.json(summary);
    } catch (err: any) {
        console.error('[admin/analytics/stats] Error:', err);
        return NextResponse.json({ error: 'Error al procesar analíticas' }, { status: 500 });
    }
}

function getEmptySummary(): AnalyticsSummary {
    return {
        totalPageViews: 0,
        uniqueVisitors: 0,
        totalProductViews: 0,
        totalSearches: 0,
        totalCarts: 0,
        totalMatchdayClicks: 0,
        conversionRate: 0,
        viewsTrend: [],
        topProducts: [],
        topSearches: [],
        trafficSources: [],
        deviceBreakdown: [],
        recentEvents: [],
    };
}
