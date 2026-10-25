"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { CatalogFilters, SortOption } from "./CatalogFilterPanel";
import CatalogFilterModal from "./CatalogFilterModal";

interface CatalogControlBarProps {
    filters: CatalogFilters;
    onFiltersChange: (filters: CatalogFilters) => void;
    totalProducts: number;
    showGender?: boolean;
    availableSeasons?: string[];
}

export default function CatalogControlBar({
    filters,
    onFiltersChange,
    totalProducts,
    showGender = true,
    availableSeasons = [],
}: CatalogControlBarProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Contar cuántos filtros activos hay (sin contar sort)
    const activeFiltersCount = [filters.gender, filters.priceRange, filters.season].filter(Boolean).length;

    return (
        <>
            <div className="sticky top-[calc(var(--header-height,4.5rem))] z-20 bg-[#07080a]/90 backdrop-blur-xl border-y border-white/[0.08] py-2 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
                    
                    {/* Contador de prendas limpio (sin píldoras pesadas) */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                            {totalProducts}{" "}
                            <span className="font-normal text-white/50">
                                {totalProducts === 1 ? "prenda disponible" : "prendas disponibles"}
                            </span>
                        </span>
                    </div>

                    {/* Controles a la derecha: Selector de orden compacto + Botón Filtros */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        {/* Dropdown compacto de ordenamiento (estilo Nike / Apple) */}
                        <div className="relative flex items-center">
                            <select
                                value={filters.sortBy}
                                onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as SortOption })}
                                className="appearance-none bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-white text-xs font-semibold rounded-full pl-3.5 pr-8 py-1.5 focus:outline-none focus:border-white/30 cursor-pointer transition-all"
                                aria-label="Ordenar productos"
                            >
                                <option value="relevance" className="bg-[#0c0e14] text-white">Relevancia</option>
                                <option value="top_sellers" className="bg-[#0c0e14] text-white">🔥 Más Vendidos</option>
                                <option value="newest" className="bg-[#0c0e14] text-white">⚡ Novedades</option>
                                <option value="price_asc" className="bg-[#0c0e14] text-white">Menor Precio</option>
                                <option value="price_desc" className="bg-[#0c0e14] text-white">Mayor Precio</option>
                                <option value="alphabetical" className="bg-[#0c0e14] text-white">A - Z</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-white/50 absolute right-2.5 pointer-events-none" />
                        </div>

                        {/* Botón Filtros */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                                activeFiltersCount > 0
                                    ? "bg-primary text-white shadow-lg shadow-primary/25 border border-primary-light"
                                    : "bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white"
                            }`}
                            aria-label="Abrir filtros avanzados"
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Filtros</span>
                            {activeFiltersCount > 0 && (
                                <span className="w-4 h-4 rounded-full bg-white text-primary text-[10px] font-black flex items-center justify-center">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>

                </div>
            </div>

            {/* Modal Drawer de Filtros */}
            <CatalogFilterModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                filters={filters}
                onFiltersChange={onFiltersChange}
                showGender={showGender}
                availableSeasons={availableSeasons}
                totalProducts={totalProducts}
            />
        </>
    );
}
