"use client";

import React from "react";
import { Monitor, Save, Loader2 } from "lucide-react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import SpecialBannerProductSelector from "@/components/admin/SpecialBannerProductSelector";
import SpecialBannersSidebar from "@/components/admin/special-banners/SpecialBannersSidebar";
import SpecialBannerCollectionSection from "@/components/admin/special-banners/SpecialBannerCollectionSection";
import SpecialBannerMediaSection from "@/components/admin/special-banners/SpecialBannerMediaSection";
import SpecialBannerPreview from "@/components/admin/special-banners/SpecialBannerPreview";
import SpecialBannerContentSection from "@/components/admin/special-banners/SpecialBannerContentSection";
import { useSpecialBannersManager } from "@/components/admin/special-banners/useSpecialBannersManager";

export default function SpecialBannersPage() {
    const {
        banners,
        loading,
        selectedBannerId,
        deleteTarget,
        setDeleteTarget,
        isCreating,
        formData,
        setFormData,
        previewOpen,
        setPreviewOpen,
        previewMode,
        setPreviewMode,
        saving,
        collectionProducts,
        setCollectionProducts,
        isProductSelectorOpen,
        setIsProductSelectorOpen,
        loadingProducts,

        handleSelectBanner,
        handleCreateNew,
        handleDuplicate,
        handleTitleChange,
        handleSlugChange,
        updateField,
        handleSubmit,
        handleDelete,
        executeDelete,
        handleToggleActive,
        moveProductInCollection,
        removeProductFromCollection,
    } = useSpecialBannersManager();

    return (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 animate-in fade-in duration-500 h-auto md:h-[calc(100dvh-140px)]">

            {/* 1. Barra Lateral con Lista de Banners */}
            <SpecialBannersSidebar
                banners={banners}
                loading={loading}
                selectedBannerId={selectedBannerId}
                onSelectBanner={handleSelectBanner}
                onCreateNew={handleCreateNew}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
            />

            {/* 2. Panel Principal de Detalle y Edición */}
            <div className="flex-1 bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative h-full">
                {(!selectedBannerId && !isCreating) ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                            <Monitor size={40} className="opacity-20" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-medium text-gray-300">Selecciona un banner o crea uno nuevo</p>
                            <p className="text-sm">Configura medios, diseño y su colección de prendas exclusivas.</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        {/* Header del Formulario */}
                        <div className="px-4 md:px-8 py-4 md:py-5 border-b border-white/5 bg-[#161616] flex flex-wrap gap-3 md:gap-4 justify-between items-center shrink-0 z-10">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-3">
                                    {isCreating ? "Crear Banner & Colección" : "Editar Banner & Colección"}
                                    <span className="text-[10px] font-mono font-normal text-gray-500 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                        {formData.slug || (formData.id ? formData.id.slice(0, 8) : "NEW")}
                                    </span>
                                </h2>
                            </div>

                            <div className="flex items-center gap-4 bg-black/20 p-1.5 rounded-xl border border-white/5">
                                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all select-none border border-transparent ${formData.active ? "bg-green-500/10 text-green-400 border-green-500/20" : "hover:bg-white/5 text-gray-500"}`}>
                                    <input
                                        type="checkbox"
                                        checked={formData.active || false}
                                        onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                        className="sr-only"
                                    />
                                    <div className={`w-2 h-2 rounded-full ${formData.active ? "bg-green-500 shadow-[0_0_5px_currentColor]" : "bg-gray-600"}`} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{formData.active ? "Activo" : "Inactivo"}</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-primary hover:bg-white hover:text-black text-black px-6 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar Todo
                            </button>
                        </div>

                        {/* Cuerpo con Secciones Modularizadas */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                            <div className="max-w-5xl mx-auto space-y-8 md:space-y-10">
                                {/* Sección 1: Colección Especial de Prendas */}
                                <SpecialBannerCollectionSection
                                    products={collectionProducts}
                                    loading={loadingProducts}
                                    onOpenSelector={() => setIsProductSelectorOpen(true)}
                                    onMoveProduct={moveProductInCollection}
                                    onRemoveProduct={removeProductFromCollection}
                                />

                                {/* Sección 2: Medios de Fondo & Focal Points & Branding */}
                                <SpecialBannerMediaSection
                                    formData={formData}
                                    onUpdateField={updateField}
                                />

                                {/* Sección 3: Live Preview Desktop / Mobile */}
                                <SpecialBannerPreview
                                    formData={formData}
                                    previewOpen={previewOpen}
                                    onTogglePreview={() => setPreviewOpen(p => !p)}
                                    previewMode={previewMode}
                                    onChangePreviewMode={setPreviewMode}
                                />

                                <hr className="border-white/5" />

                                {/* Sección 4: Textos, Badges, Slug y Enlaces */}
                                <SpecialBannerContentSection
                                    formData={formData}
                                    onTitleChange={handleTitleChange}
                                    onSlugChange={handleSlugChange}
                                    onUpdateField={updateField}
                                />
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* Modal de confirmación para eliminar */}
            <ConfirmDialog
                open={deleteTarget !== null}
                title="Eliminar banner especial"
                message="¿Borrar permanentemente este banner especial y su colección asociada? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                onConfirm={() => { if (deleteTarget) executeDelete(deleteTarget); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* Modal Selector de Prendas para la Colección */}
            <SpecialBannerProductSelector
                isOpen={isProductSelectorOpen}
                onClose={() => setIsProductSelectorOpen(false)}
                selectedProducts={collectionProducts}
                onChange={setCollectionProducts}
                bannerTitle={formData.title}
            />
        </div>
    );
}
