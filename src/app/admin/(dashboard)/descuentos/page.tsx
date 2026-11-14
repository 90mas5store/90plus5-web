'use client';

import React from 'react';
import { useDiscountsManager } from '@/components/admin/descuentos/useDiscountsManager';
import DiscountsHeader from '@/components/admin/descuentos/DiscountsHeader';
import DiscountsKpis from '@/components/admin/descuentos/DiscountsKpis';
import DiscountsTable from '@/components/admin/descuentos/DiscountsTable';
import DiscountAuditTable from '@/components/admin/descuentos/DiscountAuditTable';
import { DiscountFormModal } from '@/components/admin/descuentos/DiscountFormModal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

export default function DescuentosPage() {
    const {
        tab,
        setTab,
        codes,
        usage,
        uniqueUsedCodes,
        loading,
        toggling,
        search,
        setSearch,
        auditFilter,
        setAuditFilter,
        categories,
        leagues,
        teams,
        modalOpen,
        setModalOpen,
        editingId,
        form,
        setForm,
        saving,
        deleteTarget,
        setDeleteTarget,
        kpis,
        fetchData,
        openNew,
        openEdit,
        handleSave,
        handleToggle,
        executeDelete,
        copyCode,
    } = useDiscountsManager();

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Encabezado Homologado */}
            <DiscountsHeader
                totalCodes={kpis.totalCodes}
                loading={loading}
                onRefresh={fetchData}
                onNewCode={openNew}
            />

            {/* Tarjetas KPI Homologadas */}
            <DiscountsKpis
                activeCount={kpis.activeCount}
                totalCodes={kpis.totalCodes}
                totalRedemptions={kpis.totalRedemptions}
                totalSaved={kpis.totalSaved}
                avgPct={kpis.avgPct}
            />

            {/* Control Segmentado Apple */}
            <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setTab('codes')}
                    className={`px-4 py-1.5 rounded-lg sm:rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                        tab === 'codes'
                            ? 'bg-white text-black font-extrabold shadow-xs'
                            : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold'
                    }`}
                >
                    Códigos Promocionales
                </button>
                <button
                    type="button"
                    onClick={() => setTab('audit')}
                    className={`px-4 py-1.5 rounded-lg sm:rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                        tab === 'audit'
                            ? 'bg-white text-black font-extrabold shadow-xs'
                            : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold'
                    }`}
                >
                    Auditoría de Usos
                </button>
            </div>

            {/* Contenido Activo */}
            {tab === 'codes' ? (
                <DiscountsTable
                    codes={codes}
                    loading={loading}
                    toggling={toggling}
                    search={search}
                    onSearchChange={setSearch}
                    onCopyCode={copyCode}
                    onToggleCode={handleToggle}
                    onEditCode={openEdit}
                    onDeleteCode={setDeleteTarget}
                    onNewCode={openNew}
                />
            ) : (
                <DiscountAuditTable
                    usage={usage}
                    uniqueUsedCodes={uniqueUsedCodes}
                    loading={loading}
                    auditFilter={auditFilter}
                    onFilterChange={setAuditFilter}
                />
            )}

            {/* Modal de Crear / Editar Código */}
            <DiscountFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                editingId={editingId}
                form={form}
                setForm={setForm}
                categories={categories}
                leagues={leagues}
                teams={teams}
                saving={saving}
                onSave={handleSave}
            />

            {/* Diálogo de Confirmación */}
            <ConfirmDialog
                open={deleteTarget !== null}
                title="Eliminar Código"
                message={`¿Estás seguro de eliminar el código "${deleteTarget?.code}"? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                danger
                onConfirm={() => {
                    if (deleteTarget) {
                        executeDelete(deleteTarget.id);
                        setDeleteTarget(null);
                    }
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
