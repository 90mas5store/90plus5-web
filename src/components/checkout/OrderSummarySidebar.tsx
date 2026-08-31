'use client';

import Image from 'next/image';
import {
    CheckCircle2,
    Tag,
    Loader2,
    AlertCircle,
    X,
    ChevronRight,
} from 'lucide-react';
import MainButton from '@/components/ui/MainButton';
import { CartItem } from '@/context/CartContext';
import { DiscountState, CreateOrderPayload, CheckoutFormData } from '@/types/checkout';
import { BUSINESS_LOGIC } from '@/lib/constants';
import PayPalCheckoutButton from './PayPalCheckoutButton';

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
    onPayPalSuccess: (result: { order_id: string; order_number: string; total: number; deposit?: number; shipping?: number }) => void;
    onPayPalError: (msg: string) => void;
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
    isFormValid,
    isSubmitting,
    orderPayload,
    handleSubmit,
    onPayPalSuccess,
    onPayPalError,
}: OrderSummarySidebarProps) {
    const discountAmount = discountState?.amount ?? 0;
    const discountedSubtotal = total - discountAmount;
    const orderTotal = discountedSubtotal + shippingCost;
    const anticipo = orderTotal * BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE;

    return (
        <div className="sticky top-28 space-y-8">
            <section className="bg-white/5 backdrop-blur-md sm:backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black uppercase tracking-tight">Tu Pedido</h2>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {items.length} {items.length === 1 ? 'Ítem' : 'Ítems'}
                    </span>
                </div>

                {/* 🛒 Lista de productos */}
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mb-8">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 group">
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-black border border-white/5 shrink-0">
                                <Image src={item.imagen} alt={item.equipo} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-black text-white uppercase truncate tracking-tight">{item.equipo}</h3>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">{item.modelo}</p>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                                    {item.version && <span className="text-[9px] text-gray-500 font-bold uppercase">{item.version}</span>}
                                    {item.talla && <span className="text-[9px] text-gray-500 font-bold uppercase">Talla {item.talla}</span>}
                                </div>
                                {(item.dorsalNombre || item.dorsalNumero) && (
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        <span className="text-[9px] font-black text-white uppercase">
                                            Dorsal: {item.dorsalNumero || ''} · {item.dorsalNombre || ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-white">
                                    L{item.precio.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-[10px] text-gray-500 font-bold mt-1">x{item.cantidad}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4 pt-6 border-t border-white/5">
                    {/* 🏷️ Campo de código de descuento */}
                    {!discountState ? (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <Tag className="w-3 h-3" /> Código de descuento
                            </label>
                            <div className="flex gap-2">
                                <input
                                    value={discountCode}
                                    onChange={(e) => {
                                        setDiscountCode(e.target.value.toUpperCase());
                                        setDiscountError(null);
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
                                    placeholder="Ej. VERANO25"
                                    className="flex-1 px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-white/30 outline-none text-white font-black tracking-widest text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={applyDiscount}
                                    disabled={discountLoading || !discountCode.trim()}
                                    className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-black hover:bg-white/20 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                                </button>
                            </div>
                            {discountError && (
                                <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    {discountError}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                <div>
                                    <p className="text-xs font-black text-green-400 tracking-widest">{discountCode}</p>
                                    <p className="text-[10px] text-gray-400">
                                        {discountState.pct}% · {discountState.scopeDesc}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={removeDiscount}
                                className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                        <span>Subtotal</span>
                        <span className="text-white">
                            L{total.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {discountState && (
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-green-400">
                            <span>Descuento (-{discountState.pct}%)</span>
                            <span>
                                -L{discountAmount.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                        <span>Envío (CAEX)</span>
                        {shippingCost === 0 ? (
                            <span className="text-green-500">Gratis</span>
                        ) : (
                            <span className="text-white">
                                L{shippingCost.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        )}
                    </div>

                    {!formData.municipio && (
                        <p className="text-[10px] text-gray-600 italic">
                            Selecciona tu municipio para calcular el envío
                        </p>
                    )}

                    <div className="flex justify-between items-center py-2">
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-white uppercase tracking-tighter">Total a Pagar</span>
                            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
                                Anticipo del {BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE * 100}% requerido
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-white tracking-tighter">
                                L{orderTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm font-black text-primary drop-shadow-[0_0_10px_rgba(229,9,20,0.3)]">
                                Anticipo: L{anticipo.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8 text-[11px] text-gray-400 leading-relaxed">
                        Para confirmar el pedido debe cancelar el <span className="text-white font-bold">50% del valor total</span>. El restante 50% se cancela cuando el proveedor confirme que el producto está listo para entregarse.
                    </div>
                </div>

                {/* 📝 Términos y condiciones */}
                <div className="mt-8 mb-4">
                    <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                        <div
                            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                aceptoTerminos ? 'bg-primary border-primary' : 'border-white/20 bg-black/40 group-hover:border-white/40'
                            }`}
                        >
                            {aceptoTerminos && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={aceptoTerminos}
                            onChange={(e) => setAceptoTerminos(e.target.checked)}
                        />
                        <p className="text-xs text-gray-500 font-medium leading-relaxed select-none">
                            He leído y acepto los{' '}
                            <a
                                href="/legal/terminos"
                                target="_blank"
                                className="text-white hover:text-primary underline decoration-white/30 hover:decoration-primary underline-offset-2 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                términos de servicio
                            </a>{' '}
                            y{' '}
                            <a
                                href="/legal/privacidad"
                                target="_blank"
                                className="text-white hover:text-primary underline decoration-white/30 hover:decoration-primary underline-offset-2 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                políticas de privacidad
                            </a>
                            .
                        </p>
                    </label>
                </div>

                {/* 💳 Botón de Acción según método */}
                {metodoPago === 'paypal' ? (
                    <div className="space-y-4 pt-2">
                        {!isFormValid && (
                            <p className="text-xs text-amber-400/90 text-center font-medium bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                                Completa tus datos de envío arriba y acepta los términos para habilitar el pago con PayPal.
                            </p>
                        )}
                        <PayPalCheckoutButton
                            orderPayload={orderPayload}
                            totalHnl={total}
                            disabled={!isFormValid || isSubmitting}
                            onSuccess={onPayPalSuccess}
                            onError={onPayPalError}
                        />
                    </div>
                ) : (
                    <MainButton
                        onClick={handleSubmit}
                        disabled={isSubmitting || !metodoPago || metodoPago === 'tarjeta' || !aceptoTerminos}
                        className="w-full py-5 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl shadow-[0_20px_40px_rgba(229,9,20,0.25)] flex items-center justify-center gap-3 group disabled:opacity-50 disabled:grayscale transition-all disabled:cursor-not-allowed cursor-pointer"
                    >
                        <span>{isSubmitting ? 'PROCESANDO...' : 'CONFIRMAR PEDIDO'}</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </MainButton>
                )}
            </section>
        </div>
    );
}
