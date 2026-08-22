import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
    const slug = request.nextUrl.searchParams.get('slug');
    if (!slug) return NextResponse.json({ count: 0 });

    const supabase = createAdminClient();
    const { count, error } = await supabase
        .from('product_share_events')
        .select('*', { count: 'exact', head: true })
        .eq('product_slug', slug);

    if (error) return NextResponse.json({ count: 0 });
    return NextResponse.json({ count: count ?? 0 }, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
}

import { shareAnalyticsSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const rl = await checkRateLimit(`share:${ip}`, 30, 10 * 60 * 1000);
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const parseResult = shareAnalyticsSchema.safeParse(body);
    if (!parseResult.success) {
        return NextResponse.json({ error: 'Missing product name or slug' }, { status: 400 });
    }

    const { product_slug, product_name, team_name } = parseResult.data;
    const name = product_name || product_slug || '';
    const slug = product_slug || product_name || 'desconocido';

    const supabase = createAdminClient();
    const { error } = await supabase.from('product_share_events').insert({
        product_slug: String(slug).slice(0, 200),
        product_name: String(name).slice(0, 200),
        team_name: team_name ? String(team_name).slice(0, 200) : null,
    });

    if (error) {
        console.error('[share/route] insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
