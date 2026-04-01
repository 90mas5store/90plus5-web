import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// UUID completo: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
const FULL_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Prefijo hex válido (mínimo 4, máximo 8 chars)
const HEX_PREFIX_REGEX = /^[0-9a-f]{4,8}$/i;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('id');

    if (!orderId) {
        return NextResponse.json({ success: false, error: 'Código de pedido requerido' }, { status: 400 });
    }

    // Normalizar: quitar espacios, # inicial y guiones (el usuario puede copiar "#A0EEBC99" del correo)
    const trimmedId = orderId.trim().replace(/^#/, '');

    // Determinar si es UUID completo o prefijo corto
    const isFullUUID = FULL_UUID_REGEX.test(trimmedId);
    const cleanId = trimmedId.toLowerCase().replace(/-/g, '').slice(0, 8);

    if (!isFullUUID && !HEX_PREFIX_REGEX.test(cleanId)) {
        return NextResponse.json(
            { success: false, error: 'Código inválido. Usa tu ID de pedido o sus primeros 8 caracteres.' },
            { status: 400 }
        );
    }

    try {
        // ⚠️ Usar Service Role Key para saltar RLS ya que el rastreo es público
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Construir query base
        let query = supabase
            .from('orders')
            .select(`
                id,
                created_at,
                status,
                subtotal,
                total_amount,
                deposit_amount,
                shipping_municipality,
                shipping_department,
                order_items (
                    id,
                    quantity,
                    personalization_type,
                    custom_name,
                    custom_number,
                    products (
                        name,
                        image_url,
                        teams (
                            name
                        )
                    ),
                    product_variants (
                        version
                    )
                ),
                payments:payments!payments_order_id_fkey (
                    amount,
                    status
                )
            `);

        if (isFullUUID) {
            // UUID completo → match exacto
            query = query.eq('id', trimmedId.toLowerCase());
        } else {
            // Prefijo corto → búsqueda por rango de UUID (PostgreSQL soporta comparación nativa)
            // Rellenar prefix a 8 chars si es menor, luego construir rango min/max
            const padded = cleanId.padEnd(8, '0');
            const paddedMax = cleanId.padEnd(8, 'f');
            const minUUID = `${padded}-0000-0000-0000-000000000000`;
            const maxUUID = `${paddedMax}-ffff-ffff-ffff-ffffffffffff`;
            query = query.gte('id', minUUID).lte('id', maxUUID);
        }

        const { data: orders, error } = await query.limit(1);

        const order = orders?.[0];

        if (error || !order) {
            return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
        }

        // Mapear estado a texto
        const statusMap: Record<string, { label: string; progress: number; desc: string }> = {
            'pending_payment_50': {
                label: '1. Pedido recibido',
                progress: 12,
                desc: 'Todo listo para el pitazo inicial. Esperamos la confirmación de tu anticipo.'
            },
            'deposit_paid': {
                label: '2. Anticipo confirmado',
                progress: 25,
                desc: '¡Golazo del primero! Hemos validado tu anticipo. El equipo entra en calor.'
            },
            'processing': {
                label: '3. Pedido realizado al proveedor',
                progress: 37,
                desc: 'Mandamos tu fichaje a la fábrica. Están confeccionando tu camiseta.'
            },
            'shipped_to_hn': {
                label: '4. Producto en transito',
                progress: 50,
                desc: 'Tu producto ya salió al campo y viene volando en avión cruzando el océano.'
            },
            'in_transit': {
                label: '4. Producto en transito',
                progress: 50,
                desc: 'Tu producto ya salió al campo y viene volando hacia nosotros.'
            },
            'ready_for_delivery': {
                label: '5. Producto listo para despachar',
                progress: 62,
                desc: 'A punto de terminar el partido. Ya tenemos la camisa en nuestras manos.'
            },
            'pending_second_payment': {
                label: '6. Pendiente segundo pago',
                progress: 75,
                desc: '¡Tiempo extra! Ayudanos a cancelar tu saldo pendiente para que tu pedido corra hacia vos.'
            },
            'shipped_to_costumer': {
                label: '7. Producto enviado al cliente',
                progress: 87,
                desc: 'Contragolpe letal. Tu paquete va en ruta directo a entregarte.'
            },
            'paid_full': {
                label: '7. Producto enviado al cliente',
                progress: 87,
                desc: 'Contragolpe letal. Tu paquete va en ruta directo a entregarte.'
            },
            'completed': {
                label: '8. Producto recibido por el cliente',
                progress: 100,
                desc: 'El pitazo final. ¡Gracias por fichar con nosotros para esta temporada!'
            },
            'cancelled': {
                label: 'Cancelado',
                progress: 0,
                desc: 'Tarjeta roja directa. Este fichaje se suspendió.'
            },
            'Cancelled': {
                label: 'Cancelado',
                progress: 0,
                desc: 'Tarjeta Roja. Este pedido ha sido cancelado.'
            },
        };

        // 🛡️ Fetch History (Si la tabla existe, traeremos el historial ordenado)
        let orderHistory = [];
        try {
            const { data: historyData } = await supabase
                .from('order_status_history')
                .select('new_status, created_at')
                .eq('order_id', order.id)
                .order('created_at', { ascending: false });
            
            if (historyData) {
                orderHistory = historyData.map((h) => ({
                    status_id: h.new_status,
                    label: statusMap[h.new_status]?.label || h.new_status,
                    date: h.created_at
                }));
            }
        } catch (e) {
            console.warn("No history table yet", e);
        }

        const currentStatus = statusMap[order.status] || { label: 'En Proceso', progress: 20, desc: 'Tu pedido está siendo atendido.' };

        const verifiedPaidSum = Array.isArray(order.payments) 
            ? order.payments
                .filter((p: any) => p.status === 'verified' || p.status === 'succeeded' || p.status === 'completed')
                .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
            : 0;

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                date: order.created_at,
                location: `${order.shipping_municipality}, ${order.shipping_department}`,
                items: order.order_items.map((item: Record<string, unknown>) => ({
                    product: (item.products as Record<string, unknown>)?.name,
                    team: ((item.products as Record<string, unknown>)?.teams as Record<string, unknown>)?.name,
                    quantity: item.quantity,
                    image: (item.products as Record<string, unknown>)?.image_url,
                    version: (item.product_variants as Record<string, unknown>)?.version,
                    personalization: item.personalization_type !== 'none'
                        ? `${item.custom_number || ''} ${item.custom_name || ''}`.trim()
                        : null
                })),
                status: {
                    code: order.status,
                    ...currentStatus
                },
                billing: {
                    subtotal: order.subtotal || 0,
                    total: order.total_amount || 0,
                    deposit_paid: verifiedPaidSum,
                    remaining: Math.max(0, (order.total_amount || 0) - verifiedPaidSum)
                },
                history: orderHistory
            }
        });

    } catch (error) {
        console.error('Error tracking order:', error);
        return NextResponse.json({ success: false, error: 'Error al consultar el pedido' }, { status: 500 });
    }
}
