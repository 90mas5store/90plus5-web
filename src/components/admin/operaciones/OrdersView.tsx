import Link from 'next/link';
import { ChevronLeft, ChevronRight, Eye, MessageCircle } from 'lucide-react';
import { formatDate, HONDURAS_TIMEZONE } from '@/lib/utils';
import OrderSearch from '@/components/admin/OrderSearch';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import OrderFilters from '@/components/admin/OrderFilters';
import OrderLifecycleTabs from '@/components/admin/orders/OrderLifecycleTabs';
import FactoryExporterButton from '@/components/admin/orders/FactoryExporterButton';
import OrderMobileCard from '@/components/admin/orders/OrderMobileCard';
import type { OrderRow } from './types';

interface OrdersViewProps {
    orders: OrderRow[];
    count: number;
    currentPage: number;
    totalPages: number;
    from: number;
    to: number;
    baseParams: Record<string, string>;
    errorMessage?: string | null;
}

export function OrdersView({
    orders,
    count,
    currentPage,
    totalPages,
    from,
    to,
    baseParams,
    errorMessage,
}: OrdersViewProps) {
    if (errorMessage) {
        return (
            <div className="text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-sm">
                Error cargando pedidos: {errorMessage}
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* Barra de búsqueda, exportador y filtros */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                        Listado de Pedidos
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-neutral-300">
                        {count} {count === 1 ? 'pedido' : 'pedidos'}
                    </span>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    <div className="flex-1 md:flex-initial">
                        <OrderSearch />
                    </div>
                    <FactoryExporterButton />
                    <OrderFilters />
                </div>
            </div>

            {/* Pestañas de ciclo de vida */}
            <OrderLifecycleTabs />

            {/* Lista / Tabla de pedidos */}
            <div className="bg-[#0a0c10]/80 border border-white/[0.08] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                {/* Vista móvil */}
                <div className="md:hidden divide-y divide-white/5">
                    {orders.map((order) => (
                        <OrderMobileCard key={order.id} order={order} />
                    ))}

                    {orders.length === 0 && (
                        <div className="px-6 py-16 text-center text-gray-500">
                            <p className="font-bold text-sm text-gray-300 mb-1">No se encontraron pedidos</p>
                            <p className="text-xs text-gray-500">Intenta con otro filtro o término de búsqueda.</p>
                        </div>
                    )}
                </div>

                {/* Vista desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/[0.02] text-neutral-400 text-[10px] sm:text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-3.5 border-b border-white/[0.06]"># Ref.</th>
                                <th className="px-6 py-3.5 border-b border-white/[0.06]">Cliente</th>
                                <th className="px-6 py-3.5 border-b border-white/[0.06]">Ubicación</th>
                                <th className="px-6 py-3.5 border-b border-white/[0.06]">Fecha (UTC-6)</th>
                                <th className="px-6 py-3.5 border-b border-white/[0.06] text-center">Estado</th>
                                <th className="px-6 py-3.5 border-b border-white/[0.06] text-right">Total</th>
                                <th className="px-6 py-3.5 border-b border-white/[0.06] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] text-sm">
                            {orders.map((order) => {
                                const cleanPhone = order.customer_phone?.replace(/\D/g, '') || '';
                                const fullPhone = cleanPhone.startsWith('504') ? cleanPhone : `504${cleanPhone}`;
                                const ref = order.id.slice(0, 8).toUpperCase();
                                const waUrl = cleanPhone
                                    ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(`Hola ${order.customer_name || ''}! Te saludamos de 90+5 Store sobre tu orden #${ref}.`)}`
                                    : null;

                                return (
                                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 font-mono">
                                            <span className="text-white font-bold">#{ref}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white mb-0.5">{order.customer_name}</div>
                                            <div className="text-xs text-gray-500">{order.customer_email}</div>
                                            {order.customer_phone && (
                                                <div className="text-xs text-gray-400 font-mono mt-0.5">{order.customer_phone}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            <div className="text-white font-medium">{order.shipping_municipality || '—'}</div>
                                            <div className="text-[10px] text-gray-500">{order.shipping_department || ''}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs font-mono" suppressHydrationWarning>
                                            {formatDate(order.created_at, true, HONDURAS_TIMEZONE)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <OrderStatusBadge status={order.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-400 font-mono">
                                            L {order.total_amount?.toLocaleString('es-HN') ?? 0}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {waUrl && (
                                                    <a
                                                        href={waUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                                                        title="Contactar por WhatsApp"
                                                    >
                                                        <MessageCircle className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="inline-flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition-all"
                                                    title="Ver detalle de orden"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                                        <p className="text-base font-bold text-gray-300 mb-1">No se encontraron pedidos</p>
                                        <p className="text-xs text-gray-500">Prueba ajustando los filtros de estado o fecha.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación adaptable */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-white/[0.06] bg-black/20">
                        <p className="text-[11px] sm:text-xs text-neutral-400 text-center sm:text-left">
                            Mostrando {from + 1}–{Math.min(to + 1, count)} de <span className="text-white font-bold">{count}</span> pedidos
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {currentPage > 1 ? (
                                <Link
                                    href={`?${new URLSearchParams({ ...baseParams, page: String(currentPage - 1) })}`}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] transition-all text-xs font-bold"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                                </Link>
                            ) : (
                                <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.02] text-neutral-600 text-xs font-bold cursor-not-allowed">
                                    <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                                </span>
                            )}
                            <span className="text-xs text-neutral-400 px-2 font-mono">
                                {currentPage} / {totalPages}
                            </span>
                            {currentPage < totalPages ? (
                                <Link
                                    href={`?${new URLSearchParams({ ...baseParams, page: String(currentPage + 1) })}`}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] transition-all text-xs font-bold"
                                >
                                    Siguiente <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            ) : (
                                <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.02] text-neutral-600 text-xs font-bold cursor-not-allowed">
                                    Siguiente <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

