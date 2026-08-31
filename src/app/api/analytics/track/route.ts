import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { z } from 'zod';

const eventSchema = z.object({
    event_type: z.enum([
        'page_view',
        'product_view',
        'search',
        'add_to_cart',
        'matchday_click',
        'checkout_start',
    ]),
    path: z.string().max(500),
    referrer: z.string().max(1000).nullable().optional(),
    device: z.enum(['mobile', 'desktop', 'tablet']).optional(),
    session_id: z.string().max(100).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        // Rate limit amplio para permitir eventos legítimos de navegación (60 eventos por minuto por IP)
        const rl = await checkRateLimit(`analytics:${ip}`, 60, 60 * 1000);
        if (!rl.allowed) {
            return NextResponse.json({ ok: false, message: 'Rate limited' }, { status: 429 });
        }

        const body = await request.json().catch(() => null);
        const parse = eventSchema.safeParse(body);
        if (!parse.success) {
            return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
        }

        const { event_type, path, referrer, device, session_id, metadata } = parse.data;

        // No registrar eventos en rutas administrativas
        if (path.startsWith('/admin')) {
            return NextResponse.json({ ok: true, ignored: true });
        }

        const supabase = createAdminClient();
        const { error } = await supabase.from('analytics_events').insert({
            event_type,
            path: path.slice(0, 500),
            referrer: referrer ? referrer.slice(0, 1000) : null,
            device: device || 'desktop',
            session_id: session_id || 'anon_' + Math.random().toString(36).substring(2, 12),
            metadata: metadata || {},
        });

        if (error) {
            // Loguear silenciosamente si la tabla aún no existe o error temporal
            console.warn('[analytics/track] DB write warning:', error.message);
            return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error('[analytics/track] Unexpected error:', err);
        return NextResponse.json({ ok: true }); // Retornar 200 para que el cliente continúe sin fallos
    }
}
