'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard,
    Package,
    Shirt,
    MoreHorizontal,
    X,
    FileSpreadsheet,
    Tag,
    Trophy,
    Shield,
    LayoutTemplate,
    Lock,
    Activity,
    Trash2,
    Scissors,
    DollarSign,
} from 'lucide-react';

interface AdminBottomNavProps {
    userEmail?: string;
}

export default function AdminBottomNav({ userEmail }: AdminBottomNavProps) {
    const pathname = usePathname();
    const [moreOpen, setMoreOpen] = useState(false);

    const isActive = (path: string) => {
        if (path === '/admin' && pathname === '/admin') return true;
        if (path !== '/admin' && pathname?.startsWith(path)) return true;
        return false;
    };

    // Items principales del nav (los más usados)
    const mainItems = [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Pedidos', href: '/admin/orders', icon: Package },
        { label: 'Productos', href: '/admin/productos', icon: Shirt },
        { label: 'Reportes', href: '/admin/reportes', icon: FileSpreadsheet },
    ];

    // Items secundarios (dentro del "Más")
    const moreItems = [
        {
            section: 'Análisis',
            items: [
                { label: 'Contabilidad', href: '/admin/contabilidad', icon: DollarSign },
                { label: 'Descuentos', href: '/admin/descuentos', icon: Tag },
            ],
        },
        {
            section: 'Catálogos',
            items: [
                { label: 'Categorías', href: '/admin/categorias', icon: Tag },
                { label: 'Ligas', href: '/admin/ligas', icon: Trophy },
                { label: 'Equipos', href: '/admin/equipos', icon: Shield },
                { label: 'Personal.', href: '/admin/estilos', icon: Scissors },
            ],
        },
        {
            section: 'Configuración',
            items: [
                { label: 'Banners', href: '/admin/settings/banners', icon: LayoutTemplate },
                { label: 'Admins', href: '/admin/settings/admins', icon: Lock },
                { label: 'Actividad', href: '/admin/settings/activity', icon: Activity },
                { label: 'Papelera', href: '/admin/settings/trash', icon: Trash2 },
            ],
        },
    ];

    // Detectar si una sección del "más" está activa
    const isMoreActive = moreItems.some(group =>
        group.items.some(item => isActive(item.href))
    );

    return (
        <>
            {/* BOTTOM NAV — solo móvil */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/97 backdrop-blur-md border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.6)]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                aria-label="Navegación admin"
            >
                <div className="flex items-center h-16">
                    {mainItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center flex-1 h-full gap-1"
                                aria-label={item.label}
                            >
                                <div className="relative flex items-center justify-center">
                                    {active && (
                                        <span className="absolute inset-0 bg-white/20 blur-md rounded-xl scale-[1.8]" />
                                    )}
                                    <div className={`relative px-3 py-1.5 rounded-xl flex items-center justify-center transition-all duration-200 ${active ? 'bg-white/15 border border-white/30' : ''}`}>
                                        <item.icon
                                            className={`w-5 h-5 transition-all duration-200 ${active
                                                ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                                : 'text-gray-600'
                                                }`}
                                        />
                                    </div>
                                </div>
                                <span className={`text-[9px] tracking-widest uppercase transition-all duration-200 ${active ? 'font-black text-white' : 'font-semibold text-gray-600'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Botón "Más" */}
                    <button
                        onClick={() => setMoreOpen(true)}
                        className="flex flex-col items-center justify-center flex-1 h-full gap-1"
                        aria-label="Más opciones"
                    >
                        <div className="relative flex items-center justify-center">
                            {isMoreActive && (
                                <span className="absolute inset-0 bg-white/20 blur-md rounded-xl scale-[1.8]" />
                            )}
                            <div className={`relative px-3 py-1.5 rounded-xl flex items-center justify-center transition-all duration-200 ${isMoreActive ? 'bg-white/15 border border-white/30' : ''}`}>
                                <MoreHorizontal
                                    className={`w-5 h-5 transition-all duration-200 ${isMoreActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-gray-600'}`}
                                />
                            </div>
                        </div>
                        <span className={`text-[9px] tracking-widest uppercase transition-all duration-200 ${isMoreActive ? 'font-black text-white' : 'font-semibold text-gray-600'}`}>
                            Más
                        </span>
                    </button>
                </div>
            </nav>

            {/* SHEET "MÁS" */}
            {moreOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] md:hidden"
                        onClick={() => setMoreOpen(false)}
                    />

                    {/* Panel */}
                    <div
                        className="fixed bottom-0 left-0 right-0 z-[70] md:hidden bg-[#0a0a0a] border-t border-white/10 rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)]"
                        style={{
                            animation: 'adminSheetSlideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
                        }}
                    >
                        {/* Handle */}
                        <div className="flex items-center justify-between px-6 pt-4 pb-2">
                            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                            <div className="flex items-center gap-3 pt-2">
                                {userEmail && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="truncate max-w-[160px]">{userEmail}</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setMoreOpen(false)}
                                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                aria-label="Cerrar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Contenido */}
                        <div className="overflow-y-auto px-4 pb-6 max-h-[60dvh]" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
                            {moreItems.map((group) => (
                                <div key={group.section} className="mb-5">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-2">
                                        {group.section}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {group.items.map((item) => {
                                            const active = isActive(item.href);
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setMoreOpen(false)}
                                                    className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all overflow-hidden ${active
                                                        ? 'bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.08)]'
                                                        : 'bg-white/[0.03] border-white/5 active:bg-white/10'
                                                        }`}
                                                >
                                                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-white/15' : 'bg-white/5'}`}>
                                                        <item.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />
                                                    </div>
                                                    <span className={`font-bold text-sm leading-tight ${active ? 'text-white' : 'text-gray-300'}`}>
                                                        {item.label}
                                                    </span>
                                                    {active && (
                                                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Cerrar sesión */}
                            <form action="/auth/signout" method="post" className="mt-2">
                                <button className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-sm py-3.5 rounded-2xl transition-all border border-red-500/20">
                                    Desconectar sesión
                                </button>
                            </form>
                        </div>
                    </div>

                </>
            )}
        </>
    );
}
