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
        <div className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 pb-4 mb-6 pt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <Link
                    href="/admin/productos"
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate max-w-[200px] sm:max-w-md">
                        Editar: {name || 'Producto'}
                    </h1>
                    <p className="text-gray-400 text-xs font-mono opacity-60">ID: {id}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {isSuperAdmin && (
                    <button
                        type="button"
                        onClick={onRequestDelete}
                        className="p-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Eliminar Producto"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(229,9,20,0.3)] disabled:opacity-50 cursor-pointer"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    <span>Guardar</span>
                </button>
            </div>
        </div>
    );
}
