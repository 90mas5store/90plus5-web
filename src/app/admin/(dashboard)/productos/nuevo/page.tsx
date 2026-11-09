'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useCreateProductForm } from '@/components/admin/products/useCreateProductForm';
import ProductGeneralInfoSection from '@/components/admin/products/ProductGeneralInfoSection';
import ProductVariantsSection from '@/components/admin/products/ProductVariantsSection';
import ProductLeaguesSection from '@/components/admin/products/ProductLeaguesSection';
import ProductPatchesSection from '@/components/admin/products/ProductPatchesSection';
import ProductPlayersSection from '@/components/admin/products/ProductPlayersSection';
import ProductMediaSection from '@/components/admin/products/ProductMediaSection';
import QuickCreateModal from '@/components/admin/products/QuickCreateModal';

export default function CreateProductPage() {
    const {
        loading,
        saving,
        teams,
        leagues,
        categories,
        brands,
        allSizes,
        availableVersions,
        featuredProducts,
        filteredSizes,
        filteredPatches,
        addSize,
        formData,
        setFormData,
        handleChange,
        isAutoSlug,
        setIsAutoSlug,
        slugChecking,
        slugIsUnique,
        variants,
        addVariant,
        updateVariant,
        removeVariant,
        toggleVariantSize,
        applyAdultPreset,
        applySinglePreset,
        variantToDelete,
        setVariantToDelete,
        productPatches,
        toggleProductPatch,
        selectedLeagues,
        toggleSelectedLeague,
        productImages,
        setProductImages,
        teamPlayers,
        selectedPlayerIds,
        togglePlayer,
        selectAllPlayers,
        deselectAllPlayers,
        newPlayer,
        setNewPlayer,
        addingPlayer,
        handleAddPlayer,
        suggestedBrandName,
        handleTeamCreated,
        handleBrandCreated,
        handleSave,
    } = useCreateProductForm();

    const [quickModal, setQuickModal] = useState<{ open: boolean; type: 'team' | 'brand' }>({
        open: false,
        type: 'team',
    });

    const handleApplySeasonMove = (cleanName: string, season: string) => {
        setFormData((prev) => ({
            ...prev,
            name: cleanName,
            season: season,
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-dvh bg-neutral-950">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-32 animate-in fade-in duration-500 relative">
            {/* Header Sticky de Creación Estilo Apple */}
            <div className="sticky top-0 z-30 bg-[#07080a]/80 backdrop-blur-2xl border-b border-white/[0.08] py-4 mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 relative shadow-lg">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-6xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/productos"
                            className="w-9 h-9 rounded-2xl bg-white/[0.05] border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-[0.96] shadow-sm"
                            title="Volver al catálogo"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Nuevo Producto
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate max-w-md sm:max-w-xl">
                                {formData.name || 'Crear Nueva Prenda'}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-[0_4px_20px_rgba(229,9,20,0.35)] disabled:opacity-50 cursor-pointer active:scale-[0.97]"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>{saving ? 'Guardando...' : 'Guardar Producto'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Columna Principal */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Información General con Cascada Flexible */}
                    <ProductGeneralInfoSection
                        formData={formData}
                        onChange={handleChange}
                        teams={teams}
                        brands={brands}
                        categories={categories}
                        isAutoSlug={isAutoSlug}
                        setIsAutoSlug={setIsAutoSlug}
                        slugChecking={slugChecking}
                        slugIsUnique={slugIsUnique}
                        featuredProducts={featuredProducts}
                        suggestedBrandName={suggestedBrandName}
                        onApplySeasonMove={handleApplySeasonMove}
                        onOpenNewTeam={() => setQuickModal({ open: true, type: 'team' })}
                        onOpenNewBrand={() => setQuickModal({ open: true, type: 'brand' })}
                    />

                    {/* Plantilla de Jugadores (Dorsales) */}
                    {formData.team_id && (
                        <ProductPlayersSection
                            teamPlayers={teamPlayers}
                            selectedPlayerIds={selectedPlayerIds}
                            onTogglePlayer={togglePlayer}
                            onSelectAll={selectAllPlayers}
                            onDeselectAll={deselectAllPlayers}
                            newPlayer={newPlayer}
                            setNewPlayer={setNewPlayer}
                            addingPlayer={addingPlayer}
                            onAddPlayer={handleAddPlayer}
                        />
                    )}

                    {/* Variantes y Precios */}
                    <ProductVariantsSection
                        variants={variants}
                        availableVersions={availableVersions}
                        filteredSizes={filteredSizes}
                        allSizes={allSizes}
                        categories={categories}
                        formData={formData}
                        onAddVariant={addVariant}
                        onUpdateVariant={updateVariant}
                        onRemoveVariant={(tempId) => setVariantToDelete(tempId)}
                        onToggleVariantSize={toggleVariantSize}
                        onApplyAdultPreset={applyAdultPreset}
                        onApplySinglePreset={applySinglePreset}
                        onQuickCreateSize={addSize}
                    />
                </div>

                {/* Columna Lateral */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Imagen Principal y Galería */}
                    <ProductMediaSection
                        imageUrl={formData.image_url}
                        onImageUrlChange={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
                        galleryImages={productImages}
                        onGalleryImagesChange={setProductImages}
                        disabled={saving}
                    />

                    {/* Ligas / Competiciones (Multi-torneo) */}
                    <ProductLeaguesSection
                        leagues={leagues}
                        selectedLeagues={selectedLeagues}
                        onToggleLeague={toggleSelectedLeague}
                        primaryLeagueId={formData.league_id}
                    />

                    {/* Parches Disponibles Organizados por Torneo */}
                    <ProductPatchesSection
                        filteredPatches={filteredPatches}
                        productPatches={productPatches}
                        categoryId={formData.category_id}
                        onTogglePatch={toggleProductPatch}
                        leagues={leagues}
                        selectedLeagues={selectedLeagues}
                    />
                </div>
            </div>

            {/* Modal Confirmar Eliminación de Variante */}
            <ConfirmDialog
                open={Boolean(variantToDelete)}
                title="Eliminar Variante"
                message="¿Estás seguro de que deseas eliminar esta variante del producto?"
                confirmLabel="Eliminar"
                danger
                onConfirm={() => {
                    if (variantToDelete) {
                        removeVariant(variantToDelete);
                        setVariantToDelete(null);
                    }
                }}
                onCancel={() => setVariantToDelete(null)}
            />
            {/* Modal de Creación Rápida de Equipo / Marca */}
            <QuickCreateModal
                isOpen={quickModal.open}
                type={quickModal.type}
                leagues={leagues}
                onClose={() => setQuickModal((prev) => ({ ...prev, open: false }))}
                onCreated={(item) => {
                    if (quickModal.type === 'team') {
                        handleTeamCreated(item);
                    } else {
                        handleBrandCreated(item);
                    }
                }}
            />
        </div>
    );
}
