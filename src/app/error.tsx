'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global Error caught:', error);
    }, [error]);

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* 🔴 Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-red-600/10 blur-[100px] -z-10" />

            <div className="text-center space-y-6 max-w-lg mx-auto z-10 border border-white/5 bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
                <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight">
                        Tarjeta Roja
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Hubo un error inesperado en el sistema. El árbitro ha detenido el juego momentáneamente.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <p className="text-xs text-red-400 font-mono mt-2 bg-black/50 p-2 rounded border border-red-500/20">
                            {error.message}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                        onClick={reset}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors uppercase text-xs tracking-widest"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reintentar
                    </button>
                    <Link
                        href="/"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors border border-white/10 uppercase text-xs tracking-widest"
                    >
                        Ir al Inicio
                    </Link>
                </div>
            </div>
        </main>
    );
}
