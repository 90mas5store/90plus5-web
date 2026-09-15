"use client";

import Link from "next/link";
import { Truck, ShieldCheck, Sparkles, MessageCircle, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { getWhatsappLink } from "@/lib/whatsapp";
import { CONTACT, SITE_CONFIG } from "@/lib/config/site";

export default function StoreGeoAuthoritySection() {
    const pillars = [
        {
            icon: <Truck className="w-6 h-6 text-[#E50914]" />,
            badge: "Cobertura Nacional",
            title: "Envíos a Toda Honduras",
            desc: "Entregas en Tegucigalpa y envíos seguros a San Pedro Sula, La Ceiba y los 18 departamentos vía Cargo Expreso (CAEX) con número de guía rastreable en línea.",
        },
        {
            icon: <Zap className="w-6 h-6 text-[#E50914]" />,
            badge: "Ventas Bajo Pedido",
            title: "Cualquier Camiseta, A Tu Medida",
            desc: "Trabajamos por encargo (3 a 5 semanas de llegada). Sin limitaciones de stock físico: encarga cualquier camiseta del mundo, talla y versión que desees.",
        },
        {
            icon: <Sparkles className="w-6 h-6 text-[#E50914]" />,
            badge: "Calidad de Jugador",
            title: "Versión Jugador y Personalización",
            desc: "Equipaciones oficiales temporada 25/26 con tecnología transpirable profesional y estampados con tipografía oficial de tu jugador favorito o nombre propio.",
        },
        {
            icon: <MessageCircle className="w-6 h-6 text-[#E50914]" />,
            badge: "Centrados en Ti",
            title: "Acompañamiento 1 a 1 por WhatsApp",
            desc: "Te guiamos para elegir la talla correcta según tus medidas, confirmamos tu anticipo del 50% y te damos seguimiento continuo hasta recibir tu paquete.",
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
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E50914]/10 text-red-400 border border-[#E50914]/30 mb-4 shadow-[0_0_15px_rgba(229,9,20,0.15)]">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                    Tienda Deportiva Líder en Honduras
                </span>

                <h2
                    id="store-authority-heading"
                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug"
                >
                    La Tienda Deportiva Online #1 en{" "}
                    <span className="text-[#E50914] drop-shadow-[0_0_20px_rgba(229,9,20,0.4)]">
                        Tegucigalpa y Toda Honduras
                    </span>
                </h2>

                <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed">
                    Diseñamos la mejor experiencia de compra deportiva en Honduras. Operamos <strong>100% online bajo pedido</strong> desde Tegucigalpa: importamos tu camiseta favorita en <strong>3 a 5 semanas</strong>, con personalización oficial, anticipo del 50% y <strong>envíos seguros a todo el país vía Cargo Expreso (CAEX)</strong>.
                </p>
            </div>

            {/* Grid de 4 Pilares de Confianza */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
                {pillars.map((pillar, idx) => (
                    <article
                        key={idx}
                        className="group relative rounded-2xl p-6 bg-white/[0.03] border border-white/10 hover:border-[#E50914]/40 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(229,9,20,0.15)] flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E50914]/20 to-black/60 border border-[#E50914]/30 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-[#E50914] transition-all duration-300">
                                {pillar.icon}
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 block mb-1">
                                {pillar.badge}
                            </span>
                            <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#E50914] transition-colors">
                                {pillar.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                                {pillar.desc}
                            </p>
                        </div>
                    </article>
                ))}
            </div>

            {/* Badges de Confianza Rápidos */}
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 md:gap-6 py-4 px-6 rounded-2xl bg-white/[0.02] border border-white/5 max-w-4xl mx-auto mb-10">
                {trustBadges.map((badge, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{badge}</span>
                    </div>
                ))}
            </div>

            {/* Call to Actions */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                    href="/catalogo"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#E50914] to-[#B00710] text-white font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(229,9,20,0.4)] hover:shadow-[0_0_35px_rgba(229,9,20,0.6)] hover:scale-105 transition-all duration-300"
                >
                    <span>Explorar Catálogo de Camisetas</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                    href={getWhatsappLink({ message: "¡Hola! Quisiera asesoría sobre camisetas deportivas y envíos en Honduras." })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white/5 border border-white/15 text-white hover:border-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366] text-sm font-semibold transition-all duration-300"
                >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Chatear por WhatsApp ({CONTACT.phoneDisplay})</span>
                </a>
            </div>

            {/* Enlace sutil a Preguntas Frecuentes en /conectar */}
            <div className="relative z-10 text-center mt-6">
                <Link
                    href="/conectar#faq"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                    <span>¿Tienes dudas sobre pedidos, tallas o envíos?</span>
                    <span className="text-red-400 underline underline-offset-4 font-medium hover:text-red-300">Ver Preguntas Frecuentes</span>
                </Link>
            </div>
        </section>
    );
}
