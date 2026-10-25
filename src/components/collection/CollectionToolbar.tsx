"use client";

import { Search, X, Square, Grid2X2, Grid3X3, LayoutGrid } from "lucide-react";

interface CollectionToolbarProps {
    teams: string[];
    selectedTeam: string;
    onSelectTeam: (team: string) => void;
    teamCounts: Record<string, number>;
    totalCount: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: "default" | "price-asc" | "price-desc";
    onSortChange: (sort: "default" | "price-asc" | "price-desc") => void;
    columns: 2 | 3 | 4;
    onColumnsChange: (cols: 2 | 3 | 4) => void;
    mobileColumns: 1 | 2;
    onMobileColumnsChange: (cols: 1 | 2) => void;
    filteredCount: number;
    onResetFilters: () => void;
}

export default function CollectionToolbar({
    teams,
    selectedTeam,
    onSelectTeam,
    teamCounts,
    totalCount,
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    columns,
    onColumnsChange,
    mobileColumns,
    onMobileColumnsChange,
    filteredCount,
    onResetFilters,
}: CollectionToolbarProps) {
    const isFiltered = selectedTeam !== "all" || searchQuery.trim().length > 0;

    return (
        <div className="sticky top-[var(--header-height,64px)] z-30 bg-[#07080a]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
            {/* 🌟 Specular highlight en el borde superior de la barra de controles */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* FILA 1 (Izquierda): Filtros por Equipo estilo Apple Segmented Control */}
                    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar py-0.5 -mx-1 px-1">
                        {teams.length > 1 && (
                            <>
                                <button
                                    onClick={() => onSelectTeam("all")}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 active:scale-95 whitespace-nowrap shrink-0 ${
                                        selectedTeam === "all"
                                            ? "bg-white text-black shadow-md"
                                            : "bg-white/[0.05] text-neutral-400 hover:text-white hover:bg-white/[0.1] border border-white/[0.08]"
                                    }`}
                                >
                                    Todos ({totalCount})
                                </button>
                                {teams.map((teamName) => {
                                    const count = teamCounts[teamName] || 0;
                                    const isSelected = selectedTeam === teamName;
                                    return (
                                        <button
                                            key={teamName}
                                            onClick={() => onSelectTeam(teamName)}
                                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 active:scale-95 whitespace-nowrap shrink-0 ${
                                                isSelected
                                                    ? "bg-white text-black shadow-md"
                                                    : "bg-white/[0.05] text-neutral-400 hover:text-white hover:bg-white/[0.1] border border-white/[0.08]"
                                            }`}
                                        >
                                            {teamName} ({count})
                                        </button>
                                    );
                                })}
                            </>
                        )}

                        {/* Buscador Rápido Dentro de la Colección */}
                        <div className="relative flex-1 min-w-[140px] max-w-[220px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="Buscar en colección..."
                                className="w-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/[0.08] focus:border-white/20 rounded-full pl-8 pr-7 py-1 text-xs text-white placeholder:text-neutral-500 focus:outline-none transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => onSearchChange("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 rounded-full"
                                    aria-label="Limpiar búsqueda"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* FILA 2 (Derecha): Densidad de Grid, Ordenación y Reset */}
                    <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3">
                        {/* Selector de Densidad en Móvil (1 vs 2 columnas) */}
                        <div className="flex md:hidden items-center gap-0.5 bg-white/[0.04] p-1 rounded-full border border-white/[0.08] backdrop-blur-md">
                            <button
                                onClick={() => onMobileColumnsChange(1)}
                                title="1 por fila (Vista Grande)"
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all duration-200 active:scale-95 ${
                                    mobileColumns === 1
                                        ? "bg-white text-black shadow-sm"
                                        : "text-neutral-400 hover:text-white"
                                }`}
                            >
                                <Square size={12} />
                                <span>1</span>
                            </button>
                            <button
                                onClick={() => onMobileColumnsChange(2)}
                                title="2 por fila (Cuadrícula)"
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all duration-200 active:scale-95 ${
                                    mobileColumns === 2
                                        ? "bg-white text-black shadow-sm"
                                        : "text-neutral-400 hover:text-white"
                                }`}
                            >
                                <Grid2X2 size={12} />
                                <span>2</span>
                            </button>
                        </div>

                        {/* Selector de Densidad en PC (2, 3, 4 columnas) */}
                        <div className="hidden md:flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/[0.08] backdrop-blur-md">
                            <button
                                onClick={() => onColumnsChange(2)}
                                title="2 columnas (Vista amplia)"
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                                    columns === 2
                                        ? "bg-white text-black shadow-sm"
                                        : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                                }`}
                            >
                                <Grid2X2 size={13} />
                                <span>2</span>
                            </button>
                            <button
                                onClick={() => onColumnsChange(3)}
                                title="3 columnas (Recomendado)"
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                                    columns === 3
                                        ? "bg-white text-black shadow-sm"
                                        : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                                }`}
                            >
                                <Grid3X3 size={13} />
                                <span>3</span>
                            </button>
                            <button
                                onClick={() => onColumnsChange(4)}
                                title="4 columnas (Compacto)"
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                                    columns === 4
                                        ? "bg-white text-black shadow-sm"
                                        : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                                }`}
                            >
                                <LayoutGrid size={13} />
                                <span>4</span>
                            </button>
                        </div>

                        {/* Selector de Ordenación Apple Capsule */}
                        <select
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value as "default" | "price-asc" | "price-desc")}
                            className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-neutral-300 focus:outline-none focus:border-white/30 cursor-pointer backdrop-blur-md transition-colors"
                        >
                            <option value="default" className="bg-neutral-900 text-white">Orden recomendado</option>
                            <option value="price-asc" className="bg-neutral-900 text-white">Precio: Menor a Mayor</option>
                            <option value="price-desc" className="bg-neutral-900 text-white">Precio: Mayor a Menor</option>
                        </select>

                        {/* Botón de Limpiar si hay filtros aplicados */}
                        {isFiltered && (
                            <button
                                onClick={onResetFilters}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-[11px] font-bold transition-all active:scale-95"
                                title="Restablecer filtros"
                            >
                                <X size={12} />
                                <span className="hidden sm:inline">Limpiar ({filteredCount})</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
