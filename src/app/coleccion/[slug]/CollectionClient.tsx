"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles, Filter, Shield, Trophy, Flame, Star, Globe, ShoppingBag, Grid2X2, Grid3X3, LayoutGrid, Square } from "lucide-react";
import type { SpecialBanner, Product } from "@/lib/types";
import CollectionProductCard from "@/components/collection/CollectionProductCard";
import { motion, AnimatePresence } from "@/lib/motion";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    globe: Globe,
    trophy: Trophy,
    star: Star,
    flame: Flame,
};

interface CollectionClientProps {
    banner: SpecialBanner;
    products: Product[];
}

export default function CollectionClient({ banner, products }: CollectionClientProps) {
    const [selectedTeam, setSelectedTeam] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
    const [columns, setColumns] = useState<2 | 3 | 4>(3); // 3 columnas por defecto en PC
    const [mobileColumns, setMobileColumns] = useState<1 | 2>(2); // 2 columnas por defecto en móvil

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const updateMobile = () => setIsMobile(window.innerWidth < 768);
            updateMobile();
            window.addEventListener('resize', updateMobile);
            return () => window.removeEventListener('resize', updateMobile);
        }
    }, []);

    const objectPosition = isMobile
        ? (banner.image_position_mobile || "50% 50%")
        : (banner.image_position_desktop || "50% 50%");

    // Equipos únicos presentes en esta colección
    const teamsInCollection = useMemo(() => {
        const set = new Set<string>();
        products.forEach(p => {
            if (p.equipo) set.add(p.equipo);
        });
        return Array.from(set);
    }, [products]);

    // Filtrar y ordenar
    const filteredProducts = useMemo(() => {
        let list = [...products];

        if (selectedTeam !== "all") {
            list = list.filter(p => p.equipo === selectedTeam);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p =>
                p.modelo.toLowerCase().includes(q) ||
                (p.equipo && p.equipo.toLowerCase().includes(q))
            );
        }

        if (sortBy === "price-asc") {
            list.sort((a, b) => a.precio - b.precio);
        } else if (sortBy === "price-desc") {
            list.sort((a, b) => b.precio - a.precio);
        }

        return list;
    }, [products, selectedTeam, searchQuery, sortBy]);

    const BadgeIcon = ICON_MAP[banner.badge_secondary_icon] || Trophy;

    const posDesktop = banner.image_position_desktop || "50% 50%";
    const posMobile = banner.image_position_mobile || "50% 50%";
    const mediaClass = `collection-hero-media-${banner.id || "hero"}`;

    const mobGridClass = mobileColumns === 1 ? "grid-cols-1" : "grid-cols-2";

    return (
        <div 
            className="min-h-screen bg-[#070709] text-white"
            style={{ paddingTop: 'calc(var(--header-height, 4.5rem) + 0.75rem)' }}
        >
            {/* Reglas de encuadre CSS nativo (cero parpadeo, precisión milimétrica desktop y mobile) */}
            <style dangerouslySetInnerHTML={{ __html: `
                .${mediaClass} {
                    object-position: ${posMobile} !important;
                }
                @media (min-width: 768px) {
                    .${mediaClass} {
                        object-position: ${posDesktop} !important;
                    }
                }
            `}} />

            {/* ================= HERO DE LA COLECCIÓN (Contenido, idéntico al banner de Home) ================= */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-5">
                {/* Botón Volver al catálogo */}
                <Link
                    href="/catalogo"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md mb-4 w-fit"
                >
                    <ArrowLeft size={14} /> Volver al catálogo
                </Link>

                {/* Banner de la Colección */}
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl w-full h-auto min-h-[220px] md:min-h-[270px] border border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.5),0_20px_50px_rgba(0,0,0,0.4)] bg-black/90 flex items-center">
                    {/* Fondo: Imagen o Video con overlays cinemáticos */}
                    <div className="absolute inset-0 z-0 bg-neutral-900">
                        {banner.background_video_url ? (
                            <video
                                src={banner.background_video_url}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className={`w-full h-full object-cover opacity-60 brightness-75 ${mediaClass}`}
                            />
                        ) : banner.background_image_url ? (
                            <Image
                                src={banner.background_image_url}
                                alt={banner.title}
                                fill
                                priority
                                className={`object-cover opacity-60 brightness-75 ${mediaClass}`}
                                sizes="(max-width: 768px) 100vw, 1280px"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
                        )}

                        {/* Gradiente cinemático idéntico al banner de Home */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                    </div>

                    {/* Decoración Flotante a la derecha si existe */}
                    {banner.decoration_image_url && (
                        <div className="hidden md:block absolute right-8 bottom-0 w-36 h-36 lg:w-52 lg:h-52 pointer-events-none opacity-80 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-10">
                            <Image
                                src={banner.decoration_image_url}
                                alt=""
                                fill
                                className="object-contain"
                                sizes="208px"
                            />
                        </div>
                    )}

                    {/* Contenido del Banner */}
                    <div className="relative z-10 px-5 md:px-12 py-8 md:py-10 flex items-center justify-between w-full">
                        <div className="flex flex-col justify-center gap-3 z-10 w-full max-w-4xl">
                            {/* Badges del Evento */}
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                                {banner.badge_primary_text ? (
                                    <span className="px-2 py-[2px] md:px-3 md:py-1 bg-white text-black text-[8px] md:text-xs font-black uppercase tracking-widest rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] border border-white">
                                        {banner.badge_primary_text}
                                    </span>
                                ) : (
                                    <span className="px-2 py-[2px] md:px-3 md:py-1 bg-primary text-black text-[8px] md:text-xs font-black uppercase tracking-widest rounded-full shadow-[0_0_10px_rgba(229,9,20,0.3)] flex items-center gap-1.5">
                                        <Sparkles size={12} /> Colección Especial
                                    </span>
                                )}

                                {banner.badge_secondary_text && (
                                    <div className="flex items-center gap-1.5 bg-black/60 border border-[#FFD700]/30 text-[#FFD700] px-2.5 py-0.5 md:py-1 rounded-full text-[8px] md:text-xs font-bold tracking-wider uppercase backdrop-blur-md">
                                        <BadgeIcon className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
                                        <span>{banner.badge_secondary_text}</span>
                                    </div>
                                )}

                                <span className="text-[8px] md:text-xs font-medium text-gray-400 bg-white/5 px-2.5 py-0.5 md:py-1 rounded-full border border-white/10">
                                    {products.length} {products.length === 1 ? "prenda seleccionada" : "prendas seleccionadas"}
                                </span>
                            </div>

                            {/* Título Principal y Logo */}
                            <div className="flex items-center gap-3 md:gap-5">
                                {banner.logo_url && (
                                    <div className="relative h-10 w-8 md:h-16 md:w-14 flex-shrink-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                                        <Image
                                            src={banner.logo_url}
                                            alt=""
                                            fill
                                            className="object-contain"
                                            sizes="56px"
                                        />
                                    </div>
                                )}
                                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter text-white drop-shadow-md leading-none">
                                    {banner.title}
                                </h1>
                            </div>

                            {/* Subtítulo */}
                            {banner.subtitle && (
                                <p className="text-gray-300 font-medium text-xs md:text-base max-w-xl drop-shadow line-clamp-2 md:line-clamp-none">
                                    {banner.subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= BARRA DE FILTROS Y CONTROLES (Segmented Control Apple) ================= */}
            <div className="sticky top-0 z-30 bg-[#070709]/80 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                    {/* Filtros por Equipo estilo Apple Segmented Control */}
                    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar py-0.5">
                        {teamsInCollection.length > 1 && (
                            <>
                                <button
                                    onClick={() => setSelectedTeam("all")}
                                    className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 active:scale-95 whitespace-nowrap ${
                                        selectedTeam === "all"
                                            ? "bg-white text-black shadow-sm"
                                            : "bg-white/[0.06] text-neutral-400 hover:text-white hover:bg-white/[0.12] border border-white/[0.08]"
                                    }`}
                                >
                                    Todos ({products.length})
                                </button>
                                {teamsInCollection.map(teamName => {
                                    const count = products.filter(p => p.equipo === teamName).length;
                                    return (
                                        <button
                                            key={teamName}
                                            onClick={() => setSelectedTeam(teamName)}
                                            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 active:scale-95 whitespace-nowrap ${
                                                selectedTeam === teamName
                                                    ? "bg-white text-black shadow-sm"
                                                    : "bg-white/[0.06] text-neutral-400 hover:text-white hover:bg-white/[0.12] border border-white/[0.08]"
                                            }`}
                                        >
                                            {teamName} ({count})
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Selector de Densidad de Grid (Móvil y PC) y Ordenación */}
                    <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
                        {/* Selector en Móvil (1 o 2 columnas) */}
                        <div className="flex md:hidden items-center gap-0.5 bg-white/[0.04] p-1 rounded-full border border-white/[0.08] backdrop-blur-md">
                            <button
                                onClick={() => setMobileColumns(1)}
                                title="1 por fila (Grande)"
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all duration-200 active:scale-95 ${
                                    mobileColumns === 1
                                        ? "bg-white text-black shadow-sm"
                                        : "text-neutral-400 hover:text-white"
                                }`}
                            >
                                <Square size={12} />
                                <span>1</span>
                            </button>
                            <button
                                onClick={() => setMobileColumns(2)}
                                title="2 por fila (Compacta - Por defecto)"
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all duration-200 active:scale-95 ${
                                    mobileColumns === 2
                                        ? "bg-white text-black shadow-sm"
                                        : "text-neutral-400 hover:text-white"
                                }`}
                            >
                                <Grid2X2 size={12} />
                                <span>2</span>
                            </button>
                        </div>

                        {/* Selector de columnas para PC (2, 3 [por defecto], 4) */}
                        <div className="hidden md:flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/[0.08] backdrop-blur-md">
                            <button
                                onClick={() => setColumns(2)}
                                title="2 columnas (Vista amplia)"
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                                    columns === 2
                                        ? "bg-white text-black shadow-sm"
                                        : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                                }`}
                            >
                                <Grid2X2 size={13} />
                                <span>2</span>
                            </button>
                            <button
                                onClick={() => setColumns(3)}
                                title="3 columnas (Vista estándar - Recomendada)"
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                                    columns === 3
                                        ? "bg-white text-black shadow-sm"
                                        : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                                }`}
                            >
                                <Grid3X3 size={13} />
                                <span>3</span>
                            </button>
                            <button
                                onClick={() => setColumns(4)}
                                title="4 columnas (Vista compacta)"
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                                    columns === 4
                                        ? "bg-white text-black shadow-sm"
                                        : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                                }`}
                            >
                                <LayoutGrid size={13} />
                                <span>4</span>
                            </button>
                        </div>

                        {/* Ordenación */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-medium text-neutral-300 focus:outline-none focus:border-white/30 cursor-pointer backdrop-blur-md transition-colors"
                        >
                            <option value="default" className="bg-neutral-900 text-white">Orden recomendado</option>
                            <option value="price-asc" className="bg-neutral-900 text-white">Precio: Menor a Mayor</option>
                            <option value="price-desc" className="bg-neutral-900 text-white">Precio: Mayor a Menor</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ================= LISTADO DE PRODUCTOS / SHOWCASE ================= */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-14">
                {filteredProducts.length === 0 ? (
                    <div className="py-24 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4 text-neutral-500">
                            <ShoppingBag size={26} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">No se encontraron prendas</h3>
                        <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                            {products.length === 0
                                ? "Esta colección especial se encuentra en preparación. Vuelve pronto para descubrir las prendas seleccionadas."
                                : "No hay prendas que coincidan con los filtros seleccionados."}
                        </p>
                        {products.length > 0 && selectedTeam !== "all" ? (
                            <button
                                onClick={() => setSelectedTeam("all")}
                                className="px-5 py-2.5 bg-white text-black rounded-full text-xs font-semibold tracking-tight hover:bg-neutral-200 transition-colors active:scale-95 shadow-sm"
                            >
                                Ver todas las prendas ({products.length})
                            </button>
                        ) : (
                            <Link
                                href="/catalogo"
                                className="px-6 py-2.5 bg-white text-black rounded-full text-xs font-semibold tracking-tight hover:bg-neutral-200 transition-colors active:scale-95 shadow-sm"
                            >
                                Explorar catálogo completo
                            </Link>
                        )}
                    </div>
                ) : (
                    <motion.div
                        layout
                        className={
                            columns === 2
                                ? `grid ${mobGridClass} md:grid-cols-2 gap-3 sm:gap-6 md:gap-8 lg:gap-10 max-w-5xl mx-auto`
                                : columns === 4
                                    ? `grid ${mobGridClass} sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 max-w-7xl mx-auto`
                                    : `grid ${mobGridClass} sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 max-w-7xl mx-auto`
                        }
                    >
                        <AnimatePresence>
                            {filteredProducts.map((product, idx) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    className="h-full flex flex-col"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: Math.min(idx * 0.05, 0.3) }}
                                >
                                    <CollectionProductCard
                                        item={product}
                                        priority={idx < 4}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
