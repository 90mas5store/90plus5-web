'use client';

import { motion, AnimatePresence } from '@/lib/motion';
import { Shirt, CheckCircle2, Share2, Truck, ShieldCheck, Lock, Calendar } from 'lucide-react';

interface ProductActionButtonsProps {
    precioConRecargo: number;
    isAdding: boolean;
    copied: boolean;
    shareCount: number | null;
    onAddToCart: () => void;
    onShare: () => void;
    onShareWhatsApp: () => void;
}

export default function ProductActionButtons({
    precioConRecargo,
    isAdding,
    copied,
    shareCount,
    onAddToCart,
    onShare,
    onShareWhatsApp,
}: ProductActionButtonsProps) {
    const getDeliveryEstimate = () => {
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth();
        const year = now.getFullYear();

        let cutoffDate = new Date(year, month, day);

        if (day <= 6) {
            cutoffDate = new Date(year, month, 6);
        } else if (day <= 16) {
            cutoffDate = new Date(year, month, 16);
        } else if (day <= 26) {
            cutoffDate = new Date(year, month, 26);
        } else {
            cutoffDate = new Date(year, month + 1, 6);
        }

        const start = new Date(cutoffDate);
        start.setDate(cutoffDate.getDate() + 21);

        const end = new Date(cutoffDate);
        end.setDate(cutoffDate.getDate() + 30);

        const fmt = new Intl.DateTimeFormat('es-HN', { day: 'numeric', month: 'long' });
        return `Entrega estimada: ${fmt.format(start)} – ${fmt.format(end)}`;
    };

    return (
        <div className="pt-2 space-y-4">
            {/* Fecha estimada de entrega en Cápsula Apple */}
            <div className="flex justify-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/70 tracking-tight">
                    <Calendar className="w-3 h-3 text-white/50" />
                    <span>{getDeliveryEstimate()}</span>
                </div>
            </div>

            {/* Botón Principal Añadir al Carrito con Bisel Specular Físico Apple (§12 & §1) */}
            <button
                id="main-add-to-cart"
                type="button"
                onClick={onAddToCart}
                disabled={isAdding || precioConRecargo <= 0}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-primary to-rose-600 disabled:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 shadow-[0_10px_35px_rgba(229,9,20,0.35)] hover:shadow-[0_15px_45px_rgba(229,9,20,0.5)] border-t border-white/35 relative overflow-hidden transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
                <AnimatePresence mode="wait">
                    {isAdding ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5 animate-spin shrink-0" />
                            <span>AGREGANDO AL PEDIDO...</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-2"
                        >
                            {precioConRecargo > 0 ? (
                                <>
                                    <Shirt className="w-5 h-5 transition-transform group-hover:rotate-12 shrink-0" />
                                    <span>AGREGAR AL PEDIDO</span>
                                </>
                            ) : (
                                <span>NO DISPONIBLE</span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>

            {/* Botones de Compartir en Cápsulas Vidriadas Apple */}
            <div className="flex gap-2 sm:gap-2.5">
                <button
                    type="button"
                    onClick={onShare}
                    className="flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 backdrop-blur-xl border border-white/10 text-white/80 hover:text-white transition-all text-[11px] sm:text-xs font-bold uppercase tracking-wide cursor-pointer"
                >
                    {copied ? (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-emerald-400 truncate">¡Enlace copiado!</span>
                        </>
                    ) : (
                        <>
                            <Share2 className="w-3.5 h-3.5 text-white/70 shrink-0" />
                            <span className="truncate">Pasársela a un alero</span>
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={onShareWhatsApp}
                    className="flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-2 rounded-2xl bg-[#25D366]/[0.08] hover:bg-[#25D366]/[0.15] active:scale-95 backdrop-blur-xl border border-[#25D366]/30 text-[#25D366] transition-all text-[11px] sm:text-xs font-bold uppercase tracking-wide cursor-pointer"
                >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span className="truncate">Pedir por WhatsApp</span>
                </button>
            </div>

            {shareCount !== null && shareCount >= 5 && (
                <p className="text-center text-[10px] text-white/50 font-medium">
                    {shareCount} aleros ya vieron esta camiseta
                </p>
            )}

            {/* Micro-tarjetas de Confianza Apple Glass */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-2 border-t border-white/[0.08]">
                <div className="flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] hover:border-white/20 transition-all active:scale-95 min-h-[66px]">
                    <Truck className="w-4 h-4 text-primary shrink-0 mb-1" />
                    <span className="text-[10px] font-bold text-white leading-tight">Envíos a toda HN</span>
                    <span className="text-[8px] text-white/50 mt-0.5 leading-tight">Rastreo directo</span>
                </div>

                <div className="flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] hover:border-white/20 transition-all active:scale-95 min-h-[66px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mb-1" />
                    <span className="text-[10px] font-bold text-white leading-tight">Calidad Top</span>
                    <span className="text-[8px] text-white/50 mt-0.5 leading-tight">Detalles oficiales</span>
                </div>

                <div className="flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] hover:border-white/20 transition-all active:scale-95 min-h-[66px]">
                    <Lock className="w-4 h-4 text-blue-400 shrink-0 mb-1" />
                    <span className="text-[10px] font-bold text-white leading-tight">Compra Segura</span>
                    <span className="text-[8px] text-white/50 mt-0.5 leading-tight">Banca y tarjeta</span>
                </div>
            </div>
        </div>
    );
}
