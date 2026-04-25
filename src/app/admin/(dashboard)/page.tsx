import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { formatDate, HONDURAS_TIMEZONE } from '@/lib/utils'

import DashboardMetrics from '@/components/admin/DashboardMetrics'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'

export const revalidate = 300; // Revalidar cada 5 minutos

export default async function AdminDashboard() {
    const supabase = await createClient()

    // Traer pedidos (solo info general, sin items pesados)
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); // Limit reduced for dashboard view

    if (error) {
        return <div className="text-red-500 p-4">Error cargando pedidos: {error.message}</div>
    }

    // Métricas precisas via RPC (una sola query agregada)
    const { data: stats } = await supabase.rpc('get_order_stats').single();

    const trueTotalOrders = (stats as { total_orders: number } | null)?.total_orders || 0;
    const estimatedTotalSales = (stats as { total_sales: number } | null)?.total_sales || 0;

    return (
        <div className="space-y-6 md:space-y-8">
            {/* HEADER */}
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-white">Resumen de Ventas</h2>
                <p className="text-gray-400 text-sm">Bienvenido de vuelta, Master.</p>
            </div>

            {/* METRICAS */}
            <DashboardMetrics totalOrders={trueTotalOrders} totalSales={estimatedTotalSales} />

            {/* TABLA / CARDS PEDIDOS */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-base md:text-lg">Últimas Órdenes</h3>
                    <Link href="/admin/orders" className="text-primary text-xs md:text-sm font-bold hover:underline">Ver todas</Link>
                </div>


                <div className="md:hidden divide-y divide-white/5">
                    {orders?.map((order) => (
                        <Link
                            key={order.id}
                            href={`/admin/orders/${order.id}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono font-black text-white text-xs">#{order.id.slice(0, 8).toUpperCase()}</span>
                                    <OrderStatusBadge status={order.status} />
                                </div>
                                <div className="text-sm font-semibold text-gray-200 truncate">{order.customer_name}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">{formatDate(order.created_at, false, HONDURAS_TIMEZONE)}</div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <span className="font-black text-white text-sm">L {order.total_amount?.toLocaleString("es-HN")}</span>
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </div>
                        </Link>
                    ))}
                    {(!orders || orders.length === 0) && (
                        <p className="px-4 py-10 text-center text-gray-500 text-sm italic">Aún no hay pedidos...</p>
                    )}
                </div>


                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4"># Ref.</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {orders?.map((order) => (
                                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold">
                                        <span className="text-white">#{order.id.slice(0, 8).toUpperCase()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{order.customer_name}</div>
                                        <div className="text-xs text-gray-500">{order.customer_email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <OrderStatusBadge status={order.status} />
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white">
                                        L {order.total_amount?.toLocaleString("es-HN")}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {formatDate(order.created_at, true, HONDURAS_TIMEZONE)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/admin/orders/${order.id}`} className="text-primary font-bold hover:underline">Ver</Link>
                                    </td>
                                </tr>
                            ))}
                            {(!orders || orders.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                                        Aún no hay pedidos...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
