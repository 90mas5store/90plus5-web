import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('id');

    if (!orderId) {
        return NextResponse.json({ success: false, error: 'ID de pedido requerido' }, { status: 400 });
    }

    try {
        const supabase = await createClient();

        // Buscar la orden por ID (UUID)
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
            .eq('id', orderId)
            .single();

        if (error || !order) {
            return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
        }

        // Mapear estado a texto amigable
        const statusMap: Record<string, { label: string; progress: number; desc: string }> = {
            'pending_payment_50': { label: 'Esperando Anticipo', progress: 10, desc: 'Estamos esperando tu comprobante de pago.' },
            'payment_verified': { label: 'Pago Verificado', progress: 25, desc: 'Tu pago ha sido validado. Procesando orden.' },
            'processing': { label: 'En Producción', progress: 40, desc: 'Tu pedido se está fabricando con los mejores estándares.' },
            'shipped_to_hn': { label: 'En Tránsito Internacional', progress: 60, desc: 'Tu pedido vuela hacia Honduras.' },
            'in_customs': { label: 'En Aduana', progress: 75, desc: 'Trámites de importación en proceso.' },
            'ready_for_delivery': { label: 'Listo para Entrega', progress: 90, desc: 'Tu pedido está en nuestra bodega listo para envío local.' },
            'completed': { label: 'Entregado', progress: 100, desc: '¡Que lo disfrutes!' },
            'cancelled': { label: 'Cancelado', progress: 0, desc: 'Este pedido ha sido cancelado.' },
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
