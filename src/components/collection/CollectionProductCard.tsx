"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import TeamLogo from "@/components/TeamLogo";
import type { Product } from "@/lib/types";

interface CollectionProductCardProps {
    item: Product;
    priority?: boolean;
}

export default function CollectionProductCard({ item, priority = false }: CollectionProductCardProps) {
    const {
        equipo,
        modelo,
        precio,
        imagen,
        logoEquipo,
        brand_name,
        brand_logo,
        season,
        allows_customization,
        product_variants = [],
    } = item;

    const displayName = equipo || brand_name || "Colección Oficial";
    const displayLogo = logoEquipo || brand_logo || undefined;
    const productHref = `/producto/${item.slug || item.id}`;

    // Extraer versiones únicas (Jugador / Aficionado)
    const hasMultipleVersions = product_variants.length > 1;
    const versionsList = Array.from(new Set(product_variants.map(v => v.version).filter(Boolean)));

    return (
        <Link
            href={productHref}
            className="group relative flex flex-col justify-between h-full bg-[#0b0c10] rounded-[22px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden border border-white/[0.08] hover:border-white/20 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 active:scale-[0.985] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.85)] hover:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.95)] select-none text-left"
        >
            {/* 🌟 Specular Top-Edge Hairline (Bisel de luz física - Apple Materials §12) */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent z-20 pointer-events-none" />

            {/* 🏷️ Escudo del Club o Selección — Flotante, orgánico, con sombra física Apple §12, SIN píldora ni contenedor artificial */}
            {displayLogo && (
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110 pointer-events-none">
                    <TeamLogo
                        src={displayLogo}
                        alt={displayName}
                        size={48}
                        className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]"
                    />
                </div>
            )}

            {/* Badge sutil de Temporada en esquina superior derecha */}
            {season && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 pointer-events-none">
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-neutral-400 bg-white/[0.06] backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-white/[0.08] shadow-sm">
                        {season}
                    </span>
                </div>
            )}

            {/* ================= STAGE DE PRODUCTO / HERO SHOWCASE ================= */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] pt-6 sm:pt-8 md:pt-9 pb-1 sm:pb-2 flex items-center justify-center overflow-hidden px-3 sm:px-4 md:px-6 shrink-0">
                {/* Iluminación de estudio fotográfico radial suave */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.06)_0%,_transparent_72%)] pointer-events-none" />

                {/* Imagen de la camiseta con escala física sutil y continua */}
                <div className="relative w-full h-full max-h-[200px] sm:max-h-[240px] md:max-h-[280px] flex items-center justify-center">
                    <ProductImage
                        src={imagen}
                        alt={`${displayName} - ${modelo}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                        className="w-full h-full object-contain filter drop-shadow-[0_16px_36px_rgba(0,0,0,0.7)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                        priority={priority}
                    />
                </div>
            </div>

            {/* ================= ESPECIFICACIONES Y FOOTER ================= */}
            <div className="p-3.5 sm:p-5 md:p-6 flex flex-col justify-between flex-1 gap-3 sm:gap-4 z-10">
                <div>
                    {/* Eyebrow con nombre de equipo */}
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 block mb-0.5 sm:mb-1 truncate">
                        {displayName}
                    </span>
                    {/* Título del modelo con tracking display Apple §15 */}
                    <h3 className="text-xs sm:text-base md:text-xl font-semibold text-white tracking-[-0.025em] leading-snug group-hover:text-neutral-100 transition-colors line-clamp-2 min-h-[2rem] sm:min-h-[2.8rem] md:min-h-[3.5rem] flex items-center">
                        {modelo}
                    </h3>
                </div>

                {/* Micro-especificaciones con sobriedad Apple */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-h-[22px] sm:min-h-[28px]">
                    {allows_customization && (
                        <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 rounded-full text-[9px] sm:text-[10px] md:text-[11px] font-medium bg-white/[0.05] text-neutral-300 border border-white/[0.08] backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                            Dorsal disponible
                        </span>
                    )}

                    {hasMultipleVersions && versionsList.length > 0 && (
                        <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 rounded-full text-[9px] sm:text-[10px] md:text-[11px] font-medium bg-white/[0.05] text-neutral-300 border border-white/[0.08] backdrop-blur-md">
                            <span>Versión {versionsList.slice(0, 2).join(" & ")}</span>
                        </span>
                    )}
                </div>

                {/* Divisor sutil y Fila de Precio + Botón Cápsula Apple */}
                <div className="pt-2.5 sm:pt-3.5 border-t border-white/[0.08] flex items-center justify-between gap-2 sm:gap-3 mt-auto">
                    <div className="flex flex-col">
                        <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase tracking-widest font-medium">
                            Precio oficial
                        </span>
                        <div className="flex items-baseline gap-0.5 sm:gap-1 mt-0.5">
                            <span className="text-[10px] sm:text-xs font-semibold text-neutral-400 font-mono">L</span>
                            <span className="text-base sm:text-xl md:text-2xl font-semibold font-mono tabular-nums text-white tracking-tight">
                                {precio.toLocaleString("es-HN")}
                            </span>
                        </div>
                    </div>

                    {/* Botón Cápsula Apple con física instantánea al presionar */}
                    <div className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white text-black font-semibold text-[11px] sm:text-xs tracking-tight transition-all duration-200 group-hover:bg-neutral-200 group-hover:shadow-[0_4px_16px_rgba(255,255,255,0.2)] active:scale-[0.96] shrink-0">
                        <span>Ver prenda</span>
                        <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
