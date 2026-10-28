import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPixelPayPaymentHash } from '@/lib/pixelpay/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        let payload: any = {};
        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            payload = await req.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            formData.forEach((value, key) => {
                payload[key] = value.toString();
            });
        }

        console.info('🔔 [PixelPay Webhook] Recibida notificación:', JSON.stringify(payload));

        const orderId = payload._order_id || payload.order_id || payload.order_number || payload.payload?.id;
        const paymentHash = payload.paymentHash || payload.payment_hash || payload._payment_hash;
        const authId = payload.authorization_id || payload.auth_code || payload.transaction_id || 'APROBADO';

        if (!orderId) {
            console.warn('⚠️ [PixelPay Webhook] Falta order_id en el payload');
            return NextResponse.json({ success: false, error: 'Missing order_id' }, { status: 400 });
        }

        // Si viene paymentHash, validarlo criptográficamente
        if (paymentHash) {
            const isValid = verifyPixelPayPaymentHash(paymentHash, orderId);
            if (!isValid) {
                console.error('❌ [PixelPay Webhook] Hash de pago inválido para orden:', orderId);
                return NextResponse.json({ success: false, error: 'Invalid payment hash' }, { status: 403 });
            }
        }

        const supabase = createAdminClient();

        // Buscar la orden por order_number o por id
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .select('id, order_number, status, total_amount, deposit_amount')
            .or(`order_number.eq.${orderId},id.eq.${orderId}`)
            .single();

        if (orderErr || !order) {
            console.error('❌ [PixelPay Webhook] Orden no encontrada en Supabase:', orderId, orderErr);
            // Retornamos 200 a PixelPay para evitar reintentos continuos si la orden ya no existe
            return NextResponse.json({ success: true, warning: 'Order not found' });
        }

        // Si ya está pagada o depositada, retorno idempotente
        if (order.status === 'deposit_paid' || order.status === 'paid' || order.status === 'processing') {
            console.info(`🔁 [PixelPay Webhook] Orden ${order.order_number} ya fue procesada anteriormente.`);
            return NextResponse.json({ success: true, message: 'Already processed' });
        }

        // Actualizar el estado de la orden a deposit_paid
        const { error: updateOrderErr } = await supabase
            .from('orders')
            .update({
                status: 'deposit_paid',
                notes: `Pago verificado vía PixelPay. Autorización: ${authId}`,
                updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

        if (updateOrderErr) {
            console.error('❌ [PixelPay Webhook] Error actualizando estado de la orden:', updateOrderErr);
        }

        // Actualizar o insertar pago completado
        const { error: updatePaymentErr } = await supabase
            .from('payments')
            .update({
                status: 'completed',
                notes: `Pago en línea completado y verificado con PixelPay (Autorización: ${authId})`,
                created_at: new Date().toISOString(),
            })
            .eq('order_id', order.id)
            .eq('provider', 'pixelpay');

        if (updatePaymentErr) {
            console.warn('⚠️ [PixelPay Webhook] Aviso actualizando registro de pago:', updatePaymentErr);
        }

        console.info(`✅ [PixelPay Webhook] Orden #${order.order_number} confirmada exitosamente.`);
        return NextResponse.json({ success: true, order_id: order.id });

    } catch (err: any) {
        console.error('❌ [PixelPay Webhook] Error procesando webhook:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
