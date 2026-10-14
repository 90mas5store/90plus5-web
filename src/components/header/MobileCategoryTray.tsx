import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { m as motion, AnimatePresence } from "@/lib/motion";
import { Category } from "@/lib/types";
import { triggerHaptic } from "./haptics";

interface MobileCategoryTrayProps {
    isOpen: boolean;
    onClose: () => void;
    categorias: Category[];
    isLoading: boolean;
    categoriaActual: string | null;
    isActive: (path: string) => boolean;
}

export default function MobileCategoryTray({
    isOpen,
    onClose,
    categorias,
    isLoading,
    categoriaActual,
    isActive,
}: MobileCategoryTrayProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Scrim translúcido ultraligero que permite seguir viendo la tienda */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => {
                            triggerHaptic(8);
                            onClose();
                        }}
                        className="fixed inset-0 bg-black/35 backdrop-blur-[2px] z-40 md:hidden"
                    />

                    {/* Bandeja de Cristal anclada inmediatamente sobre el Dock */}
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.95 }}
                        transition={{ type: "spring", damping: 28, stiffness: 380, mass: 0.7 }}
                        style={{
                            bottom: "calc(5.25rem + env(safe-area-inset-bottom, 0px))",
                            transformOrigin: "bottom center",
                        }}
                        className="fixed inset-x-3 sm:inset-x-6 max-w-sm mx-auto z-50 md:hidden bg-[#121319]/95 backdrop-blur-3xl border border-white/20 rounded-[2rem] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden select-none"
                    >
                        {/* Specular hairline superior */}
                        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                        {/* Cabecera limpia y jerárquica de la bandeja */}
                        <div className="flex items-center justify-between px-2 pb-2.5 border-b border-white/[0.08]">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
                                <h3 className="text-xs font-bold text-white tracking-tight uppercase">
                                    Explorar Categorías
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic(8);
                                    onClose();
                                }}
                                aria-label="Cerrar menú"
                                className="w-6 h-6 rounded-full bg-white/10 active:scale-90 border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer backdrop-blur-md"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Contenido de la bandeja */}
                        <div className="pt-2.5 space-y-2">
                            {/* Píldora destacada: Todas las Camisetas */}
                            <Link
                                href="/catalogo"
                                onClick={() => {
                                    triggerHaptic(10);
                                    onClose();
                                }}
                                className={`group/all flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all active:scale-[0.98] ${
                                    isActive("/catalogo") && !categoriaActual
                                        ? "bg-[#E50914] text-white border-red-500/50 shadow-[0_2px_12px_rgba(229,9,20,0.5)] font-bold"
                                        : "bg-white/[0.06] hover:bg-white/[0.10] border-white/10 text-white/90"
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                                    <span className="text-xs font-bold tracking-tight">Todas las Camisetas</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover/all:translate-x-0.5 transition-transform" />
                            </Link>

                            {/* Grid de Píldoras de Categorías en 2 Columnas Limpias */}
                            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto scrollbar-hide no-scrollbar pr-0.5">
                                {!isLoading &&
                                    categorias.map((categoria) => {
                                        const isCatActive =
                                            categoria.slug?.toLowerCase() === categoriaActual?.toLowerCase() ||
                                            categoria.nombre?.toLowerCase() === categoriaActual?.toLowerCase();
                                        return (
                                            <Link
                                                key={categoria.id}
                                                href={`/catalogo?categoria=${encodeURIComponent(categoria.slug)}`}
                                                onClick={() => {
                                                    triggerHaptic(10);
                                                    onClose();
                                                }}
                                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all active:scale-[0.97] select-none ${
                                                    isCatActive
                                                        ? "bg-[#E50914] border-red-400 text-white shadow-[0_2px_12px_rgba(229,9,20,0.5)] font-bold"
                                                        : "bg-white/[0.05] hover:bg-white/[0.09] border-white/10 text-white/85"
                                                }`}
                                            >
                                                <div
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center p-1 border shrink-0 ${
                                                        isCatActive
                                                            ? "bg-white/20 border-white/30"
                                                            : "bg-white/10 border-white/15"
                                                    }`}
                                                >
                                                    {categoria.icon_url ? (
                                                        <Image
                                                            src={categoria.icon_url}
                                                            alt={categoria.nombre}
                                                            width={18}
                                                            height={18}
                                                            className="object-contain brightness-0 invert max-w-full max-h-full"
                                                        />
                                                    ) : (
                                                        <Sparkles className="w-3.5 h-3.5 text-white" />
                                                    )}
                                                </div>
                                                <span className="text-xs font-semibold tracking-tight truncate flex-1">
                                                    {categoria.nombre}
                                                </span>
                                            </Link>
                                        );
                                    })}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
