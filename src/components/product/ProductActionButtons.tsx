'use client';

import { motion, AnimatePresence } from '@/lib/motion';
import { Shirt, CheckCircle2, Share2, Truck, ShieldCheck, Lock } from 'lucide-react';
import Button from '@/components/ui/MainButton';

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
        return `Entrega: ${fmt.format(start)} - ${fmt.format(end)}`;
    };

    return (
        <div className="pt-4 space-y-4">
            {/* Fecha estimada de entrega */}
            <p className="text-center text-[10px] text-gray-400 uppercase tracking-[0.1em] font-medium">
                {getDeliveryEstimate()}
            </p>

            {/* Botón Principal Añadir al Carrito */}
            <Button
                onClick={onAddToCart}
                disabled={isAdding || precioConRecargo <= 0}
                className="w-full py-4 bg-primary hover:bg-primary-dark disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(229,9,20,0.2)] flex items-center justify-center gap-2 text-base group relative overflow-hidden transition-all cursor-pointer"
            >
                <AnimatePresence mode="wait">
                    {isAdding ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5 animate-pulse" />
                            <span>AGREGANDO...</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2"
                        >
                            {precioConRecargo > 0 ? (
                                <>
                                    <Shirt className="w-5 h-5 group-hover:rotate-12 transition-transform hidden md:block" />
                                    <span className="font-bold tracking-wide">AÑADIR AL CARRITO</span>
                                </>
                            ) : (
                                <span className="font-bold">NO DISPONIBLE</span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Button>

            {/* Botones de Compartir */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onShare}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 hover:border-white/25 text-gray-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                    {copied ? (
                        <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-green-500">¡Copiado!</span>
                        </>
                    ) : (
                        <>
                            <Share2 className="w-4 h-4" />
                            <span>Presumir</span>
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={onShareWhatsApp}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#25D366]/20 hover:border-[#25D366]/50 text-[#25D366]/60 hover:text-[#25D366] transition-all text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>WhatsApp</span>
                </button>
            </div>

            {shareCount !== null && shareCount >= 5 && (
                <p className="text-center text-[10px] text-gray-500 mt-1">
                    ⚡ {shareCount} personas han presumido este kit
                </p>
            )}

            {/* 🛡️ Micro-tarjetas de Confianza y Garantía (Trust Badges) */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <Truck className="w-4 h-4 text-primary mb-1" />
                    <span className="text-[10px] font-bold text-white leading-tight">Envíos a Todo HN</span>
                    <span className="text-[8px] text-gray-400 mt-0.5">Rastreo directo</span>
                </div>

                <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-bold text-white leading-tight">Calidad Top</span>
                    <span className="text-[8px] text-gray-400 mt-0.5">Detalles oficiales</span>
                </div>

                <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <Lock className="w-4 h-4 text-blue-400 mb-1" />
                    <span className="text-[10px] font-bold text-white leading-tight">Compra Segura</span>
                    <span className="text-[8px] text-gray-400 mt-0.5">Banca / Tarjeta</span>
                </div>
            </div>
        </div>
    );
}
