'use client';

import React from 'react';
import { useBrandsManager } from '@/components/admin/marcas/useBrandsManager';
import BrandsHeader from '@/components/admin/marcas/BrandsHeader';
import BrandsTable from '@/components/admin/marcas/BrandsTable';
import { BrandFormModal } from '@/components/admin/marcas/BrandFormModal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

export default function BrandsPage() {
    const {
        brands,
        loading,
        search,
        setSearch,
        page,
        setPage,
        totalCount,
        totalPages,
        isModalOpen,
        setIsModalOpen,
        editingBrand,
        setEditingBrand,
        saving,
        deleteTarget,
        setDeleteTarget,
        formData,
        setFormData,
        handleNameChange,
        handleSave,
        executeDelete,
        isSuperAdmin,
    } = useBrandsManager();

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Encabezado Homologado */}
            <BrandsHeader
                totalCount={totalCount}
                onNewBrand={() => {
                    setEditingBrand(null);
                    setIsModalOpen(true);
                }}
            />

            {/* Tabla y Buscador Spotlight */}
            <BrandsTable
                brands={brands}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                isSuperAdmin={isSuperAdmin}
                onPageChange={setPage}
                onEditBrand={(brand) => {
                    setEditingBrand(brand);
                    setIsModalOpen(true);
                }}
                onDeleteBrand={setDeleteTarget}
            />

            {/* Modal de Crear / Editar Marca */}
            <BrandFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingBrand(null);
                }}
                editingBrand={editingBrand}
                formData={formData}
                setFormData={setFormData}
                saving={saving}
                onNameChange={handleNameChange}
                onSave={handleSave}
            />

            {/* Diálogo de Confirmación */}
            <ConfirmDialog
                open={deleteTarget !== null}
                title="Mover a Papelera"
                message="¿Estás seguro de mover esta marca a la papelera? Podrás restaurarla más tarde desde la configuración."
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
