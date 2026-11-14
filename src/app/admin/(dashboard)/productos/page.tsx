'use client'

import Link from 'next/link'
import { Plus, Shirt, Loader2 } from 'lucide-react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useAdminProducts } from '@/components/admin/products/useAdminProducts'
import ProductCatalogFilters from '@/components/admin/products/ProductCatalogFilters'
import ProductCatalogGrid from '@/components/admin/products/ProductCatalogGrid'
import ProductCatalogList from '@/components/admin/products/ProductCatalogList'

export default function ProductsPage() {
    const {
        filteredProducts,
        loading,
        viewMode,
        setViewMode,
        search,
        setSearch,
        filterCategory,
        setFilterCategory,
        filterLeague,
        setFilterLeague,
        filterGender,
        setFilterGender,
        filterSeason,
        setFilterSeason,
        filterStatus,
        setFilterStatus,
        showFiltersModal,
        setShowFiltersModal,
        allCategories,
        allLeagues,
        allSeasons,
        activeFiltersCount,
        handleClearFilters,
        deleteTarget,
        setDeleteTarget,
        executeDelete,
        handleDelete,
        handleToggleActive,
        handleTrending,
        handleDuplicate,
        duplicating,
        trendingProduct,
        isSuperAdmin,
    } = useAdminProducts()

    return (
        <div className="space-y-4 sm:space-y-6 pb-28 max-w-7xl mx-auto">
            {/* ═══════════════════ HEADER HOMOLOGADO ═══════════════════ */}
            <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <Shirt className="w-5 h-5" />
                    </span>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                                Catálogo de Productos
                            </h1>
                            <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300">
                                {filteredProducts.length} camisetas
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                            Gestiona tu inventario, precios, versiones y existencias activas.
                        </p>
                    </div>
                </div>

                <Link
                    href="/admin/productos/nuevo"
                    className="bg-white text-black font-extrabold px-4 py-2.5 rounded-xl hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Camiseta</span>
                </Link>
            </div>

            {/* BARRA DE HERRAMIENTAS & FILTROS */}
            <ProductCatalogFilters
                search={search}
                setSearch={setSearch}
                showFiltersModal={showFiltersModal}
                setShowFiltersModal={setShowFiltersModal}
                activeFiltersCount={activeFiltersCount}
                handleClearFilters={handleClearFilters}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                allCategories={allCategories}
                filterLeague={filterLeague}
                setFilterLeague={setFilterLeague}
                allLeagues={allLeagues}
                filterGender={filterGender}
                setFilterGender={setFilterGender}
                filterSeason={filterSeason}
                setFilterSeason={setFilterSeason}
                allSeasons={allSeasons}
                filteredCount={filteredProducts.length}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            {/* CONTENIDO PRINCIPAL */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-gray-500 font-medium">Cargando catálogo...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4 rounded-3xl border border-dashed border-white/10 bg-white/5 mx-auto max-w-2xl">
                    <Shirt className="w-16 h-16 text-gray-600" />
                    <div className="text-center">
                        <p className="text-xl font-bold text-white">No se encontraron productos</p>
                        <p className="text-gray-500">Intenta con otra búsqueda o crea uno nuevo.</p>
                    </div>
                </div>
            ) : viewMode === 'grid' ? (
                <ProductCatalogGrid
                    products={filteredProducts}
                    duplicating={duplicating}
                    trendingProduct={trendingProduct}
                    handleDuplicate={handleDuplicate}
                    handleTrending={handleTrending}
                />
            ) : (
                <ProductCatalogList
                    products={filteredProducts}
                    duplicating={duplicating}
                    trendingProduct={trendingProduct}
                    isSuperAdmin={isSuperAdmin}
                    handleToggleActive={handleToggleActive}
                    handleDuplicate={handleDuplicate}
                    handleTrending={handleTrending}
                    handleDelete={handleDelete}
                />
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Mover a la papelera"
                message="¿Mover este producto a la papelera? Podrás recuperarlo después desde Ajustes → Papelera."
                confirmLabel="Mover"
                onConfirm={() => {
                    if (deleteTarget) executeDelete(deleteTarget)
                    setDeleteTarget(null)
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}
