'use client';

import { AlertCircle } from 'lucide-react';
import { useAccountingData } from '@/components/admin/contabilidad/useAccountingData';
import AccountingHeader from '@/components/admin/contabilidad/AccountingHeader';
import AccountingPeriodFilter from '@/components/admin/contabilidad/AccountingPeriodFilter';
import AccountingKpiCards from '@/components/admin/contabilidad/AccountingKpiCards';
import AccountingIncomeStatement from '@/components/admin/contabilidad/AccountingIncomeStatement';
import AccountingBankBreakdown from '@/components/admin/contabilidad/AccountingBankBreakdown';
import AccountingProductProfitability from '@/components/admin/contabilidad/AccountingProductProfitability';
import AccountingOrdersTable from '@/components/admin/contabilidad/AccountingOrdersTable';

export default function ContabilidadPage() {
    const {
        preset,
        dates,
        setDates,
        selectedStatuses,
        showAdvancedFilters,
        loading,
        error,
        metrics,
        totals,
        overallMargin,
        ordersWithMissingCosts,
        paymentEntries,
        totalVerified,
        productEntries,
        toggleStatus,
        handlePresetChange,
        calculate,
        handleExport,
    } = useAccountingData();

    return (
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-28">
            {/* ═══════════════════ HEADER HOMOLOGADO ═══════════════════ */}
            <AccountingHeader
                startDate={dates.start}
                endDate={dates.end}
                hasData={metrics !== null && metrics.length > 0}
                loading={loading}
                onExport={handleExport}
                onRefresh={calculate}
            />

            {/* ═══════════════════ FILTRO DE PERÍODOS APPLE ═══════════════════ */}
            <AccountingPeriodFilter
                preset={preset}
                startDate={dates.start}
                endDate={dates.end}
                selectedStatuses={selectedStatuses}
                showAdvancedFilters={showAdvancedFilters}
                onPresetChange={handlePresetChange}
                onStartDateChange={(val) => {
                    handlePresetChange('custom');
                    setDates((prev) => ({ ...prev, start: val }));
                }}
                onEndDateChange={(val) => {
                    handlePresetChange('custom');
                    setDates((prev) => ({ ...prev, end: val }));
                }}
                onToggleStatus={toggleStatus}
            />

            {/* ERROR */}
            {error && (
                <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-300 text-xs sm:text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                </div>
            )}

            {/* AVISO DE COSTOS FALTANTES */}
            {ordersWithMissingCosts > 0 && (
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-300 text-xs sm:text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                        <strong>{ordersWithMissingCosts} pedido{ordersWithMissingCosts !== 1 ? 's' : ''}</strong> contienen artículos sin costo registrado en la variante — la ganancia de esos artículos se estima al 100% del precio de venta.
                    </span>
                </div>
            )}

            {/* ═══════════════════ TARJETAS KPI FINANCIERAS ═══════════════════ */}
            <AccountingKpiCards
                totals={totals}
                overallMargin={overallMargin}
                ordersCount={metrics?.length ?? 0}
                loading={loading}
            />

            {/* ═══════════════════ ESTADO DE RESULTADOS & PAGOS POR BANCO ═══════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <AccountingIncomeStatement
                    totals={totals}
                    overallMargin={overallMargin}
                />
                <AccountingBankBreakdown
                    paymentEntries={paymentEntries}
                    totalVerified={totalVerified}
                    totalRevenue={totals.revenue}
                />
            </div>

            {/* ═══════════════════ RENTABILIDAD POR PRODUCTO (TOP 15) ═══════════════════ */}
            <AccountingProductProfitability
                productEntries={productEntries}
            />

            {/* ═══════════════════ DETALLE POR PEDIDO ═══════════════════ */}
            <AccountingOrdersTable
                metrics={metrics}
                onExport={handleExport}
            />
        </div>
    );
}
