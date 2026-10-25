"use client";

import { CreditCard, CheckCircle2, AlertCircle, MessageCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BUSINESS_LOGIC } from "@/lib/constants";
import type { TrackingBilling } from "./TrackingTypes";

interface TrackingBillingCardProps {
    billing: TrackingBilling;
    orderId: string;
}

export default function TrackingBillingCard({ billing, orderId }: TrackingBillingCardProps) {
    const hasRemaining = billing.remaining > 0;
    const whatsappNumber = BUSINESS_LOGIC.CONTACT.WHATSAPP_NUMBER;
    const shortId = orderId.slice(0, 8);
    const whatsappMsg = `Hola 90+5 Store, consulto sobre el saldo de mi pedido #${shortId}.`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMsg)}`;

    return (
        <div className="rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/[0.08] p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden">
            {/* Hairline superior */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                            Estado de Cuenta
                        </h3>
                        <p className="text-[11px] text-white/50">
                            Modelo de anticipo 50% & saldo contra entrega
                        </p>
                    </div>
                </div>

                <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        hasRemaining
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                >
                    {hasRemaining ? (
                        <>
                            <AlertCircle className="w-3 h-3" />
                            <span>Saldo Pendiente</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Pagado 100%</span>
                        </>
                    )}
                </span>
            </div>

            {/* Desglose Numérico */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs">
                <div className="flex items-center justify-between text-white/60">
                    <span>Monto Total del Pedido</span>
                    <span className="font-mono font-bold text-white text-sm">
                        {formatCurrency(billing.total)}
                    </span>
                </div>

                <div className="flex items-center justify-between text-white/60">
                    <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Anticipo 50% Validado</span>
                    </span>
                    <span className="font-mono font-semibold text-emerald-400">
                        {formatCurrency(billing.deposit_paid)}
                    </span>
                </div>

                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
                    <span className="font-bold text-white">Saldo por Liquidar</span>
                    <span className={`font-mono text-base font-black ${hasRemaining ? "text-primary" : "text-emerald-400"}`}>
                        {formatCurrency(billing.remaining)}
                    </span>
                </div>
            </div>

            {/* Nota aclaratoria y CTA WhatsApp */}
            <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-3">
                <p className="text-[11px] text-white/55 leading-relaxed">
                    {hasRemaining
                        ? "El saldo pendiente se liquida cuando tu camiseta arribe a Honduras para autorizar el despacho a tu dirección."
                        : "¡Tu pedido está totalmente liquidado! El despacho se realizará según lo previsto sin cobros adicionales."}
                </p>

                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-xs transition-all active:scale-95 group text-center"
                >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Consultar saldo o pagos por WhatsApp</span>
                </a>
            </div>
        </div>
    );
}
