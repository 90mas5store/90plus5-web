"use client";

import { useEffect } from "react";
import { m as motion, AnimatePresence } from "@/lib/motion";
import { X, SlidersHorizontal, RotateCcw, Check } from "lucide-react";
import { CatalogFilters, SortOption } from "./CatalogFilterPanel";

interface CatalogFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: CatalogFilters;
    onFiltersChange: (newFilters: CatalogFilters) => void;
    showGender?: boolean;
    availableSeasons?: string[];
    totalProducts?: number;
}

const GENDER_OPTIONS = [
    { value: null, label: "Todos" },
    { value: "man", label: "Hombre" },
    { value: "woman", label: "Mujer" },
    { value: "kid", label: "Niños" },
];

const PRICE_OPTIONS = [
    { value: null, label: "Cualquier precio" },
    { value: "0-800", label: "Hasta L 800" },
    { value: "800-1200", label: "L 800 - 1,200" },
    { value: "1200-99999", label: "L 1,200 o más" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "relevance", label: "Relevancia recomendada" },
    { value: "top_sellers", label: "🔥 Más Vendidos" },
    { value: "newest", label: "⚡ Novedades y Recién llegados" },
    { value: "price_asc", label: "💰 Precio: Menor a Mayor" },
    { value: "price_desc", label: "🏷️ Precio: Mayor a Menor" },
    { value: "alphabetical", label: "A - Z Alfabético" },
];

export default function CatalogFilterModal({
    isOpen,
    onClose,
    filters,
    onFiltersChange,
    showGender = true,
    availableSeasons = [],
    totalProducts,
}: CatalogFilterModalProps) {
    // Bloquear scroll de fondo al abrir en móvil
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const activeFilterCount = [filters.gender, filters.priceRange, filters.season].filter(Boolean).length;

    const handleReset = () => {
        onFiltersChange({
            ...filters,
            gender: null,
            priceRange: null,
            season: null,
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop oscuro con blur Apple */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* Sheet lateral deslizante */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="relative w-full max-w-md bg-[#0c0e14] border-l border-white/10 shadow-2xl flex flex-col h-full z-10 text-white"
                    >
                        {/* 🌟 Header del Modal */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08] bg-[#07080a]/80 backdrop-blur-md">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <SlidersHorizontal className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white leading-tight">Filtros Avanzados</h2>
                                    {typeof totalProducts === "number" && (
                                        <p className="text-xs text-white/50">{totalProducts} prendas disponibles</p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                                aria-label="Cerrar filtros"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 🌟 Contenido escroleable de filtros */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
                            
                            {/* Ordenamiento */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
                                    Ordenar por
                                </label>
                                <div className="space-y-1.5">
                                    {SORT_OPTIONS.map((opt) => {
                                        const isSelected = filters.sortBy === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => onFiltersChange({ ...filters, sortBy: opt.value })}
                                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                                                        : "bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-white/70"
                                                }`}
                                            >
                                                <span>{opt.label}</span>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Género (Segmented control) */}
                            {showGender && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
                                        Público / Género
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {GENDER_OPTIONS.map((opt) => {
                                            const isSelected = filters.gender === opt.value;
                                            return (
                                                <button
                                                    key={opt.label}
                                                    onClick={() => onFiltersChange({ ...filters, gender: opt.value })}
                                                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                                                        isSelected
                                                            ? "bg-white/20 text-white border border-white/30 shadow-sm"
                                                            : "bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-white/70"
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Rango de Precios */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
                                    Rango de Precio
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PRICE_OPTIONS.map((opt) => {
                                        const isSelected = filters.priceRange === opt.value;
                                        return (
                                            <button
                                                key={opt.label}
                                                onClick={() => onFiltersChange({ ...filters, priceRange: opt.value })}
                                                className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                                                    isSelected
                                                        ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                                                        : "bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-white/70"
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Temporadas (si existen) */}
                            {availableSeasons.length > 0 && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
                                        Temporada
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => onFiltersChange({ ...filters, season: null })}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                                !filters.season
                                                    ? "bg-white/20 text-white border border-white/30"
                                                    : "bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-white/70"
                                            }`}
                                        >
                                            Todas
                                        </button>
                                        {availableSeasons.map((season) => {
                                            const isSelected = filters.season === season;
                                            return (
                                                <button
                                                    key={season}
                                                    onClick={() => onFiltersChange({ ...filters, season: isSelected ? null : season })}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                                        isSelected
                                                            ? "bg-primary/20 text-white border border-primary/40"
                                                            : "bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-white/70"
                                                    }`}
                                                >
                                                    {season}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* 🌟 Footer con Botón Aplicar y Reset */}
                        <div className="p-5 border-t border-white/[0.08] bg-[#07080a]/90 backdrop-blur-md flex items-center gap-3">
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={handleReset}
                                    className="p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white transition-colors cursor-pointer"
                                    title="Restablecer filtros"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/25 transition-all active:scale-[0.98] cursor-pointer"
                            >
                                Aplicar ({totalProducts ?? 0} Resultados)
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
