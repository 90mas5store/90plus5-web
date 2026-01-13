"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { ShoppingCart, Menu, X, Home, Grid3x3, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useCategories } from "../hooks/useCategories";
import { useState, useEffect } from "react";
import { usePrefersReducedMotion } from "../hooks/useOptimization";

export default function Header() {
    const { items, openCart } = useCart();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const categoriaActual = searchParams.get("categoria");

    const { categorias, loading: loaded } = useCategories();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [megaMenuPinned, setMegaMenuPinned] = useState(false);
    const [megaMenuHovered, setMegaMenuHovered] = useState(false);

    const prefersReducedMotion = usePrefersReducedMotion();

    // Detectar scroll para cambiar estilo del header
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isActive = (path: string) => {
        if (path === "/") return pathname === "/";
        if (path === "/catalogo") {
            // Solo activo si estamos en /catalogo SIN parámetro de categoría
            return pathname === "/catalogo" && !categoriaActual;
        }
        return pathname.startsWith(path);
    };

    // 🎨 ULTRA MODERN LINK ITEM - Sin bordes, efecto flotante
    const LinkItem = ({ href, children, onClick, icon: Icon }: {
        href: string;
        children: React.ReactNode;
        onClick?: () => void;
        icon?: any;
    }) => {
        const active = isActive(href);
        return (
            <Link href={href} onClick={onClick} className="group relative">
                <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative px-5 py-2.5 rounded-2xl transition-all duration-500 flex items-center gap-2.5 ${active ? "text-white" : "text-gray-400 hover:text-white"
                        }`}
                >
                    {/* Glow pulsante en activo */}
                    {active && (
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl"
                            animate={!prefersReducedMotion ? {
                                opacity: [0.5, 0.8, 0.5],
                                scale: [0.95, 1.05, 0.95],
                            } : { opacity: 0.5, scale: 1 }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    )}

                    {/* Hover glow sutil */}
                    <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Sombra en hover */}
                    <div className="absolute inset-0 shadow-[0_8px_32px_rgba(229,9,20,0.15)] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Content */}
                    <div className="relative flex items-center gap-2.5">
                        {Icon && (
                            <motion.div
                                whileHover={{ rotate: [0, -10, 10, 0] }}
                                transition={{ duration: 0.5 }}
                            >
                                <Icon className={`w-4 h-4 transition-all duration-300 ${active
                                    ? 'text-primary drop-shadow-[0_0_8px_rgba(229,9,20,0.6)]'
                                    : 'group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]'
                                    }`} />
                            </motion.div>
                        )}
                        <span className={`font-medium text-[15px] tracking-wide transition-all duration-300 ${active ? 'text-white' : 'text-gray-300'
                            }`}>
                            {children}
                        </span>
                    </div>

                    {/* Línea indicadora activa */}
                    {active && (
                        <motion.div
                            layoutId="navIndicator"
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                    )}
                </motion.div>
            </Link>
        );
    };

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
                    ? "bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
                    : "bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16 md:h-[70px]">

                        {/* 🎨 LOGO */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <Image
                                src="/logo.svg"
                                alt="90+5 Store"
                                width={54}
                                height={54}
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

                        {/* 🖥️ DESKTOP NAV */}
                        <nav className="hidden lg:flex items-center gap-1">
                            <LinkItem href="/" icon={Home}>
                                Inicio
                            </LinkItem>

                            {/* MEGA MENÚ DE CATEGORÍAS - ULTRA MODERN */}
                            <div
                                className="relative"
                                onMouseEnter={() => setMegaMenuHovered(true)}
                                onMouseLeave={() => setMegaMenuHovered(false)}
                            >
                                {(() => {
                                    const currentCategory = categorias.find(c => c.slug === categoriaActual);
                                    const isInCategory = pathname.startsWith("/catalogo") && categoriaActual;
                                    const isMenuOpen = megaMenuPinned || megaMenuHovered;

                                    return (
                                        <>
                                            <motion.button
                                                onClick={() => setMegaMenuPinned(!megaMenuPinned)}
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`relative px-5 py-2.5 rounded-2xl transition-all duration-500 flex items-center gap-2.5 ${isInCategory ? "text-white" : "text-gray-400 hover:text-white"
                                                    }`}
                                            >
                                                {/* Glow pulsante si está activo */}
                                                {isInCategory && (
                                                    <motion.div
                                                        className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl"
                                                        animate={!prefersReducedMotion ? {
                                                            opacity: [0.5, 0.8, 0.5],
                                                            scale: [0.95, 1.05, 0.95],
                                                        } : { opacity: 0.5, scale: 1 }}
                                                        transition={{
                                                            duration: 3,
                                                            repeat: Infinity,
                                                            ease: "easeInOut"
                                                        }}
                                                    />
                                                )}

                                                {/* Hover glow */}
                                                <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300" />

                                                {/* Sombra en hover/open */}
                                                <div className={`absolute inset-0 shadow-[0_8px_32px_rgba(229,9,20,0.15)] rounded-2xl transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                                                    }`} />

                                                {/* Content */}
                                                <div className="relative flex items-center gap-2.5">
                                                    {currentCategory?.icon_url ? (
                                                        <div className="w-7 h-7 flex items-center justify-center">
                                                            <Image
                                                                src={currentCategory.icon_url}
                                                                alt={currentCategory.nombre}
                                                                width={200}
                                                                height={200}
                                                                className={`object-contain max-w-full max-h-full transition-all duration-300 ${isInCategory
                                                                    ? 'brightness-0 invert drop-shadow-[0_0_8px_rgba(229,9,20,0.6)]'
                                                                    : 'brightness-0 invert opacity-60 hover:opacity-100'
                                                                    }`}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <Grid3x3 className={`w-4 h-4 transition-all duration-300 ${isInCategory ? 'text-primary drop-shadow-[0_0_8px_rgba(229,9,20,0.6)]' : ''
                                                            }`} />
                                                    )}

                                                    <span className={`font-medium text-[15px] tracking-wide transition-all duration-300 ${isInCategory ? 'text-white' : 'text-gray-300'
                                                        }`}>
                                                        {currentCategory?.nombre || "Categorías"}
                                                    </span>

                                                    {/* Flecha */}
                                                    <svg
                                                        className={`w-4 h-4 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>

                                                {/* Línea indicadora activa */}
                                                {isInCategory && (
                                                    <motion.div
                                                        layoutId="categoryIndicator"
                                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
                                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                                    />
                                                )}
                                            </motion.button>

                                            {/* MEGA MENU DROPDOWN */}
                                            <AnimatePresence>
                                                {(megaMenuPinned || megaMenuHovered) && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 8, x: "-50%" }}
                                                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                                                        exit={{ opacity: 0, y: 8, x: "-50%" }}
                                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                                        className="absolute top-full left-1/2 mt-2 z-50"
                                                    >
                                                        {/* Flecha decorativa */}
                                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0a0a0a]/95 backdrop-blur-xl rotate-45 border-l border-t border-white/10" />

                                                        {/* Contenedor del menú */}
                                                        <div className="relative bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 min-w-[800px] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                                                            {/* Glow effect sutil */}
                                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-2xl pointer-events-none" />

                                                            {/* Grid de categorías - 5 columnas */}
                                                            <div className="relative grid grid-cols-5 gap-3">
                                                                {!loaded && categorias.map((categoria) => {
                                                                    const isActive = categoria.slug === categoriaActual;

                                                                    return (
                                                                        <Link
                                                                            key={categoria.id}
                                                                            href={`/catalogo?categoria=${encodeURIComponent(categoria.slug)}`}
                                                                            className={`group/item relative p-3 rounded-xl transition-all duration-300 overflow-hidden ${isActive
                                                                                ? "bg-primary/20 border-2 border-primary/50 shadow-[0_0_30px_rgba(229,9,20,0.3)]"
                                                                                : "bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.05] hover:border-primary/30"
                                                                                }`}
                                                                        >
                                                                            {/* Liquid glass effect on hover */}
                                                                            <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 rounded-xl ${isActive
                                                                                ? "from-primary/20 via-primary/10 to-transparent"
                                                                                : "from-primary/0 via-primary/0 to-primary/0 group-hover/item:from-primary/10 group-hover/item:via-primary/5 group-hover/item:to-transparent"
                                                                                }`} />

                                                                            {/* Glow on hover or active */}
                                                                            <div className={`absolute inset-0 transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0 group-hover/item:opacity-100"
                                                                                }`}>
                                                                                <div className="absolute inset-0 bg-primary/5 blur-xl rounded-xl" />
                                                                            </div>

                                                                            {/* Layout horizontal: icono + texto en la misma fila */}
                                                                            <div className="relative flex items-center gap-3">
                                                                                {/* Icono de categoría */}
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

                                                                                {/* Nombre de categoría */}
                                                                                <span className={`font-medium text-sm transition-colors duration-300 flex-1 ${isActive
                                                                                    ? "text-white"
                                                                                    : "text-gray-300 group-hover/item:text-white"
                                                                                    }`}>
                                                                                    {categoria.nombre}
                                                                                </span>

                                                                                {/* Indicador de activo */}
                                                                                {isActive && (
                                                                                    <motion.div
                                                                                        initial={{ scale: 0 }}
                                                                                        animate={{ scale: 1 }}
                                                                                        className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-[#0a0a0a]"
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        </Link>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    );
                                })()}
                            </div>

                            <LinkItem href="/catalogo" icon={Sparkles}>
                                Todos
                            </LinkItem>
                        </nav>

                        {/* 🛒 CART BUTTON - ULTRA MODERN */}
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={openCart}
                                className="relative p-3 rounded-2xl text-gray-400 hover:text-white transition-all duration-300 group"
                            >
                                {/* Hover glow */}
                                <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Sombra en hover */}
                                <div className="absolute inset-0 shadow-[0_8px_32px_rgba(229,9,20,0.15)] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <ShoppingCart className="w-5 h-5 relative z-10 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] transition-all duration-300" />

                                {items.length > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_12px_rgba(229,9,20,0.6)]"
                                    >
                                        {items.length}
                                    </motion.span>
                                )}
                            </motion.button>

                            {/* 📱 MOBILE MENU BUTTON - ULTRA MODERN */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="lg:hidden relative p-3 rounded-2xl text-gray-400 hover:text-white transition-all duration-300 group"
                            >
                                {/* Hover glow */}
                                <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <AnimatePresence mode="wait">
                                    {mobileOpen ? (
                                        <motion.div
                                            key="close"
                                            initial={{ rotate: -90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: 90, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <X className="w-6 h-6 relative z-10" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="menu"
                                            initial={{ rotate: 90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: -90, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Menu className="w-6 h-6 relative z-10" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* 📱 MOBILE DRAWER - ULTRA MODERN */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-80 bg-[#0a0a0a]/95 backdrop-blur-2xl border-l border-white/10 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] z-50 lg:hidden overflow-y-auto"
                        >
                            <div className="p-6 space-y-6">
                                {/* Header del drawer */}
                                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                    <span className="text-xl font-black text-white">
                                        90<span className="text-primary">+</span>5
                                    </span>
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setMobileOpen(false)}
                                        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                                    >
                                        <X className="w-5 h-5" />
                                    </motion.button>
                                </div>

                                {/* Navigation Links */}
                                <nav className="space-y-2">
                                    <LinkItem href="/" onClick={() => setMobileOpen(false)} icon={Home}>
                                        Inicio
                                    </LinkItem>

                                    {/* Categorías en mobile */}
                                    <div className="space-y-2 pt-4 border-t border-white/10">
                                        <span className="text-xs uppercase tracking-wider text-gray-500 font-bold px-5">Categorías</span>
                                        {!loaded && categorias.map((categoria) => (
                                            <Link
                                                key={categoria.id}
                                                href={`/catalogo?categoria=${encodeURIComponent(categoria.slug)}`}
                                                onClick={() => setMobileOpen(false)}
                                                className="group relative"
                                            >
                                                <motion.div
                                                    whileHover={{ scale: 1.02, x: 4 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="relative px-5 py-3 rounded-2xl transition-all duration-300 flex items-center gap-3 text-gray-400 hover:text-white"
                                                >
                                                    {/* Hover glow */}
                                                    <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                                    {categoria.icon_url && (
                                                        <div className="w-8 h-8 flex items-center justify-center relative z-10">
                                                            <Image
                                                                src={categoria.icon_url}
                                                                alt={categoria.nombre}
                                                                width={32}
                                                                height={32}
                                                                className="object-contain brightness-0 invert opacity-60 group-hover:opacity-100 transition-opacity duration-300 max-w-full max-h-full"
                                                            />
                                                        </div>
                                                    )}
                                                    <span className="font-semibold text-sm relative z-10">{categoria.nombre}</span>
                                                </motion.div>
                                            </Link>
                                        ))}
                                    </div>

                                    <LinkItem href="/catalogo" onClick={() => setMobileOpen(false)} icon={Sparkles}>
                                        Todos
                                    </LinkItem>
                                </nav>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
