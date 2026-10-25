import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMarqueeSettings, invalidateMarqueeSettingsCache } from '@/lib/marqueeSettings';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const marqueeItemSchema = z.object({
    id: z.string().min(1),
    icon: z.enum(['clock', 'truck', 'sparkles', 'shield', 'message', 'flame', 'star', 'tag', 'zap']),
    highlight: z.string().max(50, 'El texto destacado no puede superar 50 caracteres'),
    text: z.string().min(1, 'El texto es obligatorio').max(250, 'El texto no puede superar 250 caracteres'),
    active: z.boolean(),
});

const updateMarqueeSchema = z.object({
    enabled: z.boolean(),
    speedSeconds: z.number().min(10, 'Velocidad mínima 10s').max(120, 'Velocidad máxima 120s'),
    autoCalculateCutoff: z.boolean(),
    items: z.array(marqueeItemSchema).min(1, 'Debe haber al menos un aviso configurado'),
});

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { data: isAdmin } = await supabase.rpc('is_admin');
        if (!isAdmin) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const settings = await getMarqueeSettings();
        const adminDb = createAdminClient();
        const { data } = await adminDb
            .from('store_settings')
            .select('updated_at')
            .eq('key', 'marquee_bar_config')
            .maybeSingle();

        return NextResponse.json({
            ...settings,
            updated_at: data?.updated_at || null,
        });
    } catch (err) {
        console.error('[admin/settings/marquee GET] Error:', err);
        return NextResponse.json({ error: 'Error al consultar configuración' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { data: isAdmin } = await supabase.rpc('is_admin');
        if (!isAdmin) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const validation = updateMarqueeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0]?.message || 'Datos inválidos' },
                { status: 400 }
            );
        }

        const payload = validation.data;
        const adminDb = createAdminClient();

        const { error: upsertError } = await adminDb
            .from('store_settings')
            .upsert({
                key: 'marquee_bar_config',
                value: payload,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });

        if (upsertError) {
            console.error('[admin/settings/marquee POST] Upsert error:', upsertError);
            return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
        }

        // Invalidar caché en memoria y revalidar la página de inicio
        invalidateMarqueeSettingsCache();
        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'Marquesina actualizada con éxito',
            settings: payload,
        });
    } catch (err) {
        console.error('[admin/settings/marquee POST] Error:', err);
        return NextResponse.json({ error: 'Error inesperado al guardar' }, { status: 500 });
    }
}
