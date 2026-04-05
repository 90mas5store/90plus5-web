import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

interface ValidatePayload {
    code: string;
    email: string;
    items: Array<{
        product_id: string;
        variant_id: string;
        quantity: number;
    }>;
}

export async function POST(request: NextRequest) {
    try {
        // 🛡️ Rate limit — 20 req / 10min por IP
        const ip = getClientIp(request);
        const { allowed, retryAfterMs } = await checkRateLimit(`discount-validate:${ip}`, 20, 10 * 60_000);
        if (!allowed) {
            return NextResponse.json(
                { valid: false, message: 'Demasiados intentos. Intenta más tarde.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
            );
        }

        const payload: ValidatePayload = await request.json();
        const { code, email, items } = payload;

        if (!code || !email || !items?.length) {
            return NextResponse.json({ valid: false, message: 'Datos incompletos' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Buscar código activo
        const { data: dc, error: dcError } = await supabase
            .from('discount_codes')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .eq('active', true)
            .maybeSingle();

        if (dcError) throw dcError;

        if (!dc) {
            return NextResponse.json({ valid: false, message: 'Código de descuento inválido o inactivo' });
        }

        // 2. Verificar expiración
        if (dc.expires_at && new Date(dc.expires_at) < new Date()) {
            return NextResponse.json({ valid: false, message: 'Este código de descuento ha expirado' });
        }

        // 3. Verificar usos disponibles
        if (dc.max_uses !== null && dc.used_count >= dc.max_uses) {
            return NextResponse.json({ valid: false, message: 'Este código ha alcanzado su límite de usos' });
        }

        // 4. Verificar que el email no haya usado este código
        const { data: usageRow } = await supabase
            .from('discount_code_usage')
            .select('id')
            .eq('code_id', dc.id)
            .eq('customer_email', email.toLowerCase().trim())
            .maybeSingle();

        if (usageRow) {
            return NextResponse.json({ valid: false, message: 'Ya has utilizado este código de descuento' });
        }

        // 5. Fetch info de productos y variantes
        const productIds = [...new Set(items.map(i => i.product_id))];
        const variantIds = [...new Set(items.map(i => i.variant_id))];

        const [productsRes, variantsRes, leaguesRes] = await Promise.all([
            supabase
                .from('products')
                .select('id, category_id, team_id')
                .in('id', productIds),
            supabase
                .from('product_variants')
                .select('id, price')
                .in('id', variantIds),
            supabase
                .from('product_leagues')
                .select('product_id, league_id')
                .in('product_id', productIds),
        ]);

        if (productsRes.error) throw productsRes.error;
        if (variantsRes.error) throw variantsRes.error;

        const productMap = new Map((productsRes.data ?? []).map(p => [p.id, p]));
        const variantMap = new Map((variantsRes.data ?? []).map(v => [v.id, v]));
        // productId → Set of league_ids
        const productLeaguesMap = new Map<string, Set<string>>();
        for (const pl of (leaguesRes.data ?? [])) {
            if (!productLeaguesMap.has(pl.product_id)) {
                productLeaguesMap.set(pl.product_id, new Set());
            }
            productLeaguesMap.get(pl.product_id)!.add(pl.league_id);
        }

        const categoryScope: string[] = dc.category_ids ?? [];
        const leagueScope: string[] = dc.league_ids ?? [];
        const teamScope: string[] = dc.team_ids ?? [];

        // 6. Calcular descuento sobre ítems elegibles
        let eligibleSubtotal = 0;

        for (const item of items) {
            const product = productMap.get(item.product_id);
            const variant = variantMap.get(item.variant_id);
            if (!product || !variant) continue;

            const productLeagues = productLeaguesMap.get(item.product_id) ?? new Set();

            const matchesCategory =
                categoryScope.length === 0 || categoryScope.includes(product.category_id);
            const matchesLeague =
                leagueScope.length === 0 || leagueScope.some(lid => productLeagues.has(lid));
            const matchesTeam =
                teamScope.length === 0 || teamScope.includes(product.team_id);

            if (matchesCategory && matchesLeague && matchesTeam) {
                eligibleSubtotal += variant.price * item.quantity;
            }
        }

        const discountAmount = Math.round((eligibleSubtotal * dc.discount_pct / 100) * 100) / 100;

        if (discountAmount <= 0) {
            return NextResponse.json({
                valid: false,
                message: 'Este código no aplica a los productos en tu carrito',
            });
        }

        // Construir descripción del alcance
        const scopeParts: string[] = [];
        if (categoryScope.length > 0) scopeParts.push(`${categoryScope.length} categoría(s)`);
        if (leagueScope.length > 0) scopeParts.push(`${leagueScope.length} liga(s)`);
        if (teamScope.length > 0) scopeParts.push(`${teamScope.length} equipo(s)`);
        const scopeDescription = scopeParts.length > 0
            ? scopeParts.join(' · ')
            : 'Todos los productos';

        return NextResponse.json({
            valid: true,
            discount_pct: dc.discount_pct,
            discount_amount: discountAmount,
            eligible_subtotal: eligibleSubtotal,
            scope_description: scopeDescription,
            message: `Descuento del ${dc.discount_pct}% aplicado`,
        });

    } catch (error) {
        console.error('Error validating discount code:', error);
        return NextResponse.json({ valid: false, message: 'Error al validar el código' }, { status: 500 });
    }
}
