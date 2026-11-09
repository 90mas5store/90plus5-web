'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Save, Loader2 } from 'lucide-react';

interface ProductEditHeaderProps {
    name: string;
    id: string;
    isSuperAdmin: boolean;
    saving: boolean;
    onSave: () => void;
    onRequestDelete: () => void;
}

export default function ProductEditHeader({
    name,
    id,
    isSuperAdmin,
    saving,
    onSave,
    onRequestDelete,
}: ProductEditHeaderProps) {
    return (
        <div className="sticky top-0 z-30 bg-[#07080a]/80 backdrop-blur-2xl border-b border-white/[0.08] py-4 mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 relative shadow-lg">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-6xl mx-auto">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/productos"
                        className="w-9 h-9 rounded-2xl bg-white/[0.05] border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-[0.96] shadow-sm"
                        title="Volver al catálogo"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Editando Prenda
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">ID: {id.slice(0, 8)}...</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate max-w-md sm:max-w-xl">
                            {name || 'Producto'}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    {isSuperAdmin && (
                        <button
                            type="button"
                            onClick={onRequestDelete}
                            className="p-2.5 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer active:scale-[0.97] shadow-sm"
                            title="Eliminar Producto"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-[0_4px_20px_rgba(229,9,20,0.35)] disabled:opacity-50 cursor-pointer active:scale-[0.97]"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
