import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rateLimit';
import { BUSINESS_LOGIC, calcShippingCost } from '@/lib/constants';
import { SITE_URL } from '@/lib/config/site';
import { buildPixelPayHostedUrl } from '@/lib/pixelpay/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
        const { allowed } = await checkRateLimit(`pixelpay-init:${ip}`, 15, 60_000);
        if (!allowed) {
            return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en un momento.' }, { status: 429 });
        }

        const body = await req.json();
        const { orderPayload, paymentType = 'deposit' } = body;

        if (!orderPayload || !orderPayload.items || orderPayload.items.length === 0) {
            return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Obtener y validar información de productos en BD
        const productIds = [...new Set(orderPayload.items.map((i: any) => i.product_id))] as string[];
        const variantIds = [...new Set(orderPayload.items.map((i: any) => i.variant_id).filter(Boolean))] as string[];
        const sizeIds = [...new Set(orderPayload.items.map((i: any) => i.size_id).filter(Boolean))] as string[];

        const { data: dbProducts, error: prodError } = await supabase
            .from('products')
            .select('id, category_id, team_id')
            .in('id', productIds);

        if (prodError || !dbProducts) {
            console.error('❌ [PixelPay initiate] Error en BD al consultar products:', prodError);
            return NextResponse.json({ error: 'Error al verificar productos en la base de datos' }, { status: 500 });
        }

        const productMap = new Map(dbProducts.map((p: any) => [p.id, p]));

        // 2. Obtener precios de variantes (en el catálogo el precio base vive en product_variants)
        let dbVariants: { id: string; price: number }[] = [];
        if (variantIds.length > 0) {
            const { data: variants, error: varError } = await supabase
                .from('product_variants')
                .select('id, price')
                .in('id', variantIds);

            if (varError) {
                console.error('❌ [PixelPay initiate] Error en BD al consultar product_variants:', varError);
                return NextResponse.json({ error: 'Error al verificar variantes de productos' }, { status: 500 });
            }
            dbVariants = variants || [];
        }
        const variantMap = new Map(dbVariants.map((v: any) => [v.id, v]));

        // Obtener recargos por talla si aplican
        let sizeMap = new Map<string, number>();
        if (sizeIds.length > 0) {
            const { data: dbSizes, error: sizeError } = await supabase
                .from('sizes')
                .select('id, additional_cost')
                .in('id', sizeIds);

            if (!sizeError && dbSizes) {
                sizeMap = new Map(dbSizes.map((s: any) => [s.id, Number(s.additional_cost || 0)]));
            }
        }

        let calculatedSubtotal = 0;
        const secureItems = orderPayload.items.map((item: any) => {
            const product = productMap.get(item.product_id);
            if (!product) throw new Error(`Producto no encontrado: ${item.product_id}`);

            if (!item.variant_id) {
                throw new Error(`Producto sin variante definida: ${item.product_id}`);
            }

            const variant = variantMap.get(item.variant_id);
            if (!variant) throw new Error(`Variante no encontrada: ${item.variant_id}`);

            const basePrice = Number(variant.price || 0);
            const sizeSurcharge = item.size_id ? (sizeMap.get(item.size_id) || 0) : 0;
            const unitPrice = basePrice + sizeSurcharge;

            calculatedSubtotal += unitPrice * item.quantity;

            return {
                ...item,
                unit_price: unitPrice,
            };
        });

        // 3. Validar descuento si se proporcionó código
        let discountAmount = 0;
        let discountCodeId: string | null = null;
        if (orderPayload.discount_code) {
            try {
                const discountCode = orderPayload.discount_code.trim().toUpperCase();
                const customerEmail = orderPayload.customer_email.toLowerCase().trim();

                const { data: dc } = await supabase
                    .from('discount_codes')
                    .select('*')
                    .eq('code', discountCode)
                    .eq('active', true)
                    .maybeSingle();

                const isValidCode = dc &&
                    (!dc.expires_at || new Date(dc.expires_at) >= new Date()) &&
                    (dc.max_uses === null || dc.used_count < dc.max_uses);

                if (isValidCode) {
                    const { data: existingUsage } = await supabase
                        .from('discount_code_usage')
                        .select('id')
                        .eq('code_id', dc.id)
                        .eq('customer_email', customerEmail)
                        .maybeSingle();

                    if (!existingUsage) {
                        const { data: productLeaguesData } = await supabase
                            .from('product_leagues')
                            .select('product_id, league_id')
                            .in('product_id', productIds);

                        const productLeaguesMap = new Map<string, Set<string>>();
                        for (const pl of (productLeaguesData ?? [])) {
                            if (!productLeaguesMap.has(pl.product_id)) {
                                productLeaguesMap.set(pl.product_id, new Set());
                            }
                            productLeaguesMap.get(pl.product_id)!.add(pl.league_id);
                        }

                        const productInfoMap = new Map(dbProducts.map((p: any) => [p.id, p]));
                        const categoryScope: string[] = dc.category_ids ?? [];
                        const leagueScope: string[] = dc.league_ids ?? [];
                        const teamScope: string[] = dc.team_ids ?? [];

                        let eligibleSubtotal = 0;
                        for (const item of secureItems) {
                            const product = productInfoMap.get(item.product_id);
                            if (!product) continue;
                            const productLeagues = productLeaguesMap.get(item.product_id) ?? new Set();
                            const matchesCategory = categoryScope.length === 0 || categoryScope.includes(product.category_id);
                            const matchesLeague = leagueScope.length === 0 || leagueScope.some((lid: string) => productLeagues.has(lid));
                            const matchesTeam = teamScope.length === 0 || teamScope.includes(product.team_id);
                            if (matchesCategory && matchesLeague && matchesTeam) {
                                eligibleSubtotal += item.unit_price * item.quantity;
                            }
                        }

                        discountAmount = Math.round((eligibleSubtotal * dc.discount_pct / 100) * 100) / 100;
                        discountCodeId = dc.id;
                    }
                }
            } catch (err) {
                console.warn('[PixelPay initiate] Error validando cupón:', err);
            }
        }

        const shippingCost = calcShippingCost(
            orderPayload.shipping_department ?? '',
            orderPayload.shipping_municipality ?? ''
        );
        const effectiveSubtotal = calculatedSubtotal - discountAmount;
        const total_amount = effectiveSubtotal + shippingCost;
        const deposit_amount = total_amount * BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE;

        // Monto a cobrar en PixelPay hoy
        const chargeAmount = paymentType === 'full' ? total_amount : deposit_amount;

        if (chargeAmount <= 0) {
            return NextResponse.json({ error: 'Monto de orden inválido' }, { status: 400 });
        }

        // 4. Crear orden atómicamente en Supabase
        const cleanUUID = (id: string | null | undefined) => (!id || id.trim() === '') ? null : id;

        const rpcOrderData = {
            subtotal: calculatedSubtotal,
            deposit_amount,
            total_amount,
            discount_amount: discountAmount,
            idempotency_key: orderPayload.idempotency_key || `pixelpay_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            customer_name: orderPayload.customer_name,
            customer_email: orderPayload.customer_email,
            customer_phone: orderPayload.customer_phone,
            shipping_department: orderPayload.shipping_department,
            shipping_municipality: orderPayload.shipping_municipality,
            shipping_address: orderPayload.shipping_address,
        };

        const rpcItems = secureItems.map((item: any) => ({
            product_id: cleanUUID(item.product_id),
            variant_id: cleanUUID(item.variant_id),
            size_id: cleanUUID(item.size_id),
            patch_id: cleanUUID(item.patch_id),
            quantity: item.quantity,
            unit_price: item.unit_price,
            personalization_type: item.personalization_type || 'none',
            player_id: cleanUUID(item.player_id),
            custom_number: item.custom_number ? String(item.custom_number) : null,
            custom_name: item.custom_name ? item.custom_name.trim() : null,
        }));

        const rpcPayment = {
            amount: chargeAmount,
            type: paymentType === 'full' ? 'full' : 'deposit',
            status: 'pending',
            provider: 'pixelpay',
            method: 'tarjeta',
            notes: `Pago en línea con Tarjeta vía PixelPay (${paymentType === 'full' ? '100% Total' : '50% Anticipo'}). Pendiente de confirmación.`,
        };

        const { data: rpcResult, error: rpcError } = await supabase.rpc('create_order_atomic', {
            p_order: rpcOrderData,
            p_items: rpcItems,
            p_payment: rpcPayment,
            p_discount_code_id: discountCodeId,
            p_discount_amount: discountAmount,
            p_customer_email: orderPayload.customer_email.toLowerCase().trim(),
        });

        if (rpcError || !rpcResult) {
            console.error('❌ [PixelPay initiate] Error en create_order_atomic:', rpcError);
            return NextResponse.json(
                { error: 'Error al registrar el pedido en la base de datos' },
                { status: 500 }
            );
        }

        const orderId: string = rpcResult.order_id;
        const orderNumber: string = rpcResult.order_number || orderId.slice(0, 8).toUpperCase();
        const siteUrl = SITE_URL.replace(/\/$/, '');

        // 5. Construir URLs de retorno
        const returnUrl = `${siteUrl}/checkout/done?orderId=${encodeURIComponent(orderNumber)}&fullOrderId=${encodeURIComponent(orderId)}&nombre=${encodeURIComponent(orderPayload.customer_name)}&total=${total_amount.toFixed(2)}&anticipo=${chargeAmount.toFixed(2)}&envio=${shippingCost.toFixed(2)}&metodo=tarjeta&status=success`;
        const cancelUrl = `${siteUrl}/checkout?cancelled=1&orderId=${encodeURIComponent(orderNumber)}`;
        const callbackUrl = `${siteUrl}/api/checkout/pixelpay/webhook`;

        // 6. Generar URL de Hosted Checkout PixelPay
        const redirectUrl = buildPixelPayHostedUrl({
            orderId: orderNumber,
            amount: chargeAmount,
            currency: 'HNL',
            customer: {
                name: orderPayload.customer_name,
                email: orderPayload.customer_email,
                phone: orderPayload.customer_phone,
                address: orderPayload.shipping_address,
                city: orderPayload.shipping_municipality,
                state: orderPayload.shipping_department,
                country: 'HN',
            },
            paymentType,
            shippingAmount: shippingCost,
            returnUrl,
            cancelUrl,
            callbackUrl,
        });

        return NextResponse.json({
            success: true,
            order_id: orderId,
            order_number: orderNumber,
            total: total_amount,
            deposit: chargeAmount,
            shipping: shippingCost,
            redirect_url: redirectUrl,
        });

    } catch (err: any) {
        console.error('❌ [PixelPay initiate] Error inesperado:', err);
        return NextResponse.json(
            { error: err.message || 'Error al iniciar sesión de pago con PixelPay' },
            { status: 500 }
        );
    }
}
