import { createClient } from '@/lib/supabase/server'
import { Eye, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { formatDate, HONDURAS_TIMEZONE } from '@/lib/utils'

import OrderSearch from '@/components/admin/OrderSearch'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'

export const dynamic = 'force-dynamic';

export default async function OrdersPage({
    searchParams
}: {
    searchParams?: { q?: string }
}) {
    const supabase = await createClient()
    const queryTerm = searchParams?.q || '';

    let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (queryTerm) {
        query = query.or(`customer_name.ilike.%${queryTerm}%,customer_email.ilike.%${queryTerm}%`)
    }

    const { data: orders, error } = await query;

    if (error) {
        return <div className="text-red-500 bg-red-500/10 p-4 rounded-xl">Error cargando pedidos: {error.message}</div>
    }

    return (
        <div className="space-y-6">
            {/* HEADER & ACTIONS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Gestión de Pedidos</h1>
                    <p className="text-gray-400 text-xs md:text-sm">Administra y rastrea las compras recientes.</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {/* Buscador Real */}
                    <OrderSearch />

                    <button className="p-2 border border-white/10 rounded-xl hover:bg-white/5 text-gray-400">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-black/40 text-gray-400 text-[9px] md:text-[10px] uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-3 md:px-6 py-3 md:py-4 border-b border-white/5"># Referencia</th>
                                <th className="px-3 md:px-6 py-3 md:py-4 border-b border-white/5">Cliente</th>
                                <th className="px-3 md:px-6 py-3 md:py-4 border-b border-white/5 hidden md:table-cell">Ubicación</th>
                                <th className="px-3 md:px-6 py-3 md:py-4 border-b border-white/5">Fecha</th>
                                <th className="px-3 md:px-6 py-3 md:py-4 border-b border-white/5 text-center">Estado</th>
                                <th className="px-3 md:px-6 py-3 md:py-4 border-b border-white/5 text-right">Total</th>
                                <th className="px-3 md:px-6 py-3 md:py-4 border-b border-white/5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs md:text-sm">
                            {orders?.map((order) => (
                                <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-3 md:px-6 py-3 md:py-4 font-mono text-gray-500">
                                        <span className="text-white font-bold text-xs md:text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4">
                                        <div className="font-bold text-white mb-0.5 text-xs md:text-sm">{order.customer_name}</div>
                                        <div className="text-[10px] md:text-xs text-gray-500 hidden md:block">{order.customer_email}</div>
                                        <div className="text-[10px] md:text-xs text-gray-600 font-mono mt-1 hidden md:block">{order.customer_phone}</div>
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4 text-gray-400 text-xs hidden md:table-cell">
                                        <div className="text-white font-medium">{order.shipping_municipality}</div>
                                        <div>{order.shipping_department}</div>
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4 text-gray-400 text-[10px] md:text-sm">
                                        {formatDate(order.created_at, true, HONDURAS_TIMEZONE)}
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4 text-center">
                                        <OrderStatusBadge status={order.status} />
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4 text-right font-bold text-white text-sm md:text-base">
                                        L {order.total_amount?.toLocaleString() ?? 0}
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4 text-right">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="inline-flex items-center justify-center p-1.5 md:p-2 rounded-lg bg-white/5 hover:bg-primary hover:text-white transition-all text-gray-400"
                                        >
                                            <Eye className="w-3 h-3 md:w-4 md:h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}

                            {(!orders || orders.length === 0) && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                                        <p className="text-lg font-bold mb-2">No se encontraron pedidos</p>
                                        <p className="text-sm">Parece que aún no hay ventas registradas.</p>
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
