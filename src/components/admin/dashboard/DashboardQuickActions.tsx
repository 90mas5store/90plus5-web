'use client';

import React from 'react';
import Link from 'next/link';
import {
    FileDown,
    Tag,
    Activity,
    Shirt,
    ArrowUpRight,
} from 'lucide-react';

export default function DashboardQuickActions() {
    const actions = [
        {
            label: 'Nueva Camiseta',
            sub: 'Al catálogo',
            href: '/admin/productos/nuevo',
            icon: Shirt,
        },
        {
            label: 'Lista Fábrica',
            sub: 'Exportar pedidos',
            href: '/admin/reportes',
            icon: FileDown,
        },
        {
            label: 'Crear Cupón',
            sub: 'Promociones',
            href: '/admin/descuentos',
            icon: Tag,
        },
        {
            label: 'Analíticas en Vivo',
            sub: 'Visitas y embudo',
            href: '/admin/analiticas',
            icon: Activity,
        },
    ];

    return (
        <section aria-label="Accesos rápidos" className="space-y-2">
            <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Accesos Frecuentes
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {actions.map((act) => {
                    const IconComponent = act.icon;
                    return (
                        <Link
                            key={act.label}
                            href={act.href}
                            className="flex items-center justify-between p-3 rounded-2xl bg-[#0a0c10]/60 hover:bg-[#0a0c10] border border-white/[0.08] hover:border-white/20 transition-all active:scale-[0.98] group"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 rounded-xl bg-white/[0.04] text-neutral-300 group-hover:text-primary transition-colors shrink-0">
                                    <IconComponent className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-xs font-bold text-white truncate">
                                        {act.label}
                                    </span>
                                    <span className="block text-[10px] text-neutral-500 truncate mt-0.5">
                                        {act.sub}
                                    </span>
                                </div>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300 transition-colors shrink-0 ml-1" />
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
