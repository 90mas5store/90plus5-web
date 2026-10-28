'use client';

import Image from 'next/image';
import {
    CheckCircle2,
    Loader2,
    AlertCircle,
    X,
    ChevronRight,
    Lock,
    Truck,
} from 'lucide-react';
import MainButton from '@/components/ui/MainButton';
import { CartItem } from '@/context/CartContext';
import { DiscountState, CreateOrderPayload, CheckoutFormData } from '@/types/checkout';
import { BUSINESS_LOGIC } from '@/lib/constants';
import { PaymentMethodConfig } from '@/lib/config/banks';

interface OrderSummarySidebarProps {
    items: CartItem[];
    total: number;
    shippingCost: number;
    discountState: DiscountState | null;
    discountCode: string;
    discountLoading: boolean;
    discountError: string | null;
    setDiscountCode: (val: string) => void;
    setDiscountError: (val: string | null) => void;
    applyDiscount: () => void;
    removeDiscount: () => void;
    formData: CheckoutFormData;
    metodoPago: string;
    aceptoTerminos: boolean;
    setAceptoTerminos: (val: boolean) => void;
    isFormValid: boolean;
    isSubmitting: boolean;
    orderPayload: CreateOrderPayload;
    handleSubmit: (e: React.FormEvent) => void;
    paymentType?: 'deposit' | 'full';
    setPaymentType?: (type: 'deposit' | 'full') => void;
    paymentMethods?: PaymentMethodConfig[];
}

export default function OrderSummarySidebar({
    items,
    total,
    shippingCost,
    discountState,
    discountCode,
    discountLoading,
    discountError,
    setDiscountCode,
    setDiscountError,
    applyDiscount,
    removeDiscount,
    formData,
    metodoPago,
    aceptoTerminos,
    setAceptoTerminos,
    isSubmitting,
    handleSubmit,
    paymentType = 'deposit',
    paymentMethods,
}: OrderSummarySidebarProps) {
    const selectedMethod = paymentMethods?.find((m) => (m.code || m.id) === metodoPago);
    const isCard = metodoPago === 'tarjeta' || selectedMethod?.type === 'tarjeta';

    const discountAmount = discountState?.amount ?? 0;
    const discountedSubtotal = total - discountAmount;
    const orderTotal = discountedSubtotal + shippingCost;
    const anticipo = orderTotal * BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE;
    const chargeAmount = isCard && paymentType === 'full' ? orderTotal : anticipo;

    const isTegucigalpa = formData.departamento === 'Francisco Morazán' && formData.municipio === 'Distrito Central';

    return (
        <div className="sticky top-28 space-y-4">
            <section className="bg-[#0d0e12]/60 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 rounded-2xl shadow-xl relative overflow-hidden">
                {/* Specular top highlight */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <h2 className="text-base font-black uppercase tracking-tight text-white">
                        Tu Pedido ({items.length})
                    </h2>
                </div>

                {/* Items */}
                <div className="py-4 space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex gap-3.5 items-start">
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                <Image
                                    src={item.imagen}
                                    alt={item.equipo}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                                <h3 className="text-sm font-bold text-white leading-snug">
                                    {item.equipo}
                                </h3>
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
                                    L {(item.precio * item.cantidad).toLocaleString('es-HN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Código de Descuento */}
                <div className="py-3.5 border-t border-white/10">
                    {!discountState ? (
                        <div className="flex gap-2">
                            <input
                                value={discountCode}
                                onChange={(e) => {
                                    setDiscountCode(e.target.value.toUpperCase());
                                    setDiscountError(null);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
                                placeholder="CÓDIGO DE CUPÓN"
                                className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-white/30 outline-none text-white font-mono text-xs uppercase"
                            />
                            <button
                                type="button"
                                onClick={applyDiscount}
                                disabled={discountLoading || !discountCode.trim()}
                                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase transition-all disabled:opacity-40 cursor-pointer"
                            >
                                {discountLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{discountCode} (-{discountState.pct}%)</span>
                            </div>
                            <button
                                type="button"
                                onClick={removeDiscount}
                                className="text-zinc-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    {discountError && (
                        <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {discountError}
                        </p>
                    )}
                </div>

                {/* Totales */}
                <div className="py-3.5 border-t border-white/10 space-y-2.5 text-xs">
                    <div className="flex justify-between text-zinc-300 text-sm">
                        <span>Subtotal</span>
                        <span className="font-mono text-white">
                            L {total.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {discountState && (
                        <div className="flex justify-between text-emerald-400 text-sm">
                            <span>Descuento</span>
                            <span className="font-mono">
                                -L {discountAmount.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between text-zinc-300 text-sm">
                        <span>Envío</span>
                        {shippingCost === 0 ? (
                            <span className="text-emerald-400 font-bold">Gratis</span>
                        ) : (
                            <span className="font-mono text-white">
                                L {shippingCost.toFixed(2)}
                            </span>
                        )}
                    </div>

                    <div className="flex justify-between items-baseline pt-3 border-t border-white/10 text-zinc-200">
                        <span className="text-sm font-medium">Total del Pedido</span>
                        <span className="text-base font-mono font-bold text-white">
                            L {orderTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Monto a pagar hoy */}
                    <div className="mt-2.5 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                        <div>
                            <span className="text-xs sm:text-sm font-bold text-white block">
                                {isCard && paymentType === 'full' ? 'Abono Total Hoy' : 'Anticipo Requerido (50%)'}
                            </span>
                            <span className="text-xs text-zinc-400">
                                {isCard && paymentType === 'full' ? 'Liquidación completa' : 'Restante 50% contra entrega'}
                            </span>
                        </div>
                        <span className="text-xl font-black font-mono text-white">
                            L {chargeAmount.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Términos */}
                <div className="py-3.5 border-t border-white/10">
                    <label className="flex items-start gap-3 cursor-pointer group select-none">
                        <div
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                aceptoTerminos
                                    ? 'bg-primary border-primary text-white'
                                    : 'border-white/20 bg-black/40 group-hover:border-white/40'
                            }`}
                        >
                            {aceptoTerminos && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={aceptoTerminos}
                            onChange={(e) => setAceptoTerminos(e.target.checked)}
                        />
                        <p className="text-xs text-zinc-300 leading-snug">
                            Acepto los{' '}
                            <a href="/legal/terminos" target="_blank" className="text-white underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
                                términos de servicio
                            </a>{' '}
                            y políticas de entrega.
                        </p>
                    </label>
                </div>

                {/* CTA Desktop */}
                <div className="hidden lg:block pt-1">
                    <MainButton
                        onClick={handleSubmit}
                        disabled={isSubmitting || !metodoPago || !aceptoTerminos}
                        className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_10px_25px_rgba(229,9,20,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer active:scale-[0.98]"
                    >
                        <span>
                            {isSubmitting
                                ? 'Procesando...'
                                : isCard
                                ? `Pagar L ${chargeAmount.toLocaleString('es-HN', { minimumFractionDigits: 2 })} con Tarjeta`
                                : 'Confirmar Pedido'}
                        </span>
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </MainButton>
                </div>

                {/* Badges de Seguridad */}
                <div className="pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" /> Cifrado SSL 256-bit
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-zinc-400" /> Envíos CAEX
                    </span>
                </div>
            </section>
        </div>
    );
}
