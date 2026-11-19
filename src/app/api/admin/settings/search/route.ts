import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
    getSearchSettings,
    invalidateSearchSettingsCache,
    SEARCH_SETTINGS_KEY,
} from '@/lib/search/searchSettings';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const aliasRuleSchema = z.object({
    id: z.string().min(1).max(80),
    targetTeam: z.string().trim().min(1, 'El equipo destino es obligatorio').max(80),
    aliases: z.array(z.string().trim().min(2, 'Cada alias debe tener al menos 2 caracteres').max(50)).max(30),
    active: z.boolean(),
});

const synonymRuleSchema = z.object({
    id: z.string().min(1).max(80),
    targetTerm: z.string().trim().min(2, 'El término destino debe tener al menos 2 caracteres').max(60),
    synonyms: z.array(z.string().trim().min(2, 'Cada sinónimo debe tener al menos 2 caracteres').max(50)).max(30),
    active: z.boolean(),
});

const quickChipSchema = z.object({
    id: z.string().min(1).max(80),
    label: z.string().trim().min(1, 'La etiqueta es obligatoria').max(40),
    query: z.string().trim().min(1, 'El término de búsqueda es obligatorio').max(80),
    href: z
        .string()
        .trim()
        .refine((v) => v.startsWith('/'), 'El enlace debe ser una ruta interna (empezando con /)'),
    active: z.boolean(),
});

const updateSearchSettingsSchema = z.object({
    aliases: z.array(aliasRuleSchema).max(200),
    synonyms: z.array(synonymRuleSchema).max(100).optional().default([]),
    quickChips: z.array(quickChipSchema).max(15),
});

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { data: isAdmin } = await supabase.rpc('is_admin');
        if (!isAdmin) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const settings = await getSearchSettings();
        const adminDb = createAdminClient();
        const { data } = await adminDb
            .from('store_settings')
            .select('updated_at')
            .eq('key', SEARCH_SETTINGS_KEY)
            .maybeSingle();

        return NextResponse.json({
            ...settings,
            updated_at: data?.updated_at || null,
        });
    } catch (err) {
        console.error('[admin/settings/search GET] Error:', err);
        return NextResponse.json({ error: 'Error al consultar configuración de búsqueda' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { data: isAdmin } = await supabase.rpc('is_admin');
        if (!isAdmin) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const validation = updateSearchSettingsSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0]?.message || 'Datos inválidos' },
                { status: 400 }
            );
        }

        const payload = validation.data;
        const adminDb = createAdminClient();

        const { error: upsertError } = await adminDb.from('store_settings').upsert(
            {
                key: SEARCH_SETTINGS_KEY,
                value: payload,
                description: 'Alias, apodos de equipos y accesos rápidos del motor de búsqueda',
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
        );

        if (upsertError) {
            console.error('[admin/settings/search POST] Upsert error:', upsertError);
            return NextResponse.json({ error: 'Error al guardar configuración de búsqueda' }, { status: 500 });
        }

        invalidateSearchSettingsCache();
        revalidatePath('/');
        revalidatePath('/catalogo');

        return NextResponse.json({
            success: true,
            message: 'Configuración de búsqueda guardada con éxito',
            settings: payload,
        });
    } catch (err) {
        console.error('[admin/settings/search POST] Error:', err);
        return NextResponse.json({ error: 'Error inesperado al guardar' }, { status: 500 });
    }
}
