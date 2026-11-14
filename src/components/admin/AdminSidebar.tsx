'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LogOut,
    LayoutDashboard,
    Package,
    Shirt,
    Tag,
    Trophy,
    Shield,
    Scissors,
    DollarSign,
    CreditCard,
    Settings,
    SlidersHorizontal,
    Search,
    LayoutTemplate,
    Layers,
} from 'lucide-react';

interface AdminSidebarProps {
    userEmail?: string;
}

export default function AdminSidebar({ userEmail }: AdminSidebarProps) {
    const pathname = usePathname();

    const isActive = (path: string, exact?: boolean) => {
        if (exact || path === '/admin') return pathname === path;
        return pathname?.startsWith(path);
    };

    const navGroups = [
        {
            title: 'Operaciones',
            items: [
                { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
                {
                    label: 'Centro de Pedidos',
                    href: '/admin/orders',
                    icon: Package,
                    badge: '4 en 1',
                },
            ],
        },
        {
            title: 'Tienda & Portada',
            items: [
                {
                    label: 'Página Principal',
                    href: '/admin/escaparate',
                    icon: LayoutTemplate,
                    badge: 'En Vivo',
                },
            ],
        },
        {
            title: 'Catálogo',
            items: [
                { label: 'Productos', href: '/admin/productos', icon: Shirt },
                {
                    label: 'Estructura',
                    href: '/admin/catalogo',
                    icon: Layers,
                    badge: '5 en 1',
                },
            ],
        },
        {
            title: 'Finanzas & Crecimiento',
            items: [
                { label: 'Contabilidad', href: '/admin/contabilidad', icon: DollarSign },
                { label: 'Cuentas & Pagos', href: '/admin/settings/bancos', icon: CreditCard },
                { label: 'Descuentos', href: '/admin/descuentos', icon: Tag },
            ],
        },
        {
            title: 'Sistema',
            items: [
                {
                    label: 'Configuración',
                    href: '/admin/settings',
                    icon: Settings,
                    badge: '4 en 1',
                },
            ],
        },
    ];

    return (
        /* Solo visible en desktop (md+) */
        <aside className="hidden md:flex fixed top-0 bottom-0 left-0 w-72 bg-black border-r border-white/10 p-5 flex-col z-50">
            {/* Logo & Marca */}
            <div className="mb-4 px-3 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                        90+5 <span className="text-primary">ADMIN</span>
                    </h1>
                    <span className="text-[10px] text-gray-500 font-mono tracking-wider block mt-0.5">
                        CONSOLE v2.0
                    </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Conexión en vivo" />
            </div>

            {/* 🔍 Buscador Rápido Global (Ctrl + K en Windows/PC) */}
            <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-admin-command-palette'))}
                className="w-full flex items-center justify-between px-3 py-2 mb-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-400 hover:text-white transition-all text-xs group cursor-pointer active:scale-[0.98]"
                aria-label="Abrir buscador global de administración"
            >
                <span className="flex items-center gap-2 truncate">
                    <Search size={14} className="text-neutral-400 group-hover:text-primary transition-colors shrink-0" />
                    <span className="truncate text-xs font-medium">Buscar en admin...</span>
                </span>
                <kbd className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-neutral-300 border border-white/10">
                    Ctrl + K
                </kbd>
            </button>

            {/* Navegación Modular por Grupos */}
            <nav className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
                {navGroups.map((group) => (
                    <div key={group.title}>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-3 mb-1.5 flex items-center justify-between">
                            <span>{group.title}</span>
                        </div>

                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const active = isActive(item.href, item.exact);
                                const IconComponent = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 group relative
                                            ${active
                                                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)]'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        <IconComponent
                                            size={17}
                                            className={active ? 'text-black shrink-0' : 'group-hover:text-white transition-colors shrink-0'}
                                        />
                                        <span className="truncate">{item.label}</span>

                                        {item.badge && (
                                            <span
                                                className={`ml-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                                    active
                                                        ? 'bg-black/15 text-black'
                                                        : 'bg-white/10 text-gray-400 group-hover:text-white'
                                                }`}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer con Usuario y Desconexión */}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
                {userEmail && (
                    <div className="flex items-center gap-2.5 text-xs text-gray-400 bg-white/5 p-2.5 rounded-xl border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate text-[11px] font-mono">{userEmail}</span>
                    </div>
                )}

                <form action="/auth/signout" method="post">
                    <button className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs py-2.5 rounded-xl transition-all border border-red-500/20 cursor-pointer">
                        <LogOut size={14} />
                        Cerrar Sesión
                    </button>
                </form>
            </div>
        </aside>
    );
}
