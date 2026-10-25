"use client";

import Link from "next/link";
import { MessageCircle, ShieldCheck, MapPin, CreditCard, Sparkles } from "lucide-react";

export default function HomeTrustAndLocal() {
    const pillars = [
        {
            icon: MapPin,
            title: "Tegucigalpa & Cobertura",
            desc: "Punto de entrega en la capital y envíos asegurados a los 18 departamentos vía CAEX.",
        },
        {
            icon: CreditCard,
            title: "Pagos Locales",
            desc: "Transferencia bancaria (BAC, Atlántida, Ficohsa, Banpaís) y pago seguro con tarjetas.",
        },
        {
            icon: Sparkles,
            title: "Dorsal Oficial",
            desc: "Personaliza tu camiseta con el nombre y número oficial de tu jugador favorito.",
        },
        {
            icon: ShieldCheck,
            title: "Garantía 90+5",
            desc: "Revisamos minuciosamente cada prenda antes del despacho para asegurar calidad de élite.",
        },
    ];

    return (
        <section aria-label="Por qué comprar en 90+5 Store" className="py-8 sm:py-14 border-t border-white/[0.08] bg-[#08090d]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                
                {/* Cuadrícula de Pilares */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 mb-8 sm:mb-12">
                    {pillars.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={idx}
                                className="p-3.5 sm:p-6 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all duration-200"
                            >
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2.5 sm:mb-4">
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <h3 className="text-xs sm:text-base font-extrabold text-white mb-1">
                                    {item.title}
                                </h3>
                                <p className="text-[10px] sm:text-[13px] text-white/55 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Banner de Pedidos Especiales por WhatsApp */}
                <div className="rounded-2xl sm:rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-[#0a1510] to-[#0a1215] p-5 sm:p-9 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 relative overflow-hidden">
                    <div className="max-w-xl text-center md:text-left relative z-10">
                        <div className="flex items-center justify-center md:justify-start gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Atención Directa 24/7</span>
                        </div>
                        <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                            ¿Buscas una camiseta difícil de conseguir?
                        </h3>
                        <p className="text-white/65 text-xs sm:text-sm mt-1 leading-relaxed">
                            Mándanos una foto de la prenda por WhatsApp. Te ayudamos a cotizarla, conseguir tu talla y personalizarla con dorsal oficial.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto relative z-10">
                        <a
                            href="https://wa.me/50499999999?text=Hola%2090%2B5%20Store%2C%20quisiera%20cotizar%20una%20camiseta%20especial"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl sm:rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm transition-all duration-200 shadow-xl shadow-emerald-500/20 active:scale-95 text-center"
                        >
                            <MessageCircle className="w-4 h-4 fill-black" />
                            <span>Escribir por WhatsApp</span>
                        </a>

                        <Link
                            href="/rastreo"
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl sm:rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-bold text-xs sm:text-sm transition-all duration-200 text-center"
                        >
                            <span>Rastrear Pedido</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
