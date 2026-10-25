"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, History, ShieldCheck } from "lucide-react";
import { HomeStylesSettings, DEFAULT_HOME_STYLES_SETTINGS } from "@/lib/homeStylesSettings";

interface HomeEditorialBentoProps {
    settings?: HomeStylesSettings;
}

export default function HomeEditorialBento({ settings = DEFAULT_HOME_STYLES_SETTINGS }: HomeEditorialBentoProps) {
    if (settings && settings.enabled === false) {
        return null;
    }

    const cards = [
        {
            ...settings.card1,
            icon: Sparkles,
            gradient: "from-red-950/80 via-black/80 to-black/90",
            borderAccent: "hover:border-red-500/40",
            glow: "group-hover:shadow-[0_0_35px_rgba(229,9,20,0.25)]",
            tagStyle: "bg-red-500/15 text-red-300 border-red-500/25",
            iconColor: "text-red-400",
            btnHoverBg: "group-hover:bg-red-600 group-hover:text-white",
        },
        {
            ...settings.card2,
            icon: History,
            gradient: "from-blue-950/75 via-black/80 to-black/90",
            borderAccent: "hover:border-blue-500/40",
            glow: "group-hover:shadow-[0_0_35px_rgba(59,130,246,0.2)]",
            tagStyle: "bg-blue-500/15 text-blue-300 border-blue-500/25",
            iconColor: "text-blue-400",
            btnHoverBg: "group-hover:bg-blue-500 group-hover:text-white",
        },
        {
            ...settings.card3,
            icon: ShieldCheck,
            gradient: "from-amber-950/70 via-black/80 to-black/90",
            borderAccent: "hover:border-amber-500/40",
            glow: "group-hover:shadow-[0_0_35px_rgba(245,158,11,0.25)]",
            tagStyle: "bg-amber-500/15 text-amber-300 border-amber-500/25",
            iconColor: "text-amber-400",
            btnHoverBg: "group-hover:bg-amber-500 group-hover:text-black",
        },
    ];

    return (
        <section aria-label="Guía de versiones y estilos de camisetas" className="py-8 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6">
            {/* Encabezado editable desde el Admin */}
            <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
                {settings.badge && (
                    <div className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-primary mb-2">
                        <span>{settings.badge}</span>
                    </div>
                )}
                <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                    {settings.title}
                </h2>
                {settings.subtitle && (
                    <p className="text-white/60 text-xs sm:text-sm font-medium mt-1">
                        {settings.subtitle}
                    </p>
                )}
            </div>

            {/* Grilla Bento de 3 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <Link
                            key={card.id}
                            href={card.href}
                            className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b ${card.gradient} p-5 sm:p-7 flex flex-col justify-between transition-all duration-300 ${card.borderAccent} ${card.glow} hover:-translate-y-1 min-h-[230px]`}
                        >
                            {/* Barra decorativa specular superior */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                            <div className="relative z-10">
                                <div className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2.5 ${card.iconColor}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{card.tag}</span>
                                </div>
                                <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight mb-1.5">
                                    {card.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-white/65 leading-relaxed">
                                    {card.subtitle}
                                </p>
                            </div>

                            <div className="relative z-10 mt-6 pt-3 sm:mt-8 sm:pt-4 border-t border-white/10 flex items-center justify-between">
                                <span className="text-xs sm:text-sm font-extrabold text-white group-hover:text-primary transition-colors">
                                    {card.buttonText}
                                </span>
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 ${card.btnHoverBg} text-white flex items-center justify-center transition-all group-hover:translate-x-1`}>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
