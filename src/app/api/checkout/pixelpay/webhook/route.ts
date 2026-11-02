import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parsePixelPayCallback, verifyPixelPayPaymentHash } from '@/lib/pixelpay/client';

export const dynamic = 'force-dynamic';

/**
 * Estado con el que nace toda orden (`create_order_atomic`) — ver SEQUENCE en `src/app/admin/actions.ts`.
 * El webhook solo puede avanzar órdenes que sigan en este estado (idempotencia).
 */
const INITIAL_ORDER_STATUS = 'pending_payment_50';

/** Formato permitido para identificadores de orden (evita inyección en filtros). */
const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

async function readPayload(req: NextRequest): Promise<Record<string, unknown>> {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const body = await req.json();
        return body && typeof body === 'object' ? body : {};
    }
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const payload: Record<string, unknown> = {};
        const formData = await req.formData();
        formData.forEach((value, key) => {
            payload[key] = value.toString();
        });
        return payload;
    }
    return {};
}

/**
 * Webhook `_callback` de PixelPay Hosted Payment.
 * PixelPay envía un POST JSON cada vez que un cobro se paga con éxito y espera HTTP 200.
 * Si no recibe 200, reintenta cada 5 minutos (máx. 3 intentos).
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await readPayload(req);
        const { orderId, paymentHash, status, paymentUuid, amount, cardIssuer, authorizationId, cardBrand } =
            parsePixelPayCallback(payload);

        console.info('🔔 [PixelPay Webhook] Notificación recibida:', {
            orderId,
            status,
            paymentUuid,
            amount,
            cardIssuer,
            authorizationId,
            cardBrand,
        });

        if (!orderId || !ORDER_ID_PATTERN.test(orderId)) {
            console.warn('⚠️ [PixelPay Webhook] order ausente o inválido en el payload');
            return NextResponse.json({ success: false, error: 'Missing or invalid order' }, { status: 400 });
        }

        // El hash es obligatorio: sin él no hay forma de verificar que la petición viene de PixelPay
        if (!paymentHash || !verifyPixelPayPaymentHash(paymentHash, orderId)) {
            console.error('❌ [PixelPay Webhook] payment_hash ausente o inválido para orden:', orderId);
            return NextResponse.json({ success: false, error: 'Invalid payment hash' }, { status: 403 });
        }

        if (status !== 'paid') {
            console.warn(`⚠️ [PixelPay Webhook] Estado no pagado (${status}) para orden ${orderId}. Se ignora.`);
            return NextResponse.json({ success: true, message: 'Ignored: status is not paid' });
        }

        const supabase = createAdminClient();

        // Buscar la orden: puede ser UUID completo (36 chars) o prefijo hexadecimal de 8 chars (ej. FE4E0928)
        let order: { id: string; status: string; customer_name: string; customer_email: string } | null = null;
        const cleanId = orderId.toLowerCase();

        if (cleanId.includes('-') && cleanId.length === 36) {
            const { data, error } = await supabase
                .from('orders')
                .select('id, status, customer_name, customer_email')
                .eq('id', cleanId)
                .maybeSingle();
            if (error) console.error('❌ [PixelPay Webhook] Error buscando por UUID:', error);
            order = data;
        } else if (/^[0-9a-f]{8}$/.test(cleanId)) {
            // Rango UUID para prefijo hexadecimal de 8 dígitos
            const { data, error } = await supabase
                .from('orders')
                .select('id, status, customer_name, customer_email')
                .gte('id', `${cleanId}-0000-0000-0000-000000000000`)
                .lte('id', `${cleanId}-ffff-ffff-ffff-ffffffffffff`)
                .maybeSingle();
            if (error) console.error('❌ [PixelPay Webhook] Error buscando por prefijo:', error);
            order = data;
        } else {
            const { data, error } = await supabase
                .from('orders')
                .select('id, status, customer_name, customer_email')
                .eq('id', cleanId)
                .maybeSingle();
            if (error) console.error('❌ [PixelPay Webhook] Error buscando orden:', error);
            order = data;
        }

        if (!order) {
            console.error('❌ [PixelPay Webhook] Orden no encontrada en Supabase:', orderId);
            // 200 para evitar reintentos continuos si la orden ya no existe
            return NextResponse.json({ success: true, warning: 'Order not found' });
        }

        const orderNumber = order.id.slice(0, 8).toUpperCase();

        if (order.status !== INITIAL_ORDER_STATUS) {
            console.info(`🔁 [PixelPay Webhook] Orden #${orderNumber} ya procesada (estado: ${order.status}).`);
            return NextResponse.json({ success: true, message: 'Already processed' });
        }

        // Validar que el monto pagado coincida con el cobro pendiente registrado
        const { data: payment } = await supabase
            .from('payments')
            .select('id, amount')
            .eq('order_id', order.id)
            .eq('provider', 'pixelpay')
            .maybeSingle();

        if (payment && amount !== null && Math.abs(Number(payment.amount) - amount) > 0.01) {
            console.error(
                `❌ [PixelPay Webhook] Monto no coincide para orden #${orderNumber}: esperado ${payment.amount}, recibido ${amount}`
            );
            return NextResponse.json({ success: true, warning: 'Amount mismatch, requires manual review' });
        }

        const reference = authorizationId || paymentUuid || 'APROBADO';
        const cardDetails = [
            cardBrand ? `Red: ${cardBrand.toUpperCase()}` : null,
            cardIssuer ? `Emisor: ${cardIssuer}` : null,
        ].filter(Boolean).join(' · ');
        const paymentNotes = cardDetails
            ? `Pago en línea con Tarjeta vía PixelPay (${cardDetails} | Auth: ${reference})`
            : `Pago en línea completado y verificado con PixelPay (Referencia: ${reference})`;

        // Actualización condicional: solo si sigue en el estado inicial (evita carreras con reintentos/admin)
        const { data: updatedRows, error: updateOrderErr } = await supabase
            .from('orders')
            .update({
                status: 'deposit_paid',
            })
            .eq('id', order.id)
            .eq('status', INITIAL_ORDER_STATUS)
            .select('id, customer_name, customer_email');

        if (updateOrderErr) {
            console.error('❌ [PixelPay Webhook] Error actualizando estado de la orden:', updateOrderErr);
            // 500 para que PixelPay reintente
            return NextResponse.json({ success: false, error: 'Order update failed' }, { status: 500 });
        }

        if (!updatedRows || updatedRows.length === 0) {
            console.info(`🔁 [PixelPay Webhook] Orden #${orderNumber} cambió de estado en paralelo; sin cambios.`);
            return NextResponse.json({ success: true, message: 'Already processed' });
        }

        const { error: updatePaymentErr } = await supabase
            .from('payments')
            .update({
                status: 'verified',
                notes: paymentNotes,
                provider_payment_intent_id: reference,
                verified_at: new Date().toISOString(),
                verified_by: 'PixelPay Webhook',
            })
            .eq('order_id', order.id)
            .eq('provider', 'pixelpay');

        if (updatePaymentErr) {
            console.warn('⚠️ [PixelPay Webhook] Aviso actualizando registro de pago:', updatePaymentErr);
        }

        // 📧 Notificar al cliente igual que la verificación manual desde el admin (no crítico)
        const updated = updatedRows[0];
        if (updated?.customer_email) {
            try {
                const { sendOrderStatusUpdateEmail } = await import('@/lib/email');
                await sendOrderStatusUpdateEmail({
                    customerName: updated.customer_name,
                    customerEmail: updated.customer_email,
                    orderId: order.id,
                    status: 'deposit_paid',
                });
            } catch (emailError) {
                console.warn('⚠️ [PixelPay Webhook] Error enviando email de anticipo:', emailError);
            }
        }

        console.info(`✅ [PixelPay Webhook] Orden #${orderNumber} confirmada exitosamente.`);
        return NextResponse.json({ success: true, order_id: order.id });
    } catch (err) {
        console.error('❌ [PixelPay Webhook] Error procesando webhook:', err);
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }
}
