"use client";

import { useState } from "react";
import { ShieldCheck, Sparkles, Plane, Trophy, MessageCircle, ChevronDown, HelpCircle, CheckCircle2 } from "lucide-react";
import { BUSINESS_LOGIC } from "@/lib/constants";

export default function TrackingInfoGuide() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const whatsappNumber = BUSINESS_LOGIC.CONTACT.WHATSAPP_NUMBER;

    const steps = [
        {
            step: "01",
            icon: ShieldCheck,
            title: "Fichaje & Anticipo 50%",
            desc: "Registramos tu pedido y validamos tu comprobante de anticipo vía transferencia o tarjeta bancaria.",
        },
        {
            step: "02",
            icon: Sparkles,
            title: "Confección & Dorsal Oficial",
            desc: "Mandamos a fabricar la prenda con detalles exactos de corte, parches de competición y tu dorsal personalizado.",
        },
        {
            step: "03",
            icon: Plane,
            title: "Vuelo Directo a Honduras",
            desc: "Tu producto viaja de manera segura cruzando aduanas hasta llegar a nuestro centro de recepción en Tegucigalpa.",
        },
        {
            step: "04",
            icon: Trophy,
            title: "Inspección & Despacho",
            desc: "Revisamos calidad de costuras y estampados. Entregamos localmente o enviamos a tu puerta vía Cargo Expreso (CAEX).",
        },
    ];

    const faqs = [
        {
            q: "¿Dónde encuentro mi código o ID de pedido?",
            a: "Al confirmar tu compra, enviamos un correo con los detalles de tu orden y tu ID de pedido (ej: a0eebc99...). Si no lo encuentras en tu bandeja de entrada, revisa tu carpeta de Spam o escríbenos directamente a nuestro WhatsApp de atención.",
        },
        {
            q: "¿Cuánto tiempo tarda en llegar mi camiseta?",
            a: "Al tratarse de prendas importadas y personalizadas bajo pedido, el tiempo habitual de arribo es de 3 a 5 semanas desde la confirmación del anticipo. Te mantenemos informado en cada hito del proceso.",
        },
        {
            q: "¿Cómo se cancela el 50% de saldo restante?",
            a: "Una vez que tu camiseta arriba a Honduras e ingresa a inspección en Tegucigalpa, nuestro equipo te notifica vía WhatsApp para liquidar el 50% restante antes de coordinar la entrega o envío nacional.",
        },
        {
            q: "¿Realizan envíos a todo el territorio hondureño?",
            a: "¡Sí! En Tegucigalpa coordinamos entregas locales (envío gratis en zonas seleccionadas), y para el resto de los 18 departamentos de Honduras enviamos vía Cargo Expreso (CAEX) con número de guía oficial para rastreo directo.",
        },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto space-y-12 sm:space-y-16 mt-8 sm:mt-12">
            {/* Infografía de las 4 Fases */}
            <div>
                <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-primary block mb-2">
                        Logística Transparente 90+5
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        ¿Cómo funciona el viaje de tu camiseta?
                    </h3>
                    <p className="text-xs sm:text-sm text-white/55 mt-1.5 leading-relaxed">
                        Desde que fichas tu camiseta hasta el pitazo final en tus manos, cada etapa está asegurada.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {steps.map((st, idx) => {
                        const Icon = st.icon;
                        return (
                            <div
                                key={idx}
                                className="relative p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-3 text-2xl font-black font-mono text-white/[0.05] group-hover:text-primary/10 transition-colors pointer-events-none">
                                    {st.step}
                                </div>

                                <div>
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-sm font-extrabold text-white mb-1.5 leading-snug">
                                        {st.title}
                                    </h4>
                                    <p className="text-[11px] sm:text-xs text-white/55 leading-relaxed">
                                        {st.desc}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center gap-1.5 text-[10px] font-bold text-white/40 group-hover:text-white/70 transition-colors">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>Garantía Oficial</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Preguntas Frecuentes */}
            <div className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white">
                            Preguntas Frecuentes de Rastreo
                        </h3>
                        <p className="text-xs text-white/50">
                            Respuestas rápidas sobre entregas, tiempos y métodos de pago
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, idx) => {
                        const isOpen = openFaq === idx;
                        return (
                            <div
                                key={idx}
                                className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-colors"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                                    className="w-full flex items-center justify-between p-4 text-left gap-4 hover:bg-white/[0.02] transition-colors"
                                >
                                    <span className="text-xs sm:text-sm font-bold text-white">
                                        {faq.q}
                                    </span>
                                    <ChevronDown
                                        className={`w-4 h-4 text-white/50 shrink-0 transition-transform duration-200 ${
                                            isOpen ? "rotate-180 text-primary" : ""
                                        }`}
                                    />
                                </button>

                                {isOpen && (
                                    <div className="px-4 pb-4 pt-1 text-xs text-white/65 leading-relaxed border-t border-white/[0.04]">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Banner de Contacto Directo WhatsApp */}
            <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-[#0a1510] to-[#0a1215] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="max-w-xl text-center md:text-left relative z-10">
                    <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <MessageCircle className="w-4 h-4" />
                        <span>Soporte Logístico 90+5</span>
                    </div>
                    <h4 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                        ¿No encuentras tu ID o necesitas ayuda con tu entrega?
                    </h4>
                    <p className="text-white/65 text-xs sm:text-sm mt-1 leading-relaxed">
                        Escríbenos directamente por WhatsApp con tu nombre o número telefónico. Te ayudamos a localizar tu paquete de inmediato.
                    </p>
                </div>

                <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hola 90+5 Store, necesito ayuda para rastrear mi pedido.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm transition-all shadow-xl shadow-emerald-500/20 active:scale-95 shrink-0"
                >
                    <MessageCircle className="w-4 h-4 fill-black" />
                    <span>Hablar por WhatsApp</span>
                </a>
            </div>
        </div>
    );
}
