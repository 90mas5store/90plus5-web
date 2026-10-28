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

        // 1. Obtener y validar precios de productos en BD
        const productIds = orderPayload.items.map((i: any) => i.product_id);
        const { data: dbProducts, error: prodError } = await supabase
            .from('products')
            .select('id, base_price, category_id, team_id')
            .in('id', productIds);

        if (prodError || !dbProducts) {
            return NextResponse.json({ error: 'Error al verificar productos' }, { status: 500 });
        }

        const productMap = new Map(dbProducts.map(p => [p.id, p]));

        // 2. Obtener variantes si aplican
        const variantIds = orderPayload.items.map((i: any) => i.variant_id).filter(Boolean);
        let variantMap = new Map();
        if (variantIds.length > 0) {
            const { data: dbVariants } = await supabase
                .from('product_variants')
                .select('id, price')
                .in('id', variantIds);
            if (dbVariants) {
                variantMap = new Map(dbVariants.map(v => [v.id, v]));
            }
        }

        // Obtener tallas con costo adicional
        const sizeIds = orderPayload.items.map((i: any) => i.size_id).filter(Boolean);
        let sizeMap = new Map<string, number>();
        if (sizeIds.length > 0) {
            const { data: dbSizes } = await supabase
                .from('sizes')
                .select('id, additional_cost')
                .in('id', sizeIds);
            if (dbSizes) {
                sizeMap = new Map(dbSizes.map((s: any) => [s.id, Number(s.additional_cost || 0)]));
            }
        }

        let calculatedSubtotal = 0;
        const secureItems = orderPayload.items.map((item: any) => {
            const product = productMap.get(item.product_id);
            if (!product) throw new Error(`Producto no encontrado: ${item.product_id}`);

            const variant = item.variant_id ? variantMap.get(item.variant_id) : null;
            const basePrice = variant?.price ?? product.base_price;
            const sizeSurcharge = item.size_id ? (sizeMap.get(item.size_id) || 0) : 0;
            const unitPrice = basePrice + sizeSurcharge;

            calculatedSubtotal += unitPrice * item.quantity;

            return {
                ...item,
                unit_price: unitPrice,
            };
        });

        // 3. Validar descuento
        let discountAmount = 0;
        let discountCodeId: string | null = null;
        if (orderPayload.discount_code) {
            try {
                const { data: dc } = await supabase
                    .from('discount_codes')
                    .select('*')
                    .eq('code', orderPayload.discount_code.trim().toUpperCase())
                    .eq('is_active', true)
                    .single();

                if (dc) {
                    discountAmount = Math.round((calculatedSubtotal * dc.discount_pct / 100) * 100) / 100;
                    discountCodeId = dc.id;
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
            },
            paymentType,
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
