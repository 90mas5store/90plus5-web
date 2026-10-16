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
        <div className="bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 sm:p-4 sticky top-0 md:top-4 z-40 shadow-2xl">
            <div className="flex items-center gap-2.5 sm:gap-3 justify-between">
                {/* Buscador */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, equipo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-white focus:border-primary/50 outline-none transition-all text-xs sm:text-sm"
                    />
                </div>

                {/* Botón Filtros Emergente (Popover) */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => setShowFiltersModal(prev => !prev)}
                        className={`px-3 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeFiltersCount > 0
                                ? 'border-primary bg-primary/20 text-primary'
                                : 'border-white/10 bg-black/30 hover:bg-white/5 text-gray-300'
                        }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Filtros</span>
                        {activeFiltersCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-primary text-black font-black text-[10px] flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    {/* POPOVER EMERGENTE DE FILTROS */}
                    {showFiltersModal && (
                        <>
                            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" onClick={() => setShowFiltersModal(false)} />
                            <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-xs sm:w-80 bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                                    <span className="text-sm font-bold text-white flex items-center gap-2">
                                        <SlidersHorizontal className="w-4 h-4 text-primary" />
                                        Filtros de Catálogo
                                    </span>
                                    {activeFiltersCount > 0 && (
                                        <button onClick={handleClearFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer">
                                            <X className="w-3 h-3" /> Limpiar
                                        </button>
                                    )}
                                </div>

                                {/* Estado */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Estado</label>
                                    <select
                                        value={filterStatus}
                                        onChange={e => setFilterStatus(e.target.value as FilterStatus)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                    >
                                        <option value="all">Todos los estados</option>
                                        <option value="active">Solo Activos</option>
                                        <option value="inactive">Solo Inactivos</option>
                                        <option value="featured">⭐ Destacados en Home</option>
                                    </select>
                                </div>

                                {/* Categoría */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Categoría</label>
                                    <select
                                        value={filterCategory}
                                        onChange={e => setFilterCategory(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                    >
                                        <option value="all">Todas las categorías</option>
                                        {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                {/* Liga */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Liga</label>
                                    <select
                                        value={filterLeague}
                                        onChange={e => setFilterLeague(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                    >
                                        <option value="all">Todas las ligas</option>
                                        {allLeagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>

                                {/* Género */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Género</label>
                                    <select
                                        value={filterGender}
                                        onChange={e => setFilterGender(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                    >
                                        <option value="all">Todos los géneros</option>
                                        <option value="man">Hombre</option>
                                        <option value="woman">Mujer</option>
                                        <option value="kid">Niño</option>
                                        <option value="unisex">Unisex</option>
                                    </select>
                                </div>

                                {/* Temporada */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Temporada</label>
                                    <select
                                        value={filterSeason}
                                        onChange={e => setFilterSeason(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                                    >
                                        <option value="all">Todas las temporadas</option>
                                        {allSeasons.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <button
                                    onClick={() => setShowFiltersModal(false)}
                                    className="w-full py-2.5 bg-primary hover:bg-primary/90 rounded-xl text-xs font-black uppercase text-black transition-colors tracking-wider cursor-pointer"
                                >
                                    Ver {filteredCount} productos
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Controles de Vista */}
                <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5 shrink-0">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        title="Vista en Cuadrícula"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        title="Vista en Lista"
                    >
                        <ListIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
