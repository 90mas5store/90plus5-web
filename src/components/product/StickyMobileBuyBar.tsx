'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from '@/lib/motion';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';
import { CustomizerProduct, SelectedOption } from '@/types/productCustomizer';

interface StickyMobileBuyBarProps {
    producto: CustomizerProduct;
    precioConRecargo: number;
    tallaSeleccionada: SelectedOption | null;
    isAdding: boolean;
    onAddToCart: () => void;
}

export default function StickyMobileBuyBar({
    producto,
    precioConRecargo,
    tallaSeleccionada,
    isAdding,
    onAddToCart,
}: StickyMobileBuyBarProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;

            // No mostrar si el usuario está arriba en el hero/galería
            if (scrollY < 350) {
                setIsVisible(false);
                return;
            }

            // Ocultar si el botón principal de acción está visible en pantalla (evita duplicidad)
            const mainActionBtn = document.getElementById('main-add-to-cart');
            if (mainActionBtn) {
                const rect = mainActionBtn.getBoundingClientRect();
                if (rect.top < window.innerHeight - 20 && rect.bottom > 20) {
                    setIsVisible(false);
                    return;
                }
            }

            // Ocultar si el usuario llegó al fondo (productos relacionados o footer)
            const scrollBottom = window.innerHeight + window.scrollY;
            const docHeight = document.documentElement.scrollHeight;
            if (scrollBottom >= docHeight - 450) {
                setIsVisible(false);
                return;
            }

            setIsVisible(true);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                    className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0a0b0e]/95 backdrop-blur-2xl border-t border-white/15 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] shadow-[0_-12px_40px_rgba(0,0,0,0.85)]"
                >
                    {/* Specular Top Highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

                    <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
                        {/* Mini Info */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {producto.imagen && (
                                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 p-0.5 shrink-0 relative overflow-hidden flex items-center justify-center shadow-inner">
                                    <Image
                                        src={producto.imagen}
                                        alt={producto.equipo}
                                        fill
                                        className="object-contain p-0.5"
                                        sizes="40px"
                                    />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-xs font-black text-white truncate">
                                        {producto.equipo}
                                    </span>
                                    {tallaSeleccionada && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold bg-primary/20 text-primary border border-primary/30 shrink-0">
                                            {tallaSeleccionada.label}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm font-black text-white flex items-baseline gap-1 mt-0.5">
                                    <span className="text-xs font-bold text-amber-400">L</span>
                                    <span className="font-mono tabular-nums">
                                        {precioConRecargo > 0
                                            ? precioConRecargo.toLocaleString('es-HN', {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                              })
                                            : 'Consultar'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Buy Button con Bisel Specular */}
                        <button
                            type="button"
                            onClick={onAddToCart}
                            disabled={isAdding || precioConRecargo <= 0}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-primary to-rose-600 border-t border-white/30 hover:opacity-95 active:scale-95 disabled:bg-neutral-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_20px_rgba(229,9,20,0.4)] transition-all shrink-0 cursor-pointer min-h-[42px]"
                        >
                            {isAdding ? (
                                <CheckCircle2 className="w-4 h-4 animate-spin shrink-0" />
                            ) : (
                                <ShoppingBag className="w-4 h-4 shrink-0" />
                            )}
                            <span>{isAdding ? 'Agregando...' : 'Pedir'}</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
