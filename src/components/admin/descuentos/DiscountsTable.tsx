'use client';

import React from 'react';
import { Tag, Search, Copy, Edit, Trash2, Loader2, Plus } from 'lucide-react';
import { DiscountCode } from './types';

interface DiscountsTableProps {
    codes: DiscountCode[];
    loading: boolean;
    toggling: string | null;
    search: string;
    onSearchChange: (val: string) => void;
    onCopyCode: (code: string) => void;
    onToggleCode: (id: string, current: boolean) => void;
    onEditCode: (dc: DiscountCode) => void;
    onDeleteCode: (target: { id: string; code: string }) => void;
    onNewCode: () => void;
}

function buildScopeLabel(dc: DiscountCode) {
    const parts: string[] = [];
    if (dc.category_ids?.length) parts.push(`${dc.category_ids.length} cat.`);
    if (dc.league_ids?.length) parts.push(`${dc.league_ids.length} liga(s)`);
    if (dc.team_ids?.length) parts.push(`${dc.team_ids.length} equipo(s)`);
    return parts.length ? parts.join(' · ') : 'Todo el catálogo';
}

function formatDate(d: string | null) {
    if (!d) return 'Sin expiración';
    return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function DiscountsTable({
    codes,
    loading,
    toggling,
    search,
    onSearchChange,
    onCopyCode,
    onToggleCode,
    onEditCode,
    onDeleteCode,
    onNewCode,
}: DiscountsTableProps) {
    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            {/* Buscador Spotlight */}
            <div className="mb-4 sm:mb-6 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar por código o descripción..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-3 text-white placeholder:text-neutral-500 focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all text-xs sm:text-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs text-neutral-400 font-medium">Cargando códigos promocionales...</span>
                </div>
            ) : codes.length === 0 ? (
                <div className="py-20 text-center px-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-neutral-500">
                        <Tag className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white">No hay códigos de descuento</p>
                    <p className="text-xs text-neutral-500 mt-1 mb-4">
                        Crea cupones porcentuales para campañas, clientes VIP o temporadas especiales.
                    </p>
                    <button
                        type="button"
                        onClick={onNewCode}
                        className="bg-white text-black font-extrabold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 hover:bg-neutral-200 transition-all cursor-pointer active:scale-[0.98]"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Crear primer código</span>
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto -mx-4 sm:-mx-6">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-neutral-400">
                                <th className="pb-3 px-4 sm:px-6 font-bold">Código</th>
                                <th className="pb-3 px-4 font-bold">Descripción</th>
                                <th className="pb-3 px-4 font-bold text-center">Descuento</th>
                                <th className="pb-3 px-4 font-bold">Alcance</th>
                                <th className="pb-3 px-4 font-bold text-center">Usos</th>
                                <th className="pb-3 px-4 font-bold">Expiración</th>
                                <th className="pb-3 px-4 font-bold text-center">Estado</th>
                                <th className="pb-3 px-4 sm:px-6 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {codes.map((dc) => (
                                <tr key={dc.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3.5 px-4 sm:px-6">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-black text-white tracking-widest text-xs bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-lg">
                                                {dc.code}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onCopyCode(dc.code)}
                                                title="Copiar código"
                                                className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-neutral-300 max-w-[200px] truncate">
                                        {dc.description || <span className="text-neutral-600 italic">—</span>}
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            {dc.discount_pct}% OFF
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-neutral-400">
                                        {buildScopeLabel(dc)}
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-mono text-xs font-bold text-neutral-300">
                                        {dc.used_count}
                                        {dc.max_uses ? <span className="text-neutral-500"> / {dc.max_uses}</span> : ''}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-neutral-400 whitespace-nowrap" suppressHydrationWarning>
                                        {formatDate(dc.expires_at)}
                                    </td>
                                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => onToggleCode(dc.id, dc.active)}
                                            disabled={toggling === dc.id}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 ${
                                                dc.active
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                    : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            {toggling === dc.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        dc.active ? 'bg-emerald-400' : 'bg-neutral-500'
                                                    }`}
                                                />
                                            )}
                                            <span>{dc.active ? 'Activo' : 'Pausado'}</span>
                                        </button>
                                    </td>
                                    <td className="py-3.5 px-4 sm:px-6 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onEditCode(dc)}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer active:scale-[0.98]"
                                                title="Editar código"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteCode({ id: dc.id, code: dc.code })}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-all cursor-pointer active:scale-[0.98]"
                                                title="Eliminar código"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
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

