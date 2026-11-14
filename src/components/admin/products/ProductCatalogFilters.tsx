import React from 'react'
import { Search, SlidersHorizontal, X, LayoutGrid, List as ListIcon } from 'lucide-react'
import { CatalogItem, FilterStatus } from './useAdminProducts'

interface ProductCatalogFiltersProps {
    search: string
    setSearch: (value: string) => void
    showFiltersModal: boolean
    setShowFiltersModal: React.Dispatch<React.SetStateAction<boolean>>
    activeFiltersCount: number
    handleClearFilters: () => void
    filterStatus: FilterStatus
    setFilterStatus: (value: FilterStatus) => void
    filterCategory: string
    setFilterCategory: (value: string) => void
    allCategories: CatalogItem[]
    filterLeague: string
    setFilterLeague: (value: string) => void
    allLeagues: CatalogItem[]
    filterGender: string
    setFilterGender: (value: string) => void
    filterSeason: string
    setFilterSeason: (value: string) => void
    allSeasons: string[]
    filteredCount: number
    viewMode: 'grid' | 'list'
    setViewMode: (mode: 'grid' | 'list') => void
}

export default function ProductCatalogFilters({
    search,
    setSearch,
    showFiltersModal,
    setShowFiltersModal,
    activeFiltersCount,
    handleClearFilters,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    allCategories,
    filterLeague,
    setFilterLeague,
    allLeagues,
    filterGender,
    setFilterGender,
    filterSeason,
    setFilterSeason,
    allSeasons,
    filteredCount,
    viewMode,
    setViewMode,
}: ProductCatalogFiltersProps) {
    return (
        <div className="bg-[#0a0c10]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-3 sm:p-4 sticky top-0 md:top-4 z-40 shadow-2xl relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            <div className="flex items-center gap-2.5 sm:gap-3 justify-between">
                {/* Buscador Spotlight */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, equipo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-3 text-white placeholder:text-neutral-500 focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all text-xs sm:text-sm"
                    />
                </div>

                {/* Botón Filtros Emergente (Popover) */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => setShowFiltersModal(prev => !prev)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer ${
                            activeFiltersCount > 0
                                ? 'border-white/30 bg-white/15 text-white'
                                : 'border-white/[0.08] bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white'
                        }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Filtros</span>
                        {activeFiltersCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-white text-black font-extrabold text-[10px] flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    {/* POPOVER EMERGENTE DE FILTROS */}
                    {showFiltersModal && (
                        <>
                            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={() => setShowFiltersModal(false)} />
                            <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-xs sm:w-80 bg-[#0a0c10]/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-4 shadow-2xl space-y-3.5 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                                        <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                                        Filtros de Catálogo
                                    </span>
                                    {activeFiltersCount > 0 && (
                                        <button onClick={handleClearFilters} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer">
                                            <X className="w-3 h-3" /> Limpiar
                                        </button>
                                    )}
                                </div>

                                {/* Estado */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Estado</label>
                                    <select
                                        value={filterStatus}
                                        onChange={e => setFilterStatus(e.target.value as FilterStatus)}
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/30"
                                    >
                                        <option value="all">Todos los estados</option>
                                        <option value="active">Solo Activos</option>
                                        <option value="inactive">Solo Inactivos</option>
                                        <option value="featured">⭐ Destacados en Home</option>
                                    </select>
                                </div>

                                {/* Categoría */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Categoría</label>
                                    <select
                                        value={filterCategory}
                                        onChange={e => setFilterCategory(e.target.value)}
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/30"
                                    >
                                        <option value="all">Todas las categorías</option>
                                        {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                {/* Liga */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Liga</label>
                                    <select
                                        value={filterLeague}
                                        onChange={e => setFilterLeague(e.target.value)}
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/30"
                                    >
                                        <option value="all">Todas las ligas</option>
                                        {allLeagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>

                                {/* Género */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Género</label>
                                    <select
                                        value={filterGender}
                                        onChange={e => setFilterGender(e.target.value)}
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/30"
                                    >
                                        <option value="all">Todos los géneros</option>
                                        <option value="man">Hombre</option>
                                        <option value="woman">Mujer</option>
                                        <option value="kid">Niño</option>
                                        <option value="unisex">Unisex</option>
                                    </select>
                                </div>

                                {/* Temporada Dinámica */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Temporada (Colección)</label>
                                    <select
                                        value={filterSeason}
                                        onChange={e => setFilterSeason(e.target.value)}
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/30"
                                    >
                                        <option value="all">Todas las temporadas</option>
                                        {allSeasons.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <button
                                    onClick={() => setShowFiltersModal(false)}
                                    className="w-full py-2.5 bg-white text-black font-extrabold hover:bg-neutral-200 active:scale-[0.98] rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                                >
                                    Ver {filteredCount} productos
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Controles de Vista Segmentados */}
                <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] shrink-0">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer active:scale-[0.98] ${viewMode === 'grid' ? 'bg-white text-black shadow-xs font-bold' : 'text-neutral-400 hover:text-white'}`}
                        title="Vista en Cuadrícula"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer active:scale-[0.98] ${viewMode === 'list' ? 'bg-white text-black shadow-xs font-bold' : 'text-neutral-400 hover:text-white'}`}
                        title="Vista en Lista"
                    >
                        <ListIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
