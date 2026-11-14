'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, AlertCircle, Loader2, Filter } from 'lucide-react';
import { UsageRow } from './types';

interface DiscountAuditTableProps {
    usage: UsageRow[];
    uniqueUsedCodes: string[];
    loading: boolean;
    auditFilter: string;
    onFilterChange: (val: string) => void;
}

function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function DiscountAuditTable({
    usage,
    uniqueUsedCodes,
    loading,
    auditFilter,
    onFilterChange,
}: DiscountAuditTableProps) {
    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            {/* Filtro de Código */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div className="relative max-w-xs w-full">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <select
                        value={auditFilter}
                        onChange={(e) => onFilterChange(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-white text-xs sm:text-sm outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                    >
                        <option value="">Todos los códigos usados</option>
                        {uniqueUsedCodes.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>
                <span className="text-xs font-mono text-neutral-400">
                    {usage.length} registro{usage.length !== 1 ? 's' : ''} encontrados
                </span>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs text-neutral-400 font-medium">Cargando historial de usos...</span>
                </div>
            ) : usage.length === 0 ? (
                <div className="py-20 text-center px-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-neutral-500">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white">Sin registros de canje</p>
                    <p className="text-xs text-neutral-500 mt-1">
                        Aún no se han aplicado códigos promocionales con el filtro actual.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto -mx-4 sm:-mx-6">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                        <thead>
                            <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-neutral-400">
                                <th className="pb-3 px-4 sm:px-6 font-bold">Pedido</th>
                                <th className="pb-3 px-4 font-bold">Cliente</th>
                                <th className="pb-3 px-4 font-bold">Código</th>
                                <th className="pb-3 px-4 font-bold text-center">Tasa</th>
                                <th className="pb-3 px-4 font-bold text-right">Ahorro Aplicado</th>
                                <th className="pb-3 px-4 sm:px-6 font-bold text-right">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {usage.map((u) => (
                                <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3.5 px-4 sm:px-6">
                                        <Link
                                            href={`/admin/orders/${u.order_id}`}
                                            className="inline-flex items-center gap-1.5 text-xs font-mono font-black text-primary hover:underline"
                                        >
                                            <span>#{u.order_id.slice(0, 8).toUpperCase()}</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-neutral-300 font-medium">
                                        {u.customer_email}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <span className="font-mono font-bold text-xs bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded-md text-white tracking-wider">
                                            {u.discount_codes?.code ?? '—'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <span className="text-emerald-400 font-mono font-bold text-xs">
                                            {u.discount_codes?.discount_pct ?? '—'}%
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-xs">
                                        L {u.discount_amount.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-3.5 px-4 sm:px-6 text-right text-xs text-neutral-400 whitespace-nowrap" suppressHydrationWarning>
                                        {formatDate(u.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

