"use client";

import { useState } from "react";
import { Search, ArrowRight, Loader2, X, Clipboard, Sparkles } from "lucide-react";
import { m as motion } from "@/lib/motion";

interface TrackingSearchBarProps {
    orderId: string;
    setOrderId: (id: string) => void;
    onSearch: (id: string) => void;
    loading: boolean;
}

export default function TrackingSearchBar({
    orderId,
    setOrderId,
    onSearch,
    loading,
}: TrackingSearchBarProps) {
    const [pasting, setPasting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (orderId.trim()) {
            onSearch(orderId.trim());
        }
    };

    const handlePaste = async () => {
        try {
            setPasting(true);
            const text = await navigator.clipboard.readText();
            if (text) {
                const clean = text.trim();
                setOrderId(clean);
                onSearch(clean);
            }
        } catch {
            // Silently fallback if clipboard permission is denied
        } finally {
            setPasting(false);
        }
    };

    const handleClear = () => {
        setOrderId("");
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="relative group">
                {/* Glow ambiental reactivo al foco */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-red-500/20 to-primary/30 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative flex items-center bg-white/[0.04] hover:bg-white/[0.06] focus-within:!bg-[#0c0e14] border border-white/[0.1] focus-within:border-primary/80 rounded-2xl md:rounded-3xl p-1.5 md:p-2 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                    {/* Icono de búsqueda */}
                    <div className="pl-3 md:pl-4 pr-2 text-white/40 group-focus-within:text-primary transition-colors flex items-center shrink-0">
                        <Search className="w-5 h-5 md:w-6 md:h-6" />
                    </div>

                    {/* Input */}
                    <input
                        type="text"
                        placeholder="Ingresa tu ID de pedido (ej: a0eebc99...)"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        autoComplete="off"
                        spellCheck="false"
                        className="w-full bg-transparent text-white placeholder:text-white/35 text-sm md:text-base font-mono tracking-wider focus:outline-none py-2.5 md:py-3.5 pr-2"
                        aria-label="Código o ID de pedido"
                    />

                    {/* Botón de Limpiar si hay texto */}
                    {orderId && !loading && (
                        <button
                            type="button"
                            onClick={handleClear}
                            aria-label="Borrar texto"
                            className="p-1.5 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors mr-1 shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    {/* Botón de Pegar si no hay texto */}
                    {!orderId && !loading && (
                        <button
                            type="button"
                            onClick={handlePaste}
                            aria-label="Pegar código del portapapeles"
                            title="Pegar del portapapeles"
                            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 mr-2 rounded-xl text-[11px] font-semibold text-white/60 hover:text-white bg-white/[0.05] hover:bg-white/10 border border-white/[0.08] transition-all shrink-0 active:scale-95"
                        >
                            <Clipboard className="w-3 h-3" />
                            <span>{pasting ? "Pegando..." : "Pegar"}</span>
                        </button>
                    )}

                    {/* Botón de Búsqueda */}
                    <motion.button
                        type="submit"
                        disabled={loading || !orderId.trim()}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        className="shrink-0 flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-primary hover:bg-[#b0060e] text-white font-bold text-xs md:text-sm tracking-wide transition-all shadow-[0_4px_16px_rgba(225,29,72,0.3)] disabled:opacity-40 disabled:hover:bg-primary disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="hidden sm:inline">Buscando...</span>
                            </>
                        ) : (
                            <>
                                <span className="hidden sm:inline">Rastrear</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </motion.button>
                </div>
            </form>

            {/* Píldora de ayuda y consejos */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[11px] text-white/45">
                <span className="inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>Acepta tu ID corto de 8 caracteres o el enlace de tu correo de confirmación</span>
                </span>
            </div>
        </div>
    );
}
