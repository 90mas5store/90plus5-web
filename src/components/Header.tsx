"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { ShoppingCart, Home, Sparkles, Package } from "lucide-react";
import { m as motion } from "@/lib/motion";
import { useCart } from "../context/CartContext";
import { useCategories } from "../hooks/useCategories";
import { useState, useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../hooks/useOptimization";
import SearchTrigger from "@/components/search/SearchTrigger";
import MatchdayHeaderBanner from "./ui/MatchdayHeaderBanner";
import LinkItem from "./header/LinkItem";
import CategoriesDropdown from "./header/CategoriesDropdown";
import MobileBottomNav from "./header/MobileBottomNav";
import MobileCategoryTray from "./header/MobileCategoryTray";

export default function Header() {
    const { items, openCart } = useCart();
    const pathname = usePathname();
    const isProductPage = pathname?.startsWith("/producto");
    const searchParams = useSearchParams();
    const categoriaActual = searchParams.get("categoria");

    const { categorias, loading: isLoading } = useCategories();
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
                document.documentElement.style.setProperty("--header-height", `${h}px`);
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

    if (pathname?.startsWith("/admin")) return null;

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

    return (
        <>
            {/* ═══════════════════════════════════════
                TOP HEADER BAR (Material translúcido Apple)
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

                        {/* BRAND LOGO */}
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
                                isSearchOpen ? "pointer-events-none" : "pointer-events-auto"
                            }`}
                        >
                            <LinkItem href="/" icon={Home} isActive={isActive("/")} prefersReducedMotion={prefersReducedMotion}>
                                Inicio
                            </LinkItem>
                            <CategoriesDropdown
                                categorias={categorias}
                                isLoading={isLoading}
                                categoriaActual={categoriaActual}
                                isCategoryActive={isCategoryActive}
                                currentCategory={currentCategory}
                                prefersReducedMotion={prefersReducedMotion}
                                megaMenuPinned={megaMenuPinned}
                                setMegaMenuPinned={setMegaMenuPinned}
                                megaMenuHovered={megaMenuHovered}
                                setMegaMenuHovered={setMegaMenuHovered}
                            />
                            <LinkItem href="/catalogo" icon={Sparkles} isActive={isActive("/catalogo")} prefersReducedMotion={prefersReducedMotion}>
                                Todos
                            </LinkItem>
                            <LinkItem href="/rastreo" icon={Package} isActive={isActive("/rastreo")} prefersReducedMotion={prefersReducedMotion}>
                                Rastreo
                            </LinkItem>
                        </motion.nav>

                        {/* ACCIONES: BUSCADOR SPOTLIGHT + BOTÓN CARRITO */}
                        <div className="flex items-center gap-2">
                            <SearchTrigger
                                variant="responsive"
                                isOpen={isSearchOpen}
                                onOpenChange={setIsSearchOpen}
                            />

                            {/* Botón Carrito */}
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
                BOTTOM NAV MÓVIL (Floating Island Dock)
            ═══════════════════════════════════════ */}
            <MobileBottomNav
                isProductPage={isProductPage}
                isActive={isActive}
                isCategoryActive={isCategoryActive}
                currentCategory={currentCategory}
                categoryTrayOpen={categoryTrayOpen}
                onToggleCategoryTray={() => setCategoryTrayOpen(prev => !prev)}
            />

            {/* ═══════════════════════════════════════
                BANDEJA DE CRISTAL MÓVIL
            ═══════════════════════════════════════ */}
            <MobileCategoryTray
                isOpen={categoryTrayOpen}
                onClose={() => setCategoryTrayOpen(false)}
                categorias={categorias}
                isLoading={isLoading}
                categoriaActual={categoriaActual}
                isActive={isActive}
            />
        </>
    );
}
