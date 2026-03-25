'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, LayoutDashboard, Package, FileSpreadsheet, Shirt, Users, Tag, Trophy, Shield, LayoutTemplate, Lock, Activity, Trash2 } from 'lucide-react';

interface AdminSidebarProps {
    userEmail?: string;
}

export default function AdminSidebar({ userEmail }: AdminSidebarProps) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/admin' && pathname === '/admin') return true;
        if (path !== '/admin' && pathname?.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Pedidos', href: '/admin/orders', icon: Package },
        { label: 'Reportes', href: '/admin/reportes', icon: FileSpreadsheet },
        { label: 'Productos', href: '/admin/productos', icon: Shirt },
        {
            label: 'Clientes',
            href: '#',
            icon: Users,
            disabled: true
        }
    ];

    return (
        /* Solo visible en desktop (md+) */
        <aside className="hidden md:flex fixed top-0 bottom-0 left-0 w-72 bg-black border-r border-white/10 p-6 flex-col z-50">
            {/* Logo */}
            <div className="mb-10">
                <h1 className="text-2xl font-black tracking-tighter text-white">
                    90+5 <span className="text-primary">ADMIN</span>
                </h1>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
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

                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-6 mb-3 px-4">
                    Catálogos
                </div>

                {[
                    { label: 'Categorías', href: '/admin/categorias', icon: Tag },
                    { label: 'Ligas', href: '/admin/ligas', icon: Trophy },
                    { label: 'Equipos', href: '/admin/equipos', icon: Shield },
                ].map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 group
                                hover:bg-white/5
                                ${active
                                    ? 'bg-primary text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                    : 'text-gray-400 hover:text-white'
                                }
                            `}
                            style={active ? { backgroundColor: '#fff', color: '#000' } : {}}
                        >
                            <item.icon size={20} className={active ? 'text-black' : 'group-hover:text-white transition-colors'} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-6 mb-3 px-4">
                    Configuración
                </div>

                {[
                    { label: 'Banners Home', href: '/admin/settings/banners', icon: LayoutTemplate },
                    { label: 'Administradores', href: '/admin/settings/admins', icon: Lock },
                    { label: 'Registro de Actividad', href: '/admin/settings/activity', icon: Activity },
                    { label: 'Papelera', href: '/admin/settings/trash', icon: Trash2 },
                ].map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 group
                                hover:bg-white/5
                                ${active
                                    ? 'bg-primary text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                    : 'text-gray-400 hover:text-white'
                                }
                            `}
                            style={active ? { backgroundColor: '#fff', color: '#000' } : {}}
                        >
                            <item.icon size={20} className={active ? 'text-black' : 'group-hover:text-white transition-colors'} />
                            <span>{item.label}</span>
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
    );
}
