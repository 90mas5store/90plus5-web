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
        'processing', 'shipped_to_hn', 'in_customs',
        'ready_for_delivery', 'paid_full', 'completed', 'Cancelled'
    ];
    if (!ALLOWED_STATUSES.includes(newStatus)) {
        throw new Error('Estado inválido');
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

export async function updatePaymentStatus(paymentId: string, newStatus: 'pending' | 'completed' | 'failed') {
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
    const { error } = await supabase
        .from('payments')
        .update({ status: newStatus })
        .eq('id', paymentId)

    if (error) throw new Error(error.message)

    // 3. Auto-update Order Status if Deposit is Completed
    if (newStatus === 'completed' && payment.type === 'deposit') {
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
