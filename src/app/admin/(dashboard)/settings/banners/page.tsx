"use client";

import React from "react";
import { Monitor, Save, Loader2 } from "lucide-react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import BannersSidebar from "@/components/admin/banners/BannersSidebar";
import BannerMediaSection from "@/components/admin/banners/BannerMediaSection";
import BannerPreview from "@/components/admin/banners/BannerPreview";
import BannerContentSection from "@/components/admin/banners/BannerContentSection";
import { useBannersManager } from "@/components/admin/banners/useBannersManager";

export default function BannersPage() {
    const {
        banners,
        loading,
        selectedBannerId,
        deleteTarget,
        setDeleteTarget,
        isCreating,
        saving,
        formData,
        setFormData,
        categories,
        leagues,
        linkType,
        setLinkType,
        selectedCatalogFilter,
        setSelectedCatalogFilter,
        selectedSlug,
        setSelectedSlug,
        previewOpen,
        setPreviewOpen,
        previewMode,
        setPreviewMode,

        handleSelectBanner,
        handleCreateNew,
        updateField,
        handleSubmit,
        handleDelete,
        executeDelete,
    } = useBannersManager();

    return (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 animate-in fade-in duration-500 h-auto md:h-[calc(100dvh-140px)]">

            {/* === LISTA LATERAL (Master) === */}
            <BannersSidebar
                banners={banners}
                loading={loading}
                selectedBannerId={selectedBannerId}
                onSelectBanner={handleSelectBanner}
                onCreateNew={handleCreateNew}
                onDelete={handleDelete}
            />

            {/* === PANEL DE DETALLE (Main) === */}
            <div className="flex-1 bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative h-full">

                {(!selectedBannerId && !isCreating) ? (
                    // EMPTY STATE
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                            <Monitor size={40} className="opacity-20" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-medium text-gray-300">Selecciona un banner</p>
                            <p className="text-sm">Edita sus detalles visuales y de enlace.</p>
                        </div>
                    </div>
                ) : (
                    // EDIT FORM
                    <form onSubmit={handleSubmit} className="flex flex-col h-full">

                        {/* --- HEADER FORMULARIO --- */}
                        <div className="px-4 md:px-8 py-4 md:py-5 border-b border-white/5 bg-[#161616] flex flex-wrap gap-3 md:gap-4 justify-between items-center shrink-0 z-10">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-3">
                                    {isCreating ? "Crear Nuevo Banner" : "Editar Banner"}
                                    <span className="text-[10px] font-mono font-normal text-gray-500 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                        {formData.id ? formData.id.slice(0, 8) : "NEW"}
                                    </span>
                                </h2>
                            </div>

                            {/* GLOBAL CONTROLS */}
                            <div className="flex items-center gap-4 bg-black/20 p-1.5 rounded-xl border border-white/5">
                                {/* Switch ACTIVO */}
                                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all select-none border border-transparent ${formData.active ? "bg-green-500/10 text-green-400 border-green-500/20" : "hover:bg-white/5 text-gray-500"}`}>
                                    <input
                                        type="checkbox"
                                        checked={formData.active || false}
                                        onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-2 h-2 rounded-full ${formData.active ? "bg-green-500 shadow-[0_0_5px_currentColor]" : "bg-gray-600"}`} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{formData.active ? "Sistema Activo" : "Sistema Inactivo"}</span>
                                </label>

                                <div className="w-px h-4 bg-white/10" />

                                {/* Switch HOME */}
                                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all select-none border border-transparent ${formData.show_on_home ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "hover:bg-white/5 text-gray-500"}`}>
                                    <input
                                        type="checkbox"
                                        checked={formData.show_on_home || false}
                                        onChange={e => setFormData(prev => ({ ...prev, show_on_home: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <Monitor size={14} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Visible en Home</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-primary hover:bg-white hover:text-black text-black px-6 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar
                            </button>
                        </div>

                        {/* --- BODY FORMULARIO --- */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                            <div className="max-w-5xl mx-auto space-y-6 md:space-y-10">
                                {/* 1. Medios y Punto Focal */}
                                <BannerMediaSection
                                    formData={formData}
                                    onUpdateField={updateField}
                                />

                                {/* 2. Live Preview */}
                                <BannerPreview
                                    formData={formData}
                                    previewOpen={previewOpen}
                                    onTogglePreview={() => setPreviewOpen(p => !p)}
                                    previewMode={previewMode}
                                    onChangePreviewMode={setPreviewMode}
                                />

                                <hr className="border-white/5" />

                                {/* 3. Textos y Configuración de Destino */}
                                <BannerContentSection
                                    formData={formData}
                                    onUpdateField={updateField}
                                    linkType={linkType}
                                    setLinkType={setLinkType}
                                    selectedCatalogFilter={selectedCatalogFilter}
                                    setSelectedCatalogFilter={setSelectedCatalogFilter}
                                    selectedSlug={selectedSlug}
                                    setSelectedSlug={setSelectedSlug}
                                    categories={categories}
                                    leagues={leagues}
                                />
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* Modal de confirmación para eliminar */}
            <ConfirmDialog
                open={deleteTarget !== null}
                title="Eliminar banner"
                message="¿Borrar permanentemente este banner? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                onConfirm={() => { if (deleteTarget) executeDelete(deleteTarget); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
