'use client';

import { Search } from 'lucide-react';

interface AdminMobileHeaderProps {
    userEmail?: string;
}

export default function AdminMobileHeader({ userEmail }: AdminMobileHeaderProps) {
    const handleOpenSearch = () => {
        window.dispatchEvent(new CustomEvent('open-admin-command-palette'));
    };

    return (
        <header className="md:hidden flex-shrink-0 flex items-center justify-between px-3.5 h-14 bg-black/85 backdrop-blur-xl border-b border-white/[0.08] z-40">
            {/* Logo y estado */}
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-base font-black tracking-tight text-white">
                    90+5 <span className="text-primary font-bold">ADMIN</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Conectado" />
            </div>

            {/* 🔍 Buscador Rápido Móvil (Estilo Apple Spotlight - Touch Friendly) */}
            <button
                type="button"
                onClick={handleOpenSearch}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/10 text-neutral-300 text-xs font-medium transition-all active:scale-[0.98] cursor-pointer"
                aria-label="Buscar en el panel de administración"
            >
                <Search className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-[12px] text-neutral-400 font-medium">
                    Buscar...
                </span>
            </button>
        </header>
    );
}
