"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Product } from "@/lib/types";
import ProductCard from "@/components/ui/ProductCard";
import { usePrefersReducedMotion } from "@/hooks/useOptimization";
import useToastMessage from "@/hooks/useToastMessage";

interface HomeNewArrivalsGridProps {
    products: Product[];
}

export default function HomeNewArrivalsGrid({ products = [] }: HomeNewArrivalsGridProps) {
    const prefersReducedMotion = usePrefersReducedMotion();
    const toast = useToastMessage();

    if (!products || products.length === 0) return null;

    // Tomamos hasta 8 novedades
    const displayProducts = products.slice(0, 8);

    return (
        <section aria-label="Novedades y recién agregados" className="py-7 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-7">
                <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span>Lo Más Nuevo</span>
                    </div>
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                        Recién Llegados al Catálogo
                    </h2>
                    <p className="text-white/60 text-xs sm:text-sm font-medium mt-1">
                        Las últimas incorporaciones de la temporada listas para personalizar.
                    </p>
                </div>

                <Link
                    href="/catalogo?orden=newest"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-white/5 group self-start sm:self-auto"
                >
                    <span>Ver Todas las Novedades</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 md:gap-6">
                {displayProducts.map((product) => (
                    <ProductCard
                        key={product.id}
                        item={product}
                        enableGlow={!prefersReducedMotion}
                        onPress={() => toast.loading("Cargando personalización...")}
                    />
                ))}
            </div>
        </section>
    );
}
