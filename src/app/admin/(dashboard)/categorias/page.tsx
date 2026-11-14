'use client';

import React from 'react';
import { useCategoriesManager } from '@/components/admin/categorias/useCategoriesManager';
import CategoriesHeader from '@/components/admin/categorias/CategoriesHeader';
import CategoriesTable from '@/components/admin/categorias/CategoriesTable';
import { CategoryFormModal } from '@/components/admin/categorias/CategoryFormModal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

export default function CategoriesPage() {
    const {
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
        editingCategory,
        setEditingCategory,
        saving,
        deleteTarget,
        setDeleteTarget,
        formData,
        setFormData,
        handleNameChange,
        handleSave,
        executeDelete,
        isSuperAdmin,
    } = useCategoriesManager();

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Encabezado Homologado */}
            <CategoriesHeader
                totalCount={totalCount}
                onNewCategory={() => {
                    setEditingCategory(null);
                    setIsModalOpen(true);
                }}
            />

            {/* Tabla y Buscador Spotlight */}
            <CategoriesTable
                categories={categories}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                isSuperAdmin={isSuperAdmin}
                onPageChange={setPage}
                onEditCategory={(cat) => {
                    setEditingCategory(cat);
                    setIsModalOpen(true);
                }}
                onDeleteCategory={setDeleteTarget}
            />

            {/* Modal de Crear / Editar Categoría */}
            <CategoryFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
                }}
                editingCategory={editingCategory}
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
                message="¿Estás seguro de mover esta categoría a la papelera? Podrás restaurarla más tarde desde la configuración."
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
