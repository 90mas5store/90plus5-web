"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, Globe } from "lucide-react";

export default function SpecialEventBanner() {
    return (
        <section
            className="px-4 max-w-7xl mx-auto mb-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
        >
            <Link href="/catalogo?categoria=Mundial2026" className="block group relative overflow-hidden rounded-xl w-full h-auto min-h-[220px] md:min-h-[260px] border border-white/10 shadow-2xl bg-black/90 hover:border-white/20 transition-colors duration-500">
                {/* === BACKGROUND LAYERS === */}
                {/* 1. Official Pattern VIDEO Loop */}
                <div className="absolute inset-0 z-0 bg-neutral-900">
                    <video
                        src="/img/mundial2026/bg-loop.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster="/img/mundial2026/poster.jpg" // Fallback hipotético o dejar vacío si no existe, pero bg-neutral-900 ayuda
                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[2s] ease-out brightness-75 group-hover:brightness-90"
                    />
                    {/* Dark Gradient Overlay: Vignette for focus */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                </div>

                <div className="relative w-full h-full px-5 md:px-12 py-8 md:py-10 flex items-center justify-between z-10">

                    {/* === CONTENT LEFT (EDITORIAL / GATEWAY) === */}
                    <div
                        className="flex flex-col justify-center gap-3 z-10 w-full max-w-4xl animate-in fade-in slide-in-from-left-4 duration-700 delay-100 fill-mode-both"
                    >

                        {/* Context & Badges */}
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                            {/* Functional Badge 1 */}
                            <span className="px-2 py-[2px] md:px-3 md:py-1 bg-white text-black text-[8px] md:text-xs font-black uppercase tracking-widest rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] border border-white">
                                Colección Oficial
                            </span>
                            {/* Functional Badge 2 */}
                            <div className="flex items-center gap-1.5 bg-black/40 text-[#FFD700] border border-[#FFD700]/30 backdrop-blur-md px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-sm">
                                <Globe className="w-3 h-3 fill-current" />
                                <span className="text-[8px] md:text-[10px] font-bold tracking-wider uppercase">Todas las Selecciones</span>
                            </div>
                        </div>

                        {/* HEADLINE: LOGO + TITLE */}
                        <div className="flex items-center gap-3 md:gap-6 transform origin-left hover:scale-[1.02] transition-transform duration-500">
                            {/* Logo */}
                            <div className="relative h-12 w-9 md:h-24 md:w-20 flex-shrink-0 drop-shadow-2xl">
                                <Image
                                    src="/img/mundial2026/Mundial2026.svg"
                                    alt="Mundial 2026"
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>

                            {/* Title */}
                            <h2 className="text-4xl md:text-8xl font-black uppercase text-white tracking-tighter drop-shadow-xl leading-none">
                                MUNDIAL 2026
                            </h2>
                        </div>

                        {/* Copy: Short & Fast */}
                        <div className="mt-1 md:mt-2">
                            <p className="text-gray-300 font-medium text-xs md:text-xl tracking-wide max-w-xl pl-1 text-balance">
                                Todas las selecciones, en un solo lugar.
                            </p>
                        </div>

                        {/* Mobile CTA */}
                        <div className="md:hidden mt-4 pl-1">
                            <button className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-all">
                                <span>Ver Colección</span>
                                <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* === VISUAL ELEMENTS (ATMOSPHERE) === */}
                    <div
                        className="absolute right-[-10px] bottom-[-10px] md:right-10 md:bottom-[-40px] w-28 h-28 md:w-[400px] md:h-[400px] pointer-events-none z-10 md:z-20 opacity-40 md:opacity-100 animate-in fade-in zoom-in-90 duration-1000 delay-200 fill-mode-both"
                    >
                        <div className="w-full h-full relative transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-3 group-hover:-translate-y-2">
                            <Image
                                src="/img/mundial2026/trofeo.svg"
                                alt="Trofeo Mundial"
                                fill
                                className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                            />
                        </div>
                    </div>

                    {/* 2. Desktop CTA Button (NAVIGATIONAL / CLEAN) */}
                    <div className="hidden md:flex flex-col justify-end pb-4 h-full z-20 relative">
                        <button
                            className="flex items-center gap-3 bg-white hover:bg-[#f0f0f0] text-black px-8 py-3 rounded-full font-bold uppercase text-sm tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 group/btn transform hover:scale-105 active:scale-95"
                        >
                            <span>Explorar Colección</span>
                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>

                </div>
            </Link >
        </section >
    );
}
