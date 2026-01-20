import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('id');

    if (!orderId) {
        return NextResponse.json({ success: false, error: 'ID de pedido requerido' }, { status: 400 });
    }

    try {
        // ⚠️ Usar Service Role Key para saltar RLS (Policies) ya que el rastreo es público
        // y el usuario anónimo no tiene permiso de leer 'orders' normalmente.
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Helper to perform range search on UUIDs (native support without casting)
        const cleanId = orderId.toLowerCase().replace(/[^a-f0-9]/g, '');
        const padChar = (char: string) => {
            let padded = cleanId.padEnd(32, char);
            // Insert hyphens: 8-4-4-4-12
            return `${padded.slice(0, 8)}-${padded.slice(8, 12)}-${padded.slice(12, 16)}-${padded.slice(16, 20)}-${padded.slice(20, 32)}`;
        };

        const minUuid = padChar('0');
        const maxUuid = padChar('f');

        // Buscar la orden por rango de ID (funciona para parcial y completo)
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                id,
                created_at,
                status,
                customer_name,
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
            .gte('id', minUuid)
            .lte('id', maxUuid)
            .limit(1)
            .maybeSingle();

        if (error || !order) {
            return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
        }

        // Mapear estado a texto amigable
        // Mapear estado a texto amigable (Modo Futbolero Leve)
        const statusMap: Record<string, { label: string; progress: number; desc: string }> = {
            'pending_payment_50': {
                label: 'Calentamiento (Espera)',
                progress: 10,
                desc: 'Todo listo. Esperamos tu anticipo para el pitazo inicial.'
            },
            'deposit_paid': { // Added explicit deposit_paid if missing in previous logic, or mapping it. Correcting based on standard flow.
                label: '¡Gol del Anticipo!',
                progress: 25,
                desc: 'Anticipo recibido. El equipo entra en producción.'
            },
            'payment_verified': { // Legacy or synonym
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
            'paid_full': { // Specific state for fully paid before completion? Or mapped to ready?
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
            'Cancelled': { // Case sensitivity handling
                label: 'Partido Suspendido',
                progress: 0,
                desc: 'Tarjeta Roja. Este pedido ha sido cancelado.'
            },
        };

        const currentStatus = statusMap[order.status] || { label: 'En Proceso', progress: 20, desc: 'Tu pedido está siendo atendido.' };

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                date: order.created_at,
                customer: order.customer_name.split(' ')[0], // Solo primer nombre por privacidad
                location: `${order.shipping_municipality}, ${order.shipping_department}`,
                items: order.order_items.map((item: any) => ({
                    product: item.products?.name,
                    team: item.products?.teams?.name,
                    quantity: item.quantity,
                    image: item.products?.image_url,
                    version: item.product_variants?.version,
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
