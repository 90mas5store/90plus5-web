'use client';

import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useEditProductForm } from '@/components/admin/products/useEditProductForm';
import ProductEditHeader from '@/components/admin/products/ProductEditHeader';
import ProductGeneralInfoSection from '@/components/admin/products/ProductGeneralInfoSection';
import ProductVariantsSection from '@/components/admin/products/ProductVariantsSection';
import ProductLeaguesSection from '@/components/admin/products/ProductLeaguesSection';
import ProductPatchesSection from '@/components/admin/products/ProductPatchesSection';
import ProductPlayersSection from '@/components/admin/products/ProductPlayersSection';
import ProductMediaSection from '@/components/admin/products/ProductMediaSection';

export default function EditProductPage() {
    const params = useParams();
    const id =
        typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

    const {
        loading,
        saving,
        isSuperAdmin,
        teams,
        leagues,
        categories,
        brands,
        availableVersions,
        featuredProducts,
        filteredSizes,
        filteredPatches,
        formData,
        setFormData,
        handleChange,
        isAutoSlug,
        setIsAutoSlug,
        slugChecking,
        slugIsUnique,
        variants,
        setVariants,
        addVariant,
        updateVariant,
        removeVariant,
        toggleVariantSize,
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
        confirmDeleteProduct,
        setConfirmDeleteProduct,
        handleDeleteProduct,
        handleSave,
    } = useEditProductForm(id);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-dvh bg-neutral-950">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-32 animate-in fade-in duration-500 relative">
            {/* Header Sticky */}
            <ProductEditHeader
                name={formData.name}
                id={id}
                isSuperAdmin={isSuperAdmin}
                saving={saving}
                onSave={handleSave}
                onRequestDelete={() => setConfirmDeleteProduct(true)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Columna Principal */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Información General */}
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
                        currentProductId={id}
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
                        formData={formData}
                        onAddVariant={addVariant}
                        onUpdateVariant={updateVariant}
                        onRemoveVariant={removeVariant}
                        onToggleVariantSize={toggleVariantSize}
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

                    {/* Ligas Múltiples */}
                    <ProductLeaguesSection
                        leagues={leagues}
                        selectedLeagues={selectedLeagues}
                        onToggleLeague={toggleSelectedLeague}
                    />

                    {/* Parches */}
                    <ProductPatchesSection
                        filteredPatches={filteredPatches}
                        productPatches={productPatches}
                        categoryId={formData.category_id}
                        onTogglePatch={toggleProductPatch}
                    />
                </div>
            </div>

            {/* Confirmación para eliminar variante */}
            <ConfirmDialog
                open={variantToDelete !== null}
                title="Eliminar variante"
                message="¿Estás seguro de eliminar esta variante del producto?"
                confirmLabel="Eliminar"
                onConfirm={() => {
                    if (variantToDelete) {
                        setVariants((prev) => prev.filter((v) => v.tempId !== variantToDelete));
                        setVariantToDelete(null);
                    }
                }}
                onCancel={() => setVariantToDelete(null)}
            />

            {/* Confirmación para eliminar producto completo */}
            <ConfirmDialog
                open={confirmDeleteProduct}
                title="Eliminar Producto Definitivamente"
                message={`¿Estás seguro de eliminar "${formData.name}"? Esta acción no se puede deshacer y borrará variantes, imágenes y datos vinculados.`}
                confirmLabel="Eliminar Definitivamente"
                onConfirm={handleDeleteProduct}
                onCancel={() => setConfirmDeleteProduct(false)}
            />
        </div>
    );
}
