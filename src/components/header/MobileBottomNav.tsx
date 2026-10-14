import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, Grid3x3, Sparkles, Package } from "lucide-react";
import { m as motion } from "@/lib/motion";
import { Category } from "@/lib/types";
import { triggerHaptic } from "./haptics";

interface MobileBottomNavProps {
    isProductPage: boolean;
    isActive: (path: string) => boolean;
    isCategoryActive: boolean;
    currentCategory: Category | undefined;
    categoryTrayOpen: boolean;
    onToggleCategoryTray: () => void;
}

export default function MobileBottomNav({
    isProductPage,
    isActive,
    isCategoryActive,
    currentCategory,
    categoryTrayOpen,
    onToggleCategoryTray,
}: MobileBottomNavProps) {
    if (isProductPage) return null;

    return (
        <nav
            className="fixed bottom-4 inset-x-4 sm:inset-x-8 z-40 md:hidden max-w-sm mx-auto pointer-events-none select-none"
            style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
            aria-label="Navegación principal"
        >
            <div className="relative flex items-center h-[58px] px-2 rounded-full bg-[#121319]/92 backdrop-blur-3xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.85)] pointer-events-auto">
                {/* Specular hairline superior del dock */}
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

                {/* Inicio */}
                <Link
                    href="/"
                    className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative active:scale-90 transition-transform duration-100"
                >
                    {isActive("/") && (
                        <motion.div
                            layoutId="mobileActiveTabPill"
                            className="absolute inset-1 bg-white/[0.14] border border-white/20 rounded-full shadow-sm"
                            transition={{ type: "spring", damping: 28, stiffness: 350 }}
                        />
                    )}
                    <Home
                        className={`w-5 h-5 relative z-10 transition-colors ${
                            isActive("/") ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "text-white/50"
                        }`}
                    />
                    <span
                        className={`text-[10px] leading-tight tracking-tight relative z-10 transition-colors ${
                            isActive("/") ? "font-bold text-white" : "font-medium text-white/50"
                        }`}
                    >
                        Inicio
                    </span>
                </Link>

                {/* Categorías */}
                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic(12);
                        onToggleCategoryTray();
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
                        <Grid3x3
                            className={`w-5 h-5 relative z-10 transition-colors ${
                                isCategoryActive || categoryTrayOpen
                                    ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                    : "text-white/50"
                            }`}
                        />
                    )}
                    <span
                        className={`text-[10px] leading-tight tracking-tight relative z-10 max-w-[76px] truncate transition-colors ${
                            isCategoryActive || categoryTrayOpen ? "font-bold text-white" : "font-medium text-white/50"
                        }`}
                    >
                        {isCategoryActive && currentCategory ? currentCategory.nombre : "Categorías"}
                    </span>
                </button>

                {/* Todos */}
                <Link
                    href="/catalogo"
                    className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative active:scale-90 transition-transform duration-100"
                >
                    {isActive("/catalogo") && (
                        <motion.div
                            layoutId="mobileActiveTabPill"
                            className="absolute inset-1 bg-white/[0.14] border border-white/20 rounded-full shadow-sm"
                            transition={{ type: "spring", damping: 28, stiffness: 350 }}
                        />
                    )}
                    <Sparkles
                        className={`w-5 h-5 relative z-10 transition-colors ${
                            isActive("/catalogo") ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "text-white/50"
                        }`}
                    />
                    <span
                        className={`text-[10px] leading-tight tracking-tight relative z-10 transition-colors ${
                            isActive("/catalogo") ? "font-bold text-white" : "font-medium text-white/50"
                        }`}
                    >
                        Todos
                    </span>
                </Link>

                {/* Rastreo */}
                <Link
                    href="/rastreo"
                    className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative active:scale-90 transition-transform duration-100"
                >
                    {isActive("/rastreo") && (
                        <motion.div
                            layoutId="mobileActiveTabPill"
                            className="absolute inset-1 bg-white/[0.14] border border-white/20 rounded-full shadow-sm"
                            transition={{ type: "spring", damping: 28, stiffness: 350 }}
                        />
                    )}
                    <Package
                        className={`w-5 h-5 relative z-10 transition-colors ${
                            isActive("/rastreo") ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "text-white/50"
                        }`}
                    />
                    <span
                        className={`text-[10px] leading-tight tracking-tight relative z-10 transition-colors ${
                            isActive("/rastreo") ? "font-bold text-white" : "font-medium text-white/50"
                        }`}
                    >
                        Rastreo
                    </span>
                </Link>
            </div>
        </nav>
    );
}
