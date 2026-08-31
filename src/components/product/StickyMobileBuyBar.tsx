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
            // Show after scrolling past 380px on mobile
            if (window.scrollY > 380) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-neutral-950/92 backdrop-blur-xl border-t border-white/10 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
                >
                    <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
                        {/* Mini Info */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {producto.imagen && (
                                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 p-1 shrink-0 relative overflow-hidden flex items-center justify-center">
                                    <Image
                                        src={producto.imagen}
                                        alt={producto.equipo}
                                        fill
                                        className="object-contain p-0.5"
                                        sizes="44px"
                                    />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-xs font-black text-white truncate">
                                        {producto.equipo}
                                    </span>
                                    {tallaSeleccionada && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-primary/20 text-primary border border-primary/30 shrink-0">
                                            {tallaSeleccionada.label}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm font-black text-white">
                                    L{' '}
                                    {precioConRecargo > 0
                                        ? precioConRecargo.toLocaleString('es-HN', {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                          })
                                        : 'Consultar'}
                                </div>
                            </div>
                        </div>

                        {/* Quick Buy Button */}
                        <button
                            type="button"
                            onClick={onAddToCart}
                            disabled={isAdding || precioConRecargo <= 0}
                            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 active:scale-95 disabled:bg-gray-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(229,9,20,0.4)] transition-all shrink-0 cursor-pointer"
                        >
                            {isAdding ? (
                                <CheckCircle2 className="w-4 h-4 animate-pulse" />
                            ) : (
                                <ShoppingBag className="w-4 h-4" />
                            )}
                            <span>{isAdding ? 'Agregando...' : 'Comprar'}</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
