'use client';

import React from 'react';
import { useLeaguesManager } from '@/components/admin/ligas/useLeaguesManager';
import LeaguesHeader from '@/components/admin/ligas/LeaguesHeader';
import LeaguesTable from '@/components/admin/ligas/LeaguesTable';
import { LeagueFormModal } from '@/components/admin/ligas/LeagueFormModal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

export default function LeaguesPage() {
    const {
        leagues,
        categories,
        loading,
        search,
        setSearch,
        page,
        setPage,
        totalCount,
        totalPages,
        isModalOpen,
        setIsModalOpen,
        editingLeague,
        setEditingLeague,
        saving,
        deleteTarget,
        setDeleteTarget,
        formData,
        setFormData,
        handleNameChange,
        handleSave,
        executeDelete,
        isSuperAdmin,
    } = useLeaguesManager();

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Encabezado Homologado */}
            <LeaguesHeader
                totalCount={totalCount}
                onNewLeague={() => {
                    setEditingLeague(null);
                    setIsModalOpen(true);
                }}
            />

            {/* Tabla y Buscador Spotlight */}
            <LeaguesTable
                leagues={leagues}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                isSuperAdmin={isSuperAdmin}
                onPageChange={setPage}
                onEditLeague={(league) => {
                    setEditingLeague(league);
                    setIsModalOpen(true);
                }}
                onDeleteLeague={setDeleteTarget}
            />

            {/* Modal de Crear / Editar Liga */}
            <LeagueFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingLeague(null);
                }}
                editingLeague={editingLeague}
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                saving={saving}
                onNameChange={handleNameChange}
                onSave={handleSave}
            />

            {/* Diálogo de Confirmación */}
            <ConfirmDialog
                open={deleteTarget !== null}
                title="Mover a Papelera"
                message="¿Estás seguro de mover esta liga a la papelera? Podrás restaurarla más tarde desde la configuración."
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
