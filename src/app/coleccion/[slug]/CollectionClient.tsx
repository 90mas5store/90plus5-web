"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, RotateCcw } from "lucide-react";
import type { SpecialBanner, Product } from "@/lib/types";
import CollectionHero from "@/components/collection/CollectionHero";
import CollectionToolbar from "@/components/collection/CollectionToolbar";
import ProductCard from "@/components/ui/ProductCard";
import CollectionTrustFooter from "@/components/collection/CollectionTrustFooter";
import { motion, AnimatePresence } from "@/lib/motion";

interface CollectionClientProps {
    banner: SpecialBanner;
    products: Product[];
}

export default function CollectionClient({ banner, products }: CollectionClientProps) {
    const [selectedTeam, setSelectedTeam] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
    const [columns, setColumns] = useState<2 | 3 | 4>(4); // 4 columnas en PC por defecto (solicitado por usuario)
    const [mobileColumns, setMobileColumns] = useState<1 | 2>(2); // 2 columnas en móvil por defecto

    // Equipos únicos presentes en esta colección y conteo por equipo
    const { teamsInCollection, teamCounts } = useMemo(() => {
        const counts: Record<string, number> = {};
        const teamSet = new Set<string>();

        products.forEach((p) => {
            const team = p.equipo || p.brand_name;
            if (team) {
                teamSet.add(team);
                counts[team] = (counts[team] || 0) + 1;
            }
        });

        return {
            teamsInCollection: Array.from(teamSet),
            teamCounts: counts,
        };
    }, [products]);

    // Filtrar y ordenar productos
    const filteredProducts = useMemo(() => {
        let list = [...products];

        if (selectedTeam !== "all") {
            list = list.filter((p) => (p.equipo || p.brand_name) === selectedTeam);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (p) =>
                    p.modelo.toLowerCase().includes(q) ||
                    (p.equipo && p.equipo.toLowerCase().includes(q)) ||
                    (p.brand_name && p.brand_name.toLowerCase().includes(q))
            );
        }

        if (sortBy === "price-asc") {
            list.sort((a, b) => a.precio - b.precio);
        } else if (sortBy === "price-desc") {
            list.sort((a, b) => b.precio - a.precio);
        }

        return list;
    }, [products, selectedTeam, searchQuery, sortBy]);

    const handleResetFilters = () => {
        setSelectedTeam("all");
        setSearchQuery("");
        setSortBy("default");
    };

    const handleScrollToProducts = () => {
        const el = document.getElementById("collection-products");
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const mobGridClass = mobileColumns === 1 ? "grid-cols-1 max-w-sm sm:max-w-none mx-auto w-full" : "grid-cols-2";

    return (
        <div
            className="min-h-screen bg-[#07080a] text-white flex flex-col selection:bg-primary selection:text-white"
            style={{ paddingTop: "var(--header-height, 4.5rem)" }}
        >
            {/* 1. HERO CINEMÁTICO FULL-WIDTH (Idéntico al Home: imagen/video expandido edge-to-edge + cápsula Apple) */}
            <CollectionHero
                banner={banner}
                totalProducts={products.length}
                onExploreClick={handleScrollToProducts}
            />

            {/* 2. BARRA DE HERRAMIENTAS Y CONTROLES (Sticky Glassmorphism con Segmented Control estilo Apple) */}
            <CollectionToolbar
                teams={teamsInCollection}
                selectedTeam={selectedTeam}
                onSelectTeam={setSelectedTeam}
                teamCounts={teamCounts}
                totalCount={products.length}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                columns={columns}
                onColumnsChange={setColumns}
                mobileColumns={mobileColumns}
                onMobileColumnsChange={setMobileColumns}
                filteredCount={filteredProducts.length}
                onResetFilters={handleResetFilters}
            />

            {/* 3. SHOWCASE Y CUADRÍCULA DE PRENDAS OFICIALES (Utiliza la tarjeta flagship de 90+5) */}
            <main
                id="collection-products"
                className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 w-full scroll-mt-24"
            >
                {filteredProducts.length === 0 ? (
                    /* ESTADO VACÍO / NO RESULTS */
                    <div className="py-20 sm:py-28 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4 text-neutral-400 shadow-inner">
                            <ShoppingBag size={28} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
                            No se encontraron prendas
                        </h2>
                        <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                            {products.length === 0
                                ? "Esta colección especial se encuentra en preparación. Vuelve pronto para descubrir las prendas seleccionadas."
                                : "No hay prendas en esta colección que coincidan con los filtros o la búsqueda ingresada."}
                        </p>
                        {products.length > 0 && (selectedTeam !== "all" || searchQuery.trim()) ? (
                            <button
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full text-xs font-bold tracking-tight hover:bg-neutral-200 transition-colors active:scale-95 shadow-sm"
                            >
                                <RotateCcw size={14} />
                                <span>Restablecer filtros ({products.length} prendas)</span>
                            </button>
                        ) : (
                            <Link
                                href="/catalogo"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full text-xs font-bold tracking-tight hover:bg-neutral-200 transition-colors active:scale-95 shadow-sm"
                            >
                                <ArrowLeft size={14} />
                                <span>Explorar catálogo completo</span>
                            </Link>
                        )}
                    </div>
                ) : (
                    /* GRID DINÁMICO CON LA TARJETA OFICIAL DEL HOME Y CATÁLOGO */
                    <motion.div
                        layout
                        className={
                            columns === 2
                                ? `grid ${mobGridClass} md:grid-cols-2 gap-3 sm:gap-6 md:gap-8 max-w-5xl mx-auto`
                                : columns === 4
                                ? `grid ${mobGridClass} sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 md:gap-6 max-w-7xl mx-auto`
                                : `grid ${mobGridClass} sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 md:gap-7 max-w-7xl mx-auto`
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
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        duration: 0.35,
                                        ease: [0.16, 1, 0.3, 1],
                                        delay: Math.min(idx * 0.04, 0.25),
                                    }}
                                >
                                    <ProductCard
                                        item={product}
                                        priority={idx < 4}
                                        enableGlow={true}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            {/* 4. SECCIÓN DE CONFIANZA Y CONTACTO WHATSAPP (Estilo Home) */}
            <CollectionTrustFooter />
        </div>
    );
}
