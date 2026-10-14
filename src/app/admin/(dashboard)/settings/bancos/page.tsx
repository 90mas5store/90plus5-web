'use client'

import React from 'react'
import { CreditCard, Building2 } from 'lucide-react'
import { usePaymentSettingsManager } from '@/components/admin/bancos/usePaymentSettingsManager'
import PaymentMethodsTab from '@/components/admin/bancos/PaymentMethodsTab'
import BankAccountsTab from '@/components/admin/bancos/BankAccountsTab'
import PaymentMethodModal from '@/components/admin/bancos/PaymentMethodModal'
import BankAccountModal from '@/components/admin/bancos/BankAccountModal'

export default function PaymentSettingsPage() {
    const {
        activeTab,
        setActiveTab,

        // Métodos
        methods,
        loadingMethods,
        editingMethod,
        setEditingMethod,
        isMethodModalOpen,
        setIsMethodModalOpen,
        openNewMethodModal,
        openEditMethodModal,
        handleMoveMethod,
        handleToggleMethodActive,
        handleToggleMethodComingSoon,
        handleSaveMethodSubmit,
        handleDeleteMethodClick,

        // Bancos
        banks,
        loadingBanks,
        editingBank,
        setEditingBank,
        isBankModalOpen,
        setIsBankModalOpen,
        openNewBankModal,
        openEditBankModal,
        handleMoveBank,
        handleToggleBankActive,
        handleSaveBankSubmit,
        handleDeleteBankClick,
        handleFileUpload,
    } = usePaymentSettingsManager()

    return (
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-28">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 md:gap-3">
                        <CreditCard className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                        Formas de Pago y Cuentas Bancarias
                    </h1>
                    <p className="text-gray-400 mt-1 md:mt-2 text-xs md:text-sm">
                        Administra las opciones de pago en el checkout, configura cuentas de transferencia o activa el aviso de &quot;Próximamente&quot;.
                    </p>
                </div>
            </div>

            {/* PESTAÑAS DE NAVEGACIÓN */}
            <div className="flex border-b border-white/10">
                <button
                    type="button"
                    onClick={() => setActiveTab('methods')}
                    className={`px-5 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        activeTab === 'methods'
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                >
                    <CreditCard className="w-4 h-4" /> Formas de Pago ({methods.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('banks')}
                    className={`px-5 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        activeTab === 'banks'
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                >
                    <Building2 className="w-4 h-4" /> Cuentas Bancarias ({banks.length})
                </button>
            </div>

            {/* 💳 TAB 1: MÉTODOS DE PAGO */}
            {activeTab === 'methods' && (
                <PaymentMethodsTab
                    methods={methods}
                    loading={loadingMethods}
                    onNewMethod={openNewMethodModal}
                    onEditMethod={openEditMethodModal}
                    onDeleteMethod={handleDeleteMethodClick}
                    onToggleActive={handleToggleMethodActive}
                    onToggleComingSoon={handleToggleMethodComingSoon}
                    onMoveMethod={handleMoveMethod}
                />
            )}

            {/* 🏦 TAB 2: CUENTAS BANCARIAS */}
            {activeTab === 'banks' && (
                <BankAccountsTab
                    banks={banks}
                    loading={loadingBanks}
                    onNewBank={openNewBankModal}
                    onEditBank={openEditBankModal}
                    onDeleteBank={handleDeleteBankClick}
                    onToggleActive={handleToggleBankActive}
                    onMoveBank={handleMoveBank}
                />
            )}

            {/* 📝 MODAL EDITAR MÉTODO DE PAGO */}
            <PaymentMethodModal
                isOpen={isMethodModalOpen}
                onClose={() => setIsMethodModalOpen(false)}
                editingMethod={editingMethod}
                setEditingMethod={setEditingMethod}
                onSave={handleSaveMethodSubmit}
            />

            {/* 📝 MODAL EDITAR CUENTA BANCARIA */}
            <BankAccountModal
                isOpen={isBankModalOpen}
                onClose={() => setIsBankModalOpen(false)}
                editingBank={editingBank}
                setEditingBank={setEditingBank}
                onSave={handleSaveBankSubmit}
                onFileUpload={handleFileUpload}
            />
        </div>
    )
}
