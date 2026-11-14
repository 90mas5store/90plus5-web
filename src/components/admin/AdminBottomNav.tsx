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
    Activity,
    Scissors,
    DollarSign,
    Bookmark,
    Settings,
    LayoutTemplate,
    Radio,
    Trash2,
    SlidersHorizontal,
    ArrowRight,
    LogOut,
    Search,
    CreditCard,
    Users,
    Megaphone,
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

    // Items principales de la barra fija móvil (los más frecuentados diariamente)
    const mainItems = [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Pedidos', href: '/admin/orders', icon: Package },
        { label: 'Productos', href: '/admin/productos', icon: Shirt },
        { label: 'Analíticas', href: '/admin/orders?tab=analiticas', icon: Activity },
    ];

    // Secciones organizadas del Control Center Móvil
    const moreGroups = [
        {
            section: 'Finanzas & Crecimiento',
            items: [
                { label: 'Contabilidad', href: '/admin/contabilidad', icon: DollarSign },
                { label: 'Cuentas & Pagos', href: '/admin/settings/bancos', icon: CreditCard },
                { label: 'Descuentos', href: '/admin/descuentos', icon: Tag },
            ],
        },
        {
            section: 'Operaciones & Clientes',
            items: [
                { label: 'Clientes VIP', href: '/admin/orders?tab=clientes', icon: Users },
                { label: 'Lista Fábrica', href: '/admin/orders?tab=fabrica', icon: FileSpreadsheet },
            ],
        },
        {
            section: 'Catálogo Unificado',
            items: [
                { label: 'Estructura (5 en 1)', href: '/admin/catalogo', icon: Shield },
                { label: 'Equipos', href: '/admin/catalogo?tab=equipos', icon: Shield },
                { label: 'Ligas', href: '/admin/catalogo?tab=ligas', icon: Trophy },
                { label: 'Categorías', href: '/admin/catalogo?tab=categorias', icon: Tag },
                { label: 'Marcas', href: '/admin/catalogo?tab=marcas', icon: Bookmark },
                { label: 'Personalización', href: '/admin/catalogo?tab=estilos', icon: Scissors },
            ],
        },
        {
            section: 'Tienda & Escaparate',
            items: [
                { label: 'Página Principal', href: '/admin/escaparate', icon: LayoutTemplate },
                { label: 'Banners de Portada', href: '/admin/escaparate?tab=banners', icon: LayoutTemplate },
                { label: 'Marquesina de Avisos', href: '/admin/escaparate?tab=marquesina', icon: Megaphone },
                { label: 'Fútbol & Matchday', href: '/admin/escaparate?tab=matchday', icon: Radio },
            ],
        },
        {
            section: 'Ajustes del Sistema',
            items: [
                { label: 'Configuración', href: '/admin/settings', icon: Settings },
                { label: 'Papelera', href: '/admin/settings/trash', icon: Trash2 },
            ],
        },
    ];

    const isSettingsActive = pathname?.startsWith('/admin/settings');
    const isMoreActive = isSettingsActive || moreGroups.some((group) =>
        group.items.some((item) => isActive(item.href))
    );

    return (
        <>
            {/* BOTTOM NAV — Barra fija inferior para móvil */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.8)]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                aria-label="Navegación admin móvil"
            >
                <div className="flex items-center h-16">
                    {mainItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center flex-1 h-full gap-1 active:scale-95 transition-transform"
                                aria-label={item.label}
                            >
                                <div className="relative flex items-center justify-center">
                                    {active && (
                                        <span className="absolute inset-0 bg-white/20 blur-md rounded-xl scale-[1.8]" />
                                    )}
                                    <div
                                        className={`relative px-3 py-1.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                            active ? 'bg-white/15 border border-white/30' : ''
                                        }`}
                                    >
                                        <item.icon
                                            className={`w-5 h-5 transition-all duration-200 ${
                                                active
                                                    ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                                    : 'text-gray-500'
                                            }`}
                                        />
                                    </div>
                                </div>
                                <span
                                    className={`text-[9px] tracking-widest uppercase transition-all duration-200 ${
                                        active ? 'font-black text-white' : 'font-semibold text-gray-500'
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Botón "Más" (Control Center) */}
                    <button
                        onClick={() => setMoreOpen(true)}
                        className="flex flex-col items-center justify-center flex-1 h-full gap-1 active:scale-95 transition-transform cursor-pointer"
                        aria-label="Más opciones"
                    >
                        <div className="relative flex items-center justify-center">
                            {isMoreActive && (
                                <span className="absolute inset-0 bg-white/20 blur-md rounded-xl scale-[1.8]" />
                            )}
                            <div
                                className={`relative px-3 py-1.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                    isMoreActive ? 'bg-white/15 border border-white/30' : ''
                                }`}
                            >
                                <MoreHorizontal
                                    className={`w-5 h-5 transition-all duration-200 ${
                                        isMoreActive
                                            ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                            : 'text-gray-500'
                                    }`}
                                />
                            </div>
                        </div>
                        <span
                            className={`text-[9px] tracking-widest uppercase transition-all duration-200 ${
                                isMoreActive ? 'font-black text-white' : 'font-semibold text-gray-500'
                            }`}
                        >
                            Más
                        </span>
                    </button>
                </div>
            </nav>

            {/* SHEET "MÁS" — Control Center Móvil estilo iOS */}
            {moreOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] md:hidden animate-in fade-in duration-200"
                        onClick={() => setMoreOpen(false)}
                    />

                    {/* Panel Bottom Sheet */}
                    <div
                        className="fixed bottom-0 left-0 right-0 z-[70] md:hidden bg-[#0a0a0a] border-t border-white/15 rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.9)] max-h-[85dvh] flex flex-col"
                        style={{
                            animation: 'adminSheetSlideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
                        }}
                    >
                        {/* Cabecera del Sheet */}
                        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-white/5 shrink-0">
                            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2.5" />
                            <div className="flex items-center gap-2 pt-1">
                                <span className="text-sm font-black text-white tracking-tight">
                                    Control Center
                                </span>
                                {userEmail && (
                                    <span className="text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded-full truncate max-w-[130px]">
                                        {userEmail}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setMoreOpen(false)}
                                className="p-1.5 rounded-xl text-gray-400 hover:text-white bg-white/5 transition-all cursor-pointer"
                                aria-label="Cerrar menú"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Contenido con scroll táctil suave */}
                        <div
                            className="overflow-y-auto px-4 py-4 space-y-3"
                            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
                        >
                            {/* 🔍 ACCESO RÁPIDO A BÚSQUEDA GLOBAL */}
                            <button
                                type="button"
                                onClick={() => {
                                    setMoreOpen(false);
                                    window.dispatchEvent(new CustomEvent('open-admin-command-palette'));
                                }}
                                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 active:scale-95 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
                                        <Search className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-xs font-bold text-white">Búsqueda Rápida Universal</span>
                                        <span className="block text-[10px] text-gray-400">Buscar pedidos, camisetas, clientes</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-neutral-400 group-hover:text-white">
                                    <span className="text-xs font-medium">Buscar</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </button>

                            {/* 🌟 BANNER DESTACADO: CENTRO DE CONFIGURACIÓN */}
                            <Link
                                href="/admin/settings"
                                onClick={() => setMoreOpen(false)}
                                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all relative overflow-hidden group ${
                                    isSettingsActive
                                        ? 'bg-white text-black border-white shadow-xl shadow-white/10'
                                        : 'bg-gradient-to-r from-neutral-900 via-neutral-900 to-black border-white/15 hover:border-white/30'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-2.5 rounded-xl border ${
                                            isSettingsActive
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white/10 text-white border-white/20'
                                        }`}
                                    >
                                        <Settings className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={`text-sm font-extrabold tracking-tight ${
                                                    isSettingsActive ? 'text-black' : 'text-white'
                                                }`}
                                            >
                                                Centro de Configuración
                                            </span>
                                            <span
                                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                                    isSettingsActive
                                                        ? 'bg-black/10 text-black'
                                                        : 'bg-primary/20 text-primary border border-primary/30'
                                                }`}
                                            >
                                                11 en 1
                                            </span>
                                        </div>
                                        <p
                                            className={`text-[11px] mt-0.5 ${
                                                isSettingsActive ? 'text-gray-700' : 'text-gray-400'
                                            }`}
                                        >
                                            Bancos, banners, matchday, tasa y seguridad
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight
                                    className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1 ${
                                        isSettingsActive ? 'text-black' : 'text-gray-400'
                                    }`}
                                />
                            </Link>

                            {/* GRUPOS DE ACCESOS RÁPIDOS */}
                            {moreGroups.map((group) => (
                                <div key={group.section}>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                                        {group.section}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {group.items.map((item) => {
                                            const active = isActive(item.href);
                                            const IconComponent = item.icon;

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setMoreOpen(false)}
                                                    className={`relative flex items-center gap-2.5 p-3 rounded-xl border transition-all active:scale-95 ${
                                                        active
                                                            ? 'bg-white/10 border-white/30 text-white'
                                                            : 'bg-white/[0.03] border-white/5 text-gray-300 hover:text-white hover:bg-white/5'
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                            active ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400'
                                                        }`}
                                                    >
                                                        <IconComponent className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-xs truncate">
                                                        {item.label}
                                                    </span>
                                                    {active && (
                                                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Cerrar Sesión */}
                            <form action="/auth/signout" method="post" className="pt-2">
                                <button className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs py-3 rounded-xl transition-all border border-red-500/20 active:scale-95 cursor-pointer">
                                    <LogOut className="w-3.5 h-3.5" />
                                    Cerrar Sesión
                                </button>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

