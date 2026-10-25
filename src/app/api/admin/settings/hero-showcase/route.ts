import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHeroShowcaseSettings, invalidateHeroShowcaseCache } from '@/lib/heroSettings';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateHeroSchema = z.object({
    quickTagBadge: z.string().max(60).default(''),
    quickTagAction: z.string().max(60).default(''),
    specsSizes: z.string().max(80).default(''),
    specsVersion: z.string().max(80).default(''),
    trustNotice: z.string().max(160).default(''),
    secondaryButtonText: z.string().max(60).default(''),
    secondaryButtonUrl: z.string().max(120).default('/catalogo'),
    showQuickTag: z.boolean().default(true),
    showSpecs: z.boolean().default(true),
    showTrustNotice: z.boolean().default(true),
    showSecondaryButton: z.boolean().default(true),
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

        const settings = await getHeroShowcaseSettings();
        const adminDb = createAdminClient();
        const { data } = await adminDb
            .from('store_settings')
            .select('updated_at')
            .eq('key', 'hero_showcase_config')
            .maybeSingle();

        return NextResponse.json({
            ...settings,
            updated_at: data?.updated_at || null,
        });
    } catch (err) {
        console.error('[admin/settings/hero-showcase GET] Error:', err);
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
        const parsed = updateHeroSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
                { status: 400 }
            );
        }

        const d = parsed.data;
        const dbPayload = {
            quick_tag_badge: d.quickTagBadge,
            quick_tag_action: d.quickTagAction,
            specs_sizes: d.specsSizes,
            specs_version: d.specsVersion,
            trust_notice: d.trustNotice,
            secondary_button_text: d.secondaryButtonText,
            secondary_button_url: d.secondaryButtonUrl,
            show_quick_tag: d.showQuickTag,
            show_specs: d.showSpecs,
            show_trust_notice: d.showTrustNotice,
            show_secondary_button: d.showSecondaryButton,
        };

        const adminDb = createAdminClient();
        const { data, error } = await adminDb
            .from('store_settings')
            .upsert(
                {
                    key: 'hero_showcase_config',
                    value: dbPayload,
                    description: 'Textos y elementos configurables del Hero de la tienda (píldora interactiva, tallas, confianza y botón secundario)',
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'key' }
            )
            .select()
            .single();

        if (error) {
            console.error('[admin/settings/hero-showcase POST] Error updating DB:', error);
            return NextResponse.json({ error: 'Error al guardar en base de datos' }, { status: 500 });
        }

        // Invalidar caché en memoria
        invalidateHeroShowcaseCache();

        // Revalidar paths de Next.js
        try {
            revalidatePath('/', 'layout');
        } catch { /* ignore in edge/dev */ }

        return NextResponse.json({
            success: true,
            data: d,
            updated_at: data?.updated_at,
            message: 'Configuración del Hero actualizada correctamente',
        });
    } catch (err) {
        console.error('[admin/settings/hero-showcase POST] Error:', err);
        return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
    }
}
