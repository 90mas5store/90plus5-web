"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { ShoppingCart, Home, Grid3x3, Sparkles, Package, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useCategories } from "../hooks/useCategories";
import { useState, useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../hooks/useOptimization";
import { Category } from "@/lib/types";
import { useSeasonSettings } from "../hooks/useSeasonSettings";
import SearchTrigger from "@/components/search/SearchTrigger";
import MatchdayHeaderBanner from "./ui/MatchdayHeaderBanner";

function triggerHaptic(duration = 10) {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
            navigator.vibrate(duration);
        } catch {
            // Silencioso si no está soportado
        }
    }
}

// ─────────────────────────────────────────────
// LinkItem — Elemento individual con Cápsula Apple Segmentada
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
        <Link href={href} onClick={onClick} className="relative z-10">
            <motion.div
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                className={`relative px-4 lg:px-5 py-2 rounded-full transition-all duration-200 flex items-center gap-2 select-none cursor-pointer ${
                    isActive ? "text-white font-semibold" : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                }`}
            >
                {isActive && (
                    <motion.div
                        layoutId="appleHeaderNavPill"
                        className="absolute inset-0 bg-white/[0.14] border border-white/20 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-md"
                        transition={{ type: "spring", damping: 28, stiffness: 350 }}
                    />
                )}
                <div className="relative z-10 flex items-center gap-2">
                    {Icon && (
                        <Icon className={`w-4 h-4 transition-all duration-200 ${
                            isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-white/60'
                        }`} />
                    )}
                    <span className="text-[13px] lg:text-[14px] tracking-[-0.01em]">
                        {children}
                    </span>
                </div>
            </motion.div>
        </Link>
    );
}

// ─────────────────────────────────────────────
// CategoriesDropdown — Mega Menú Sólido Apple con Hover Intent
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
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const seasonSettings = useSeasonSettings();

    const closeMenu = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setMegaMenuPinned(false);
        setMegaMenuHovered(false);
    };

    // Hover Intent: pequeño retardo para no disparar el menú por roce accidental del cursor
    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setMegaMenuHovered(true);
        }, 120);
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setMegaMenuHovered(false);
        }, 180);
    };

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
            className="relative z-10"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.button
                onClick={() => setMegaMenuPinned(!megaMenuPinned)}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                className={`relative px-4 lg:px-5 py-2 rounded-full transition-all duration-200 flex items-center gap-2 select-none cursor-pointer ${
                    isCategoryActive
                        ? "text-white font-semibold"
                        : isMenuOpen
                        ? "text-white bg-white/[0.08]"
                        : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                }`}
            >
                {/* Solo renderiza la píldora activa cuando la categoría es la ruta actual (evita conflicto con Inicio) */}
                {isCategoryActive && (
                    <motion.div
                        layoutId="appleHeaderNavPill"
                        className="absolute inset-0 bg-white/[0.14] border border-white/20 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-md"
                        transition={{ type: "spring", damping: 28, stiffness: 350 }}
                    />
                )}

                <div className="relative z-10 flex items-center gap-2">
                    {currentCategory?.icon_url ? (
                        <div className="w-4 h-4 flex items-center justify-center">
                            <Image
                                src={currentCategory.icon_url}
                                alt={currentCategory.nombre}
                                width={18}
                                height={18}
                                className={`object-contain max-w-full max-h-full brightness-0 invert ${
                                    isCategoryActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'opacity-80'
                                }`}
                            />
                        </div>
                    ) : (
                        <Grid3x3 className="w-4 h-4" />
                    )}
                    <span className="text-[13px] lg:text-[14px] tracking-[-0.01em]">
                        {currentCategory?.nombre || "Categorías"}
                    </span>
                    <svg
                        className={`w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                            isMenuOpen ? 'rotate-180 text-white' : 'text-white/50'
                        }`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </motion.button>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                        exit={{ opacity: 0, y: 6, scale: 0.98, x: "-50%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 350 }}
                        className="absolute top-full left-1/2 mt-2 z-50 pointer-events-auto"
                    >
                        {/* Menú Sólido de Alta Legibilidad y Formato Proporcionado */}
                        <div className="relative bg-[#121319] border border-white/20 rounded-[2rem] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.92)] w-[720px] max-w-[92vw] flex flex-col md:flex-row gap-5 overflow-hidden">
                            {/* Specular hairline superior */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

                            {/* Lado izquierdo: Grid de 2 columnas amplias para que ningún nombre se corte */}
                            <div className="flex-1 pr-1">
                                <div className="grid grid-cols-2 gap-2.5">
                                    {!isLoading && categorias.map((categoria) => {
                                        const isActive =
                                            categoria.slug?.toLowerCase() === categoriaActual?.toLowerCase() ||
                                            categoria.nombre?.toLowerCase() === categoriaActual?.toLowerCase();
                                        return (
                                            <Link
                                                key={categoria.id}
                                                href={`/catalogo?categoria=${encodeURIComponent(categoria.slug)}`}
                                                onClick={closeMenu}
                                                className={`group/item relative px-3.5 py-3 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                                                    isActive
                                                        ? "bg-[#E50914]/25 border border-red-500/50 shadow-sm"
                                                        : "bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20"
                                                }`}
                                            >
                                                <div className="relative flex items-center gap-3">
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center p-1.5 transition-transform duration-200 ${
                                                        isActive
                                                            ? "bg-red-600/40 border border-red-500/50"
                                                            : "bg-white/10 border border-white/15 group-hover/item:scale-105"
                                                    }`}>
                                                        {categoria.icon_url ? (
                                                            <Image
                                                                src={categoria.icon_url}
                                                                alt={categoria.nombre}
                                                                width={22}
                                                                height={22}
                                                                className="object-contain brightness-0 invert max-w-full max-h-full"
                                                            />
                                                        ) : (
                                                            <Sparkles className="w-4 h-4 text-white" />
                                                        )}
                                                    </div>
                                                    <span className={`font-semibold text-xs sm:text-sm tracking-tight transition-colors duration-200 flex-1 truncate ${
                                                        isActive ? "text-white" : "text-white/90 group-hover/item:text-white"
                                                    }`}>
                                                        {categoria.nombre}
                                                    </span>
                                                    {isActive && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] shadow-[0_0_6px_rgba(229,9,20,0.8)] shrink-0" />
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Lado derecho: Tarjeta Editorial sólida y compacta */}
                            <div className="hidden md:flex flex-col justify-between w-[220px] shrink-0 p-4 rounded-2xl bg-gradient-to-br from-red-950/40 via-white/[0.02] to-transparent border border-white/12 relative overflow-hidden group/card">
                                <div className="relative z-20">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-white uppercase tracking-wider mb-2">
                                        <Sparkles className="w-3 h-3 text-amber-400" />
                                        {currentCategory ? "COLECCIÓN" : seasonSettings.badge}
                                    </span>
                                    <h3 className="font-bold text-white text-sm leading-snug tracking-tight">
                                        {currentCategory ? currentCategory.nombre : seasonSettings.title}
                                    </h3>
                                    <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                                        {currentCategory
                                            ? `Explorá las camisetas oficiales y versiones de ${currentCategory.nombre}.`
                                            : seasonSettings.subtitle}
                                    </p>
                                </div>

                                <div className="relative z-20 mt-3">
                                    <Link
                                        href={
                                            currentCategory
                                                ? `/catalogo?categoria=${encodeURIComponent(currentCategory.slug)}&temporada=${encodeURIComponent(seasonSettings.season)}`
                                                : `/catalogo?temporada=${encodeURIComponent(seasonSettings.season)}`
                                        }
                                        onClick={closeMenu}
                                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-[0_4px_16px_rgba(229,9,20,0.4)] border-t border-white/25 active:scale-95 transition-all"
                                    >
                                        <span>{currentCategory ? `Ver ${currentCategory.nombre}` : seasonSettings.buttonText}</span>
                                        <ArrowRight className="w-3 h-3" />
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
// Header principal con Estética Apple Completa
// ─────────────────────────────────────────────
export default function Header() {
    const { items, openCart } = useCart();
    const pathname = usePathname();
    const isProductPage = pathname?.startsWith('/producto');
    const searchParams = useSearchParams();
    const categoriaActual = searchParams.get("categoria");

    const { categorias, loading: isLoading } = useCategories();
    const seasonSettings = useSeasonSettings();
    const [scrolled, setScrolled] = useState(false);
    const [megaMenuPinned, setMegaMenuPinned] = useState(false);
    const [megaMenuHovered, setMegaMenuHovered] = useState(false);
    const [categoryTrayOpen, setCategoryTrayOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const headerRef = useRef<HTMLElement>(null);

    const prefersReducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        setIsSearchOpen(false);
        setCategoryTrayOpen(false);
    }, [pathname]);

    const totalQuantity = items.reduce((acc, item) => acc + (item.cantidad || 1), 0);

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

    if (pathname?.startsWith('/admin')) return null;

    const isActive = (path: string) => {
        if (path === "/") return pathname === "/";
        if (path === "/catalogo") return pathname === "/catalogo" && !categoriaActual;
        return pathname.startsWith(path);
    };

    const isCategoryActive = !!(pathname?.startsWith("/catalogo") && categoriaActual);
    const currentCategory = categorias.find(
        (c) =>
            c.slug?.toLowerCase() === categoriaActual?.toLowerCase() ||
            c.nombre?.toLowerCase() === categoriaActual?.toLowerCase()
    );

    const dropdownProps: CatDropdownProps = {
        categorias, isLoading, categoriaActual, isCategoryActive, currentCategory,
        prefersReducedMotion, megaMenuPinned, setMegaMenuPinned, megaMenuHovered, setMegaMenuHovered,
    };

    return (
        <>
            {/* ═══════════════════════════════════════
                TOP HEADER BAR (Material translúcido Apple §12)
            ═══════════════════════════════════════ */}
            <header
                ref={headerRef}
                className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
                    scrolled
                        ? "bg-[#0b0c10]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
                        : "bg-[#0b0c10]/80 backdrop-blur-xl border-b border-white/[0.05]"
                }`}
            >
                {/* Specular hairline superior */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                <MatchdayHeaderBanner />

                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16 md:h-[72px]">

                        {/* BRAND LOGO — Aspecto original idéntico con micro-resortes táctiles */}
                        <Link
                            href="/"
                            className="flex items-center gap-3 group shrink-0 active:scale-95 transition-transform duration-200"
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

                        {/* BARRA SEGMENTADA DESKTOP & TABLET (≥768px) ESTILO APPLE */}
                        <motion.nav
                            animate={{
                                opacity: isSearchOpen ? 0 : 1,
                                scale: isSearchOpen ? 0.95 : 1,
                            }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className={`hidden md:flex items-center p-1 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-inner gap-0.5 ${
                                isSearchOpen ? 'pointer-events-none' : 'pointer-events-auto'
                            }`}
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

                        {/* ACCIONES: BUSCADOR SPOTLIGHT + BOTÓN CARRITO FROSTED GLASS */}
                        <div className="flex items-center gap-2">
                            {/* SearchTrigger Spotlight */}
                            <SearchTrigger
                                variant="responsive"
                                isOpen={isSearchOpen}
                                onOpenChange={setIsSearchOpen}
                            />

                            {/* Botón Carrito — Cápsula circular de cristal esmerilado */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={openCart}
                                aria-label="Carrito de compras"
                                className="relative w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition-all shadow-sm cursor-pointer"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                {totalQuantity > 0 && (
                                    <motion.span
                                        key={totalQuantity}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                        className="absolute -top-1 -right-1 bg-[#E50914] text-white text-[10px] font-mono font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border border-[#0b0c10] shadow-[0_2px_8px_rgba(229,9,20,0.6)]"
                                    >
                                        {totalQuantity}
                                    </motion.span>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ═══════════════════════════════════════
                BOTTOM NAV MÓVIL: FLOATING ISLAND DOCK (iOS 18 / visionOS style)
                4 pestañas limpias con hit targets generosos (Carrito y Buscador accesibles arriba)
            ═══════════════════════════════════════ */}
            {!isProductPage && (
                <nav
                    className="fixed bottom-4 inset-x-4 sm:inset-x-8 z-40 md:hidden max-w-sm mx-auto pointer-events-none select-none"
                    style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
                    aria-label="Navegación principal"
                >
                    <div className="relative flex items-center h-[58px] px-2 rounded-full bg-[#121319]/92 backdrop-blur-3xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.85)] pointer-events-auto">
                        {/* Specular hairline superior del dock */}
                        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

                        {/* Inicio */}
                        <Link href="/" className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative active:scale-90 transition-transform duration-100">
                            {isActive("/") && (
                                <motion.div
                                    layoutId="mobileActiveTabPill"
                                    className="absolute inset-1 bg-white/[0.14] border border-white/20 rounded-full shadow-sm"
                                    transition={{ type: "spring", damping: 28, stiffness: 350 }}
                                />
                            )}
                            <Home className={`w-5 h-5 relative z-10 transition-colors ${isActive("/") ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-white/50'}`} />
                            <span className={`text-[10px] leading-tight tracking-tight relative z-10 transition-colors ${isActive("/") ? 'font-bold text-white' : 'font-medium text-white/50'}`}>
                                Inicio
                            </span>
                        </Link>

                        {/* Categorías */}
                        <button
                            onClick={() => {
                                triggerHaptic(12);
                                setCategoryTrayOpen(prev => !prev);
                            }}
                            aria-label="Ver categorías"
                            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative active:scale-90 transition-transform duration-100 cursor-pointer"
                        >
                            {(isCategoryActive || categoryTrayOpen) && (
                                <motion.div
                                    layoutId="mobileActiveTabPill"
                                    className="absolute inset-1 bg-white/[0.14] border border-white/20 rounded-full shadow-sm"
                                    transition={{ type: "spring", damping: 28, stiffness: 350 }}
                                />
                            )}
                            {isCategoryActive && currentCategory?.icon_url ? (
                                <Image
                                    src={currentCategory.icon_url}
                                    alt={currentCategory.nombre}
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 object-contain brightness-0 invert relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                />
                            ) : (
                                <Grid3x3 className={`w-5 h-5 relative z-10 transition-colors ${(isCategoryActive || categoryTrayOpen) ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-white/50'}`} />
                            )}
                            <span className={`text-[10px] leading-tight tracking-tight relative z-10 max-w-[76px] truncate transition-colors ${(isCategoryActive || categoryTrayOpen) ? 'font-bold text-white' : 'font-medium text-white/50'}`}>
                                {isCategoryActive && currentCategory ? currentCategory.nombre : 'Categorías'}
                            </span>
                        </button>

                        {/* Todos */}
                        <Link href="/catalogo" className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative active:scale-90 transition-transform duration-100">
                            {isActive("/catalogo") && (
                                <motion.div
                                    layoutId="mobileActiveTabPill"
                                    className="absolute inset-1 bg-white/[0.14] border border-white/20 rounded-full shadow-sm"
                                    transition={{ type: "spring", damping: 28, stiffness: 350 }}
                                />
                            )}
                            <Sparkles className={`w-5 h-5 relative z-10 transition-colors ${isActive("/catalogo") ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-white/50'}`} />
                            <span className={`text-[10px] leading-tight tracking-tight relative z-10 transition-colors ${isActive("/catalogo") ? 'font-bold text-white' : 'font-medium text-white/50'}`}>
                                Todos
                            </span>
                        </Link>

                        {/* Rastreo */}
                        <Link href="/rastreo" className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative active:scale-90 transition-transform duration-100">
                            {isActive("/rastreo") && (
                                <motion.div
                                    layoutId="mobileActiveTabPill"
                                    className="absolute inset-1 bg-white/[0.14] border border-white/20 rounded-full shadow-sm"
                                    transition={{ type: "spring", damping: 28, stiffness: 350 }}
                                />
                            )}
                            <Package className={`w-5 h-5 relative z-10 transition-colors ${isActive("/rastreo") ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-white/50'}`} />
                            <span className={`text-[10px] leading-tight tracking-tight relative z-10 transition-colors ${isActive("/rastreo") ? 'font-bold text-white' : 'font-medium text-white/50'}`}>
                                Rastreo
                            </span>
                        </Link>
                    </div>
                </nav>
            )}

            {/* ═══════════════════════════════════════
                BANDEJA DE CRISTAL ANCLADA AL DOCK (Apple Bottom Tray §7, §12)
                Emerge inmediatamente sobre el pulgar, con jerarquía visual impecable
            ═══════════════════════════════════════ */}
            <AnimatePresence>
                {categoryTrayOpen && (
                    <>
                        {/* Scrim translúcido ultraligero que permite seguir viendo la tienda */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => {
                                triggerHaptic(8);
                                setCategoryTrayOpen(false);
                            }}
                            className="fixed inset-0 bg-black/35 backdrop-blur-[2px] z-40 md:hidden"
                        />

                        {/* Bandeja de Cristal anclada inmediatamente sobre el Dock */}
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.94 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.95 }}
                            transition={{ type: "spring", damping: 28, stiffness: 380, mass: 0.7 }}
                            style={{
                                bottom: 'calc(5.25rem + env(safe-area-inset-bottom, 0px))',
                                transformOrigin: 'bottom center',
                            }}
                            className="fixed inset-x-3 sm:inset-x-6 max-w-sm mx-auto z-50 md:hidden bg-[#121319]/95 backdrop-blur-3xl border border-white/20 rounded-[2rem] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden select-none"
                        >
                            {/* Specular hairline superior */}
                            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                            {/* Cabecera limpia y jerárquica de la bandeja */}
                            <div className="flex items-center justify-between px-2 pb-2.5 border-b border-white/[0.08]">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
                                    <h3 className="text-xs font-bold text-white tracking-tight uppercase">
                                        Explorar Categorías
                                    </h3>
                                </div>
                                <button
                                    onClick={() => {
                                        triggerHaptic(8);
                                        setCategoryTrayOpen(false);
                                    }}
                                    aria-label="Cerrar menú"
                                    className="w-6 h-6 rounded-full bg-white/10 active:scale-90 border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer backdrop-blur-md"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Contenido de la bandeja */}
                            <div className="pt-2.5 space-y-2">
                                {/* Píldora destacada: Todas las Camisetas */}
                                <Link
                                    href="/catalogo"
                                    onClick={() => {
                                        triggerHaptic(10);
                                        setCategoryTrayOpen(false);
                                    }}
                                    className={`group/all flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all active:scale-[0.98] ${
                                        isActive("/catalogo") && !categoriaActual
                                            ? "bg-[#E50914] text-white border-red-500/50 shadow-[0_2px_12px_rgba(229,9,20,0.5)] font-bold"
                                            : "bg-white/[0.06] hover:bg-white/[0.10] border-white/10 text-white/90"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                                        <span className="text-xs font-bold tracking-tight">Todas las Camisetas</span>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover/all:translate-x-0.5 transition-transform" />
                                </Link>

                                {/* Grid de Píldoras de Categorías en 2 Columnas Limpias */}
                                <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto scrollbar-hide no-scrollbar pr-0.5">
                                    {!isLoading && categorias.map((categoria) => {
                                        const isCatActive =
                                            categoria.slug?.toLowerCase() === categoriaActual?.toLowerCase() ||
                                            categoria.nombre?.toLowerCase() === categoriaActual?.toLowerCase();
                                        return (
                                            <Link
                                                key={categoria.id}
                                                href={`/catalogo?categoria=${encodeURIComponent(categoria.slug)}`}
                                                onClick={() => {
                                                    triggerHaptic(10);
                                                    setCategoryTrayOpen(false);
                                                }}
                                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all active:scale-[0.97] select-none ${
                                                    isCatActive
                                                        ? "bg-[#E50914] border-red-400 text-white shadow-[0_2px_12px_rgba(229,9,20,0.5)] font-bold"
                                                        : "bg-white/[0.05] hover:bg-white/[0.09] border-white/10 text-white/85"
                                                }`}
                                            >
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center p-1 border shrink-0 ${
                                                    isCatActive
                                                        ? "bg-white/20 border-white/30"
                                                        : "bg-white/10 border-white/15"
                                                }`}>
                                                    {categoria.icon_url ? (
                                                        <Image
                                                            src={categoria.icon_url}
                                                            alt={categoria.nombre}
                                                            width={18}
                                                            height={18}
                                                            className="object-contain brightness-0 invert max-w-full max-h-full"
                                                        />
                                                    ) : (
                                                        <Sparkles className="w-3.5 h-3.5 text-white" />
                                                    )}
                                                </div>
                                                <span className="text-xs font-semibold tracking-tight truncate flex-1">
                                                    {categoria.nombre}
                                                </span>
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
