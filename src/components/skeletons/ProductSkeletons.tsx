'use client';

import { motion } from "framer-motion";
import { memo } from "react";

interface ProductGridSkeletonProps {
    /** Número de items skeleton a mostrar */
    count?: number;
    /** Columnas en diferentes breakpoints */
    gridCols?: string;
}

function ProductCardSkeleton() {
    return (
        <div className="relative bg-[#0a0a0a] rounded-[2rem] overflow-hidden border border-white/5 aspect-[4/5]">
            {/* Imagen skeleton */}
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    animate={{
                        x: ["-100%", "100%"],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </div>

            {/* Logo skeleton */}
            <div className="absolute top-5 left-5 z-20">
                <div className="w-12 h-12 rounded-full bg-white/5" />
            </div>

            {/* Content skeleton */}
            <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                {/* Team name */}
                <div className="h-6 bg-white/10 rounded-lg w-3/4" />
                {/* Model */}
                <div className="h-3 bg-white/5 rounded w-1/2" />
                {/* Price badge */}
                <div className="h-8 bg-white/10 rounded-full w-24 mt-2" />
            </div>
        </div>
    );
}

function ProductGridSkeletonComponent({
    count = 8,
    gridCols = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
}: ProductGridSkeletonProps) {
    return (
        <div className={`grid ${gridCols} gap-4 sm:gap-8`}>
            {Array.from({ length: count }).map((_, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                    <ProductCardSkeleton />
                </motion.div>
            ))}
        </div>
    );
}

export const ProductGridSkeleton = memo(ProductGridSkeletonComponent);

// ============================================
// 🎨 SKELETON PARA PERSONALIZACIÓN DE PRODUCTO
// ============================================

function ProductCustomizationSkeletonComponent() {
    return (
        <div className="min-h-screen bg-black text-white pt-8 pb-20 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Back button skeleton */}
                <div className="mb-8 w-24 h-6 bg-white/10 rounded" />

                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    {/* Image section */}
                    <div className="lg:col-span-7">
                        <div className="relative aspect-[4/5] md:aspect-square rounded-[2.5rem] overflow-hidden border border-white/5 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                                animate={{
                                    x: ["-100%", "100%"],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                            />
                        </div>
                    </div>

                    {/* Customization section */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-white/10" />
                            <div className="space-y-2">
                                <div className="h-10 w-48 bg-white/10 rounded" />
                                <div className="h-4 w-24 bg-white/5 rounded" />
                            </div>
                        </div>

                        {/* Price */}
                        <div className="h-10 w-32 bg-white/10 rounded" />

                        {/* Description */}
                        <div className="space-y-2 border-l-2 border-primary/30 pl-4">
                            <div className="h-4 w-full bg-white/5 rounded" />
                            <div className="h-4 w-3/4 bg-white/5 rounded" />
                        </div>

                        <div className="h-px bg-white/10" />

                        {/* Version options */}
                        <div className="space-y-4">
                            <div className="h-4 w-20 bg-white/10 rounded" />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="h-20 bg-white/5 rounded-2xl border border-white/5" />
                                <div className="h-20 bg-white/5 rounded-2xl border border-white/5" />
                            </div>
                        </div>

                        {/* Size options */}
                        <div className="space-y-4">
                            <div className="h-4 w-16 bg-white/10 rounded" />
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="w-12 h-12 bg-white/5 rounded-xl border border-white/10" />
                                ))}
                            </div>
                        </div>

                        {/* Dorsal section */}
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                            <div className="h-4 w-40 bg-white/10 rounded" />
                            <div className="flex gap-3">
                                <div className="flex-1 h-12 bg-white/5 rounded-xl" />
                                <div className="flex-1 h-12 bg-white/5 rounded-xl" />
                            </div>
                        </div>

                        {/* Add to cart button */}
                        <div className="h-16 bg-primary/30 rounded-[1.5rem] animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export const ProductCustomizationSkeleton = memo(ProductCustomizationSkeletonComponent);

// ============================================
// 🏠 SKELETON PARA HOME/CATÁLOGO
// ============================================

function CatalogPageSkeletonComponent() {
    return (
        <main className="min-h-screen bg-black text-white pb-24 relative overflow-hidden">
            {/* Hero skeleton */}
            <div className="relative h-[30vh] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 mb-4">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent"
                    animate={{
                        x: ["-100%", "100%"],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </div>

            {/* Search bar skeleton */}
            <div className="flex justify-center mb-6 px-4">
                <div className="w-full max-w-xl h-14 bg-white/5 rounded-full border border-white/10" />
            </div>

            {/* Categories carousel skeleton */}
            <div className="flex gap-4 px-4 mb-8 overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="flex-shrink-0 w-20 space-y-2">
                        <div className="w-20 h-20 bg-white/5 rounded-full" />
                        <div className="h-3 bg-white/5 rounded w-16 mx-auto" />
                    </div>
                ))}
            </div>

            {/* Products grid skeleton */}
            <div className="max-w-7xl mx-auto px-4">
                <ProductGridSkeleton count={8} />
            </div>
        </main>
    );
}

export const CatalogPageSkeleton = memo(CatalogPageSkeletonComponent);

export default ProductGridSkeleton;
