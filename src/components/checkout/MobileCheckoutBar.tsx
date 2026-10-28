'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from '@/lib/motion';
import { ChevronUp, ChevronRight, X } from 'lucide-react';
import { CartItem } from '@/context/CartContext';

interface MobileCheckoutBarProps {
    total: number;
    anticipo: number;
    chargeAmount: number;
    paymentType: 'deposit' | 'full';
    isCard: boolean;
    isSubmitting: boolean;
    isFormValid: boolean;
    metodoPago: string;
    aceptoTerminos: boolean;
    onSubmit: (e: React.FormEvent) => void;
    items: CartItem[];
    shippingCost: number;
    discountAmount?: number;
}

export default function MobileCheckoutBar({
    total,
    anticipo,
    chargeAmount,
    paymentType,
    isCard,
    isSubmitting,
    isFormValid,
    metodoPago,
    aceptoTerminos,
    onSubmit,
    items,
    shippingCost,
    discountAmount = 0,
}: MobileCheckoutBarProps) {
    const [sheetOpen, setSheetOpen] = useState(false);

    const displayAmount = isCard ? chargeAmount : anticipo;
    const isReady = Boolean(isFormValid && metodoPago && aceptoTerminos);

    const buttonLabel = isSubmitting
        ? (isCard ? 'Conectando...' : 'Procesando...')
        : isCard
        ? `Pagar L ${displayAmount.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'Confirmar Pedido';

    return (
        <>
            {/* 📱 Apple-Style Quick Peek Bottom Sheet */}
            <AnimatePresence>
                {sheetOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSheetOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                        />

                        {/* Sheet */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d0e12] border-t border-white/15 rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl pb-24 overflow-hidden"
                        >
                            {/* Drag handle */}
                            <div className="w-full flex items-center justify-center pt-3 pb-2 cursor-pointer" onClick={() => setSheetOpen(false)}>
                                <div className="w-12 h-1.5 rounded-full bg-white/20" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10">
                                <div>
                                    <h3 className="text-base font-black uppercase tracking-tight text-white">
                                        Resumen de tu Orden
                                    </h3>
                                    <p className="text-xs text-zinc-400">
                                        {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSheetOpen(false)}
                                    className="p-2 rounded-full bg-white/5 text-zinc-300 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Items list */}
                            <div className="overflow-y-auto px-5 py-4 space-y-4 divide-y divide-white/5 flex-1">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-3.5 pt-3.5 first:pt-0 items-start">
                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                            <Image src={item.imagen} alt={item.equipo} fill sizes="64px" className="object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h4 className="text-sm font-bold text-white leading-snug">
                                                {item.equipo}
                                            </h4>
                                            <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                                                {item.modelo}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-400 mt-1">
                                                {item.talla && <span>Talla: {item.talla}</span>}
                                                {item.version && <span>· {item.version}</span>}
                                                <span>· Cant: {item.cantidad}</span>
                                            </div>
                                            {(item.dorsalNombre || item.dorsalNumero) && (
                                                <p className="text-xs text-primary font-mono font-semibold mt-1">
                                                    Dorsal: {item.dorsalNumero || ''} {item.dorsalNombre || ''}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0 pt-0.5">
                                            <span className="text-sm font-mono font-bold text-white block">
                                                L {(item.precio * item.cantidad).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* Totals Breakdown */}
                                <div className="pt-4 space-y-2.5 text-xs">
                                    <div className="flex justify-between text-zinc-300 text-sm">
                                        <span>Subtotal</span>
                                        <span className="font-mono text-white">
                                            L {total.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-emerald-400 text-sm">
                                            <span>Descuento</span>
                                            <span className="font-mono">
                                                -L {discountAmount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-zinc-300 text-sm">
                                        <span>Envío</span>
                                        <span className="font-mono text-white">
                                            {shippingCost === 0 ? 'Gratis' : `L ${shippingCost.toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-base font-black text-white pt-2.5 border-t border-white/10">
                                        <span>Total del Pedido</span>
                                        <span className="font-mono text-white">
                                            L {(total - discountAmount + shippingCost).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm font-black text-primary pt-1">
                                        <span>Anticipo Requerido (50%)</span>
                                        <span className="font-mono">
                                            L {anticipo.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* 📱 Fixed Bottom Floating Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07080a]/95 backdrop-blur-2xl border-t border-white/10 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
                {/* Specular Top Light */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="flex items-center gap-3.5">
                    {/* Amount & Peek Toggle */}
                    <button
                        type="button"
                        onClick={() => setSheetOpen((prev) => !prev)}
                        className="flex flex-col text-left py-1 px-2 -ml-1 rounded-xl active:bg-white/5 transition-colors cursor-pointer select-none shrink-0"
                    >
                        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-zinc-300">
                            <span>{isCard && paymentType === 'full' ? 'Total Hoy' : 'Anticipo'}</span>
                            <ChevronUp className={`w-3.5 h-3.5 text-zinc-300 transition-transform ${sheetOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="text-xl font-black font-mono tracking-tight text-white leading-tight">
                            L {displayAmount.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                            {isCard && paymentType === 'full' ? '100% Total' : '50% Requerido'}
                        </span>
                    </button>

                    {/* Main CTA Button */}
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isSubmitting || !isReady}
                        className="flex-1 py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_10px_25px_rgba(229,9,20,0.35)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed cursor-pointer"
                    >
                        <span>{buttonLabel}</span>
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                </div>
            </div>
        </>
    );
}
