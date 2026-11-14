'use client';

import React from 'react';
import Link from 'next/link';
import { Package, Download } from 'lucide-react';
import { OrderMetrics } from './types';
import { fmt, fmtPct, parseBankFromNotes, STATUS_LABEL, VERIFIED } from './accountingUtils';

interface AccountingOrdersTableProps {
    metrics: OrderMetrics[] | null;
    onExport: () => void;
}

export default function AccountingOrdersTable({
    metrics,
    onExport,
}: AccountingOrdersTableProps) {
    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06] mb-4">
                <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-white/5 text-white border border-white/10">
                        <Package className="w-4 h-4" />
                    </span>
                    <div>
                        <h2 className="text-sm sm:text-base font-extrabold text-white">
                            Detalle por Pedido ({metrics?.length ?? 0})
                        </h2>
                        <p className="text-[11px] text-neutral-400">
                            Transacciones individuales con costo, ganancia bruta y estado de cobranza
                        </p>
                    </div>
                </div>

                {metrics && metrics.length > 0 && (
                    <button
                        type="button"
                        onClick={onExport}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" /> Exportar lista a CSV
                    </button>
                )}
            </div>

            {!metrics || metrics.length === 0 ? (
                <p className="text-xs text-neutral-500 italic text-center py-8">
                    No se encontraron pedidos en el período seleccionado.
                </p>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/20">
                    <table className="w-full text-xs sm:text-sm min-w-[920px] border-collapse">
                        <thead>
                            <tr className="text-[10px] sm:text-xs uppercase font-bold text-neutral-400 bg-white/[0.02] border-b border-white/[0.06]">
                                <th className="text-left px-4 py-3">Pedido</th>
                                <th className="text-left px-4 py-3">Cliente</th>
                                <th className="text-left px-4 py-3">Estado</th>
                                <th className="text-right px-4 py-3">Subtotal</th>
                                <th className="text-right px-4 py-3">Descuento</th>
                                <th className="text-right px-4 py-3">Envío</th>
                                <th className="text-right px-4 py-3">Neto</th>
                                <th className="text-right px-4 py-3">Costo</th>
                                <th className="text-right px-4 py-3">Ganancia</th>
                                <th className="text-right px-4 py-3">Margen</th>
                                <th className="text-right px-4 py-3">Cobrado</th>
                                <th className="text-left px-4 py-3">Banco</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {metrics.map((m) => {
                                const verifiedPays = (m.order.payments || []).filter((p) =>
                                    VERIFIED.includes(p.status)
                                );
                                const banks = [
                                    ...new Set(verifiedPays.map((p) => parseBankFromNotes(p.notes, p.method))),
                                ].join(', ');
                                const isFullyPaid = m.verifiedPaid >= m.revenue - 1;

                                return (
                                    <tr key={m.order.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/orders/${m.order.id}`}
                                                className="font-mono text-xs font-bold text-white group-hover:text-primary transition-colors"
                                            >
                                                #{m.order.id.slice(0, 8).toUpperCase()}
                                            </Link>
                                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                                {new Date(m.order.created_at).toLocaleDateString('es-HN')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-white text-xs max-w-[120px] truncate">
                                            {m.order.customer_name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[11px] text-neutral-400">
                                                {STATUS_LABEL[m.order.status] || m.order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-neutral-400 font-mono text-xs">
                                            {fmt(m.productRevenue)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs font-mono">
                                            {m.discountAmount > 0 ? (
                                                <span className="text-amber-400 font-bold">
                                                    - {fmt(m.discountAmount)}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-neutral-400 font-mono text-xs">
                                            {m.shippingRevenue > 0 ? (
                                                fmt(m.shippingRevenue)
                                            ) : (
                                                <span className="text-neutral-500">Gratis</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-emerald-400 font-mono font-bold text-xs">
                                            {fmt(m.revenue)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-rose-400 font-mono text-xs">
                                            {fmt(m.productCost)}
                                        </td>
                                        <td
                                            className={`px-4 py-3 text-right font-mono font-bold text-xs ${
                                                m.grossProfit >= 0 ? 'text-white' : 'text-rose-400'
                                            }`}
                                        >
                                            {fmt(m.grossProfit)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-[11px] font-bold">
                                            <span
                                                className={
                                                    m.marginPct >= 30
                                                        ? 'text-emerald-400'
                                                        : m.marginPct >= 15
                                                        ? 'text-amber-400'
                                                        : 'text-rose-400'
                                                }
                                            >
                                                {fmtPct(m.marginPct)}
                                            </span>
                                        </td>
                                        <td
                                            className={`px-4 py-3 text-right font-mono text-xs font-bold ${
                                                isFullyPaid
                                                    ? 'text-emerald-400'
                                                    : m.verifiedPaid > 0
                                                    ? 'text-amber-400'
                                                    : 'text-neutral-500'
                                            }`}
                                        >
                                            {m.verifiedPaid > 0 ? fmt(m.verifiedPaid) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-neutral-400 max-w-[130px] truncate">
                                            {banks || <span className="text-neutral-600">—</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

