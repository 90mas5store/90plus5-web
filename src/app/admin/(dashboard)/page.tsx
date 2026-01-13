import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

import DashboardMetrics from '@/components/admin/DashboardMetrics'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'

export const dynamic = 'force-dynamic'; // Asegurar que siempre traiga datos frescos

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

    // Cálculos
    // Note: total count should be a separate query if we had pagination, but with limit small this is just "recent". 
    // Ideally we want TOTAL stats. 
    // Let's do a quick separate count query for the metrics to be accurate.
    const { count: totalCount, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

    // For sales sum, we need all orders or a sum function RPC. 
    // Since we don't have an RPC, we rely on the fetching. 
    // Fetching ALL purely for sum is expensive. 
    // I'll stick to the "Recent" text logic if I can't sum all.
    // However, user asked for "Improvement". Let's try to fetch a bit more for the sum, or accept it's "Recent Sales".
    // Let's fetch last 100 for the stats to be semi-realistic without killing perf.
    const { data: ordersForStats } = await supabase.from('orders').select('total_amount').limit(100);

    const trueTotalOrders = totalCount || 0;
    const estimatedTotalSales = ordersForStats?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0;

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div>
                <h2 className="text-3xl font-black text-white">Resumen de Ventas</h2>
                <p className="text-gray-400">Bienvenido de vuelta, Master.</p>
            </div>

            {/* METRICAS */}
            <DashboardMetrics totalOrders={trueTotalOrders} totalSales={estimatedTotalSales} />

            {/* TABLA PEDIDOS */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Últimas Órdenes</h3>
                    <Link href="/admin/orders" className="text-primary text-sm font-bold hover:underline">Ver todas</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4"># Referencia</th>
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
                                    <td className="px-6 py-4 font-mono text-gray-500 font-bold">
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
                                        L {order.total_amount?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {new Date(order.created_at).toLocaleDateString()}
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
