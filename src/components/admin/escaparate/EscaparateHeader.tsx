'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutTemplate, ExternalLink, Sparkles } from 'lucide-react';

export default function EscaparateHeader() {
    return (
        <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <LayoutTemplate className="w-5 h-5" />
                </span>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                            Escaparate & Home Studio
                        </h1>
                        <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Portada en Vivo
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                        Edita banners hero, marquesina de avisos, partido matchday y colecciones destacadas en tiempo real.
                    </p>
                </div>
            </div>

            <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-200 hover:text-white border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
            >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ver Tienda en Vivo</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </Link>
        </div>
    );
}

