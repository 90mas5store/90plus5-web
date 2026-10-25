"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Star, Flame, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Product } from "@/lib/types";
import ProductCard from "@/components/ui/ProductCard";
import { usePrefersReducedMotion } from "@/hooks/useOptimization";
import useToastMessage from "@/hooks/useToastMessage";

interface HomeProductCarouselProps {
    destacados: Product[];
    bestSellers?: Product[];
}

export default function HomeProductCarousel({
    destacados = [],
    bestSellers = [],
}: HomeProductCarouselProps) {
    type TabType = "destacados" | "bestsellers";
    const [activeTab, setActiveTab] = useState<TabType>("destacados");

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = usePrefersReducedMotion();
    const toast = useToastMessage();

    const scroll = useCallback((direction: "left" | "right") => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollAmount = container.clientWidth * 0.75;
        container.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    }, []);

    const currentList = activeTab === "destacados"
        ? (destacados.length > 0 ? destacados : bestSellers)
        : (bestSellers.length > 0 ? bestSellers : destacados);

    if (currentList.length === 0) return null;

    return (
        <section aria-label="Prendas destacadas y más vendidas" className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6">
            {/* Header de la sección con selector de pestañas */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 sm:mb-7">
                <div>
                    {/* Conmutador de Pestañas: Destacados vs Más Vendidos */}
                    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 w-fit mb-3">
                        <button
                            onClick={() => setActiveTab("destacados")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === "destacados"
                                    ? "bg-white text-black shadow-md"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            <Star className={`w-3.5 h-3.5 ${activeTab === "destacados" ? "text-primary fill-primary" : "text-white/50"}`} />
                            <span>Selección 90+5</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("bestsellers")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === "bestsellers"
                                    ? "bg-white text-black shadow-md"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            <Flame className={`w-3.5 h-3.5 ${activeTab === "bestsellers" ? "text-amber-500 fill-amber-500" : "text-white/50"}`} />
                            <span>Más Vendidos</span>
                        </button>
                    </div>

                    <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                        {activeTab === "destacados" ? "Prendas Seleccionadas por 90+5" : "Los Más Pedidos en Todo Honduras"}
                    </h2>
                    <p className="text-white/60 text-xs sm:text-sm font-medium mt-1">
                        {activeTab === "destacados"
                            ? "Piezas icónicas, ediciones especiales y camisetas de máxima demanda."
                            : "Las equipaciones favoritas elegidas por nuestros clientes este mes."}
                    </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    {/* Botones de navegación (Desktop) */}
                    <div className="hidden sm:flex items-center gap-1.5">
                        <button
                            onClick={() => scroll("left")}
                            aria-label="Desplazar a la izquierda"
                            className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-white flex items-center justify-center transition-colors active:scale-90"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            aria-label="Desplazar a la derecha"
                            className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-white flex items-center justify-center transition-colors active:scale-90"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <Link
                        href={activeTab === "destacados" ? "/catalogo" : "/catalogo?orden=top_sellers"}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5 group"
                    >
                        <span>Ver Colección Completa</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Shelf / Carrusel de productos optimizado para móvil y desktop */}
            <div
                ref={scrollContainerRef}
                className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
            >
                {currentList.map((product) => (
                    <div
                        key={product.id}
                        className="snap-start shrink-0 w-[180px] sm:w-[230px] md:w-[260px]"
                    >
                        <ProductCard
                            item={product}
                            topSeller={activeTab === "bestsellers"}
                            enableGlow={!prefersReducedMotion}
                            onPress={() => toast.loading("Cargando personalización...")}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
