import React, { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Grid3x3, Sparkles, ArrowRight } from "lucide-react";
import { m as motion, AnimatePresence } from "@/lib/motion";
import { Category } from "@/lib/types";
import { useSeasonSettings } from "@/hooks/useSeasonSettings";

export interface CategoriesDropdownProps {
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

export default function CategoriesDropdown({
    categorias,
    isLoading,
    categoriaActual,
    isCategoryActive,
    currentCategory,
    prefersReducedMotion,
    megaMenuPinned,
    setMegaMenuPinned,
    megaMenuHovered,
    setMegaMenuHovered,
}: CategoriesDropdownProps) {
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
                type="button"
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
                {/* Solo renderiza la píldora activa cuando la categoría es la ruta actual */}
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
                                    isCategoryActive ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "opacity-80"
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
                            isMenuOpen ? "rotate-180 text-white" : "text-white/50"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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
                                    {!isLoading &&
                                        categorias.map((categoria) => {
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
                                                        <div
                                                            className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center p-1.5 transition-transform duration-200 ${
                                                                isActive
                                                                    ? "bg-red-600/40 border border-red-500/50"
                                                                    : "bg-white/10 border border-white/15 group-hover/item:scale-105"
                                                            }`}
                                                        >
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
                                                        <span
                                                            className={`font-semibold text-xs sm:text-sm tracking-tight transition-colors duration-200 flex-1 truncate ${
                                                                isActive ? "text-white" : "text-white/90 group-hover/item:text-white"
                                                            }`}
                                                        >
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
