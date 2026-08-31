import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getExchangeRate, convertHnlToUsd } from '@/lib/exchangeRate';
import { createPayPalOrder } from '@/lib/paypal/client';
import { calcShippingCost, BUSINESS_LOGIC } from '@/lib/constants';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { createOrderSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const ip = getClientIp(request);
        const { allowed } = await checkRateLimit(`paypal-create:${ip}`, 15, 60_000);
        if (!allowed) {
            return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' }, { status: 429 });
        }

        const body = await request.json();
        const parsed = createOrderSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Datos de orden inválidos', details: parsed.error.issues },
                { status: 400 }
            );
        }

        const payload = parsed.data;
        const supabase = createAdminClient();

        // 1. Obtener variantes y tallas para calcular el precio real de forma segura
        const variantIds = [...new Set(payload.items.map((i) => i.variant_id).filter(Boolean))] as string[];
        const sizeIds = [...new Set(payload.items.map((i) => i.size_id).filter(Boolean))] as string[];

        let variantMap = new Map<string, number>();
        if (variantIds.length > 0) {
            const { data: variants, error: varError } = await supabase
                .from('product_variants')
                .select('id, price')
                .in('id', variantIds);

            if (varError) {
                console.warn('[PayPal create-order] Warning fetching variants:', varError);
            }
            if (variants) {
                variantMap = new Map(variants.map((v) => [v.id, Number(v.price || 0)]));
            }
        }

        let sizeMap = new Map<string, number>();
        if (sizeIds.length > 0) {
            const { data: dbSizes, error: sizeError } = await supabase
                .from('sizes')
                .select('id, additional_cost')
                .in('id', sizeIds);

            if (!sizeError && dbSizes) {
                sizeMap = new Map(dbSizes.map((s) => [s.id, Number(s.additional_cost || 0)]));
            }
        }

        // 2. Calcular subtotal real
        let subtotalHnl = 0;
        for (const item of payload.items) {
            const basePrice = item.variant_id && variantMap.has(item.variant_id)
                ? (variantMap.get(item.variant_id) || 0)
                : Number(item.unit_price || 0);

            const sizeSurcharge = item.size_id ? (sizeMap.get(item.size_id) || 0) : 0;
            const itemUnitPrice = basePrice + sizeSurcharge;

            subtotalHnl += itemUnitPrice * item.quantity;
        }

        // 3. Aplicar descuento si existe
        let discountHnl = 0;
        if (payload.discount_code) {
            try {
                const cleanCode = payload.discount_code.trim().toUpperCase();
                const { data: dc } = await supabase
                    .from('discount_codes')
                    .select('*')
                    .eq('code', cleanCode)
                    .eq('active', true)
                    .maybeSingle();

                if (dc) {
                    const now = new Date();
                    const isValidDate = !dc.expires_at || new Date(dc.expires_at) >= now;
                    const hasUses = dc.max_uses === null || (dc.used_count || 0) < dc.max_uses;

                    if (isValidDate && hasUses) {
                        if (dc.discount_pct) {
                            discountHnl = (subtotalHnl * Number(dc.discount_pct)) / 100;
                        } else if (dc.discount_value) {
                            discountHnl = Number(dc.discount_value);
                        }
                    }
                }
            } catch (err) {
                console.warn('[PayPal create-order] Error validando cupón:', err);
            }
        }

        // 4. Calcular costo de envío y total
        const shippingHnl = calcShippingCost(payload.shipping_department, payload.shipping_municipality);
        const totalHnl = Math.max(0, subtotalHnl - discountHnl + shippingHnl);

        // 5. Determinar si se cobra el 50% de anticipo o el 100% total
        const paymentType = body.payment_type === 'full' ? 'full' : 'deposit';
        const depositPercentage = BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE || 0.5;
        const payableHnl = paymentType === 'full' ? totalHnl : (totalHnl * depositPercentage);

        // 6. Convertir a USD usando la tasa de cambio activa
        const exchangeRate = await getExchangeRate();
        const usdAmount = convertHnlToUsd(payableHnl, exchangeRate);

        if (usdAmount <= 0) {
            return NextResponse.json({ error: 'Monto total inválido para procesar en PayPal' }, { status: 400 });
        }

        // 7. Crear orden en PayPal
        const descriptionLabel = paymentType === 'full'
            ? `90+5 Store - Pago Total (100%) para ${payload.customer_name}`
            : `90+5 Store - Anticipo (50%) para ${payload.customer_name}`;

        const paypalOrder = await createPayPalOrder({
            usdAmount,
            description: descriptionLabel,
        });

        return NextResponse.json({
            paypalOrderId: paypalOrder.id,
            usdAmount,
            payableHnl,
            totalHnl,
            paymentType,
            exchangeRate,
        });
    } catch (err: any) {
        console.error('[PayPal create-order] Error inesperado:', err);
        return NextResponse.json(
            { error: err.message || 'Error al iniciar la orden de PayPal' },
            { status: 500 }
        );
    }
}
