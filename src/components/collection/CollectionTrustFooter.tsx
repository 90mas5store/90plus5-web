"use client";

import Link from "next/link";
import { MessageCircle, ShieldCheck, MapPin, CreditCard, Sparkles, ArrowRight } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/config/site";

export default function CollectionTrustFooter() {
    const pillars = [
        {
            icon: MapPin,
            title: "Tegucigalpa & Cobertura",
            desc: "Punto de entrega en la capital y envíos asegurados a los 18 departamentos vía CAEX.",
        },
        {
            icon: CreditCard,
            title: "Pagos Locales Flexibles",
            desc: "Transferencia bancaria directa (BAC, Atlántida, Ficohsa, Banpaís) y pago con tarjeta.",
        },
        {
            icon: Sparkles,
            title: "Dorsal Oficial",
            desc: "Personaliza tu camiseta con el número y tipografía oficial de tu jugador favorito.",
        },
        {
            icon: ShieldCheck,
            title: "Garantía 90+5",
            desc: "Revisamos minuciosamente cada prenda antes del despacho para garantizar calidad de élite.",
        },
    ];

    return (
        <section aria-label="Por qué comprar en 90+5 Store" className="mt-14 sm:mt-20 border-t border-white/[0.08] bg-[#07080a] pt-10 sm:pt-14 pb-8 sm:pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Cuadrícula de 4 Pilares */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 mb-8 sm:mb-12">
                    {pillars.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={idx}
                                className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all duration-200"
                            >
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2.5 sm:mb-3">
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <h3 className="text-xs sm:text-sm font-extrabold text-white mb-1">
                                    {item.title}
                                </h3>
                                <p className="text-[10px] sm:text-xs text-white/55 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Banner de Pedidos Especiales por WhatsApp */}
                <div className="rounded-2xl sm:rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-[#0a1510] to-[#0a1215] p-5 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                    {/* Resplandor suave */}
                    <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />

                    <div className="max-w-xl text-center md:text-left relative z-10">
                        <div className="flex items-center justify-center md:justify-start gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Atención Directa 24/7</span>
                        </div>
                        <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                            ¿Buscas una versión o camiseta especial no listada?
                        </h3>
                        <p className="text-white/65 text-xs sm:text-sm mt-1 leading-relaxed">
                            Envíanos la foto de la equipación por WhatsApp. Te confirmamos disponibilidad de talla, versión y dorsal oficial con nuestro equipo en Tegucigalpa.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto relative z-10 shrink-0">
                        <a
                            href={`${SOCIAL_LINKS.whatsapp}?text=Hola%2090%2B5%20Store%2C%20quisiera%20cotizar%20una%20camiseta%20de%20esta%20colección`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl sm:rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm transition-all duration-200 shadow-xl shadow-emerald-500/20 active:scale-95 text-center cursor-pointer"
                        >
                            <MessageCircle className="w-4 h-4 fill-black" />
                            <span>Consultar por WhatsApp</span>
                        </a>

                        <Link
                            href="/catalogo"
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl sm:rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-bold text-xs sm:text-sm transition-all duration-200 text-center"
                        >
                            <span>Ver todo el catálogo</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
