'use client';

import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirmar',
    onConfirm,
    onCancel,
    danger = true,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Panel */}
            <div className="relative bg-[#111] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                    aria-label="Cerrar"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${danger ? 'bg-red-500/15 border border-red-500/20' : 'bg-yellow-500/15 border border-yellow-500/20'}`}>
                    <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-400' : 'text-yellow-400'}`} />
                </div>

                <h3 className="text-base font-black text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">{message}</p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => { onConfirm(); onCancel(); }}
                        className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition-all ${danger
                            ? 'bg-red-500/80 hover:bg-red-500 border border-red-500/30'
                            : 'bg-yellow-500/80 hover:bg-yellow-500 border border-yellow-500/30'
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
