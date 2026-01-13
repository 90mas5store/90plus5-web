'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatus(orderId: string, newStatus: string, notes?: string) {
    const supabase = await createClient()

    // 🔐 Validar usuario con getUser() (más seguro que getSession)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('Unauthorized')
    }

    const updateData: any = { status: newStatus }
    // Si quisieras guardar notas o tracking, podrías agregarlo a una columna 'admin_notes' o similar
    // Por ahora solo status.

    const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

    if (error) {
        throw new Error(error.message)
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
    }

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${payment.order_id}`)
    return { success: true }
}
