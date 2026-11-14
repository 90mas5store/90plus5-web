'use client';

import React from 'react';
import { useTeamsManager } from '@/components/admin/equipos/useTeamsManager';
import TeamsHeader from '@/components/admin/equipos/TeamsHeader';
import TeamsFilters from '@/components/admin/equipos/TeamsFilters';
import TeamsTable from '@/components/admin/equipos/TeamsTable';
import { TeamFormModal } from '@/components/admin/equipos/TeamFormModal';
import { TeamMatchdayModal } from '@/components/admin/equipos/TeamMatchdayModal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

export default function TeamsPage() {
    const {
        teams,
        allTeamsList,
        leagues,
        brands,
        teamBrandsMap,
        loading,
        search,
        setSearch,
        activeTab,
        setActiveTab,
        page,
        setPage,
        totalCount,
        totalPages,
        isModalOpen,
        setIsModalOpen,
        editingTeam,
        setEditingTeam,
        saving,
        deleteTarget,
        setDeleteTarget,
        matchdayModalTeam,
        setMatchdayModalTeam,
        matchdayConfig,
        setMatchdayConfig,
        formData,
        setFormData,
        handleSave,
        openMatchdayModal,
        handleSaveMatchdayConfig,
        executeDelete,
        isSuperAdmin,
    } = useTeamsManager();

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Encabezado Homologado */}
            <TeamsHeader
                totalCount={totalCount}
                onNewTeam={() => {
                    setEditingTeam(null);
                    setIsModalOpen(true);
                }}
            />

            {/* Filtros & Búsqueda Spotlight */}
            <TeamsFilters
                search={search}
                onSearchChange={setSearch}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Tabla de Equipos con Estilo Apple */}
            <TeamsTable
                teams={teams}
                brands={brands}
                teamBrandsMap={teamBrandsMap}
                loading={loading}
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                isSuperAdmin={isSuperAdmin}
                onPageChange={setPage}
                onEditTeam={(team) => {
                    setEditingTeam(team);
                    setIsModalOpen(true);
                }}
                onDeleteTeam={setDeleteTarget}
                onOpenMatchday={openMatchdayModal}
            />

            {/* Modal de Crear / Editar Equipo */}
            <TeamFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTeam(null);
                }}
                editingTeam={editingTeam}
                formData={formData}
                setFormData={setFormData}
                leagues={leagues}
                brands={brands}
                saving={saving}
                onSave={handleSave}
            />

            {/* Modal Matchday en Vivo */}
            <TeamMatchdayModal
                team={matchdayModalTeam}
                onClose={() => setMatchdayModalTeam(null)}
                matchdayConfig={matchdayConfig}
                setMatchdayConfig={setMatchdayConfig}
                allTeamsList={allTeamsList}
                saving={saving}
                onSave={handleSaveMatchdayConfig}
            />

            {/* Diálogo de Confirmación */}
            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Mover a Papelera"
                message="¿Estás seguro de mover este equipo a la papelera? Podrás restaurarlo más tarde desde la papelera."
                confirmLabel="Mover a Papelera"
                danger
                onConfirm={() => {
                    if (deleteTarget) {
                        executeDelete(deleteTarget);
                        setDeleteTarget(null);
                    }
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
