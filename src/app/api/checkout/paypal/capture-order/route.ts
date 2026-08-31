import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { capturePayPalOrder } from '@/lib/paypal/client';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/lib/email';
import { calcShippingCost, BUSINESS_LOGIC } from '@/lib/constants';
import { SITE_URL } from '@/lib/config/site';
import type { SupabaseRawOrderItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paypalOrderId, orderPayload } = body;

        if (!paypalOrderId || !orderPayload) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 🛡️ IDEMPOTENCY CHECK — Si ya se procesó este pago de PayPal previamente, retornar la orden creada
        const { data: existingOrder } = await supabase
            .from('orders')
            .select('id, order_number')
            .eq('idempotency_key', `paypal_${paypalOrderId}`)
            .maybeSingle();

        if (existingOrder) {
            console.info('🔁 Idempotency hit: Orden PayPal ya procesada previamente #', existingOrder.order_number);
            return NextResponse.json({
                success: true,
                order_id: existingOrder.id,
                order_number: existingOrder.order_number,
                status: 'COMPLETED',
                reused: true
            });
        }

        // 1. Capturar orden en PayPal
        const captureResult = await capturePayPalOrder(paypalOrderId);

        if (captureResult.status !== 'COMPLETED') {
            console.error('[PayPal capture-order] Estado no completado:', captureResult);
            return NextResponse.json(
                { error: `El pago no fue completado (Estado: ${captureResult.status})` },
                { status: 400 }
            );
        }

        // 2. Obtener variantes y tallas para calcular montos exactos y seguros
        const variantIds = [...new Set(orderPayload.items.map((i: any) => i.variant_id).filter(Boolean))] as string[];
        const sizeIds = [...new Set(orderPayload.items.map((i: any) => i.size_id).filter(Boolean))] as string[];

        let variantMap = new Map<string, number>();
        if (variantIds.length > 0) {
            const { data: variants, error: varError } = await supabase
                .from('product_variants')
                .select('id, price')
                .in('id', variantIds);

            if (varError) {
                console.warn('[PayPal capture-order] Warning fetching variants:', varError);
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

        // 3. Validar items y calcular subtotales
        const secureItems: Array<any> = [];
        let calculatedSubtotal = 0;

        for (const item of orderPayload.items) {
            const basePrice = item.variant_id && variantMap.has(item.variant_id)
                ? (variantMap.get(item.variant_id) || 0)
                : Number(item.unit_price || 0);

            const sizeSurcharge = item.size_id ? (sizeMap.get(item.size_id) || 0) : 0;
            const unitPrice = basePrice + sizeSurcharge;

            calculatedSubtotal += unitPrice * item.quantity;

            secureItems.push({
                product_id: item.product_id,
                variant_id: item.variant_id || null,
                size_id: item.size_id || null,
                patch_id: item.patch_id || null,
                quantity: item.quantity,
                unit_price: unitPrice,
                personalization_type: item.personalization_type || 'none',
                player_id: item.player_id || null,
                custom_number: item.custom_number ? String(item.custom_number) : null,
                custom_name: item.custom_name ? item.custom_name.trim() : null,
            });
        }

        // 4. Descuentos
        let discountAmount = 0;
        let discountCodeId: string | null = null;
        if (orderPayload.discount_code) {
            try {
                const cleanCode = orderPayload.discount_code.trim().toUpperCase();
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
                            discountAmount = (calculatedSubtotal * Number(dc.discount_pct)) / 100;
                        } else if (dc.discount_value) {
                            discountAmount = Number(dc.discount_value);
                        }
                        discountCodeId = dc.id;
                    }
                }
            } catch (err) {
                console.warn('[PayPal capture-order] Error validando cupón:', err);
            }
        }

        // 5. Costo de envío y total
        const shippingCost = calcShippingCost(
            orderPayload.shipping_department ?? '',
            orderPayload.shipping_municipality ?? ''
        );
        const effectiveSubtotal = Math.max(0, calculatedSubtotal - discountAmount);
        const total_amount = effectiveSubtotal + shippingCost;
        
        const isFullPayment = body.paymentType === 'full';
        const deposit_amount = isFullPayment ? total_amount : (total_amount * (BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE || 0.5));
        const finalStatus = 'deposit_paid';

        // 6. Crear orden atómica en Supabase
        const cleanUUID = (id: string | null | undefined) => (!id || id.trim() === '') ? null : id;

        const rpcOrderData = {
            subtotal: calculatedSubtotal,
            deposit_amount,
            total_amount,
            discount_amount: discountAmount,
            idempotency_key: `paypal_${paypalOrderId}`,
            customer_name: orderPayload.customer_name,
            customer_email: orderPayload.customer_email,
            customer_phone: orderPayload.customer_phone,
            shipping_department: orderPayload.shipping_department,
            shipping_municipality: orderPayload.shipping_municipality,
            shipping_address: orderPayload.shipping_address,
        };

        const rpcItems = secureItems.map(item => ({
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
            amount: deposit_amount,
            type: 'deposit',
            status: 'completed',
            provider: 'paypal',
            method: 'paypal',
            notes: isFullPayment
                ? `Pago 100% procesado con PayPal. ID Captura: ${captureResult.captureId || paypalOrderId} - USD: $${captureResult.capturedAmountUsd || 0}`
                : `Anticipo 50% procesado con PayPal. ID Captura: ${captureResult.captureId || paypalOrderId} - USD: $${captureResult.capturedAmountUsd || 0}. Saldo restante: L${(total_amount - deposit_amount).toFixed(2)}`,
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
            console.error('[PayPal capture-order] Error en create_order_atomic:', rpcError);
            return NextResponse.json({ error: 'Error al registrar la orden en el sistema' }, { status: 500 });
        }

        const orderId: string = rpcResult.order_id;

        // Actualizar estado de la orden y marcar el pago como 'verified' en Supabase
        await Promise.all([
            supabase
                .from('orders')
                .update({
                    status: finalStatus,
                    notes: isFullPayment
                        ? `Pagado 100% con PayPal. ID: ${captureResult.captureId || paypalOrderId} ($${captureResult.capturedAmountUsd} USD) por ${captureResult.payerEmail || orderPayload.customer_email}`
                        : `Anticipo 50% pagado con PayPal. ID: ${captureResult.captureId || paypalOrderId} ($${captureResult.capturedAmountUsd} USD) por ${captureResult.payerEmail || orderPayload.customer_email}. Saldo restante al entregar: L${(total_amount - deposit_amount).toFixed(2)}`,
                })
                .eq('id', orderId),
            supabase
                .from('payments')
                .update({
                    status: 'verified',
                    verified_at: new Date().toISOString(),
                    type: 'deposit',
                    amount: deposit_amount,
                    notes: isFullPayment
                        ? `Pago 100% verificado con PayPal. ID Captura: ${captureResult.captureId || paypalOrderId} ($${captureResult.capturedAmountUsd || 0} USD)`
                        : `Anticipo 50% verificado con PayPal. ID Captura: ${captureResult.captureId || paypalOrderId} ($${captureResult.capturedAmountUsd || 0} USD). Saldo restante: L${(total_amount - deposit_amount).toFixed(2)}`,
                })
                .eq('order_id', orderId),
        ]);

        // 7. Enviar correos de confirmación
        try {
            const { data: enrichedItems } = await supabase
                .from('order_items')
                .select(`
                    quantity,
                    products (name, image_url, team_id, teams(name)),
                    personalization_type,
                    custom_name,
                    custom_number,
                    product_variants (version),
                    sizes (label),
                    patches (name)
                `)
                .eq('order_id', orderId);

            const emailItems = (enrichedItems as SupabaseRawOrderItem[] | null)?.map((item) => {
                const customization: string[] = [];
                if (item.product_variants?.version) customization.push(item.product_variants.version);
                if (item.sizes?.label) customization.push(`Talla ${item.sizes.label}`);
                if (item.patches?.name) customization.push(`Parche: ${item.patches.name}`);
                if (item.personalization_type === 'custom' || item.personalization_type === 'player') {
                    customization.push(`Dorsal: ${item.custom_number || ''} ${item.custom_name || ''}`);
                }
                return {
                    name: item.products?.name || 'Producto',
                    team: item.products?.teams?.name || '',
                    image: item.products?.image_url || '',
                    quantity: item.quantity,
                    details: customization.join(' · ')
                };
            }) || [];

            await sendOrderConfirmationEmail({
                customerName: orderPayload.customer_name,
                customerEmail: orderPayload.customer_email,
                orderId,
                totalAmount: total_amount,
                depositAmount: deposit_amount,
                items: emailItems,
            });

            await sendAdminNewOrderEmail({
                customerName: orderPayload.customer_name,
                customerEmail: orderPayload.customer_email,
                orderId,
                totalAmount: total_amount,
                items: emailItems,
            });
        } catch (emailErr) {
            console.warn('[PayPal capture-order] Error enviando correos:', emailErr);
        }

        return NextResponse.json({
            success: true,
            order_id: orderId,
            order_number: orderId.slice(0, 8).toUpperCase(),
            total: total_amount,
            deposit: deposit_amount,
            shipping: shippingCost,
        });
    } catch (err: any) {
        console.error('[PayPal capture-order] Error inesperado:', err);
        return NextResponse.json(
            { error: err.message || 'Error al capturar el pago con PayPal' },
            { status: 500 }
        );
    }
}
