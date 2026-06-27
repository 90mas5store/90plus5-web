'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkRateLimit } from '@/lib/rateLimit'

// Estados válidos en el sistema (incluyendo legacy para compatibilidad)
const ALLOWED_STATUSES = [
    'pending_payment_50', 'deposit_paid',
    'processing', 'in_transit',
    'ready_for_delivery', 'pending_second_payment', 'shipped_to_costumer',
    'completed', 'cancelled',
    // Legacy (soporte hacia atrás)
    'shipped_to_hn', 'paid_full', 'payment_verified', 'in_customs',
    // Mantener compatibilidad con el casing anterior por si hay datos existentes
    'Cancelled'
];

const SEQUENCE = [
    'pending_payment_50',
    'deposit_paid',
    'processing',
    'in_transit',
    'ready_for_delivery',
    'pending_second_payment',
    'shipped_to_costumer',
    'completed'
];

/** Normaliza estados legacy al equivalente actual */
function normalizeStatus(status: string): string {
    if (status === 'shipped_to_hn') return 'in_transit';
    if (status === 'paid_full') return 'completed';
    if (status === 'payment_verified') return 'deposit_paid';
    return status;
}

export async function updateOrderStatus(orderId: string, newStatus: string, notes?: string) {
    const supabase = await createClient()

    // 🔐 Validar usuario con getUser() (más seguro que getSession)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('Unauthorized')
    }

    // 🛡️ Rate limit — máximo 5 cambios de estado por orden por minuto
    const { allowed } = await checkRateLimit(`order-status:${orderId}`, 5, 60_000);
    if (!allowed) {
        throw new Error('Demasiados cambios de estado para esta orden. Espera un momento.');
    }

    // 🛡️ Validar que el nuevo estado sea un valor permitido
    if (!ALLOWED_STATUSES.includes(newStatus)) {
        throw new Error('Estado inválido');
    }

    // Validar orden estricto de pasos
    const { data: currentOrder } = await supabase.from('orders').select('status').eq('id', orderId).single();
    if (currentOrder) {
        const normalizedCurrent = normalizeStatus(currentOrder.status);
        const normalizedNew = normalizeStatus(newStatus);

        const currentIndex = SEQUENCE.indexOf(normalizedCurrent);
        const newIndex = SEQUENCE.indexOf(normalizedNew);

        // Solo bloquear si ambos están en la secuencia y se salta más de 1 paso adelante
        if (newStatus !== 'Cancelled' && newStatus !== 'cancelled' && currentIndex !== -1 && newIndex !== -1) {
            if (newIndex > currentIndex + 1) {
                throw new Error('No puedes saltarte estados. Debes seguir la secuencia uno a uno.');
            }
        }
    }

    const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

    if (error) {
        throw new Error(error.message)
    }

    // Registrar historial de estado
    try {
        await supabase.from('order_status_history').insert({
            order_id: orderId,
            old_status: currentOrder?.status ?? null,
            new_status: newStatus,
            changed_by: user.id,
        });
    } catch (historyError) {
        console.warn('Error registrando historial de estado:', historyError);
    }

    // 📧 Enviar correo de notificación (no crítico — un fallo aquí no debe romper la acción)
    try {
        const { data: orderData } = await supabase
            .from('orders')
            .select('customer_email, customer_name')
            .eq('id', orderId)
            .single();

        if (orderData?.customer_email) {
            const { sendOrderStatusUpdateEmail } = await import('@/lib/email');
            await sendOrderStatusUpdateEmail({
                customerName: orderData.customer_name,
                customerEmail: orderData.customer_email,
                orderId,
                status: newStatus
            });
        }
    } catch (emailError) {
        // No crítico: loguear pero no propagar el error
        console.warn('Error enviando email de actualización de estado:', emailError);
    }

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${orderId}`)

    return { success: true }
}

export async function updatePaymentStatus(paymentId: string, newStatus: 'pending' | 'verified' | 'rejected') {
    const supabase = await createClient()

    // 🔐 Validar usuario con getUser() (más seguro que getSession)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // 1. Get payment info first to know order_id and type
    const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .select('order_id, type')
        .eq('id', paymentId)
        .single()

    if (fetchError || !payment) throw new Error('Payment not found')

    // 2. Update Payment
    const updatePayload: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'verified') {
        updatePayload.verified_at = new Date().toISOString();
        updatePayload.verified_by = user.id;
    }

    const { error } = await supabase
        .from('payments')
        .update(updatePayload)
        .eq('id', paymentId)

    if (error) throw new Error(error.message)

    // 3. Auto-update Order Status if Deposit is Completed
    if (newStatus === 'verified' && payment.type === 'deposit') {
        const { error: orderError } = await supabase
            .from('orders')
            .update({ status: 'deposit_paid' })
            // Only update if it's currently in the initial state
            .eq('id', payment.order_id)
            .eq('status', 'pending_payment_50')

        if (orderError) console.error('Could not auto-update order status', orderError)

        // 📧 Enviar correo de notificación de Anticipo (no crítico)
        try {
            const { data: orderData } = await supabase
                .from('orders')
                .select('customer_email, customer_name')
                .eq('id', payment.order_id)
                .single();

            if (orderData?.customer_email) {
                const { sendOrderStatusUpdateEmail } = await import('@/lib/email');
                await sendOrderStatusUpdateEmail({
                    customerName: orderData.customer_name,
                    customerEmail: orderData.customer_email,
                    orderId: payment.order_id,
                    status: 'deposit_paid'
                });
            }
        } catch (emailError) {
            console.warn('Error enviando email de anticipo:', emailError);
        }
    }

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${payment.order_id}`)
    return { success: true }
}

export async function revalidateConfig() {
    revalidatePath('/', 'layout')
    revalidatePath('/catalogo')
    return { success: true }
}

export async function revalidateProduct(slug: string) {
    revalidatePath(`/producto/${slug}`)
    revalidatePath('/catalogo')
    revalidatePath('/', 'layout')
    return { success: true }
}

export async function registerPaymentAction(orderId: string, statusConfig: { newStatus: string, payment: { amount: number, method: string, bank: string, reference: string, date: string } }) {
    const supabase = await createClient()

    // Validar Admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const type = statusConfig.newStatus === 'deposit_paid' ? 'deposit' : 'remaining';
    
    const notesStr = `Banco: ${statusConfig.payment.bank} | Ref: ${statusConfig.payment.reference} | Fecha: ${statusConfig.payment.date}`

    const paymentData = {
        order_id: orderId,
        amount: statusConfig.payment.amount,
        type: type,
        status: 'verified',
        provider: 'Transferencia Manual',
        method: statusConfig.payment.method,
        notes: notesStr,
        verified_at: new Date().toISOString(),
        verified_by: user.id
    };

    // 1. Verify if pending checkout payment already exists to update it
    const { data: existingPending } = await supabase
        .from('payments')
        .select('id')
        .eq('order_id', orderId)
        .eq('type', type)
        .eq('status', 'pending')
        .maybeSingle();

    let paymentError;

    if (existingPending) {
        const { error } = await supabase
            .from('payments')
            .update(paymentData)
            .eq('id', existingPending.id);
        paymentError = error;
    } else {
        const { error } = await supabase
            .from('payments')
            .insert(paymentData);
        paymentError = error;
    }

    if (paymentError) {
        throw new Error('Error al registrar pago: ' + paymentError.message)
    }

    // 2. Actualizar estado del pedido (deposit_paid o shipped_to_costumer)
    return updateOrderStatus(orderId, statusConfig.newStatus)
}

/**
 * Activa o desactiva el badge "⚡ EN VIVO" en un producto.
 * @param productId UUID del producto
 * @param hours  Duración en horas (2 | 4 | 8). Pasar null para desactivar.
 */
export async function setProductTrending(productId: string, hours: number | null) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const trendingUntil = hours
        ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
        : null

    const { error } = await supabase
        .from('products')
        .update({ trending_until: trendingUntil })
        .eq('id', productId)

    if (error) throw new Error(error.message)

    revalidatePath('/catalogo')
    revalidatePath('/admin/productos')
}

/** Revalida el cache del home y catálogo tras cambios en banners */
export async function revalidateBannersAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    revalidatePath('/')
    revalidatePath('/catalogo')
}
