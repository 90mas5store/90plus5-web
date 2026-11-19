"use client";

import React from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Info, MessageCircle, Sparkles } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import MainButton from "@/components/ui/MainButton";
import { Product } from "@/lib/types";
import type { LiveMatchData } from "@/hooks/useLiveMatches";
import type { SearchExecutionMeta } from "@/lib/search/searchEngine";
import { BUSINESS_LOGIC } from "@/lib/constants";
import CatalogEmptyState from "./CatalogEmptyState";
import CatalogInFeedBento from "./CatalogInFeedBento";

interface ProductGridSectionProps {
    loading: boolean;
    loadingMore: boolean;
    productos: Product[];
    totalProducts: number;
    topSellerIds: string[];
    liveMatches: Record<string, LiveMatchData | null>;
    queryParam?: string | null;
    searchMeta?: SearchExecutionMeta;
    onPersonalizar: () => void;
    onClearFilters: () => void;
    onLoadMore: () => void;
}

export default function ProductGridSection({
    loading,
    loadingMore,
    productos,
    totalProducts,
    topSellerIds,
    liveMatches,
    queryParam,
    searchMeta,
    onPersonalizar,
    onClearFilters,
    onLoadMore,
}: ProductGridSectionProps) {
    const cleanQuery = queryParam?.trim() || "";
    const isPartialMatch = Boolean(cleanQuery && productos.length > 0 && searchMeta?.matchQuality === "partial");
    const hasCorrections = Boolean(
        cleanQuery && productos.length > 0 && !isPartialMatch && (searchMeta?.correctedTerms?.length ?? 0) > 0
    );

    const whatsappUrl = `https://wa.me/${BUSINESS_LOGIC.CONTACT.WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `¡Hola 90+5 Store! Busqué "${cleanQuery}" en el catálogo online y no vi esa variante exacta. ¿Me confirman si la pueden traer bajo pedido?`
    )}`;

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
            {/* Banner contextual de coincidencia parcial o corrección ortográfica */}
            {!loading && isPartialMatch && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 text-xs sm:text-sm text-amber-100/90">
                        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                            No encontramos coincidencia exacta para{" "}
                            <strong className="text-white">&quot;{cleanQuery}&quot;</strong>
                            {searchMeta?.unmatchedCatalogTokens && searchMeta.unmatchedCatalogTokens.length > 0 && (
                                <span className="text-amber-200/75">
                                    {" "}
                                    (sin modelos combinados con &quot;{searchMeta.unmatchedCatalogTokens.join(" ")}&quot;)
                                </span>
                            )}
                            . Mostrando los resultados más relacionados:
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {searchMeta?.suggestedAlternative && (
                            <Link
                                href={searchMeta.suggestedAlternative.href}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition-all active:scale-95"
                            >
                                <span>{searchMeta.suggestedAlternative.label}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-primary" />
                            </Link>
                        )}
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition-all active:scale-95"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Pedir bajo encargo</span>
                        </a>
                    </div>
                </div>
            )}

            {!loading && hasCorrections && searchMeta?.correctedTerms && (
                <div className="mb-5 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] inline-flex items-center gap-2 text-xs text-neutral-300">
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                        Mostrando resultados para{" "}
                        <strong className="text-white">
                            {searchMeta.correctedTerms.map((c) => c.to).join(", ")}
                        </strong>
                    </span>
                </div>
            )}

            {/* 1. Loading Skeleton Inicial (Alta Fidelidad Apple / Sport Luxury) */}
            {loading && productos.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="aspect-[4/5] bg-[#0c0e14] rounded-[1.6rem] md:rounded-[1.9rem] border border-white/[0.06] overflow-hidden relative animate-pulse p-4 flex flex-col justify-end"
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="w-1/2 h-3 bg-white/10 rounded mb-2" />
                            <div className="w-3/4 h-4 bg-white/15 rounded mb-2" />
                            <div className="w-1/3 h-4 bg-white/10 rounded" />
                        </div>
                    ))}
                </div>
            ) : productos.length === 0 ? (
                /* 2. Empty State Personalizado (con contexto de búsqueda) */
                <CatalogEmptyState queryParam={queryParam} onClearFilters={onClearFilters} />
            ) : (
                /* 3. Grid de Productos con Inserciones Editoriales Bento */
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                        {productos.map((item, index) => {
                            const isAfterEight = index === 7;
                            const isAfterSixteen = index === 15;

                            return (
                                <React.Fragment key={item.id}>
                                    <div className="h-full">
                                        <ProductCard
                                            item={item}
                                            priority={index < 4}
                                            onPress={onPersonalizar}
                                            topSeller={topSellerIds.includes(item.id)}
                                            liveMatch={liveMatches[item.team_id] ?? null}
                                        />
                                    </div>

                                    {/* Bento 1: Guía de Versiones después del 8º producto */}
                                    {isAfterEight && productos.length >= 8 && (
                                        <CatalogInFeedBento type="versions_guide" />
                                    )}

                                    {/* Bento 2: WhatsApp Concierge después del 16º producto */}
                                    {isAfterSixteen && productos.length >= 16 && (
                                        <CatalogInFeedBento type="whatsapp_concierge" />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* 4. Botón Cargar Más */}
                    {productos.length < totalProducts && (
                        <div className="flex flex-col items-center justify-center mt-12 pb-8">
                            <span className="text-xs text-white/40 mb-3 font-medium">
                                Mostrando {productos.length} de {totalProducts} prendas
                            </span>
                            <MainButton
                                onClick={onLoadMore}
                                disabled={loadingMore}
                                isLoading={loadingMore}
                                className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold uppercase tracking-widest text-xs backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer border border-white/10 shadow-lg active:scale-95"
                            >
                                <span>{loadingMore ? "Cargando prendas..." : "Ver más camisetas"}</span>
                                {!loadingMore && <ArrowDown className="w-4 h-4" />}
                            </MainButton>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
