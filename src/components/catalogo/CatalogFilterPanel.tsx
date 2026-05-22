"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { SlidersHorizontal, X, ArrowUpDown } from "lucide-react";

export type SortOption =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "top_sellers"
  | "alphabetical";

export interface CatalogFilters {
  gender: string | null;
  priceRange: string | null;
  sortBy: SortOption;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  gender: null,
  priceRange: null,
  sortBy: "relevance",
};

interface FilterOption {
  value: string;
  label: string;
}

interface CatalogFilterPanelProps {
  /** Mostrar filtro de género (solo en categorías con mezcla de géneros) */
  showGender: boolean;
  /** Filtros actuales */
  filters: CatalogFilters;
  /** Callback cuando cambian los filtros */
  onFiltersChange: (filters: CatalogFilters) => void;
}

const GENDER_OPTIONS: FilterOption[] = [
  { value: "man", label: "Hombre" },
  { value: "woman", label: "Mujer" },
  { value: "kid", label: "Ninos" },
];

const PRICE_OPTIONS: FilterOption[] = [
  { value: "0-800", label: "Hasta L 800" },
  { value: "800-1200", label: "L 800 - 1,200" },
  { value: "1200-99999", label: "L 1,200+" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevancia" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "newest", label: "Novedad" },
  { value: "top_sellers", label: "Lo mas vendido" },
  { value: "alphabetical", label: "A - Z" },
];

export default function CatalogFilterPanel({
  showGender,
  filters,
  onFiltersChange,
}: CatalogFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<CatalogFilters>(filters);

  // Sincronizar cuando cambian los filtros externos
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Contar filtros activos (sort no cuenta como filtro)
  const activeFilterCount = [filters.gender, filters.priceRange].filter(Boolean).length;
  const hasNonDefaultSort = filters.sortBy !== "relevance";

  const handleToggle = (key: "gender" | "priceRange", value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  const handleSortSelect = (value: SortOption) => {
    setLocalFilters((prev) => ({
      ...prev,
      sortBy: value,
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    const cleared: CatalogFilters = { ...DEFAULT_FILTERS };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setIsOpen(false);
  };

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <div className="flex justify-center px-4 pb-4">
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all duration-300 ${
            activeFilterCount > 0 || hasNonDefaultSort
              ? "bg-[#E50914]/10 border-[#E50914]/30 text-white shadow-[0_0_15px_rgba(229,9,20,0.15)]"
              : "bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtros y orden</span>
          {(activeFilterCount > 0 || hasNonDefaultSort) && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[#E50914] text-white text-[10px] font-bold">
              {activeFilterCount + (hasNonDefaultSort ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Overlay + Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Panel bottom-sheet (movil) / lateral (desktop) */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:left-auto md:top-0 md:w-[380px] md:bottom-0"
            >
              <div className="bg-[#0a0a0a] border-t md:border-l md:border-t-0 border-white/10 rounded-t-3xl md:rounded-none md:h-full flex flex-col max-h-[85dvh] md:max-h-none">
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-2">
                  <h3 className="text-lg font-bold text-white">Filtros y orden</h3>
                  <div className="flex items-center gap-3">
                    {(activeFilterCount > 0 || hasNonDefaultSort) && (
                      <button
                        onClick={handleClear}
                        className="text-xs font-semibold text-gray-500 hover:text-[#E50914] transition-colors"
                      >
                        Limpiar todo
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                      aria-label="Cerrar filtros"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Drag indicator (movil) */}
                <div className="flex justify-center pb-3 md:hidden">
                  <div className="w-10 h-1 rounded-full bg-white/10" />
                </div>

                {/* Filter Groups */}
                <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-6">
                  {/* Ordenar por */}
                  <FilterGroup label="Ordenar por" icon={<ArrowUpDown className="w-3 h-3" />}>
                    <div className="flex flex-col gap-1.5">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleSortSelect(opt.value)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 text-left ${
                            localFilters.sortBy === opt.value
                              ? "bg-[#E50914]/12 border-[#E50914]/40 text-white"
                              : "bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/15 hover:text-gray-300"
                          }`}
                        >
                          {/* Radio dot */}
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              localFilters.sortBy === opt.value
                                ? "border-[#E50914]"
                                : "border-white/20"
                            }`}
                          >
                            {localFilters.sortBy === opt.value && (
                              <div className="w-2 h-2 rounded-full bg-[#E50914]" />
                            )}
                          </div>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </FilterGroup>

                  {/* Genero — solo si showGender */}
                  {showGender && (
                    <FilterGroup label="Genero">
                      <div className="flex flex-wrap gap-2">
                        {GENDER_OPTIONS.map((opt) => (
                          <FilterChip
                            key={opt.value}
                            label={opt.label}
                            isActive={localFilters.gender === opt.value}
                            onClick={() => handleToggle("gender", opt.value)}
                          />
                        ))}
                      </div>
                    </FilterGroup>
                  )}

                  {/* Rango de precio */}
                  <FilterGroup label="Precio">
                    <div className="flex flex-wrap gap-2">
                      {PRICE_OPTIONS.map((opt) => (
                        <FilterChip
                          key={opt.value}
                          label={opt.label}
                          isActive={localFilters.priceRange === opt.value}
                          onClick={() => handleToggle("priceRange", opt.value)}
                        />
                      ))}
                    </div>
                  </FilterGroup>
                </div>

                {/* Apply Button */}
                <div className="p-5 pt-3 border-t border-white/5">
                  <button
                    onClick={handleApply}
                    className="w-full py-3.5 rounded-2xl bg-[#E50914] hover:bg-[#c5080f] text-white font-bold text-sm tracking-wide transition-colors shadow-[0_4px_20px_rgba(229,9,20,0.3)]"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/** Grupo de filtro con label */
function FilterGroup({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}

/** Chip individual de filtro */
function FilterChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
        isActive
          ? "bg-[#E50914]/12 border-[#E50914]/40 text-white shadow-[0_0_10px_rgba(229,9,20,0.15)]"
          : "bg-white/[0.03] border-white/8 text-gray-500 hover:border-white/15 hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  );
}
