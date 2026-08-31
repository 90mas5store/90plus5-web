import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getExchangeRate, invalidateExchangeRateCache, DEFAULT_HNL_TO_USD_RATE } from '@/lib/exchangeRate';
import { z } from 'zod';

const updateRateSchema = z.object({
    rate: z.number().positive('La tasa debe ser mayor a 0').min(1, 'Monto mínimo inválido').max(500, 'Monto máximo excedido'),
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

        const adminDb = createAdminClient();
        const { data, error } = await adminDb
            .from('store_settings')
            .select('*')
            .eq('key', 'hnl_to_usd_rate')
            .single();

        let currentRate = DEFAULT_HNL_TO_USD_RATE;
        let updatedAt = new Date().toISOString();

        if (!error && data) {
            currentRate = Number(data.value?.rate) || DEFAULT_HNL_TO_USD_RATE;
            updatedAt = data.updated_at || updatedAt;
        }

        return NextResponse.json({
            rate: currentRate,
            updated_at: updatedAt,
            base: 'USD',
            target: 'HNL',
        });
    } catch (err) {
        console.error('[admin/settings/exchange-rate GET] Error:', err);
        return NextResponse.json({ error: 'Error al consultar tasa de cambio' }, { status: 500 });
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
        const parsed = updateRateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
                { status: 400 }
            );
        }

        const newRate = Number(parsed.data.rate.toFixed(2));
        const adminDb = createAdminClient();

        const { data, error } = await adminDb
            .from('store_settings')
            .upsert(
                {
                    key: 'hnl_to_usd_rate',
                    value: { rate: newRate },
                    description: 'Tasa de cambio de Lempiras hondureños (HNL) por cada 1 Dólar estadounidense (USD)',
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'key' }
            )
            .select()
            .single();

        if (error) {
            console.error('[admin/settings/exchange-rate POST] Error updating DB:', error);
            return NextResponse.json({ error: 'Error al guardar en base de datos' }, { status: 500 });
        }

        // Invalidar caché
        invalidateExchangeRateCache();

        return NextResponse.json({
            success: true,
            rate: newRate,
            updated_at: data?.updated_at,
            message: 'Tasa de cambio actualizada correctamente',
        });
    } catch (err) {
        console.error('[admin/settings/exchange-rate POST] Error:', err);
        return NextResponse.json({ error: 'Error al actualizar tasa de cambio' }, { status: 500 });
    }
}
