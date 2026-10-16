'use client';

import { FileSpreadsheet } from 'lucide-react';
import { useReportesData } from '@/components/admin/reportes/useReportesData';
import OrderExportSection from '@/components/admin/reportes/OrderExportSection';
import VipLoyaltySection from '@/components/admin/reportes/VipLoyaltySection';
import BestSellersSection from '@/components/admin/reportes/BestSellersSection';
import KitSharesSection from '@/components/admin/reportes/KitSharesSection';

export default function ReportesPage() {
    const {
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        selectedStatuses,
        toggleStatus,
        setPreset,
        topBuyers,
        loadingBuyers,
        loadTopBuyers,
        bestSellers,
        loadingBest,
        loadBestSellers,
        shareStats,
        loadingShares,
        loadShareStats,
    } = useReportesData();

    const handleStartDateChange = (val: string) => {
        setStartDate(val);
        loadBestSellers(val, endDate, selectedStatuses);
        loadShareStats(val, endDate);
    };

    const handleEndDateChange = (val: string) => {
        setEndDate(val);
        loadBestSellers(startDate, val, selectedStatuses);
        loadShareStats(startDate, val);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-28">
            {/* HEADER */}
            <div>
                <h1 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 md:gap-3">
                    <FileSpreadsheet className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                    Reportes de Pedidos y CRM
                </h1>
                <p className="text-gray-400 mt-1 md:mt-2 text-xs md:text-sm">
                    Exporta pedidos para proveedores, analiza productos más vendidos y gestiona el programa de fidelización VIP.
                </p>
            </div>

            {/* 📦 1. EXPORTACIÓN DE PEDIDOS PARA PROVEEDORES */}
            <OrderExportSection
                startDate={startDate}
                endDate={endDate}
                selectedStatuses={selectedStatuses}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                onToggleStatus={toggleStatus}
                onSetPreset={setPreset}
            />

            {/* 👑 2. SECCIÓN TOP COMPRADORES & PROGRAMA DE FIDELIDAD VIP */}
            <VipLoyaltySection
                topBuyers={topBuyers}
                loadingBuyers={loadingBuyers}
                onRefresh={loadTopBuyers}
            />

            {/* 📈 3. PRODUCTOS MÁS VENDIDOS */}
            <BestSellersSection
                bestSellers={bestSellers}
                loading={loadingBest}
                onRefresh={() => loadBestSellers(startDate, endDate, selectedStatuses)}
            />

            {/* 📸 4. PRESUMES DE KIT */}
            <KitSharesSection
                shareStats={shareStats}
                loading={loadingShares}
                onRefresh={() => loadShareStats(startDate, endDate)}
            />
        </div>
    );
}
