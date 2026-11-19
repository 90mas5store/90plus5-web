'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
    AnimatePresence,
    motion,
    useDragControls,
    useReducedMotion,
    type PanInfo,
} from 'framer-motion';
import {
    LayoutDashboard,
    Package,
    Shirt,
    LayoutTemplate,
    MoreHorizontal,
    X,
    Search,
    ArrowRight,
    ChevronRight,
    DollarSign,
    CreditCard,
    Tag,
    Shield,
    Trophy,
    Bookmark,
    Scissors,
    Sparkles,
    Radio,
    Megaphone,
    FileSpreadsheet,
    Users,
    Activity,
    Settings,
    Lock,
    Trash2,
    LogOut,
    Layers,
    type LucideIcon,
} from 'lucide-react';

interface AdminBottomNavProps {
    userEmail?: string;
}

interface MainNavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    liveDot?: boolean;
}

interface SheetLinkItem {
    label: string;
    href: string;
    icon: LucideIcon;
    subtitle?: string;
    liveDot?: boolean;
    spanFull?: boolean;
}

const MAIN_ITEMS: MainNavItem[] = [
    { label: 'Inicio', href: '/admin', icon: LayoutDashboard },
    { label: 'Pedidos', href: '/admin/orders', icon: Package },
    { label: 'Productos', href: '/admin/productos', icon: Shirt },
    { label: 'Portada', href: '/admin/escaparate', icon: LayoutTemplate, liveDot: true },
];

const FINANCE_ITEMS: SheetLinkItem[] = [
    {
        label: 'Contabilidad',
        href: '/admin/contabilidad',
        icon: DollarSign,
        subtitle: 'Ingresos, costos y márgenes',
        spanFull: true,
    },
    { label: 'Cuentas & Pagos', href: '/admin/settings/bancos', icon: CreditCard },
    { label: 'Descuentos', href: '/admin/descuentos', icon: Tag },
];

const CATALOGO_ITEMS: SheetLinkItem[] = [
    { label: 'Equipos', href: '/admin/catalogo?tab=equipos', icon: Shield },
    { label: 'Ligas', href: '/admin/catalogo?tab=ligas', icon: Trophy },
    { label: 'Categorías', href: '/admin/catalogo?tab=categorias', icon: Tag },
    { label: 'Marcas', href: '/admin/catalogo?tab=marcas', icon: Bookmark },
    { label: 'Personalización', href: '/admin/catalogo?tab=estilos', icon: Scissors },
    { label: 'Búsqueda y Alias', href: '/admin/catalogo?tab=busqueda', icon: Search },
];

const SHORTCUT_ITEMS: SheetLinkItem[] = [
    { label: 'Hero & Colecciones', href: '/admin/escaparate?tab=special', icon: Sparkles },
    { label: 'Fútbol & Matchday', href: '/admin/escaparate?tab=matchday', icon: Radio, liveDot: true },
    { label: 'Marquesina', href: '/admin/escaparate?tab=marquesina', icon: Megaphone },
    { label: 'Lista Fábrica', href: '/admin/orders?tab=fabrica', icon: FileSpreadsheet },
    { label: 'Clientes VIP', href: '/admin/orders?tab=clientes', icon: Users },
    { label: 'Analíticas', href: '/admin/orders?tab=analiticas', icon: Activity },
];

const SYSTEM_PILLS: SheetLinkItem[] = [
    { label: 'Admins', href: '/admin/settings?tab=admins', icon: Lock },
    { label: 'Actividad', href: '/admin/settings?tab=activity', icon: Activity },
    { label: 'Tasa USD', href: '/admin/settings?tab=tasa-cambio', icon: DollarSign },
    { label: 'Papelera', href: '/admin/settings?tab=trash', icon: Trash2 },
];

function AdminBottomNavInner({ userEmail }: AdminBottomNavProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab');
    const routeKey = `${pathname ?? ''}?${currentTab ?? ''}`;

    const [openRouteKey, setOpenRouteKey] = useState<string | null>(null);
    const moreOpen = openRouteKey === routeKey;
    const openSheet = () => setOpenRouteKey(routeKey);
    const closeSheet = () => setOpenRouteKey(null);
    const prefersReducedMotion = useReducedMotion();
    const dragControls = useDragControls();

    const isActive = (href: string): boolean => {
        if (!pathname) return false;

        const [targetPath, queryString] = href.split('?');
        const targetTab = queryString ? new URLSearchParams(queryString).get('tab') : null;

        if (targetTab) {
            if (pathname !== targetPath) return false;
            if (!currentTab) {
                if (targetPath === '/admin/catalogo' && targetTab === 'equipos') return true;
                if (targetPath === '/admin/escaparate' && targetTab === 'special') return true;
                if (targetPath === '/admin/settings' && targetTab === 'admins') return true;
                return false;
            }
            if (
                targetPath === '/admin/escaparate' &&
                targetTab === 'special' &&
                currentTab === 'banners'
            ) {
                return true;
            }
            return currentTab === targetTab;
        }

        if (targetPath === '/admin' || targetPath === '/admin/settings') {
            return pathname === targetPath;
        }

        return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
    };

    const isMainRouteActive = MAIN_ITEMS.some((item) => isActive(item.href));
    const isMoreActive = !isMainRouteActive;
    const isCatalogoActive = isActive('/admin/catalogo');
    const isSettingsActive = isActive('/admin/settings');

    // Bloqueo de scroll y tecla Escape cuando el Control Center está abierto
    useEffect(() => {
        if (!moreOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpenRouteKey(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [moreOpen]);

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y > 90 || info.velocity.y > 420) {
            closeSheet();
        }
    };

    const pillTransition = prefersReducedMotion
        ? { duration: 0.14 }
        : { type: 'spring' as const, bounce: 0, duration: 0.34 };

    const sheetTransition = prefersReducedMotion
        ? { duration: 0.16, ease: 'easeOut' as const }
        : { type: 'spring' as const, damping: 32, stiffness: 380, mass: 0.85 };

    return (
        <>
            {/* BOTTOM NAV — Barra fija inferior para móvil */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#07080a]/90 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-12px_36px_rgba(0,0,0,0.85)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                aria-label="Navegación admin móvil"
            >
                <div className="flex items-center h-16 px-1">
                    {MAIN_ITEMS.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-label={item.label}
                                aria-current={active ? 'page' : undefined}
                                className="flex flex-col items-center justify-center flex-1 h-full gap-1 active:scale-[0.94] transition-transform duration-100 select-none"
                            >
                                <div className="relative flex items-center justify-center px-3.5 py-1.5 rounded-xl">
                                    {active && (
                                        <motion.span
                                            layoutId="admin-bottom-nav-pill"
                                            transition={pillTransition}
                                            className="absolute inset-0 rounded-xl bg-white/[0.12] border border-white/[0.18]"
                                        />
                                    )}
                                    <span className="relative flex items-center justify-center">
                                        <Icon
                                            className={`w-5 h-5 transition-colors duration-150 ${
                                                active ? 'text-white' : 'text-neutral-500'
                                            }`}
                                        />
                                        {item.liveDot && (
                                            <span
                                                className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-[#07080a]"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </span>
                                </div>
                                <span
                                    className={`text-[10px] leading-none tracking-[0.02em] transition-colors duration-150 ${
                                        active ? 'font-bold text-white' : 'font-medium text-neutral-500'
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Botón "Más" — Control Center */}
                    <button
                        type="button"
                        onClick={openSheet}
                        aria-label="Más opciones"
                        aria-expanded={moreOpen}
                        aria-haspopup="dialog"
                        className="flex flex-col items-center justify-center flex-1 h-full gap-1 active:scale-[0.94] transition-transform duration-100 select-none cursor-pointer"
                    >
                        <div className="relative flex items-center justify-center px-3.5 py-1.5 rounded-xl">
                            {isMoreActive && (
                                <motion.span
                                    layoutId="admin-bottom-nav-pill"
                                    transition={pillTransition}
                                    className="absolute inset-0 rounded-xl bg-white/[0.12] border border-white/[0.18]"
                                />
                            )}
                            <MoreHorizontal
                                className={`relative w-5 h-5 transition-colors duration-150 ${
                                    isMoreActive ? 'text-white' : 'text-neutral-500'
                                }`}
                            />
                        </div>
                        <span
                            className={`text-[10px] leading-none tracking-[0.02em] transition-colors duration-150 ${
                                isMoreActive ? 'font-bold text-white' : 'font-medium text-neutral-500'
                            }`}
                        >
                            Más
                        </span>
                    </button>
                </div>
            </nav>

            {/* SHEET "MÁS" — Control Center Móvil */}
            <AnimatePresence>
                {moreOpen && (
                    <>
                        {/* Scrim / Backdrop */}
                        <motion.div
                            key="admin-sheet-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[60] md:hidden"
                            onClick={() => closeSheet()}
                            aria-hidden="true"
                        />

                        {/* Bottom Sheet */}
                        <motion.div
                            key="admin-sheet-panel"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Control Center de administración"
                            initial={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { y: 0 }}
                            exit={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
                            transition={sheetTransition}
                            drag={prefersReducedMotion ? false : 'y'}
                            dragControls={dragControls}
                            dragListener={false}
                            dragConstraints={{ top: 0 }}
                            dragElastic={{ top: 0.06, bottom: 0.9 }}
                            dragSnapToOrigin
                            onDragEnd={handleDragEnd}
                            className="fixed bottom-0 left-0 right-0 z-[70] md:hidden bg-[#0a0c10]/95 backdrop-blur-2xl border-t border-white/[0.10] rounded-t-3xl shadow-[0_-24px_64px_rgba(0,0,0,0.92)] max-h-[88dvh] flex flex-col overflow-hidden before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
                        >
                            {/* Cabecera arrastrable del Sheet */}
                            <div
                                onPointerDown={(e) => {
                                    if (!prefersReducedMotion) dragControls.start(e);
                                }}
                                className="relative flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/[0.06] shrink-0 touch-none select-none"
                            >
                                <div
                                    className="w-10 h-1 bg-white/20 rounded-full absolute left-1/2 -translate-x-1/2 top-2.5"
                                    aria-hidden="true"
                                />
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm font-black text-white tracking-tight shrink-0">
                                        Control Center
                                    </span>
                                    {userEmail && (
                                        <span className="text-[10px] text-neutral-400 font-mono bg-white/[0.05] border border-white/[0.06] px-2 py-0.5 rounded-full truncate max-w-[155px]">
                                            {userEmail}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => closeSheet()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-xl text-neutral-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] active:scale-[0.94] transition-all cursor-pointer shrink-0"
                                    aria-label="Cerrar menú"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Contenido scrollable */}
                            <div
                                className="overflow-y-auto overscroll-contain px-4 py-4 space-y-4"
                                style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
                            >
                                {/* 1. Búsqueda Rápida Universal */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        closeSheet();
                                        window.dispatchEvent(new CustomEvent('open-admin-command-palette'));
                                    }}
                                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] active:scale-[0.97] transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                                            <Search className="w-4 h-4" />
                                        </div>
                                        <div className="text-left min-w-0">
                                            <span className="block text-xs font-bold text-white truncate">
                                                Búsqueda Rápida Universal
                                            </span>
                                            <span className="block text-[11px] text-neutral-400 truncate">
                                                Buscar pedidos, camisetas, clientes
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-neutral-400 group-hover:text-white shrink-0 pl-2">
                                        <span className="text-[11px] font-semibold">Buscar</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                </button>

                                {/* 2. Finanzas & Crecimiento */}
                                <section aria-label="Finanzas y Crecimiento">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1 mb-2">
                                        Finanzas &amp; Crecimiento
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {FINANCE_ITEMS.map((item) => {
                                            const active = isActive(item.href);
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => closeSheet()}
                                                    className={`relative flex items-center gap-2.5 p-3 rounded-xl border transition-all active:scale-[0.97] ${
                                                        item.spanFull ? 'col-span-2 justify-between' : ''
                                                    } ${
                                                        active
                                                            ? 'bg-white/[0.10] border-white/25 text-white'
                                                            : 'bg-white/[0.03] border-white/[0.06] text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                                                active
                                                                    ? 'bg-white text-black border-white'
                                                                    : 'bg-white/[0.05] text-neutral-300 border-white/[0.06]'
                                                            }`}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="block font-bold text-xs truncate">
                                                                {item.label}
                                                            </span>
                                                            {item.subtitle && (
                                                                <span className="block text-[10px] text-neutral-400 truncate mt-0.5">
                                                                    {item.subtitle}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {item.spanFull && (
                                                        <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
                                                    )}
                                                    {active && !item.spanFull && (
                                                        <span
                                                            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* 3. Catálogo & Estructura (6 en 1) */}
                                <section aria-label="Catálogo y Estructura">
                                    <div className="flex items-center justify-between px-1 mb-2">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                                            Catálogo &amp; Estructura
                                        </p>
                                        <Link
                                            href="/admin/catalogo"
                                            onClick={() => closeSheet()}
                                            className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-all active:scale-[0.97] ${
                                                isCatalogoActive
                                                    ? 'bg-white text-black border-white'
                                                    : 'bg-white/[0.05] text-neutral-300 border-white/[0.08] hover:text-white hover:bg-white/[0.10]'
                                            }`}
                                        >
                                            <Layers className="w-3 h-3" />
                                            <span>6 en 1</span>
                                            <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CATALOGO_ITEMS.map((item) => {
                                            const active = isActive(item.href);
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => closeSheet()}
                                                    className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border transition-all active:scale-[0.97] ${
                                                        active
                                                            ? 'bg-white/[0.10] border-white/25 text-white'
                                                            : 'bg-white/[0.03] border-white/[0.06] text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                                            active
                                                                ? 'bg-white text-black border-white'
                                                                : 'bg-white/[0.05] text-neutral-400 border-white/[0.06]'
                                                        }`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-xs truncate">
                                                        {item.label}
                                                    </span>
                                                    {active && (
                                                        <span
                                                            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* 4. Atajos de Portada & Pedidos */}
                                <section aria-label="Atajos de Portada y Pedidos">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1 mb-2">
                                        Atajos de Portada &amp; Pedidos
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {SHORTCUT_ITEMS.map((item) => {
                                            const active = isActive(item.href);
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => closeSheet()}
                                                    className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border transition-all active:scale-[0.97] ${
                                                        active
                                                            ? 'bg-white/[0.10] border-white/25 text-white'
                                                            : 'bg-white/[0.03] border-white/[0.06] text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                                            active
                                                                ? 'bg-white text-black border-white'
                                                                : 'bg-white/[0.05] text-neutral-400 border-white/[0.06]'
                                                        }`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-xs truncate">
                                                        {item.label}
                                                    </span>
                                                    {(active || item.liveDot) && (
                                                        <span
                                                            className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${
                                                                active
                                                                    ? 'bg-emerald-400'
                                                                    : 'bg-emerald-400/80 animate-pulse'
                                                            }`}
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* 5. Sistema (4 en 1) */}
                                <section aria-label="Sistema y Configuración">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1 mb-2">
                                        Sistema
                                    </p>
                                    <div
                                        className={`rounded-2xl border p-3 space-y-2.5 relative overflow-hidden before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent ${
                                            isSettingsActive
                                                ? 'bg-white/[0.08] border-white/25'
                                                : 'bg-white/[0.03] border-white/[0.08]'
                                        }`}
                                    >
                                        <Link
                                            href="/admin/settings"
                                            onClick={() => closeSheet()}
                                            className="flex items-center justify-between gap-3 active:scale-[0.98] transition-transform group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={`p-2 rounded-xl border shrink-0 ${
                                                        isSettingsActive
                                                            ? 'bg-white text-black border-white'
                                                            : 'bg-primary/10 text-primary border-primary/20'
                                                    }`}
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-extrabold text-white tracking-tight">
                                                            Configuración
                                                        </span>
                                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white/[0.08] text-neutral-300 border border-white/[0.08]">
                                                            4 en 1
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                                                        Admins, actividad, tasa USD y papelera
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white shrink-0" />
                                        </Link>

                                        {/* Accesos directos a las 4 pestañas de Configuración */}
                                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/[0.06]">
                                            {SYSTEM_PILLS.map((pill) => {
                                                const active = isActive(pill.href);
                                                const Icon = pill.icon;
                                                return (
                                                    <Link
                                                        key={pill.href}
                                                        href={pill.href}
                                                        onClick={() => closeSheet()}
                                                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all active:scale-[0.97] ${
                                                            active
                                                                ? 'bg-white text-black border-white shadow-xs'
                                                                : 'bg-black/30 text-neutral-300 border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
                                                        }`}
                                                    >
                                                        <Icon
                                                            className={`w-3.5 h-3.5 shrink-0 ${
                                                                active ? 'text-black' : 'text-neutral-400'
                                                            }`}
                                                        />
                                                        <span className="truncate">{pill.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </section>

                                {/* 6. Cerrar Sesión */}
                                <form action="/auth/signout" method="post" className="pt-1">
                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/15 text-red-400 font-bold text-xs py-3 rounded-xl transition-all border border-red-500/20 active:scale-[0.97] cursor-pointer"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        Cerrar Sesión
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export default function AdminBottomNav(props: AdminBottomNavProps) {
    return (
        <Suspense fallback={null}>
            <AdminBottomNavInner {...props} />
        </Suspense>
    );
}
