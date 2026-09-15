"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { ShoppingCart, Home, Grid3x3, Sparkles, X, Package, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "@/lib/motion";
import { useCart } from "../context/CartContext";
import { useCategories } from "../hooks/useCategories";
import { useState, useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../hooks/useOptimization";
import { Category } from "@/lib/types";
import { SITE_CONFIG } from "@/lib/config/site";
import { useSeasonSettings } from "../hooks/useSeasonSettings";
import SearchTrigger from "@/components/search/SearchTrigger";
import MatchdayHeaderBanner from "./ui/MatchdayHeaderBanner";

// ─────────────────────────────────────────────
// LinkItem — elemento de navegación individual
// ─────────────────────────────────────────────
function LinkItem({ href, children, onClick, icon: Icon, isActive, prefersReducedMotion }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    isActive: boolean;
    prefersReducedMotion: boolean;
}) {
    return (
        <Link href={href} onClick={onClick} className="group relative">
            <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.04, y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                className={`relative px-4 lg:px-5 py-2.5 rounded-2xl transition-all duration-300 flex items-center gap-2.5 ${isActive ? "text-white" : "text-gray-400 hover:text-white"}`}
            >
                {isActive && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/25 via-primary/10 to-primary/25 rounded-2xl blur-lg"
                        animate={{ opacity: 0.7, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
                <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 shadow-[0_8px_32px_rgba(229,9,20,0.15)] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-2.5">
                    {Icon && (
                        <motion.div whileHover={prefersReducedMotion ? undefined : { rotate: -8, scale: 1.1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                            <Icon className={`w-4 h-4 transition-all duration-300 ${isActive
                                ? 'text-primary drop-shadow-[0_0_8px_rgba(229,9,20,0.6)]'
                                : 'group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]'
                            }`} />
                        </motion.div>
                    )}
                    <span className={`font-medium text-sm lg:text-[15px] tracking-wide transition-all duration-300 ${isActive ? 'text-white font-semibold' : 'text-gray-300'}`}>
                        {children}
                    </span>
                </div>
                {isActive && (
                    <motion.div
                        layoutId="navIndicator"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                )}
            </motion.div>
        </Link>
    );
}

// ─────────────────────────────────────────────
// CategoriesDropdown — Mega Menú Enriquecido Desktop & Tablet
// ─────────────────────────────────────────────
interface CatDropdownProps {
    categorias: Category[];
    isLoading: boolean;
    categoriaActual: string | null;
    isCategoryActive: boolean;
    currentCategory: Category | undefined;
    prefersReducedMotion: boolean;
    megaMenuPinned: boolean;
    setMegaMenuPinned: (v: boolean) => void;
    megaMenuHovered: boolean;
    setMegaMenuHovered: (v: boolean) => void;
}

function CategoriesDropdown({
    categorias, isLoading, categoriaActual, isCategoryActive, currentCategory,
    prefersReducedMotion, megaMenuPinned, setMegaMenuPinned, megaMenuHovered, setMegaMenuHovered,
}: CatDropdownProps) {
    const isMenuOpen = megaMenuPinned || megaMenuHovered;
    const menuRef = useRef<HTMLDivElement>(null);
    const seasonSettings = useSeasonSettings();

    const closeMenu = () => {
        setMegaMenuPinned(false);
        setMegaMenuHovered(false);
    };

    // Cerrar al hacer clic fuera o presionar la tecla Escape
    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeMenu();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeMenu();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMenuOpen]);

    return (
        <div
            ref={menuRef}
            className="relative"
            onMouseEnter={() => setMegaMenuHovered(true)}
            onMouseLeave={() => setMegaMenuHovered(false)}
        >
            <motion.button
                onClick={() => setMegaMenuPinned(!megaMenuPinned)}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.04, y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                className={`relative px-4 lg:px-5 py-2.5 rounded-2xl transition-all duration-300 flex items-center gap-2.5 cursor-pointer ${isCategoryActive ? "text-white" : "text-gray-400 hover:text-white"}`}
            >
                {isCategoryActive && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/25 via-primary/10 to-primary/25 rounded-2xl blur-lg"
                        animate={{ opacity: 0.7, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
                <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
                <div className={`absolute inset-0 shadow-[0_8px_32px_rgba(229,9,20,0.15)] rounded-2xl transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`} />

                <div className="relative flex items-center gap-2.5">
                    {currentCategory?.icon_url ? (
                        <div className="w-6 h-6 flex items-center justify-center">
                            <Image
                                src={currentCategory.icon_url}
                                alt={currentCategory.nombre}
                                width={32}
                                height={32}
                                className={`object-contain max-w-full max-h-full transition-all duration-300 ${isCategoryActive
                                    ? 'brightness-0 invert drop-shadow-[0_0_8px_rgba(229,9,20,0.6)]'
                                    : 'brightness-0 invert opacity-60 hover:opacity-100'
                                }`}
                            />
                        </div>
                    ) : (
                        <Grid3x3 className={`w-4 h-4 transition-all duration-300 ${isCategoryActive ? 'text-primary drop-shadow-[0_0_8px_rgba(229,9,20,0.6)]' : ''}`} />
                    )}
                    <span className={`font-medium text-sm lg:text-[15px] tracking-wide transition-all duration-300 ${isCategoryActive ? 'text-white font-semibold' : 'text-gray-300'}`}>
                        {currentCategory?.nombre || "Categorías"}
                    </span>
                    <svg
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${isMenuOpen ? 'rotate-180 text-primary' : 'text-gray-400'}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {isCategoryActive && (
                    <motion.div
                        layoutId="categoryIndicator"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                )}
            </motion.button>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 10, x: "-50%" }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="absolute top-full left-1/2 mt-2 z-50 pointer-events-auto"
                    >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0a0a0a]/95 backdrop-blur-md rotate-45 border-l border-t border-white/10" />

                        <div className="relative bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_24px_64px_rgba(0,0,0,0.7)] w-[820px] max-w-[92vw] max-h-[min(540px,calc(100vh-120px))] flex flex-col md:flex-row gap-5 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-2xl pointer-events-none" />

                            {/* Lado izquierdo: Grid de categorías scrollable */}
                            <div className="flex-1 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {!isLoading && categorias.map((categoria) => {
                                        const isActive = categoria.slug === categoriaActual;
                                        return (
                                            <Link
                                                key={categoria.id}
                                                href={`/catalogo?categoria=${encodeURIComponent(categoria.slug)}`}
                                                onClick={closeMenu}
                                                className={`group/item relative p-3 rounded-xl transition-all duration-300 overflow-hidden ${isActive
                                                    ? "bg-primary/20 border-2 border-primary/50 shadow-[0_0_24px_rgba(229,9,20,0.3)]"
                                                    : "bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.05] hover:border-primary/30"
                                                }`}
                                            >
                                                <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 rounded-xl ${isActive
                                                    ? "from-primary/20 via-primary/10 to-transparent"
                                                    : "from-primary/0 via-primary/0 to-primary/0 group-hover/item:from-primary/15 group-hover/item:via-primary/5 group-hover/item:to-transparent"
                                                }`} />

                                                <div className="relative flex items-center gap-3">
                                                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center p-1.5 transition-all duration-300 ${isActive
                                                        ? "from-primary/40 to-primary/20 scale-110"
                                                        : "from-primary/20 to-primary/5 group-hover/item:scale-110"
                                                    }`}>
                                                        {categoria.icon_url ? (
                                                            <Image
                                                                src={categoria.icon_url}
                                                                alt={categoria.nombre}
                                                                width={32}
                                                                height={32}
                                                                className="object-contain brightness-0 invert max-w-full max-h-full"
                                                            />
                                                        ) : (
                                                            <Sparkles className="w-5 h-5 text-white" />
                                                        )}
                                                    </div>
                                                    <span className={`font-semibold text-sm transition-colors duration-300 flex-1 truncate ${isActive ? "text-white" : "text-gray-300 group-hover/item:text-white"}`}>
                                                        {categoria.nombre}
                                                    </span>
                                                    {isActive && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 shadow-[0_0_8px_rgba(229,9,20,0.9)]"
                                                        />
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Lado derecho: Tarjeta Editorial Contextual y Dinámica */}
                            <div className="hidden md:flex flex-col justify-between w-[240px] shrink-0 p-4 rounded-xl bg-gradient-to-br from-red-950/40 via-neutral-950 to-black border border-white/10 relative overflow-hidden group/card">
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none" />
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover/card:bg-primary/30 transition-all duration-500 pointer-events-none" />
                                
                                <div className="relative z-20">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/20 border border-primary/40 text-[10px] font-black text-primary uppercase tracking-wider mb-2">
                                        <Sparkles className="w-3 h-3 text-amber-400" />
                                        {currentCategory ? "COLECCIÓN" : seasonSettings.badge}
                                    </span>
                                    <h3 className="font-extrabold text-white text-base leading-tight">
                                        {currentCategory ? currentCategory.nombre : seasonSettings.title}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                        {currentCategory
                                            ? `Explorá las camisetas oficiales y versiones de ${currentCategory.nombre}.`
                                            : seasonSettings.subtitle}
                                    </p>
                                </div>

                                <div className="relative z-20 mt-4">
                                    <Link
                                        href={
                                            currentCategory
                                                ? `/catalogo?categoria=${encodeURIComponent(currentCategory.slug)}&temporada=${encodeURIComponent(seasonSettings.season)}`
                                                : `/catalogo?temporada=${encodeURIComponent(seasonSettings.season)}`
                                        }
                                        onClick={closeMenu}
                                        className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl bg-primary hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-primary/30 active:scale-95"
                                    >
                                        <span>{currentCategory ? `Ver ${currentCategory.nombre}` : seasonSettings.buttonText}</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────────────────────────────
// Header principal
// ─────────────────────────────────────────────
export default function Header() {
    const { items, openCart } = useCart();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const categoriaActual = searchParams.get("categoria");

    const { categorias, loading: isLoading } = useCategories();
    const [scrolled, setScrolled] = useState(false);
    const [megaMenuPinned, setMegaMenuPinned] = useState(false);
    const [megaMenuHovered, setMegaMenuHovered] = useState(false);
    const [categorySheetOpen, setCategorySheetOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const headerRef = useRef<HTMLElement>(null);

    const prefersReducedMotion = usePrefersReducedMotion();

    // Cerrar búsqueda al navegar
    useEffect(() => {
        setIsSearchOpen(false);
    }, [pathname]);

    // Total de prendas acumuladas (conteo real en carrito)
    const totalQuantity = items.reduce((acc, item) => acc + (item.cantidad || 1), 0);

    // Medición dinámica de la altura del Header (con o sin banner de partidos)
    useEffect(() => {
        if (!headerRef.current) return;
        const updateHeight = () => {
            if (headerRef.current) {
                const h = headerRef.current.offsetHeight;
                document.documentElement.style.setProperty('--header-height', `${h}px`);
            }
        };
        updateHeight();
        const ro = new ResizeObserver(updateHeight);
        ro.observe(headerRef.current);
        return () => ro.disconnect();
    }, [pathname]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Cerrar bottom sheet con tecla Escape
    useEffect(() => {
        if (!categorySheetOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setCategorySheetOpen(false);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [categorySheetOpen]);

    if (pathname?.startsWith('/admin')) return null;

    const isActive = (path: string) => {
        if (path === "/") return pathname === "/";
        if (path === "/catalogo") return pathname === "/catalogo" && !categoriaActual;
        return pathname.startsWith(path);
    };

    const isCategoryActive = !!(pathname?.startsWith("/catalogo") && categoriaActual);
    const currentCategory = categorias.find(c => c.slug === categoriaActual);

    const dropdownProps: CatDropdownProps = {
        categorias, isLoading, categoriaActual, isCategoryActive, currentCategory,
        prefersReducedMotion, megaMenuPinned, setMegaMenuPinned, megaMenuHovered, setMegaMenuHovered,
    };

    return (
        <>
            {/* ═══════════════════════════════════════
                TOP HEADER (todas las pantallas)
            ═══════════════════════════════════════ */}
            <header
                ref={headerRef}
                className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
                    ? "bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
                    : "bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5"
            }`}>
                <MatchdayHeaderBanner />
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16 md:h-[72px]">

                        {/* LOGO CON NAVEGACIÓN SPA Y PRIORIDAD LCP */}
                        <Link
                            href="/"
                            className="flex items-center gap-3 group shrink-0"
                            onClick={() => {
                                if (pathname === "/") {
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                            }}
                        >
                            <Image
                                src="/logo.svg"
                                alt="90+5 Store"
                                width={54}
                                height={54}
                                priority
                                className="object-contain transition-all duration-300 group-hover:scale-105"
                            />
                            <div className="flex flex-col leading-none">
                                <span className="text-white text-2xl font-extrabold tracking-tight">
                                    90<span className="text-primary">+</span>5
                                </span>
                                <span className="text-gray-400 text-sm -mt-2.5 font-thin tracking-wide group-hover:text-white transition-colors">
                                    Store
                                </span>
                            </div>
                        </Link>

                        {/* NAVEGACIÓN UNIFICADA DESKTOP & TABLET (≥768px) - Desvanecimiento suave cuando el buscador está activo */}
                        <motion.nav
                            animate={{
                                opacity: isSearchOpen ? 0 : 1,
                                scale: isSearchOpen ? 0.95 : 1,
                                pointerEvents: isSearchOpen ? "none" : "auto",
                            }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="hidden md:flex items-center gap-1"
                        >
                            <LinkItem href="/" icon={Home} isActive={isActive("/")} prefersReducedMotion={prefersReducedMotion}>
                                Inicio
                            </LinkItem>
                            <CategoriesDropdown {...dropdownProps} />
                            <LinkItem href="/catalogo" icon={Sparkles} isActive={isActive("/catalogo")} prefersReducedMotion={prefersReducedMotion}>
                                Todos
                            </LinkItem>
                            <LinkItem href="/rastreo" icon={Package} isActive={isActive("/rastreo")} prefersReducedMotion={prefersReducedMotion}>
                                Rastreo
                            </LinkItem>
                        </motion.nav>

                        {/* ACCIONES: BUSCADOR SPOTLIGHT + CARRITO */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            {/* Trigger universal de búsqueda: Cross-fade y docking orgánico sin layout shift */}
                            <SearchTrigger
                                variant="responsive"
                                isOpen={isSearchOpen}
                                onOpenChange={setIsSearchOpen}
                            />

                            {/* Botón Carrito de Compras */}
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={openCart}
                                aria-label="Carrito de compras"
                                className="relative flex p-2.5 sm:p-3 rounded-2xl text-gray-400 hover:text-white transition-all duration-300 group cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="absolute inset-0 shadow-[0_8px_32px_rgba(229,9,20,0.15)] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <ShoppingCart className="w-5 h-5 relative z-10 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] transition-all duration-300" />
                                {totalQuantity > 0 && (
                                    <motion.span
                                        key={totalQuantity}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                        className="absolute -top-1 -right-1 bg-primary text-white text-[11px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_12px_rgba(229,9,20,0.7)]"
                                    >
                                        {totalQuantity}
                                    </motion.span>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Ambient Soft Tint on Desktop (Sin blur, solo enfoque elegante al buscador) */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setIsSearchOpen(false)}
                        className="fixed inset-0 bg-black/25 z-40 hidden md:block"
                    />
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════
                BOTTOM NAV MÓVIL (<768px)
            ═══════════════════════════════════════ */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0a0a0a]/97 backdrop-blur-md border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                aria-label="Navegación principal"
            >
                <div className="flex items-center h-16">

                    {/* Inicio */}
                    <Link href="/" className="flex flex-col items-center justify-center flex-1 h-full gap-1">
                        <div className="relative flex items-center justify-center">
                            {isActive("/") && <span className="absolute inset-0 bg-primary/35 blur-md rounded-xl scale-[1.8]" />}
                            <div className={`relative px-5 py-1.5 rounded-xl flex items-center justify-center transition-all duration-200 ${isActive("/") ? 'bg-primary/20 border border-primary/50' : ''}`}>
                                <Home className={`w-5 h-5 transition-all duration-200 ${isActive("/") ? 'text-primary drop-shadow-[0_0_8px_rgba(229,9,20,0.9)]' : 'text-gray-400'}`} />
                            </div>
                        </div>
                        <span className={`text-[9px] tracking-widest uppercase transition-all duration-200 ${isActive("/") ? 'font-black text-white' : 'font-semibold text-gray-400'}`}>
                            Inicio
                        </span>
                    </Link>

                    {/* Categorías — muestra categoría activa si hay una seleccionada */}
                    <button
                        onClick={() => setCategorySheetOpen(true)}
                        aria-label="Ver categorías"
                        className="flex flex-col items-center justify-center flex-1 h-full gap-1 cursor-pointer"
                    >
                        <div className="relative flex items-center justify-center">
                            {(isCategoryActive || categorySheetOpen) && <span className="absolute inset-0 bg-primary/35 blur-md rounded-xl scale-[1.8]" />}
                            <div className={`relative px-5 py-1.5 rounded-xl flex items-center justify-center transition-all duration-200 ${(isCategoryActive || categorySheetOpen) ? 'bg-primary/20 border border-primary/50' : ''}`}>
                                {isCategoryActive && currentCategory?.icon_url ? (
                                    <Image
                                        src={currentCategory.icon_url}
                                        alt={currentCategory.nombre}
                                        width={20}
                                        height={20}
                                        className="w-5 h-5 object-contain brightness-0 invert drop-shadow-[0_0_8px_rgba(229,9,20,0.9)]"
                                    />
                                ) : (
                                    <Grid3x3 className={`w-5 h-5 transition-all duration-200 ${(isCategoryActive || categorySheetOpen) ? 'text-primary drop-shadow-[0_0_8px_rgba(229,9,20,0.9)]' : 'text-gray-400'}`} />
                                )}
                            </div>
                        </div>
                        <span className={`text-[9px] tracking-widest uppercase transition-all duration-200 max-w-[72px] truncate ${(isCategoryActive || categorySheetOpen) ? 'font-black text-white' : 'font-semibold text-gray-400'}`}>
                            {isCategoryActive && currentCategory ? currentCategory.nombre : 'Categorías'}
                        </span>
                    </button>

                    {/* Todos */}
                    <Link href="/catalogo" className="flex flex-col items-center justify-center flex-1 h-full gap-1">
                        <div className="relative flex items-center justify-center">
                            {isActive("/catalogo") && <span className="absolute inset-0 bg-primary/35 blur-md rounded-xl scale-[1.8]" />}
                            <div className={`relative px-5 py-1.5 rounded-xl flex items-center justify-center transition-all duration-200 ${isActive("/catalogo") ? 'bg-primary/20 border border-primary/50' : ''}`}>
                                <Sparkles className={`w-5 h-5 transition-all duration-200 ${isActive("/catalogo") ? 'text-primary drop-shadow-[0_0_8px_rgba(229,9,20,0.9)]' : 'text-gray-400'}`} />
                            </div>
                        </div>
                        <span className={`text-[9px] tracking-widest uppercase transition-all duration-200 ${isActive("/catalogo") ? 'font-black text-white' : 'font-semibold text-gray-400'}`}>
                            Todos
                        </span>
                    </Link>

                    {/* Rastreo */}
                    <Link href="/rastreo" className="flex flex-col items-center justify-center flex-1 h-full gap-1">
                        <div className="relative flex items-center justify-center">
                            {isActive("/rastreo") && <span className="absolute inset-0 bg-primary/35 blur-md rounded-xl scale-[1.8]" />}
                            <div className={`relative px-5 py-1.5 rounded-xl flex items-center justify-center transition-all duration-200 ${isActive("/rastreo") ? 'bg-primary/20 border border-primary/50' : ''}`}>
                                <Package className={`w-5 h-5 transition-all duration-200 ${isActive("/rastreo") ? 'text-primary drop-shadow-[0_0_8px_rgba(229,9,20,0.9)]' : 'text-gray-400'}`} />
                            </div>
                        </div>
                        <span className={`text-[9px] tracking-widest uppercase transition-all duration-200 ${isActive("/rastreo") ? 'font-black text-white' : 'font-semibold text-gray-400'}`}>
                            Rastreo
                        </span>
                    </Link>

                    {/* Carrito */}
                    <button onClick={openCart} aria-label="Carrito de compras" className="flex flex-col items-center justify-center flex-1 h-full gap-1 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                            <div className="relative px-5 py-1.5 rounded-xl flex items-center justify-center">
                                <ShoppingCart className="w-5 h-5 text-gray-400" />
                                {totalQuantity > 0 && (
                                    <motion.span
                                        key={totalQuantity}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1.5 -right-1 bg-primary text-white text-[9px] font-black rounded-full w-[18px] h-[18px] flex items-center justify-center shadow-[0_0_8px_rgba(229,9,20,0.8)]"
                                    >
                                        {totalQuantity}
                                    </motion.span>
                                )}
                            </div>
                        </div>
                        <span className="text-[9px] font-semibold text-gray-400 tracking-widest uppercase">
                            Carrito
                        </span>
                    </button>
                </div>
            </nav>

            {/* ═══════════════════════════════════════
                BOTTOM SHEET DE CATEGORÍAS (móvil)
            ═══════════════════════════════════════ */}
            <AnimatePresence>
                {categorySheetOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setCategorySheetOpen(false)}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden"
                        />

                        {/* Sheet */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 32, stiffness: 280 }}
                            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0f0f0f] border-t border-white/10 rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.7)] max-h-[78dvh] flex flex-col"
                        >
                            {/* Handle + Header */}
                            <div className="flex-shrink-0 px-6 pt-4 pb-4 border-b border-white/10">
                                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Categorías</h2>
                                    <button
                                        onClick={() => setCategorySheetOpen(false)}
                                        aria-label="Cerrar"
                                        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Contenido scrollable */}
                            <div className="flex-1 overflow-y-auto p-5">
                                <div className="grid grid-cols-2 gap-3">
                                    {!isLoading && categorias.map((categoria) => {
                                        const isSheetActive = categoria.slug === categoriaActual;
                                        return (
                                            <Link
                                                key={categoria.id}
                                                href={`/catalogo?categoria=${encodeURIComponent(categoria.slug)}`}
                                                onClick={() => setCategorySheetOpen(false)}
                                                className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all overflow-hidden ${isSheetActive
                                                    ? 'bg-primary/15 border-primary/40 shadow-[0_0_20px_rgba(229,9,20,0.15)]'
                                                    : 'bg-white/5 border-white/10 active:bg-white/10'
                                                }`}
                                            >
                                                {categoria.icon_url && (
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center p-2 ${isSheetActive ? 'bg-primary/30' : 'bg-white/10'}`}>
                                                        <Image
                                                            src={categoria.icon_url}
                                                            alt={categoria.nombre}
                                                            width={28}
                                                            height={28}
                                                            className={`object-contain brightness-0 invert max-w-full max-h-full ${isSheetActive ? 'drop-shadow-[0_0_6px_rgba(229,9,20,0.5)]' : 'opacity-70'}`}
                                                        />
                                                    </div>
                                                )}
                                                <span className={`font-bold text-sm leading-tight ${isSheetActive ? 'text-white' : 'text-gray-300'}`}>
                                                    {categoria.nombre}
                                                </span>
                                                {isSheetActive && (
                                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_6px_rgba(229,9,20,0.8)]" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
