"use client";

import Link from "next/link";
import { Truck, ShieldCheck, Sparkles, MessageCircle, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { getWhatsappLink } from "@/lib/whatsapp";
import { CONTACT, SITE_CONFIG } from "@/lib/config/site";

export default function StoreGeoAuthoritySection() {
    const pillars = [
        {
            icon: <Truck className="w-5 h-5 text-[#E50914]" />,
            badge: "Cobertura Nacional",
            title: "Envíos a Toda Honduras",
            desc: "Entregas en Tegucigalpa y envíos seguros a San Pedro Sula, La Ceiba y los 18 departamentos vía Cargo Expreso (CAEX) con número de guía rastreable en línea.",
        },
        {
            icon: <Zap className="w-5 h-5 text-[#E50914]" />,
            badge: "Ventas Bajo Pedido",
            title: "La Prenda que Buscás, A Tu Medida",
            desc: "Trabajamos por encargo (3 a 5 semanas de llegada). Sin rollos de stock: pedí cualquier prenda o camiseta del mundo, la talla y versión que querás.",
        },
        {
            icon: <Sparkles className="w-5 h-5 text-[#E50914]" />,
            badge: "Calidad de Jugador",
            title: "Versión Jugador y Personalización",
            desc: "Equipaciones oficiales temporada 25/26 con tela transpirable profesional y estampados oficiales con tu número favorito o tu propio nombre.",
        },
        {
            icon: <MessageCircle className="w-5 h-5 text-[#E50914]" />,
            badge: "Atención Directa",
            title: "Te Atendemos 1 a 1 por WhatsApp",
            desc: "Te asesoramos para que elijás la talla exacta según tus medidas, confirmamos tu anticipo del 50% y te acompañamos hasta que tengás el paquete en tus manos.",
        },
    ];

    const trustBadges = [
        "Sede en Tegucigalpa",
        "Ventas bajo pedido (3-5 semanas)",
        "Envíos nacionales con Cargo Expreso (CAEX)",
        "Anticipo 50% · Transferencias bancarias",
    ];

    return (
        <section
            aria-labelledby="store-authority-heading"
            className="relative py-14 md:py-20 px-4 max-w-7xl mx-auto overflow-hidden"
        >
            {/* Ambient subtle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#E50914]/10 blur-[120px] pointer-events-none rounded-full" />

            <div className="relative z-10 text-center max-w-3xl mx-auto mb-12">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/[0.06] backdrop-blur-md text-red-400 border border-white/10 mb-4 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                    Tienda Deportiva Líder en Honduras
                </span>

                <h2
                    id="store-authority-heading"
                    className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug drop-shadow-sm"
                >
                    La Tienda Deportiva Online #1 en{" "}
                    <span className="text-[#E50914]">
                        Tegucigalpa y Toda Honduras
                    </span>
                </h2>

                <p className="mt-3.5 text-sm sm:text-base text-white/60 leading-relaxed font-normal">
                    Viví la pasión del fútbol con las mejores prendas del país. Atendemos <strong>100% online bajo pedido</strong> desde Tegucigalpa: te traemos tu prenda favorita en <strong>3 a 5 semanas</strong> con personalización oficial, anticipo del 50% y <strong>envíos seguros a toda Honduras vía Cargo Expreso (CAEX)</strong>.
                </p>
            </div>

            {/* Grid de 4 Pilares de Confianza en Squircles Apple */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-12">
                {pillars.map((pillar, idx) => (
                    <article
                        key={idx}
                        className="group relative rounded-[1.75rem] p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 transition-all duration-300 ease-out hover:-translate-y-1 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between overflow-hidden"
                    >
                        {/* Specular hairline superior */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                        <div>
                            <div className="w-11 h-11 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                                {pillar.icon}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block mb-1">
                                {pillar.badge}
                            </span>
                            <h3 className="text-base font-bold text-white mb-2 tracking-tight group-hover:text-red-400 transition-colors">
                                {pillar.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                                {pillar.desc}
                            </p>
                        </div>
                    </article>
                ))}
            </div>

            {/* Badges de Confianza Rápidos en Cápsula Glass */}
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 md:gap-6 py-3.5 px-6 rounded-full bg-white/[0.03] backdrop-blur-md border border-white/[0.07] max-w-4xl mx-auto mb-10 shadow-sm">
                {trustBadges.map((badge, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/70 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>{badge}</span>
                    </div>
                ))}
            </div>

            {/* Call to Actions con Botones Apple */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <Link
                    href="/catalogo"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#E50914] hover:bg-red-700 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider shadow-[0_8px_25px_rgba(229,9,20,0.35)] transition-all duration-200 cursor-pointer"
                >
                    <span>Explorá Todo el Catálogo</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                    href={getWhatsappLink({ message: "¡Hola! Me gustaría pedir una prenda y consultar sobre los envíos en Honduras." })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/15 text-white hover:border-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366] active:scale-[0.98] text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Escribinos por WhatsApp ({CONTACT.phoneDisplay})</span>
                </a>
            </div>

            {/* Enlace sutil a Preguntas Frecuentes en /conectar */}
            <div className="relative z-10 text-center mt-6">
                <Link
                    href="/conectar#faq"
                    className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
                >
                    <span>¿Tenés dudas con tu pedido, tallas o envíos?</span>
                    <span className="text-red-400 underline underline-offset-4 font-medium hover:text-red-300">Revisá las Preguntas Frecuentes</span>
                </Link>
            </div>
        </section>
    );
}
