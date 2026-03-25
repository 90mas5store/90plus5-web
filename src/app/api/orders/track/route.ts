import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 🛡️ Regex para validar UUID v4 completo
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('id');

    if (!orderId) {
        return NextResponse.json({ success: false, error: 'ID de pedido requerido' }, { status: 400 });
    }

    // 🛡️ C3 FIX: Requerir UUID completo — NO permitir búsqueda parcial/fuzzy
    // Sanitizar: remover espacios y convertir a minúsculas
    const cleanId = orderId.trim().toLowerCase();

    if (!UUID_REGEX.test(cleanId)) {
        return NextResponse.json(
            { success: false, error: 'Formato de ID inválido. Usa el ID completo de tu pedido (ej: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).' },
            { status: 400 }
        );
    }

    try {
        // ⚠️ Usar Service Role Key para saltar RLS (Policies) ya que el rastreo es público
        // y el usuario anónimo no tiene permiso de leer 'orders' normalmente.
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 🛡️ FIX: Buscar por UUID EXACTO — ya no se usa rango/fuzzy
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                id,
                created_at,
                status,
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
                )
            `)
            .eq('id', cleanId)
            .single();

        if (error || !order) {
            return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
        }

        // Mapear estado a texto amigable (Modo Futbolero Leve)
        const statusMap: Record<string, { label: string; progress: number; desc: string }> = {
            'pending_payment_50': {
                label: 'Calentamiento (Espera)',
                progress: 10,
                desc: 'Todo listo. Esperamos tu anticipo para el pitazo inicial.'
            },
            'deposit_paid': {
                label: '¡Gol del Anticipo!',
                progress: 25,
                desc: 'Anticipo recibido. El equipo entra en producción.'
            },
            'payment_verified': {
                label: 'Anticipo Confirmado',
                progress: 25,
                desc: 'Pago de entrada validado. ¡A jugar!'
            },
            'processing': {
                label: 'En Cancha (Producción)',
                progress: 40,
                desc: 'Estamos jugando el partido. Tu pedido se está fabricando.'
            },
            'shipped_to_hn': {
                label: 'Balón en el aire (Tránsito)',
                progress: 60,
                desc: 'El pedido vuela hacia Honduras. ¡Contragolpe en proceso!'
            },
            'in_customs': {
                label: 'Revisión (Aduana)',
                progress: 75,
                desc: 'El árbitro está revisando la jugada (Trámites de aduana).'
            },
            'ready_for_delivery': {
                label: 'Tiempo Extra (Listo)',
                progress: 90,
                desc: 'A punto de terminar el partido. Listo para entrega final.'
            },
            'paid_full': {
                label: '90 Minutos (Pagado)',
                progress: 95,
                desc: 'Pedido pagado al 100%. Solo falta entregarte la copa.'
            },
            'completed': {
                label: '¡Final del Partido! (Entregado)',
                progress: 100,
                desc: '¡Victoria! Gracias por fichar con nosotros. ¡Hasta la próxima temporada!'
            },
            'cancelled': {
                label: 'Partido Suspendido',
                progress: 0,
                desc: 'Tarjeta Roja. Este pedido ha sido cancelado.'
            },
            'Cancelled': {
                label: 'Partido Suspendido',
                progress: 0,
                desc: 'Tarjeta Roja. Este pedido ha sido cancelado.'
            },
        };

        const currentStatus = statusMap[order.status] || { label: 'En Proceso', progress: 20, desc: 'Tu pedido está siendo atendido.' };

        // 🛡️ M7 FIX adicional: No exponer customer_name en la respuesta pública
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
                }
            }
        });

    } catch (error) {
        console.error('Error tracking order:', error);
        return NextResponse.json({ success: false, error: 'Error al consultar el pedido' }, { status: 500 });
    }
}
