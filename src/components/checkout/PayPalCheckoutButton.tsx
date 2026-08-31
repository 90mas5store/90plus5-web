'use client';

import { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Loader2, AlertCircle, DollarSign, ShieldCheck, CheckCircle2, Coins, CreditCard } from 'lucide-react';
import { convertHnlToUsd } from '@/lib/exchangeRate';

interface PayPalCheckoutButtonProps {
    orderPayload: any;
    totalHnl: number;
    disabled?: boolean;
    onSuccess: (result: { order_id: string; order_number: string; total: number; deposit?: number; shipping?: number }) => void;
    onError: (errorMessage: string) => void;
}

export default function PayPalCheckoutButton({
    orderPayload,
    totalHnl,
    disabled = false,
    onSuccess,
    onError,
}: PayPalCheckoutButtonProps) {
    const defaultInitialRate = Number(process.env.NEXT_PUBLIC_HNL_TO_USD_RATE) || 26.80;
    const [rate, setRate] = useState<number>(defaultInitialRate);
    const [loadingRate, setLoadingRate] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [paymentType, setPaymentType] = useState<'deposit' | 'full'>('deposit'); // Por defecto: 50% de anticipo

    const rawClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
    const clientId = rawClientId.replace(/['"\s]/g, '').trim();

    // Cargar tasa de cambio activa en segundo plano
    useEffect(() => {
        let isMounted = true;
        fetch('/api/exchange-rate')
            .then((r) => r.json())
            .then((data) => {
                if (isMounted && data?.rate && typeof data.rate === 'number') {
                    setRate(data.rate);
                }
            })
            .catch((err) => console.warn('[PayPal] Error fetching exchange rate:', err))
            .finally(() => {
                if (isMounted) setLoadingRate(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Cálculos de montos
    const anticipoHnl = totalHnl * 0.5;
    const anticipoUsd = convertHnlToUsd(anticipoHnl, rate);
    const totalUsd = convertHnlToUsd(totalHnl, rate);

    const activeHnl = paymentType === 'deposit' ? anticipoHnl : totalHnl;
    const activeUsd = paymentType === 'deposit' ? anticipoUsd : totalUsd;

    if (!clientId) {
        return (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                <span>Las credenciales de PayPal aún no están configuradas en el archivo .env.local</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* ═══════════════════ SELECTOR: 50% ANTICIPO VS 100% TOTAL ═══════════════════ */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    ¿Cuánto deseas pagar hoy con PayPal?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                    {/* Opción 50% Anticipo */}
                    <button
                        type="button"
                        onClick={() => setPaymentType('deposit')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                            paymentType === 'deposit'
                                ? 'bg-primary/10 border-primary text-white shadow-[0_0_20px_rgba(229,9,20,0.2)]'
                                : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {paymentType === 'deposit' && (
                            <span className="absolute top-2 right-2 p-0.5 rounded-full bg-primary text-white">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                        )}
                        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-tight text-white mb-0.5">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span>Anticipo 50%</span>
                        </div>
                        <div className="text-sm font-black text-primary font-mono">
                            L{anticipoHnl.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">
                            ≈ ${anticipoUsd.toFixed(2)} USD
                        </span>
                        <span className="text-[9px] text-gray-500 block mt-1">
                            El 50% restante se paga al recibir
                        </span>
                    </button>

                    {/* Opción 100% Total */}
                    <button
                        type="button"
                        onClick={() => setPaymentType('full')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                            paymentType === 'full'
                                ? 'bg-primary/10 border-primary text-white shadow-[0_0_20px_rgba(229,9,20,0.2)]'
                                : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {paymentType === 'full' && (
                            <span className="absolute top-2 right-2 p-0.5 rounded-full bg-primary text-white">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                        )}
                        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-tight text-white mb-0.5">
                            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                            <span>Total 100%</span>
                        </div>
                        <div className="text-sm font-black text-white font-mono">
                            L{totalHnl.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">
                            ≈ ${totalUsd.toFixed(2)} USD
                        </span>
                        <span className="text-[9px] text-gray-500 block mt-1">
                            Pago completo de tu orden
                        </span>
                    </button>
                </div>
            </div>

            {/* ═══════════════════ RESUMEN DE CONVERSIÓN ═══════════════════ */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-neutral-900 to-black border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                            <DollarSign className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Cobro en PayPal ({paymentType === 'deposit' ? 'Anticipo 50%' : 'Total 100%'})
                        </span>
                    </div>
                    <span className="text-[11px] font-mono text-gray-400">
                        1 USD = L {rate.toFixed(2)} HNL
                    </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                    <span className="text-gray-300">Total a debitar en USD:</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                        ${activeUsd.toFixed(2)} USD
                    </span>
                </div>
            </div>

            {/* ═══════════════════ SMART BUTTONS DE PAYPAL ═══════════════════ */}
            <div className="space-y-2">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                    💡 <strong>¿Cómo ingresar tu tarjeta?</strong> Haz clic en el botón negro <strong>&quot;Tarjeta de débito o crédito&quot;</strong> abajo para escribir los datos de tu tarjeta directamente, o pulsa el botón amarillo de <strong>PayPal</strong> para pagar con tu cuenta.
                </p>

                <div className="relative transition-all min-h-[100px] w-full">
                    {isProcessing && (
                        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col items-center gap-4 text-center max-w-xs">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-white">Confirmando tu pago...</p>
                                    <p className="text-xs text-gray-400">Por favor no cierres esta ventana mientras registramos tu pedido.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <PayPalScriptProvider
                        key={clientId}
                        options={{
                            clientId: clientId,
                            currency: 'USD',
                            intent: 'capture',
                            components: 'buttons',
                            enableFunding: 'card',
                        }}
                    >
                        <PayPalButtons
                            style={{
                                layout: 'vertical',
                                color: 'gold',
                                shape: 'rect',
                                label: 'pay',
                                height: 48,
                            }}
                            disabled={isProcessing}
                            onClick={(data, actions) => {
                                if (disabled) {
                                    onError('Por favor completa todos tus datos de envío arriba y acepta los términos antes de continuar.');
                                    return actions.reject();
                                }
                                return actions.resolve();
                            }}
                            createOrder={async () => {
                                try {
                                    const payloadWithPaymentType = {
                                        ...orderPayload,
                                        payment_type: paymentType,
                                    };

                                    const res = await fetch('/api/checkout/paypal/create-order', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payloadWithPaymentType),
                                    });

                                    const data = await res.json();
                                    if (!res.ok || !data.paypalOrderId) {
                                        throw new Error(data.error || 'Error al iniciar la transacción con PayPal');
                                    }

                                    return data.paypalOrderId;
                                } catch (err: any) {
                                    onError(err.message || 'No se pudo crear la orden con PayPal');
                                    throw err;
                                }
                            }}
                        onApprove={async (data) => {
                            try {
                                setIsProcessing(true);
                                const res = await fetch('/api/checkout/paypal/capture-order', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        paypalOrderId: data.orderID,
                                        orderPayload,
                                        paymentType,
                                    }),
                                });

                                const result = await res.json();
                                if (!res.ok || !result.success) {
                                    throw new Error(result.error || 'Error al capturar el pago');
                                }

                                onSuccess(result);
                            } catch (err: any) {
                                setIsProcessing(false);
                                onError(err.message || 'Ocurrió un problema al confirmar tu pago');
                            }
                        }}
                        onCancel={() => {
                            setIsProcessing(false);
                        }}
                        onError={(err) => {
                            setIsProcessing(false);
                            console.error('[PayPal Buttons Error]:', err);
                            onError('No se pudo procesar el pago con PayPal. Intenta de nuevo.');
                        }}
                    />
                </PayPalScriptProvider>
            </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Transacción encriptada y protegida por PayPal</span>
            </div>
        </div>
    );
}
