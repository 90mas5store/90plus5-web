'use client';

import React from 'react';
import { Tag, Edit, Trash2, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { Category } from './types';

interface CategoriesTableProps {
    categories: Category[];
    loading: boolean;
    search: string;
    onSearchChange: (val: string) => void;
    page: number;
    totalPages: number;
    totalCount: number;
    isSuperAdmin: boolean;
    onPageChange: (p: number) => void;
    onEditCategory: (cat: Category) => void;
    onDeleteCategory: (id: string) => void;
}

export default function CategoriesTable({
    categories,
    loading,
    search,
    onSearchChange,
    page,
    totalPages,
    totalCount,
    isSuperAdmin,
    onPageChange,
    onEditCategory,
    onDeleteCategory,
}: CategoriesTableProps) {
    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            {/* Buscador Spotlight */}
            <div className="mb-4 sm:mb-6 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o slug..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-3 text-white placeholder:text-neutral-500 focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all text-xs sm:text-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs text-neutral-400 font-medium">Cargando categorías...</span>
                </div>
            ) : categories.length === 0 ? (
                <div className="py-20 text-center px-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-neutral-500">
                        <Tag className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white">No se encontraron categorías</p>
                    <p className="text-xs text-neutral-500 mt-1">Prueba cambiando el término de búsqueda</p>
                </div>
            ) : (
                <div className="overflow-x-auto -mx-4 sm:-mx-6">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-neutral-400">
                                <th className="pb-3 px-4 sm:px-6 font-bold w-16 text-center">Orden</th>
                                <th className="pb-3 px-4 font-bold w-20 text-center">Icono</th>
                                <th className="pb-3 px-4 font-bold min-w-[180px]">Nombre</th>
                                <th className="pb-3 px-4 font-bold min-w-[140px]">Slug</th>
                                <th className="pb-3 px-4 font-bold text-center">Estado</th>
                                <th className="pb-3 px-4 sm:px-6 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {categories.map((cat) => (
                                <tr key={cat.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3 px-4 sm:px-6 text-center font-mono text-xs text-neutral-400">
                                        {cat.order_index}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {cat.icon_url ? (
                                            <div className="w-10 h-10 relative mx-auto rounded-xl bg-white/[0.03] border border-white/[0.08] p-1 overflow-hidden flex items-center justify-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={cat.icon_url}
                                                    alt={cat.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 mx-auto rounded-xl bg-white/[0.03] flex items-center justify-center text-neutral-600 border border-white/[0.08]">
                                                <Tag className="w-4 h-4" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 font-bold text-white text-sm">
                                        {cat.name}
                                    </td>
                                    <td className="py-3 px-4 text-xs font-mono text-neutral-400">
                                        {cat.slug}
                                    </td>
                                    <td className="py-3 px-4 text-center whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                                cat.active
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    cat.active ? 'bg-emerald-400' : 'bg-red-400'
                                                }`}
                                            />
                                            {cat.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 sm:px-6 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onEditCategory(cat)}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer active:scale-[0.98]"
                                                title="Editar categoría"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteCategory(cat.id)}
                                                disabled={!isSuperAdmin}
                                                title={!isSuperAdmin ? 'Solo Super Admins pueden eliminar' : 'Mover a papelera'}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
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

            {/* Paginación Apple */}
            {totalCount > 20 && (
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.06]">
                    <p className="text-xs text-neutral-400">
                        Mostrando {(page - 1) * 20 + 1}–{Math.min(page * 20, totalCount)} de {totalCount} categorías
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/[0.08] text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-neutral-300 font-mono font-bold px-2">
                            {page} / {totalPages || 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/[0.08] text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

