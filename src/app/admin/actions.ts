'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { checkRateLimit } from '@/lib/rateLimit'
import { registerPaymentSchema } from '@/lib/validations'

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

export async function updateOrderStatus(orderId: string, newStatus: string, notes?: string, skipRateLimit = false) {
    try {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(orderId)) {
            return { success: false, error: 'ID de pedido inválido' };
        }

        // 🔐 Validar sesión con cliente anon (respeta cookies de sesión)
        const authClient = await createClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Cliente admin para todas las operaciones DB (bypasa RLS)
        const supabase = createAdminClient()

        // 🛡️ Rate limit — máximo 20 cambios de estado por orden por minuto
        // Se puede omitir cuando se llama desde registerPaymentAction (flujo de pago)
        if (!skipRateLimit) {
            const { allowed } = await checkRateLimit(`order-status:${orderId}`, 20, 60_000);
            if (!allowed) {
                return { success: false, error: 'Demasiados cambios de estado para esta orden. Espera un momento.' }
            }
        }

        // 🛡️ Validar que el nuevo estado sea un valor permitido
        if (!ALLOWED_STATUSES.includes(newStatus)) {
            return { success: false, error: 'Estado inválido' }
        }

        // Validar orden estricto de pasos
        const { data: currentOrder } = await supabase
            .from('orders')
            .select('status, total_amount, payments(amount, status)')
            .eq('id', orderId)
            .single();

        if (currentOrder) {
            const normalizedCurrent = normalizeStatus(currentOrder.status);
            const normalizedNew = normalizeStatus(newStatus);

            const currentIndex = SEQUENCE.indexOf(normalizedCurrent);
            const newIndex = SEQUENCE.indexOf(normalizedNew);

            // Calcular total pagado y verificado
            const payments = Array.isArray(currentOrder.payments) ? currentOrder.payments : [];
            const verifiedPaidSum = payments
                .filter((p: any) => p.status === 'verified' || p.status === 'succeeded' || p.status === 'completed')
                .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
            const totalAmount = Number(currentOrder.total_amount) || 0;
            const remainingBalance = Math.max(0, totalAmount - verifiedPaidSum);
            const isFullyPaid = remainingBalance <= 0.01;

            // Exención: Si la orden está 100% pagada, se permite saltar 'pending_second_payment'
            // (avanzar de 'ready_for_delivery' directamente a 'shipped_to_costumer')
            const isSecondPaymentExemptJump = isFullyPaid &&
                normalizedCurrent === 'ready_for_delivery' &&
                normalizedNew === 'shipped_to_costumer';

            // Solo bloquear si ambos están en la secuencia y se salta más de 1 paso adelante
            if (newStatus !== 'Cancelled' && newStatus !== 'cancelled' && currentIndex !== -1 && newIndex !== -1) {
                if (newIndex > currentIndex + 1 && !isSecondPaymentExemptJump) {
                    return { success: false, error: 'No puedes saltarte estados. Debes seguir la secuencia uno a uno.' }
                }
            }
        }

        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId)

        if (error) {
            return { success: false, error: error.message }
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
    } catch (err: any) {
        console.error('Error in updateOrderStatus:', err);
        return { success: false, error: err.message || String(err) }
    }
}

export async function updatePaymentStatus(paymentId: string, newStatus: 'pending' | 'verified' | 'rejected') {
    // 🔐 Validar sesión con cliente anon
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Cliente admin para operaciones DB
    const supabase = createAdminClient()
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
    try {
        const parseResult = registerPaymentSchema.safeParse({
            orderId,
            amount: statusConfig?.payment?.amount,
            method: statusConfig?.payment?.method,
            bank: statusConfig?.payment?.bank,
            reference: statusConfig?.payment?.reference,
            date: statusConfig?.payment?.date,
        });

        if (!parseResult.success) {
            const errorMsg = parseResult.error.issues.map(i => i.message).join(' | ');
            return { success: false, error: `Datos de pago inválidos: ${errorMsg}` };
        }

        const validPayment = parseResult.data;

        // 🔐 Validar sesión con cliente anon
        const authClient = await createClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) return { success: false, error: 'Unauthorized' }

        // Cliente admin para operaciones DB (bypasa RLS)
        const supabase = createAdminClient()

        const type: 'deposit' | 'final' = statusConfig.newStatus === 'deposit_paid' ? 'deposit' : 'final';
        
        const notesStr = `Banco: ${validPayment.bank} | Ref: ${validPayment.reference} | Fecha: ${validPayment.date}`

        const paymentData = {
            order_id: validPayment.orderId,
            amount: validPayment.amount,
            type: type,
            status: 'verified',
            provider: 'Transferencia Manual',
            method: validPayment.method,
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
            return { success: false, error: 'Error al registrar pago: ' + paymentError.message }
        }

        // 2. Actualizar estado del pedido (deposit_paid o shipped_to_costumer)
        // skipRateLimit=true porque registerPaymentAction ya validó auth y el pago fue insertado
        return updateOrderStatus(orderId, statusConfig.newStatus, undefined, true)
    } catch (err: any) {
        console.error('Error in registerPaymentAction:', err);
        return { success: false, error: err.message || String(err) }
    }
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

/**
 * Sincroniza y garantiza ordenamiento único con corrimiento automático de productos destacados.
 * Si un producto toma la posición N (ej. 0), los demás se desplazan correlativamente (+1).
 */
export async function syncFeaturedOrderAction(params: {
    targetProductId?: string | null;
    targetOrder?: number;
    isFeatured: boolean;
}) {
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    // 1. Obtener todos los productos destacados activos (y no eliminados)
    const { data: featuredProducts, error } = await supabase
        .from('products')
        .select('id, name, sort_order, created_at')
        .eq('featured', true)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching featured products in syncFeaturedOrderAction:', error)
        return { success: false, error: error.message }
    }

    const targetId = params.targetProductId
    const isTargetFeatured = Boolean(params.isFeatured)
    const rawOrder = Number(params.targetOrder)
    const requestedOrder = isNaN(rawOrder) ? 0 : Math.max(0, Math.floor(rawOrder))

    // Remover targetId de la lista existente para insertarlo limpiamente en su nueva posición
    const listWithoutTarget = (featuredProducts || []).filter(p => p.id !== targetId)

    let finalOrderedList: { id: string; sort_order?: number }[] = []

    if (isTargetFeatured && targetId) {
        // Determinamos el índice donde debe insertarse:
        // Si pide 0 -> va al inicio (índice 0) y los demás se desplazan hacia abajo (+1)
        // Si pide un número mayor a la longitud de la lista -> va al final
        const insertIndex = Math.min(requestedOrder, listWithoutTarget.length)
        
        finalOrderedList = [...listWithoutTarget]
        finalOrderedList.splice(insertIndex, 0, { id: targetId })
    } else {
        // Si no es destacado, la lista queda sin el target
        finalOrderedList = [...listWithoutTarget]
    }

    // Actualizar sort_order de cada producto para que sea su índice único (0, 1, 2, 3...)
    const updates: PromiseLike<any>[] = []
    
    finalOrderedList.forEach((item, index) => {
        const previousItem = (featuredProducts || []).find(p => p.id === item.id)
        if (!previousItem || previousItem.sort_order !== index) {
            updates.push(
                supabase
                    .from('products')
                    .update({ sort_order: index, featured: true })
                    .eq('id', item.id)
            )
        }
    })

    // Si el target no es destacado pero estaba en featured en la BD, desmarcarlo
    if (!isTargetFeatured && targetId) {
        updates.push(
            supabase
                .from('products')
                .update({ featured: false })
                .eq('id', targetId)
        )
    }

    if (updates.length > 0) {
        const results = await Promise.allSettled(updates)
        const failed = results.filter(r => r.status === 'rejected')
        if (failed.length > 0) {
            console.error('Algunas actualizaciones de orden fallaron:', failed)
        }
    }

    revalidatePath('/')
    revalidatePath('/catalogo')
    revalidatePath('/admin/productos')

    const assignedOrder = isTargetFeatured && targetId
        ? finalOrderedList.findIndex(p => p.id === targetId)
        : null

    return { success: true, assignedOrder }
}

/**
 * Elimina permanentemente un pedido y todos sus registros relacionados.
 * ⚠️ Esta acción es irreversible.
 *
 * Elimina en orden para respetar FK constraints:
 * order_status_history → order_notes → payments → order_items → orders
 *
 * Nota: Si las FKs tienen ON DELETE CASCADE en Supabase, los DELETE
 * de tablas hijas son redundantes pero inofensivos — garantizan
 * compatibilidad sin importar la configuración de la BD.
 */
export async function deleteOrderAction(orderId: string) {
    try {
        // 🔐 Validar sesión
        const authClient = await createClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'No autorizado' }
        }

        // 🛡️ Validar que el orderId es un UUID válido
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(orderId)) {
            return { success: false, error: 'ID de pedido inválido' }
        }

        // Cliente admin para bypasear RLS
        const supabase = createAdminClient()

        // Verificar que el pedido existe
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('id, status')
            .eq('id', orderId)
            .single()

        if (fetchError || !order) {
            return { success: false, error: 'Pedido no encontrado' }
        }

        // 1. Eliminar historial de estados
        const { error: historyError } = await supabase
            .from('order_status_history')
            .delete()
            .eq('order_id', orderId)
        if (historyError) console.warn('Error borrando historial:', historyError.message)

        // 2. Eliminar notas internas
        const { error: notesError } = await supabase
            .from('order_notes')
            .delete()
            .eq('order_id', orderId)
        if (notesError) console.warn('Error borrando notas:', notesError.message)

        // 3. Eliminar uso de códigos de descuento
        const { error: discountError } = await supabase
            .from('discount_code_usage')
            .delete()
            .eq('order_id', orderId)
        if (discountError) console.warn('Error borrando discount_code_usage:', discountError.message)

        // 4. Eliminar pagos
        const { error: paymentsError } = await supabase
            .from('payments')
            .delete()
            .eq('order_id', orderId)
        if (paymentsError) console.warn('Error borrando pagos:', paymentsError.message)

        // 5. Eliminar items del pedido
        const { error: itemsError } = await supabase
            .from('order_items')
            .delete()
            .eq('order_id', orderId)
        if (itemsError) {
            return { success: false, error: 'Error al eliminar items: ' + itemsError.message }
        }

        // 6. Eliminar el pedido
        const { error: orderError } = await supabase
            .from('orders')
            .delete()
            .eq('id', orderId)
        if (orderError) {
            return { success: false, error: 'Error al eliminar el pedido: ' + orderError.message }
        }

        revalidatePath('/admin/orders')
        revalidatePath('/admin')

        return { success: true }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('Error en deleteOrderAction:', message)
        return { success: false, error: message }
    }
}

/**
 * Elimina permanentemente un producto y todas sus dependencias en orden estricto de FK.
 * Si el producto forma parte de pedidos históricos (`order_items`), protege la contabilidad:
 * - Con `fallbackToTrash: true` (desde Edición): lo mueve a Papelera (soft-delete) y lo desactiva.
 * - Con `fallbackToTrash: false` (desde Papelera): bloquea el borrado definitivo y devuelve el motivo.
 *
 * ⚠️ Requiere sesión activa con rol `super_admin` en `admin_whitelist`.
 */
export async function deleteProductPermanentlyAction(
    productId: string,
    slug?: string,
    options?: { fallbackToTrash?: boolean }
): Promise<{
    success: boolean;
    softDeleted?: boolean;
    hasOrders?: boolean;
    message?: string;
    error?: string;
}> {
    try {
        // 🛡️ Validar UUID del producto
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(productId)) {
            return { success: false, error: 'ID de producto inválido' }
        }

        // 🔐 Validar sesión con cliente anon (cookies)
        const authClient = await createClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'No autorizado' }
        }

        // Cliente admin para verificar whitelist y operar sin bloqueos RLS
        const supabase = createAdminClient()

        // 🔐 Verificar rol super_admin en admin_whitelist
        const { data: adminRecord, error: adminError } = await supabase
            .from('admin_whitelist')
            .select('id, role')
            .eq('id', user.id)
            .single()

        if (adminError || !adminRecord || adminRecord.role !== 'super_admin') {
            return { success: false, error: 'Solo un Super Admin puede eliminar productos.' }
        }

        // Obtener slug actual del producto si existe
        const { data: existingProduct } = await supabase
            .from('products')
            .select('id, slug')
            .eq('id', productId)
            .maybeSingle()

        const resolvedSlug = slug || existingProduct?.slug || undefined

        // 1. Obtener todas las variantes del producto
        const { data: variantsData, error: variantsFetchError } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', productId)

        if (variantsFetchError) {
            return {
                success: false,
                error: 'Error al consultar variantes del producto: ' + variantsFetchError.message,
            }
        }

        const variantIds = (variantsData || []).map((v: { id: string }) => v.id)

        // 2. Verificar si existen order_items que referencien este producto o sus variantes
        let hasOrderItems = false

        const { count: productOrdersCount, error: prodOrderErr } = await supabase
            .from('order_items')
            .select('id', { count: 'exact', head: true })
            .eq('product_id', productId)

        if (prodOrderErr) {
            return {
                success: false,
                error: 'Error al verificar pedidos vinculados: ' + prodOrderErr.message,
            }
        }

        if ((productOrdersCount ?? 0) > 0) {
            hasOrderItems = true
        } else if (variantIds.length > 0) {
            const { count: variantOrdersCount, error: varOrderErr } = await supabase
                .from('order_items')
                .select('id', { count: 'exact', head: true })
                .in('variant_id', variantIds)

            if (varOrderErr) {
                return {
                    success: false,
                    error: 'Error al verificar variantes en pedidos: ' + varOrderErr.message,
                }
            }

            if ((variantOrdersCount ?? 0) > 0) {
                hasOrderItems = true
            }
        }

        const fallbackToTrash = options?.fallbackToTrash ?? false

        if (hasOrderItems) {
            if (fallbackToTrash) {
                const { error: softDeleteError } = await supabase
                    .from('products')
                    .update({
                        deleted_at: new Date().toISOString(),
                        active: false,
                        featured: false,
                    })
                    .eq('id', productId)

                if (softDeleteError) {
                    return {
                        success: false,
                        error: 'Error al mover el producto a la papelera: ' + softDeleteError.message,
                    }
                }

                await syncFeaturedOrderAction({
                    targetProductId: productId,
                    isFeatured: false,
                })

                revalidatePath('/admin/productos')
                revalidatePath('/admin/settings/trash')
                revalidatePath('/catalogo')
                revalidatePath('/')
                if (resolvedSlug) {
                    revalidatePath(`/producto/${resolvedSlug}`)
                }

                return {
                    success: true,
                    softDeleted: true,
                    message:
                        'Este producto está en pedidos históricos; se movió a la Papelera y se desactivó para proteger la contabilidad.',
                }
            }

            return {
                success: false,
                hasOrders: true,
                error: 'Este producto forma parte de pedidos históricos y no puede eliminarse definitivamente para proteger la contabilidad.',
            }
        }

        // 3. Eliminar tablas dependientes en orden estricto de FK
        if (variantIds.length > 0) {
            const { error: variantSizesError } = await supabase
                .from('variant_sizes')
                .delete()
                .in('variant_id', variantIds)
            if (variantSizesError) {
                console.warn('Error borrando variant_sizes:', variantSizesError.message)
            }
        }

        const { error: variantsDeleteError } = await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', productId)
        if (variantsDeleteError) {
            return {
                success: false,
                error: 'Error al eliminar variantes del producto: ' + variantsDeleteError.message,
            }
        }

        const optionalChildTables = [
            'product_patches',
            'product_leagues',
            'product_images',
            'product_players',
            'product_audience',
            'special_banner_products',
            'product_share_events',
        ] as const

        for (const table of optionalChildTables) {
            const { error: childError } = await supabase
                .from(table)
                .delete()
                .eq('product_id', productId)
            if (childError) {
                console.warn(`Error borrando ${table}:`, childError.message)
            }
        }

        // 4. Eliminar finalmente el producto
        const { error: productDeleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', productId)

        if (productDeleteError) {
            return {
                success: false,
                error: 'Error al eliminar el producto: ' + productDeleteError.message,
            }
        }

        await syncFeaturedOrderAction({
            targetProductId: productId,
            isFeatured: false,
        })

        revalidatePath('/admin/productos')
        revalidatePath('/admin/settings/trash')
        revalidatePath('/catalogo')
        revalidatePath('/')
        if (resolvedSlug) {
            revalidatePath(`/producto/${resolvedSlug}`)
        }

        return { success: true }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('Error en deleteProductPermanentlyAction:', message)
        return { success: false, error: message }
    }
}
