'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkRateLimit } from '@/lib/rateLimit'

export async function updateOrderStatus(orderId: string, newStatus: string, notes?: string) {
    const supabase = await createClient()

    // 🔐 Validar usuario con getUser() (más seguro que getSession)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('Unauthorized')
    }

    // 🛡️ A3 FIX: Rate limit — máximo 5 cambios de estado por orden por minuto
    const { allowed } = await checkRateLimit(`order-status:${orderId}`, 5, 60_000);
    if (!allowed) {
        throw new Error('Demasiados cambios de estado para esta orden. Espera un momento.');
    }

    // 🛡️ Validar que el nuevo estado sea un valor permitido
    const ALLOWED_STATUSES = [
        'pending_payment_50', 'deposit_paid', 'payment_verified',
        'processing', 'shipped_to_hn', 'in_customs', 'in_transit',
        'ready_for_delivery', 'pending_second_payment', 'shipped_to_costumer',
        'paid_full', 'completed', 'Cancelled'
    ];
    if (!ALLOWED_STATUSES.includes(newStatus)) {
        throw new Error('Estado inválido');
    }

    // Validar orden estricto de pasos
    const { data: currentOrder } = await supabase.from('orders').select('status').eq('id', orderId).single();
    if (currentOrder) {
        let activeMatch = currentOrder.status;
        if (activeMatch === 'shipped_to_hn') activeMatch = 'in_transit';
        if (activeMatch === 'paid_full') activeMatch = 'completed';

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
        
        const currentIndex = SEQUENCE.indexOf(activeMatch);
        let targetMatch = newStatus;
        if (targetMatch === 'shipped_to_hn') targetMatch = 'in_transit';
        if (targetMatch === 'paid_full') targetMatch = 'completed';
        const newIndex = SEQUENCE.indexOf(targetMatch);
        
        if (newStatus !== 'Cancelled' && currentIndex !== -1 && newIndex !== -1) {
            if (newIndex > currentIndex + 1) {
                throw new Error("No puedes saltarte estados. Debes seguir la secuencia uno a uno.");
            }
        }
    }

    const updateData = { status: newStatus }
    // Si quisieras guardar notas o tracking, podrías agregarlo a una columna 'admin_notes' o similar
    // Por ahora solo status.

    const { error } = await supabase
        .from('orders')
        .update(updateData)
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

    // 📧 Enviar correo de notificación (Nuevo)
    // Primero obtenemos los datos del cliente que quizás no venían en el updateData
    const { data: orderData } = await supabase
        .from('orders')
        .select('customer_email, customer_name')
        .eq('id', orderId)
        .single();

    if (orderData?.customer_email) {
        // Importación dinámica o directa, asumiendo que está en lib/email
        // Nota: Asegúrate de importar la función arriba si no usas dynamic import
        const { sendOrderStatusUpdateEmail } = await import('@/lib/email');
        await sendOrderStatusUpdateEmail({
            customerName: orderData.customer_name,
            customerEmail: orderData.customer_email,
            orderId,
            status: newStatus
        });
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

        if (orderError) console.error("Could not auto-update order status", orderError)

        // 📧 Enviar correo de notificación de Anticipo
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
