'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, LayoutTemplate, CreditCard } from 'lucide-react';

export default function SettingsHeader() {
    return (
        <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Settings className="w-5 h-5" />
                </span>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                            Sistema & Seguridad
                        </h1>
                        <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300">
                            4 en 1
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                        Administradores autorizados, auditoría en vivo, tasa de cambio USD y papelera de reciclaje.
                    </p>
                </div>
            </div>

            {/* Accesos Rápidos a Módulos Relocalizados */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
                <Link
                    href="/admin/escaparate"
                    className="bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                    <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
                    <span>Ir a Escaparate</span>
                </Link>
                <Link
                    href="/admin/settings/bancos"
                    className="bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cuentas Bancarias</span>
                </Link>
            </div>
        </div>
    );
}

