import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSeasonSettings, invalidateSeasonSettingsCache, DEFAULT_SEASON_SETTINGS } from '@/lib/seasonSettings';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateSeasonSchema = z.object({
    season: z.string().min(2, 'La temporada es requerida').max(20, 'Temporada demasiado larga'),
    seasonShort: z.string().min(2, 'La abreviatura es requerida').max(10, 'Abreviatura demasiado larga'),
    badge: z.string().min(1, 'El badge es requerido').max(30),
    title: z.string().min(1, 'El título es requerido').max(60),
    subtitle: z.string().min(1, 'El subtítulo es requerido').max(150),
    buttonText: z.string().min(1, 'El texto del botón es requerido').max(40),
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

        const settings = await getSeasonSettings();
        const adminDb = createAdminClient();
        const { data } = await adminDb
            .from('store_settings')
            .select('updated_at')
            .eq('key', 'current_season')
            .maybeSingle();

        return NextResponse.json({
            ...settings,
            updated_at: data?.updated_at || null,
        });
    } catch (err) {
        console.error('[admin/settings/season GET] Error:', err);
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
        const parsed = updateSeasonSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
                { status: 400 }
            );
        }

        const adminDb = createAdminClient();
        const { data, error } = await adminDb
            .from('store_settings')
            .upsert(
                {
                    key: 'current_season',
                    value: parsed.data,
                    description: 'Temporada activa oficial y configuración de la tarjeta promocional del header',
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'key' }
            )
            .select()
            .single();

        if (error) {
            console.error('[admin/settings/season POST] Error updating DB:', error);
            return NextResponse.json({ error: 'Error al guardar en base de datos' }, { status: 500 });
        }

        // Invalidar caché en memoria
        invalidateSeasonSettingsCache();

        // Revalidar paths de Next.js
        try {
            revalidatePath('/', 'layout');
            revalidatePath('/catalogo');
        } catch { /* ignore in edge/dev */ }

        return NextResponse.json({
            success: true,
            data: parsed.data,
            updated_at: data?.updated_at,
            message: 'Configuración de temporada actualizada correctamente',
        });
    } catch (err) {
        console.error('[admin/settings/season POST] Error:', err);
        return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
    }
}
