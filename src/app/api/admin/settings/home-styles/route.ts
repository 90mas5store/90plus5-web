import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHomeStylesSettings, invalidateHomeStylesSettingsCache } from '@/lib/homeStylesSettings';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const cardConfigSchema = z.object({
    id: z.string(),
    tag: z.string().min(1, 'La etiqueta es requerida').max(40),
    title: z.string().min(1, 'El título es requerido').max(60),
    subtitle: z.string().min(1, 'La descripción es requerida').max(250),
    href: z.string().min(1, 'El enlace es requerido'),
    buttonText: z.string().min(1, 'El texto del botón es requerido').max(40),
});

const updateStylesSchema = z.object({
    enabled: z.boolean(),
    badge: z.string().min(1).max(40),
    title: z.string().min(1).max(80),
    subtitle: z.string().max(250),
    card1: cardConfigSchema,
    card2: cardConfigSchema,
    card3: cardConfigSchema,
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

        const settings = await getHomeStylesSettings();
        const adminDb = createAdminClient();
        const { data } = await adminDb
            .from('store_settings')
            .select('updated_at')
            .eq('key', 'home_styles_bento_config')
            .maybeSingle();

        return NextResponse.json({
            ...settings,
            updated_at: data?.updated_at || null,
        });
    } catch (err) {
        console.error('[admin/settings/home-styles GET] Error:', err);
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
        const validation = updateStylesSchema.safeParse(body);

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
                key: 'home_styles_bento_config',
                value: payload,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });

        if (upsertError) {
            console.error('[admin/settings/home-styles POST] Upsert error:', upsertError);
            return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
        }

        invalidateHomeStylesSettingsCache();
        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'Guía de Estilos actualizada con éxito',
            settings: payload,
        });
    } catch (err) {
        console.error('[admin/settings/home-styles POST] Error:', err);
        return NextResponse.json({ error: 'Error inesperado al guardar' }, { status: 500 });
    }
}
