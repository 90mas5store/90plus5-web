"use client";

import Link from "next/link";
import { Sparkles, MessageCircle, ArrowRight, ShieldCheck, Flame } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config/site";

interface InFeedCardProps {
    type: "versions_guide" | "whatsapp_concierge";
}

export default function CatalogInFeedBento({ type }: InFeedCardProps) {
    if (type === "versions_guide") {
        return (
            <div className="col-span-2 md:col-span-2 lg:col-span-2 rounded-[1.6rem] md:rounded-[1.9rem] overflow-hidden border border-white/10 bg-gradient-to-br from-red-950/40 via-[#0e1017] to-[#07080a] p-5 sm:p-7 flex flex-col justify-between relative shadow-xl hover:border-red-500/30 transition-all duration-300 group min-h-[300px]">
                {/* 🌟 Specular Highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-3">
                        <Sparkles className="w-3 h-3 text-red-400" />
                        <span>Guía 90+5 Store</span>
                    </div>

                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
                        ¿Versión Jugador o Aficionado?
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-white/70 font-medium leading-relaxed">
                        • <strong className="text-white">Versión Jugador:</strong> Corte entallado atlético, escudos termosellados en relieve y tejido liviano de alta ventilación.
                        <br />
                        • <strong className="text-white">Versión Fan:</strong> Corte estándar cómodo, escudos bordados de alta duración ideales para uso casual.
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                        Ambas con dorsal oficial opcional
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 group-hover:text-red-300 transition-colors">
                        <span>Ver detalles</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                </div>
            </div>
        );
    }

    if (type === "whatsapp_concierge") {
        const whatsappNumber = "50499000000"; // fallback o variable
        const message = encodeURIComponent("¡Hola 90+5 Store! Estuve viendo el catálogo y busco una camiseta que no encontré en la web. ¿Me podrían ayudar a cotizarla bajo pedido?");
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

        return (
            <div className="col-span-2 md:col-span-2 lg:col-span-2 rounded-[1.6rem] md:rounded-[1.9rem] overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-950/40 via-[#0e1017] to-[#07080a] p-5 sm:p-7 flex flex-col justify-between relative shadow-xl hover:border-emerald-500/30 transition-all duration-300 group min-h-[300px]">
                {/* 🌟 Specular Highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-3">
                        <MessageCircle className="w-3 h-3 text-emerald-400" />
                        <span>Servicio Bajo Pedido</span>
                    </div>

                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
                        ¿Buscas una camiseta específica o retro?
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-white/70 font-medium leading-relaxed">
                        Si el club, selección o modelo que buscas no aparece en la vitrina actual, te lo cotizamos y traemos bajo pedido directamente a Honduras en 10-14 días.
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/80">
                        Atención directa en Tegucigalpa
                    </span>

                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 shadow-sm hover:shadow-emerald-500/20"
                    >
                        <span>Pedir por WhatsApp</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>
        );
    }

    return null;
}
