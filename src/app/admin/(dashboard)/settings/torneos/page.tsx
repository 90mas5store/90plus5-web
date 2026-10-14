"use client";

import React from "react";
import { Radio, RefreshCw, Save, Loader2 } from "lucide-react";
import TorneosKPIs from "@/components/admin/torneos/TorneosKPIs";
import TorneosDiscoverySection from "@/components/admin/torneos/TorneosDiscoverySection";
import TorneosManualForm from "@/components/admin/torneos/TorneosManualForm";
import TorneosListSection from "@/components/admin/torneos/TorneosListSection";
import { useTorneosManager } from "@/components/admin/torneos/useTorneosManager";

export default function AdminTorneosSettingsPage() {
    const {
        loading,
        saving,
        updatedAt,
        loadData,
        handleSaveAll,

        // Descubrimiento
        discoveryQuery,
        setDiscoveryQuery,
        matchedTeams,
        matchedSuggestedLeagues,
        suggestedLeagues,
        activeSlugsSet,
        allTrackedSlugsSet,
        handleAddSuggestedLeague,
        handleOpenManualWithQuery,

        // Manual
        showManualForm,
        setShowManualForm,
        manualSlug,
        setManualSlug,
        manualName,
        setManualName,
        manualCategory,
        setManualCategory,
        manualCountry,
        setManualCountry,
        testingManualSlug,
        testResult,
        handleTestManualSlug,
        handleAddManualLeague,

        // Lista y filtros
        trackedLeagues,
        filteredActiveLeagues,
        activeCount,
        copasCount,
        disabledLeagues,
        customLeagues,
        categoryFilter,
        setCategoryFilter,
        listSearch,
        setListSearch,
        toggleLeague,
        handleDeleteCustom,
    } = useTorneosManager();

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
            {/* ── ENCABEZADO ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                            Tiempo Real ESPN
                        </span>
                        <span className="text-gray-500 text-xs">• Sin necesidad de redeploy</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Torneos & Copas Matchday
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 max-w-2xl">
                        Gestiona qué ligas y copas en vivo consulta el sistema en tiempo real. Busca por nombre de equipo (ej. <em>Boca, Real Madrid</em>) o por país/torneo (ej. <em>Colombia, Copa Argentina</em>) y agrégalos con 1 clic.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-gray-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
                        title="Recargar datos"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
                    </button>

                    <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={saving || loading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 active:scale-[0.98] text-white font-bold text-sm shadow-[0_4px_20px_rgba(229,9,20,0.35)] transition-all cursor-pointer disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Guardar Cambios</span>
                    </button>
                </div>
            </div>

            {/* ── KPIS RÁPIDOS ── */}
            <TorneosKPIs
                activeCount={activeCount}
                totalTracked={trackedLeagues.length}
                copasCount={copasCount}
                customCount={customLeagues.length}
                updatedAt={updatedAt}
            />

            {/* ── BUSCADOR PREDICTIVO INTELIGENTE ── */}
            <TorneosDiscoverySection
                discoveryQuery={discoveryQuery}
                setDiscoveryQuery={setDiscoveryQuery}
                matchedTeams={matchedTeams}
                matchedSuggestedLeagues={matchedSuggestedLeagues}
                suggestedLeagues={suggestedLeagues}
                activeSlugsSet={activeSlugsSet}
                allTrackedSlugsSet={allTrackedSlugsSet}
                onToggleLeague={toggleLeague}
                onAddSuggestedLeague={handleAddSuggestedLeague}
                onOpenManualWithQuery={handleOpenManualWithQuery}
            />

            {/* ── MODO MANUAL AVANZADO (COLAPSABLE) ── */}
            <TorneosManualForm
                showManualForm={showManualForm}
                setShowManualForm={setShowManualForm}
                manualSlug={manualSlug}
                setManualSlug={setManualSlug}
                manualName={manualName}
                setManualName={setManualName}
                manualCategory={manualCategory}
                setManualCategory={setManualCategory}
                manualCountry={manualCountry}
                setManualCountry={setManualCountry}
                testingManualSlug={testingManualSlug}
                testResult={testResult}
                onTestManualSlug={handleTestManualSlug}
                onAddManualLeague={handleAddManualLeague}
            />

            {/* ── LISTA DE TORNEOS ACTIVOS EN SEGUIMIENTO ── */}
            <TorneosListSection
                trackedLeagues={trackedLeagues}
                filteredActiveLeagues={filteredActiveLeagues}
                activeCount={activeCount}
                disabledLeagues={disabledLeagues}
                customLeagues={customLeagues}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                listSearch={listSearch}
                setListSearch={setListSearch}
                onToggleLeague={toggleLeague}
                onDeleteCustom={handleDeleteCustom}
            />

            {/* Botón flotante móvil */}
            <div className="fixed bottom-4 right-4 z-40 sm:hidden">
                <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving || loading}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#E50914] text-white font-bold text-sm shadow-[0_8px_30px_rgba(229,9,20,0.5)] active:scale-95 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Guardar Cambios</span>
                </button>
            </div>
        </div>
    );
}
