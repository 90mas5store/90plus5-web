"use client";

import React from "react";
import { Scissors } from "lucide-react";
import { useAdminRole } from "@/hooks/useAdminRole";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { TABS } from "@/components/admin/estilos/types";
import PatchesTab from "@/components/admin/estilos/PatchesTab";
import SizesTab from "@/components/admin/estilos/SizesTab";
import PlayersTab from "@/components/admin/estilos/PlayersTab";
import { useEstilosManager } from "@/components/admin/estilos/useEstilosManager";

export default function EstilosPage() {
    const { isSuperAdmin } = useAdminRole();

    const {
        activeTab,
        setActiveTab,

        // Parches
        patches,
        patchesLoading,
        patchSaving,
        editingPatch,
        patchForm,
        setPatchForm,
        patchDeleteTarget,
        setPatchDeleteTarget,
        leagues,
        categories,
        openEditPatch,
        openNewPatch,
        handleSavePatch,
        handleDeletePatch,

        // Tallas
        sizes,
        sizesLoading,
        sizeSaving,
        editingSize,
        sizeForm,
        setSizeForm,
        sizeDeleteTarget,
        setSizeDeleteTarget,
        openEditSize,
        openNewSize,
        handleSaveSize,
        handleDeleteSize,
        handleGeneratePreset,
        handleCleanupDuplicates,

        // Plantillas
        teams,
        selectedTeamId,
        setSelectedTeamId,
        players,
        playersLoading,
        newPlayer,
        setNewPlayer,
        addingPlayer,
        playerDeleteTarget,
        setPlayerDeleteTarget,
        editingPlayer,
        setEditingPlayer,
        editPlayerForm,
        setEditPlayerForm,
        savingPlayer,
        showInactive,
        setShowInactive,
        handleAddPlayer,
        handleDeletePlayer,
        handleRestorePlayer,
        openEditPlayer,
        handleSavePlayer,
    } = useEstilosManager();

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* ENCABEZADO HOMOLOGADO */}
            <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <Scissors className="w-5 h-5" />
                    </span>
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                            Personalización & Estilos
                        </h1>
                        <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                            Gestión centralizada de parches oficiales, tallas por categoría y dorsales de jugadores.
                        </p>
                    </div>
                </div>

                {/* SEGMENTED CONTROL APPLE */}
                <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] overflow-x-auto shrink-0">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`text-xs px-3.5 py-1.5 rounded-lg sm:rounded-xl transition-all whitespace-nowrap cursor-pointer active:scale-[0.98] ${
                                    isActive
                                        ? "bg-white text-black font-extrabold shadow-xs"
                                        : "text-neutral-300 hover:text-white hover:bg-white/5 font-semibold"
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── TAB: PARCHES ── */}
            {activeTab === "parches" && (
                <PatchesTab
                    patches={patches}
                    patchesLoading={patchesLoading}
                    patchSaving={patchSaving}
                    editingPatch={editingPatch}
                    patchForm={patchForm}
                    setPatchForm={setPatchForm}
                    leagues={leagues}
                    categories={categories}
                    isSuperAdmin={isSuperAdmin}
                    onOpenEditPatch={openEditPatch}
                    onOpenNewPatch={openNewPatch}
                    onSavePatch={handleSavePatch}
                    onDeletePatch={(id) => setPatchDeleteTarget(id)}
                />
            )}

            {/* ── TAB: TALLAS ── */}
            {activeTab === "tallas" && (
                <SizesTab
                    sizes={sizes}
                    sizesLoading={sizesLoading}
                    sizeSaving={sizeSaving}
                    editingSize={editingSize}
                    sizeForm={sizeForm}
                    setSizeForm={setSizeForm}
                    categories={categories}
                    isSuperAdmin={isSuperAdmin}
                    onOpenEditSize={openEditSize}
                    onOpenNewSize={openNewSize}
                    onSaveSize={handleSaveSize}
                    onOpenDeleteSize={(id) => setSizeDeleteTarget(id)}
                    onGeneratePreset={handleGeneratePreset}
                    onCleanupDuplicates={handleCleanupDuplicates}
                />
            )}

            {/* ── TAB: PLANTILLAS ── */}
            {activeTab === "plantillas" && (
                <PlayersTab
                    teams={teams}
                    selectedTeamId={selectedTeamId}
                    setSelectedTeamId={setSelectedTeamId}
                    players={players}
                    playersLoading={playersLoading}
                    newPlayer={newPlayer}
                    setNewPlayer={setNewPlayer}
                    addingPlayer={addingPlayer}
                    editingPlayer={editingPlayer}
                    setEditingPlayer={setEditingPlayer}
                    editPlayerForm={editPlayerForm}
                    setEditPlayerForm={setEditPlayerForm}
                    savingPlayer={savingPlayer}
                    showInactive={showInactive}
                    setShowInactive={setShowInactive}
                    isSuperAdmin={isSuperAdmin}
                    onAddPlayer={handleAddPlayer}
                    onSavePlayer={handleSavePlayer}
                    onOpenEditPlayer={openEditPlayer}
                    onOpenDeletePlayer={(id) => setPlayerDeleteTarget(id)}
                    onRestorePlayer={handleRestorePlayer}
                />
            )}

            {/* Modal eliminar parche */}
            <ConfirmDialog
                open={patchDeleteTarget !== null}
                title="Eliminar parche"
                message="¿Eliminar este parche? Se quitará de todos los productos que lo tengan asignado."
                confirmLabel="Eliminar"
                danger
                onConfirm={() => {
                    if (patchDeleteTarget) handleDeletePatch(patchDeleteTarget);
                }}
                onCancel={() => setPatchDeleteTarget(null)}
            />

            {/* Modal eliminar talla */}
            <ConfirmDialog
                open={sizeDeleteTarget !== null}
                title="Eliminar talla"
                message="Si la talla está en uso por productos existentes se desactivará automáticamente (no se eliminará). Si no está en uso, se eliminará definitivamente."
                confirmLabel="Continuar"
                danger
                onConfirm={() => {
                    if (sizeDeleteTarget) handleDeleteSize(sizeDeleteTarget);
                }}
                onCancel={() => setSizeDeleteTarget(null)}
            />

            {/* Modal desactivar jugador */}
            <ConfirmDialog
                open={playerDeleteTarget !== null}
                title="Desactivar jugador"
                message="¿Desactivar este jugador? Puedes restaurarlo desde la lista de inactivos."
                confirmLabel="Desactivar"
                danger
                onConfirm={() => {
                    if (playerDeleteTarget) handleDeletePlayer(playerDeleteTarget);
                }}
                onCancel={() => setPlayerDeleteTarget(null)}
            />
        </div>
    );
}
