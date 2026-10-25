"use client";

import React from "react";
import { ArrowDown } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import MainButton from "@/components/ui/MainButton";
import { Product } from "@/lib/types";
import type { LiveMatchData } from "@/hooks/useLiveMatches";
import CatalogEmptyState from "./CatalogEmptyState";
import CatalogInFeedBento from "./CatalogInFeedBento";

interface ProductGridSectionProps {
    loading: boolean;
    loadingMore: boolean;
    productos: Product[];
    totalProducts: number;
    topSellerIds: string[];
    liveMatches: Record<string, LiveMatchData | null>;
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
    onPersonalizar,
    onClearFilters,
    onLoadMore,
}: ProductGridSectionProps) {
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
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
                /* 2. Empty State Personalizado */
                <CatalogEmptyState onClearFilters={onClearFilters} />
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
