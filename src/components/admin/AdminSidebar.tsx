'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, LogOut, Menu, X, Shirt, Users, Settings, FileSpreadsheet } from 'lucide-react';

interface AdminSidebarProps {
    userEmail?: string;
}

export default function AdminSidebar({ userEmail }: AdminSidebarProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const isActive = (path: string) => {
        if (path === '/admin' && pathname === '/admin') return true;
        if (path !== '/admin' && pathname?.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        {
            label: 'Dashboard',
            href: '/admin',
            icon: LayoutDashboard
        },
        {
            label: 'Pedidos',
            href: '/admin/orders',
            icon: Package
        },
        {
            label: 'Reportes',
            href: '/admin/reportes',
            icon: FileSpreadsheet
        },
        {
            label: 'Productos',
            href: '/admin/productos',
            icon: Shirt,
        },
        {
            label: 'Clientes',
            href: '#',
            icon: Users,
            disabled: true
        }
    ];

    return (
        <>
            {/* MOBILE TOGGLE - Only visible on small screens */}
            <div className="md:hidden fixed top-4 right-4 z-50">
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="bg-neutral-900 border border-white/10 p-2 rounded-lg text-white shadow-xl"
                >
                    {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* SIDEBAR BACKDROP (Mobile) */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* ASIDE */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-black border-r border-white/10 p-6 flex flex-col transition-transform duration-300 ease-in-out
                md:translate-x-0 md:static md:w-72
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="mb-10 flex items-center justify-between">
                    <h1 className="text-2xl font-black tracking-tighter text-white">
                        90+5 <span className="text-primary">ADMIN</span>
                    </h1>
                </div>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 group
                                    ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5'}
                                    ${active
                                        ? 'bg-primary text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                        : 'text-gray-400 hover:text-white'
                                    }
                                `}
                                style={active ? { backgroundColor: '#fff', color: '#000' } : {}}
                            >
                                <item.icon size={20} className={active ? 'text-black' : 'group-hover:text-white transition-colors'} />
                                <span>{item.label}</span>
                                {item.disabled && (
                                    <span className="ml-auto text-[10px] uppercase border border-white/10 px-1.5 rounded text-gray-500">
                                        Pronto
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="pt-6 border-t border-white/10 space-y-4">
                    {userEmail && (
                        <div className="flex items-center gap-3 text-xs font-medium text-gray-500 bg-white/5 p-3 rounded-lg border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                            <span className="truncate max-w-[140px]">{userEmail}</span>
                        </div>
                    )}

                    <form action="/auth/signout" method="post">
                        <button className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 font-bold text-sm py-3 rounded-xl transition-all border border-red-500/20">
                            <LogOut size={16} />
                            Desconectar
                        </button>
                    </form>
                </div>
            </aside>
        </>
    );
}
