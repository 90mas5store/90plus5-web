import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, Mail, User, CreditCard, ShoppingBag, Truck } from 'lucide-react'
import OrderStatusSelector from './OrderStatusSelector'
import PaymentItem from './PaymentItem'
import CopyButton from '@/components/admin/CopyButton'
import { formatDate, HONDURAS_TIMEZONE } from '@/lib/utils'

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    // 1️⃣ Fetch Order
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
        *,
        order_items (
            *,
            products (name, image_url),
            product_variants(version),
            sizes(label),
            patches(name),
            players(name, number)
        ),
        payments:payments!payments_order_id_fkey (*)
    `)
        .eq('id', params.id)
        .single();

    if (error || !order) {
        console.error('Order error:', error)
        return notFound();
    }

    const cleanPhone = order.customer_phone?.replace(/\D/g, '') || '';
    const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('504') ? cleanPhone : `504${cleanPhone}`}`;

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* 🔙 BACK BUTTON */}
            <Link href="/admin/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-6 md:mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs md:text-sm font-bold uppercase">Volver a pedidos</span>
            </Link>

            {/* HEADER: ID + STATUS */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6 border-b border-white/10 pb-6 md:pb-8 mb-6 md:mb-8">
                <div>
                    <div className="flex items-center gap-3 md:gap-4 mb-2">
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                            #{order.id.slice(0, 8).toUpperCase()}
                        </h1>
                        <CopyButton text={order.id} label="ID" />
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] md:text-xs font-mono text-gray-400">
                            {formatDate(order.created_at, true, HONDURAS_TIMEZONE)}
                        </span>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-400 flex items-center gap-2">
                            Cliente: <span className="text-white font-bold">{order.customer_name}</span>
                        </span>
                    </div>
                </div>

                {/* STATUS SELECTOR */}
                <div className="w-full md:w-auto">
                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-2 md:mb-3 tracking-widest">Cambiar Estado</p>
                    <OrderStatusSelector orderId={order.id} currentStatus={order.status} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                {/* 📦 LEFT COLUMN: ORDER ITEMS */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden p-4 md:p-6">
                        <h2 className="flex items-center gap-2 md:gap-3 text-base md:text-lg font-bold text-white mb-4 md:mb-6">
                            <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                            Productos ({order.order_items.length})
                        </h2>

                        <div className="space-y-4 md:space-y-6">
                            {order.order_items.map((item: any, idx: number) => (
                                <div key={idx} className="flex flex-col sm:flex-row gap-4 md:gap-6 p-4 md:p-6 rounded-xl md:rounded-2xl bg-black/40 border border-white/5 relative overflow-hidden group">
                                    {/* GRADIENT GLOW */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                                    {/* IMAGEN PRODUCTO */}
                                    <div className="w-full sm:w-20 h-28 md:w-24 md:h-32 bg-white/5 rounded-xl overflow-hidden flex-shrink-0 relative border border-white/10">
                                        {item.products?.image_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-xs text-gray-600">No img</div>
                                        )}
                                        <div className="absolute bottom-0 right-0 left-0 bg-black/60 backdrop-blur-sm text-white text-[10px] py-1 text-center font-bold">
                                            x{item.quantity}
                                        </div>
                                    </div>

                                    {/* DETALLES */}
                                    <div className="flex-1 min-w-0 space-y-3 md:space-y-4">
                                        <div>
                                            <h3 className="font-black text-white text-base md:text-lg leading-tight mb-1">
                                                {item.products?.name || 'Producto Desconocido'}
                                            </h3>
                                            <p className="text-primary font-bold text-sm md:text-base">L {(item.unit_price * item.quantity).toLocaleString()}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
                                            {/* Versión */}
                                            {item.product_variants && (
                                                <div>
                                                    <span className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">Versión</span>
                                                    <span className="text-white font-medium capitalize">{item.product_variants.version || 'Estándar'}</span>
                                                </div>
                                            )}

                                            {/* Talla */}
                                            <div>
                                                <span className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">Talla</span>
                                                <span className="text-white font-medium">{item.sizes?.label || 'N/A'}</span>
                                            </div>

                                            {/* Parches */}
                                            {item.patch_id && (
                                                <div className="col-span-2">
                                                    <span className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">Parches</span>
                                                    <div className="text-white font-medium bg-white/5 inline-block px-2 py-1 rounded text-xs border border-white/10">
                                                        {item.patches?.name || 'Parches Seleccionados'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* PERSONALIZACIÓN */}
                                        {(item.personalization_type === 'player' || item.personalization_type === 'custom') && (
                                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-4 mt-2">
                                                <div className="bg-primary text-white font-black text-xl w-10 h-10 flex items-center justify-center rounded-lg shadow-lg shadow-primary/20">
                                                    {(item.personalization_type === 'player' ? item.players?.number : item.custom_number) || '#'}
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] uppercase font-bold text-primary/70">
                                                        {item.personalization_type === 'player' ? 'Jugador' : 'Personalizado'}
                                                    </span>
                                                    <span className="text-white font-bold text-lg uppercase tracking-wide">
                                                        {(item.personalization_type === 'player' ? item.players?.name : item.custom_name) || 'SIN NOMBRE'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10 flex justify-end">
                            <div className="w-full md:w-72 space-y-3">
                                <div className="flex justify-between text-gray-400 text-sm">
                                    <span>Subtotal</span>
                                    <span>L {order.subtotal?.toLocaleString() ?? 0}</span>
                                </div>
                                <div className="flex justify-between text-gray-400 text-sm">
                                    <span>Envío</span>
                                    <span>L 0</span>
                                </div>
                                <div className="flex justify-between text-white text-2xl font-black pt-4 border-t border-white/10">
                                    <span>Total</span>
                                    <span>L {order.total_amount?.toLocaleString() ?? 0}</span>
                                </div>
                                <div className="flex justify-between text-green-500 text-sm font-bold bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                                    <span>Anticipo Pagado</span>
                                    <span>- L {order.deposit_amount?.toLocaleString() ?? 0}</span>
                                </div>
                                <div className="flex justify-between text-orange-500 text-xl font-black bg-orange-500/10 p-4 rounded-xl border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                                    <span>Pendiente</span>
                                    <span>L {(order.total_amount - order.deposit_amount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 👤 RIGHT COLUMN: CUSTOMER & INFO */}
                <div className="space-y-6">

                    {/* CLIENTE */}
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                        <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">
                            <User className="w-4 h-4" />
                            Datos del Cliente
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Nombre</p>
                                <p className="font-bold text-white text-lg">{order.customer_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Email</p>
                                <a href={`mailto:${order.customer_email}`} className="text-primary hover:underline flex items-center gap-2">
                                    <Mail className="w-3 h-3" />
                                    {order.customer_email}
                                </a>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Teléfono</p>
                                <div className="flex items-center gap-3">
                                    <a href={`tel:${order.customer_phone}`} className="text-white hover:text-primary flex items-center gap-2 font-mono">
                                        <Phone className="w-3 h-3" />
                                        {order.customer_phone}
                                    </a>
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-black p-1.5 rounded-lg transition-all"
                                        title="Enviar WhatsApp"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DIRECCIÓN */}
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                        <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">
                            <Truck className="w-4 h-4" />
                            Envío
                        </h2>
                        <div className="space-y-4">
                            <div className="flex gap-3 text-white">
                                <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">{order.shipping_address}</p>
                                    <p className="text-gray-400 text-sm mt-1">{order.shipping_municipality}, {order.shipping_department}</p>
                                </div>
                            </div>

                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.shipping_address}, ${order.shipping_municipality}, ${order.shipping_department}, Honduras`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase transition-colors"
                            >
                                Ver en Google Maps
                            </a>
                        </div>
                    </div>

                    {/* PAGO INFO */}
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                        <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">
                            <CreditCard className="w-4 h-4" />
                            Gestión de Pagos
                        </h2>
                        {order.payments && order.payments.length > 0 ? (
                            <div className="space-y-3">
                                {order.payments.map((p: any) => (
                                    <PaymentItem key={p.id} payment={p} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No hay registros de pago.</p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
