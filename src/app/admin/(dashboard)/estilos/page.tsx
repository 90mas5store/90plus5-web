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
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 pb-0 mb-8 pt-6 -mx-4 px-4 md:mx-0 md:px-0 md:pt-8">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                        <Scissors className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Personalización</h1>
                        <p className="text-gray-500 text-xs">Gestión de parches, tallas y plantillas de jugadores</p>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all border-b-2 cursor-pointer ${
                                activeTab === tab.key
                                    ? "text-white border-white"
                                    : "text-gray-500 border-transparent hover:text-gray-300"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
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
                    onDeletePatch={id => setPatchDeleteTarget(id)}
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
                    onOpenDeleteSize={id => setSizeDeleteTarget(id)}
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
                    onOpenDeletePlayer={id => setPlayerDeleteTarget(id)}
                    onRestorePlayer={handleRestorePlayer}
                />
            )}

            {/* Modal eliminar parche */}
            <ConfirmDialog
                open={patchDeleteTarget !== null}
                title="Eliminar parche"
                message="¿Eliminar este parche? Se quitará de todos los productos que lo tengan asignado."
                confirmLabel="Eliminar"
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
                onConfirm={() => {
                    if (playerDeleteTarget) handleDeletePlayer(playerDeleteTarget);
                }}
                onCancel={() => setPlayerDeleteTarget(null)}
            />
        </div>
    );
}
