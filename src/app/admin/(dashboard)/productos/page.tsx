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
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
            {/* HEADER & ACCIONES */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 md:gap-3">
                        <Shirt className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                        Catálogo de Productos
                    </h1>
                    <p className="text-gray-400 mt-1 md:mt-2 text-sm">
                        Gestiona tu inventario, precios y existencias.
                    </p>
                </div>

                <Link
                    href="/admin/productos/nuevo"
                    className="group bg-white text-black px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/5 w-full md:w-auto text-sm md:text-base"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Nuevo Producto
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
